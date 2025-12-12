"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { generateKPIData, generateChartData, generateActivityData, generateTopSellingItems } from "@/lib/utils/dashboard-stats"
import { productService } from "@/lib/services/productService"
import { saleService } from "@/lib/services/saleService"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import { useAuthStore } from "@/stores/authStore"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { LowStockAlerts } from "@/components/dashboard/low-stock-alerts"
import { TopSellingItems } from "@/components/dashboard/top-selling-items"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Store, Settings2, Plus } from "lucide-react"
import { DateRangeFilter } from "@/components/dashboard/date-range-filter"
import { ViewSaleDetailsModal } from "@/components/modals/view-sale-details-modal"
import { QuickAddSaleModal } from "@/components/modals/quick-add-sale-modal"
import { CustomizeDashboardModal } from "@/components/modals/customize-dashboard-modal"

export default function BarDashboardPage() {
  const router = useRouter()
  const { currentBusiness, currentOutlet: businessOutlet } = useBusinessStore()
  const { currentOutlet: tenantOutlet, isLoading: tenantLoading, currentTenant } = useTenant()
  const { isAuthenticated } = useAuthStore()
  const [showQuickSale, setShowQuickSale] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [showSaleDetails, setShowSaleDetails] = useState(false)
  const [kpiData, setKpiData] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [topItems, setTopItems] = useState<any[]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [recentSales, setRecentSales] = useState<any[]>([])
  
  // Use tenant outlet if available, otherwise fall back to business store outlet
  const currentOutlet = tenantOutlet || businessOutlet

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login")
      return
    }
    
    // If no current business, try to restore from user's tenant
    if (!currentBusiness) {
      const { user } = useAuthStore.getState()
      if (user?.tenant) {
        const tenantId = typeof user.tenant === 'object' 
          ? String(user.tenant.id || user.tenant) 
          : String(user.tenant)
        console.log("Restoring business from user tenant:", tenantId)
        const { setCurrentBusiness } = useBusinessStore.getState()
        setCurrentBusiness(tenantId).catch((error: any) => {
          console.error("Failed to restore business:", error)
          router.push("/admin")
        })
        return // Wait for business to be restored
      }
      router.push("/admin")
      return
    }
    
    if (currentBusiness.type !== "bar") {
      // Redirect to appropriate dashboard based on business type
      if (currentBusiness.type === "wholesale and retail") {
        router.push("/dashboard/retail/dashboard")
      } else if (currentBusiness.type === "restaurant") {
        router.push("/dashboard/restaurant/dashboard")
      } else {
        router.push("/dashboard")
      }
      return
    }
  }, [currentBusiness, isAuthenticated, router])

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentBusiness) return
      
      setIsLoadingData(true)
      try {
        const outletId = currentOutlet?.id
        const [kpi, chart, activity, top, productsData] = await Promise.all([
          generateKPIData(currentBusiness.id, currentBusiness, outletId),
          generateChartData(currentBusiness.id, outletId),
          generateActivityData(currentBusiness.id, outletId),
          generateTopSellingItems(currentBusiness.id, outletId),
          productService.list({ is_active: true }).catch(() => ({ results: [], count: 0 })),
        ])
        
        setKpiData(kpi)
        setChartData(chart)
        setActivities(activity)
        setTopItems(top)
        
        const products = Array.isArray(productsData) ? productsData : (productsData.results || [])
        // Check both product-level and variation-level low stock
        const lowStock = products
          .filter((p: any) => {
            // Check product-level low stock
            const productLow = p.low_stock_threshold && p.stock <= p.low_stock_threshold
            
            // Check variation-level low stock
            const variationLow = p.variations?.some((v: any) => 
              v.track_inventory && 
              v.low_stock_threshold > 0 && 
              (v.total_stock || v.stock || 0) <= v.low_stock_threshold
            )
            
            // Also check is_low_stock flag from backend
            return p.is_low_stock || productLow || variationLow
          })
          .map((p: any) => {
            // Find the variation with lowest stock if any
            const lowVariation = p.variations?.find((v: any) => 
              v.track_inventory && 
              v.low_stock_threshold > 0 && 
              (v.total_stock || v.stock || 0) <= v.low_stock_threshold
            )
            
            return {
              id: p.id,
              name: p.name,
              sku: p.sku || lowVariation?.sku || "N/A",
              currentStock: lowVariation ? (lowVariation.total_stock || lowVariation.stock || 0) : (p.stock || 0),
              minStock: lowVariation ? (lowVariation.low_stock_threshold || 0) : (p.low_stock_threshold || 0),
              category: p.category?.name || "General",
            }
          })
        setLowStockItems(lowStock)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setIsLoadingData(false)
      }
    }
    
    if (currentBusiness) {
      loadDashboardData()
      
      // Auto-refresh dashboard data every 30 seconds for real-time updates
      const interval = setInterval(() => {
        loadDashboardData()
      }, 30000)
      
      // Listen for outlet changes
      const handleOutletChange = () => {
        loadDashboardData()
      }
      
      // Listen for sale completion events to refresh dashboard
      const handleSaleCompleted = () => {
        loadDashboardData()
      }
      
      window.addEventListener("outlet-changed", handleOutletChange)
      window.addEventListener("sale-completed", handleSaleCompleted)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener("outlet-changed", handleOutletChange)
        window.removeEventListener("sale-completed", handleSaleCompleted)
      }
    }
  }, [currentBusiness, currentOutlet])

  useEffect(() => {
    const loadRecentSales = async () => {
      if (!currentBusiness) return
      
      try {
        const outletId = currentOutlet?.id
        const salesData = await saleService.list({ 
          outlet: outletId,
          status: "completed",
        })
        setRecentSales(Array.isArray(salesData) ? salesData : salesData.results || [])
      } catch (error) {
        console.error("Failed to load recent sales:", error)
        setRecentSales([])
      }
    }
    
    if (currentBusiness) {
      loadRecentSales()
      
      // Auto-refresh recent sales every 30 seconds for real-time updates
      const interval = setInterval(() => {
        loadRecentSales()
      }, 30000)
      
      // Listen for sale completion events to refresh recent sales immediately
      const handleSaleCompleted = () => {
        loadRecentSales()
      }
      
      window.addEventListener("sale-completed", handleSaleCompleted)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener("sale-completed", handleSaleCompleted)
      }
    }
  }, [currentBusiness, currentOutlet])

  const handleViewSale = async (saleId: string) => {
    try {
      const sale = await saleService.get(saleId)
      setSelectedSale(sale)
      setShowSaleDetails(true)
    } catch (error) {
      console.error("Failed to load sale:", error)
    }
  }

  if (!currentBusiness || currentBusiness.type !== "bar" || isLoadingData || tenantLoading || !kpiData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

  // Initialize with default KPI data if not loaded
  const displayKpiData = kpiData || {
    sales: { value: 0, change: 0 },
    customers: { value: 0, change: 0 },
    products: { value: 0, change: 0 },
    expenses: { value: 0, change: 0 },
    profit: { value: 0, change: 0 },
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Bar Dashboard</h1>
              {currentOutlet && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                  <Store className="h-4 w-4" />
                  <span>{currentOutlet.name}</span>
                </div>
              )}
            </div>
            {currentTenant && (
              <p className="text-muted-foreground">
                Welcome back! Here's what's happening at <span className="font-medium">{currentTenant.name}</span> today.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DateRangeFilter />
            <Button variant="outline" onClick={() => setShowCustomize(true)}>
              <Settings2 className="mr-2 h-4 w-4" />
              Customize
            </Button>
            <Button onClick={() => setShowQuickSale(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Quick Sale
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <KPICards data={displayKpiData} business={currentBusiness} />

        {/* Charts and Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>Sales and profit trends over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesChart data={chartData} type="area" />
            </CardContent>
          </Card>

          <RecentActivity activities={activities} business={currentBusiness} />
        </div>

        {/* Low Stock and Top Selling */}
        <div className="grid gap-4 md:grid-cols-2">
          <LowStockAlerts items={lowStockItems} />
          <TopSellingItems items={topItems} business={currentBusiness} />
        </div>

        {/* Recent Sales with Click to View */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Click on any sale to view details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recent sales</p>
              ) : (
                recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 cursor-pointer hover:bg-accent/50 p-2 rounded transition-colors"
                    onClick={() => handleViewSale(sale.id)}
                  >
                    <div>
                      <p className="font-medium">Sale #{sale.receipt_number || sale.id.slice(-6)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sale.created_at || sale.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {currentBusiness?.currencySymbol || "MWK"} {sale.total.toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <QuickAddSaleModal open={showQuickSale} onOpenChange={setShowQuickSale} />
      <CustomizeDashboardModal open={showCustomize} onOpenChange={setShowCustomize} />
      <ViewSaleDetailsModal
        open={showSaleDetails}
        onOpenChange={setShowSaleDetails}
        sale={selectedSale}
      />
    </DashboardLayout>
  )
}

