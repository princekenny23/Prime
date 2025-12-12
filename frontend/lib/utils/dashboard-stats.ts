// Dashboard Stats Utilities - Generate industry-specific stats
import type { Business } from "../types"
import { saleService } from "../services/saleService"
import { productService } from "../services/productService"

export interface DashboardKPI {
  sales: { value: number; change: number }
  customers: { value: number; change: number }
  products: { value: number; change: number }
  expenses: { value: number; change: number }
  profit: { value: number; change: number }
}

export interface ChartDataPoint {
  date: string
  sales: number
  profit: number
}

export interface ActivityItem {
  id: string
  type: "sale" | "inventory" | "customer" | "payment" | "alert"
  title: string
  description: string
  timestamp: Date
  amount?: number
}

/**
 * Generate KPI data for business dashboard
 * Calculates trends by comparing with previous period
 */
export async function generateKPIData(
  businessId: string,
  business: Business,
  outletId?: string
): Promise<DashboardKPI> {
  try {
    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split("T")[0]
    
    // Use optimized endpoints - count instead of loading all products
    const [todayStats, yesterdayStats, productCount] = await Promise.all([
      saleService.getStats({ start_date: today, end_date: today }).catch(() => ({ total_revenue: 0, today_revenue: 0, total_sales: 0, today_sales: 0 })),
      saleService.getStats({ start_date: yesterdayStr, end_date: yesterdayStr }).catch(() => ({ total_revenue: 0, today_revenue: 0, total_sales: 0, today_sales: 0 })),
      productService.count({ is_active: true }).catch(() => 0),
    ])
    
    const todayRevenue = todayStats.today_revenue || todayStats.total_revenue || 0
    const yesterdayRevenue = yesterdayStats.today_revenue || yesterdayStats.total_revenue || 0
    
    const salesChange = yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : todayRevenue > 0 ? 100 : 0
    
    return {
      sales: { value: todayRevenue, change: salesChange },
      customers: { value: 0, change: 0 }, // TODO: Get from customerService
      products: { value: productCount, change: 0 },
      expenses: { value: 0, change: 0 }, // TODO: Get from expenses API
      profit: { value: todayRevenue, change: salesChange }, // TODO: Calculate properly with expenses
    }
  } catch (error) {
    console.error("Failed to load KPI data from API:", error)
    // Return empty/default data
    return {
      sales: { value: 0, change: 0 },
      customers: { value: 0, change: 0 },
      products: { value: 0, change: 0 },
      expenses: { value: 0, change: 0 },
      profit: { value: 0, change: 0 },
    }
  }
}

/**
 * Generate chart data for last 7 days - optimized single API call
 */
export async function generateChartData(
  businessId: string,
  outletId?: string
): Promise<ChartDataPoint[]> {
  try {
    // Use optimized endpoint that returns all 7 days in one call
    const chartData = await saleService.getChartData(outletId)
    return chartData.map(item => ({
      date: item.date,
      sales: item.sales,
      profit: item.profit,
    }))
  } catch (error) {
    console.error("Failed to load chart data from API:", error)
    // Return empty array
    return []
  }
}

/**
 * Generate recent activity from sales and other events
 */
export async function generateActivityData(
  businessId: string,
  outletId?: string
): Promise<ActivityItem[]> {
  try {
    const activities: ActivityItem[] = []
    
    // Get recent sales
    const salesResponse = await saleService.list({
      outlet: outletId,
      status: "completed",
      page: 1,
    })
    
    const sales = Array.isArray(salesResponse) ? salesResponse : (salesResponse.results || [])
    
    // Add recent sales as activities
    sales.slice(0, 10).forEach((sale: any) => {
      activities.push({
        id: `activity_${sale.id}`,
        type: "sale",
        title: "New Sale Completed",
        description: `Sale #${sale.receipt_number || sale.id.slice(-6)} - ${sale.items?.length || 0} items`,
        timestamp: new Date(sale.created_at || sale.createdAt),
        amount: sale.total,
      })
    })
    
    // Get low stock products
    try {
      const lowStockProducts = await productService.getLowStock()
      lowStockProducts.slice(0, 3).forEach((product: any) => {
        activities.push({
          id: `alert_${product.id}`,
          type: "alert",
          title: "Low Stock Alert",
          description: `${product.name} is running low (${product.stock || 0} remaining)`,
          timestamp: new Date(),
        })
      })
    } catch (error) {
      console.error("Failed to load low stock products:", error)
    }
    
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10)
  } catch (error) {
    console.error("Failed to load activity data from API:", error)
    return []
  }
}

/**
 * Generate top selling items - optimized backend query
 */
export async function generateTopSellingItems(
  businessId: string,
  outletId?: string
) {
  try {
    // Use optimized endpoint that does aggregation on backend
    return await saleService.getTopSellingItems({ outlet: outletId })
  } catch (error) {
    console.error("Failed to load top selling items from API:", error)
    return []
  }
}




