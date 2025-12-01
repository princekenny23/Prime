// Dashboard Stats Utilities - Generate industry-specific stats
import type { Business } from "../types/mock-data"
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
    
    const [todayStats, yesterdayStats, productsData] = await Promise.all([
      saleService.getStats({ start_date: today, end_date: today }),
      saleService.getStats({ start_date: yesterdayStr, end_date: yesterdayStr }),
      productService.list({ is_active: true }),
    ])
    
    const salesChange = yesterdayStats.today_revenue > 0
      ? ((todayStats.today_revenue - yesterdayStats.today_revenue) / yesterdayStats.today_revenue) * 100
      : todayStats.today_revenue > 0 ? 100 : 0
    
    return {
      sales: { value: todayStats.today_revenue, change: salesChange },
      customers: { value: 0, change: 0 }, // TODO: Get from customerService
      products: { value: Array.isArray(productsData) ? productsData.length : productsData.count || 0, change: 0 },
      expenses: { value: 0, change: 0 }, // TODO: Get from expenses API
      profit: { value: todayStats.today_revenue, change: salesChange }, // TODO: Calculate properly with expenses
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
 * Generate chart data for last 7 days
 */
export async function generateChartData(
  businessId: string,
  outletId?: string
): Promise<ChartDataPoint[]> {
  try {
    const days: ChartDataPoint[] = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      
      const stats = await saleService.getStats({ start_date: dateStr, end_date: dateStr })
      const dayTotal = stats.today_revenue || 0
      const dayProfit = dayTotal * 0.7 // TODO: Calculate profit properly with expenses
      
      days.push({
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        sales: dayTotal,
        profit: dayProfit,
      })
    }
    
    return days
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
 * Generate top selling items
 */
export async function generateTopSellingItems(
  businessId: string,
  outletId?: string
) {
  try {
    // Get recent sales to calculate top items
    const salesResponse = await saleService.list({
      outlet: outletId,
      status: "completed",
      page: 1,
    })
    
    const sales = Array.isArray(salesResponse) ? salesResponse : (salesResponse.results || [])
    
    // Get all products
    const productsResponse = await productService.list({ is_active: true })
    const products = Array.isArray(productsResponse) ? productsResponse : (productsResponse.results || [])
    
    // Aggregate sales by product
    const productSales: Record<string, { quantity: number; revenue: number }> = {}
    
    sales.forEach((sale: any) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const productId = item.product_id || item.productId || item.product?.id
          if (productId) {
            if (!productSales[productId]) {
              productSales[productId] = { quantity: 0, revenue: 0 }
            }
            productSales[productId].quantity += item.quantity || 0
            productSales[productId].revenue += (item.price || 0) * (item.quantity || 0)
          }
        })
      }
    })
    
    // Convert to array and sort by revenue
    const topItems = Object.entries(productSales)
      .map(([productId, data]) => {
        const product = products.find((p: any) => String(p.id) === String(productId))
        return {
          id: productId,
          name: product?.name || "Unknown Product",
          sku: product?.sku || "N/A",
          quantity: data.quantity,
          revenue: data.revenue,
          change: 0, // TODO: Calculate change from previous period
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
    
    return topItems
  } catch (error) {
    console.error("Failed to load top selling items from API:", error)
    return []
  }
}




