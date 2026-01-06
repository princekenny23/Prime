"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
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
import { Store, Settings2 } from "lucide-react"
import { DateRangeFilter } from "@/components/dashboard/date-range-filter"
import { ViewSaleDetailsModal } from "@/components/modals/view-sale-details-modal"
import { CustomizeDashboardModal } from "@/components/modals/customize-dashboard-modal"

export default function RetailDashboardPage() {
  const router = useRouter()
  const { currentBusiness, currentOutlet: businessOutlet } = useBusinessStore()
  const { currentOutlet: tenantOutlet, isLoading: tenantLoading } = useTenant()
  const { isAuthenticated } = useAuthStore()
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
  const outletId = currentOutlet?.id
  
  // Refs for loading state and interval
  const loadingRef = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

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
    
    if (currentBusiness.type !== "wholesale and retail") {
      // Redirect to appropriate dashboard based on business type
      if (currentBusiness.type === "restaurant") {
        router.push("/dashboard/restaurant/dashboard")
      } else if (currentBusiness.type === "bar") {
        router.push("/dashboard/bar/dashboard")
      } else {
        router.push("/dashboard")
      }
      return
    }
  }, [currentBusiness, isAuthenticated, router])

  // Load dashboard data with optimization
  const loadDashboardData = useCallback(async () => {
    if (!currentBusiness || loadingRef.current) return
    
    loadingRef.current = true
    setIsLoadingData(true)
    try {
      const [kpi, chart, activity, top, lowStockData] = await Promise.all([
        generateKPIData(currentBusiness.id, currentBusiness, outletId),
        generateChartData(currentBusiness.id, outletId),
        generateActivityData(currentBusiness.id, outletId),
        generateTopSellingItems(currentBusiness.id, outletId),
        productService.getLowStock(outletId).catch(() => []),
      ])
      
      setKpiData(kpi)
      setChartData(chart)
      setActivities(activity)
      setTopItems(top)
      
      const lowStockResult = lowStockData as any
      const lowStock = Array.isArray(lowStockResult) ? lowStockResult : (lowStockResult?.results || [])
      const processedLowStock = lowStock.map((p: any) => {
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
      setLowStockItems(processedLowStock)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setIsLoadingData(false)
      loadingRef.current = false
    }
  }, [currentBusiness, outletId])
  
  useEffect(() => {
    if (!currentBusiness) return
    
    loadDashboardData()
    
    intervalRef.current = setInterval(() => {
      loadDashboardData()
    }, 30000)
    
    const handleOutletChange = () => {
      loadDashboardData()
    }
    
    const handleSaleCompleted = () => {
      loadDashboardData()
    }
    
    window.addEventListener("outlet-changed", handleOutletChange)
    window.addEventListener("sale-completed", handleSaleCompleted)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      window.removeEventListener("outlet-changed", handleOutletChange)
      window.removeEventListener("sale-completed", handleSaleCompleted)
    }
  }, [currentBusiness?.id, outletId, loadDashboardData])

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
      
      // Auto-refresh recent sales every 30 seconds
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

  // Memoize default KPI data - MUST be before any early returns
  const defaultKpiData = useMemo(() => ({
    sales: { value: 0, change: 0 },
    customers: { value: 0, change: 0 },
    products: { value: 0, change: 0 },
    expenses: { value: 0, change: 0 },
    profit: { value: 0, change: 0 },
    transactions: { value: 0, change: 0 },
    avgOrderValue: { value: 0, change: 0 },
    lowStockItems: { value: 0, change: 0 },
    outstandingCredit: { value: 0, change: 0 },
    returns: { value: 0, change: 0 },
  }), [])
  
  const displayKpiData = useMemo(() => kpiData || defaultKpiData, [kpiData, defaultKpiData])

  if (!currentBusiness || currentBusiness.type !== "wholesale and retail" || isLoadingData || tenantLoading || !kpiData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Wholesale Dashboard</h1>
              {currentOutlet && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                  <Store className="h-4 w-4" />
                  <span>{currentOutlet.name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DateRangeFilter />
            <Button variant="outline" onClick={() => setShowCustomize(true)}>
              <Settings2 className="mr-2 h-4 w-4" />
              Customize
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
      <CustomizeDashboardModal open={showCustomize} onOpenChange={setShowCustomize} />
      <ViewSaleDetailsModal
        open={showSaleDetails}
        onOpenChange={setShowSaleDetails}
        sale={selectedSale}
      />
    </DashboardLayout>
  )
}

