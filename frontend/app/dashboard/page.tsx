"use client"



import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { generateKPIData, generateChartData, generateActivityData, generateTopSellingItems } from "@/lib/utils/dashboard-stats"
import { productService } from "@/lib/services/productService"
import { saleService } from "@/lib/services/saleService"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
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

export default function DashboardPage() {
  const router = useRouter()
  const { currentBusiness, currentOutlet } = useBusinessStore()
  const { currentTenant, currentOutlet: tenantOutlet, isLoading } = useTenant()
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
  
  // Redirect to industry-specific dashboard if business is selected
  useEffect(() => {
    if (currentBusiness) {
      // Redirect to industry-specific dashboard
      const industryRoute = `/dashboard/${currentBusiness.type}`
      router.push(industryRoute)
    } else {
      // No business selected, go to admin dashboard
      router.push("/admin")
    }
  }, [currentBusiness, router])
  
  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentBusiness) return
      
      setIsLoadingData(true)
      try {
        const outletId = currentOutlet?.id || tenantOutlet?.id
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
        const lowStock = products
          .filter((p: any) => p.low_stock_threshold && p.stock <= p.low_stock_threshold)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku || "N/A",
            currentStock: p.stock || 0,
            minStock: p.low_stock_threshold || 0,
            category: p.category?.name || "General",
          }))
        setLowStockItems(lowStock)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setIsLoadingData(false)
      }
    }
    
    if (currentBusiness) {
      loadDashboardData()
    }
  }, [currentBusiness, currentOutlet, tenantOutlet])

  const [recentSales, setRecentSales] = useState<any[]>([])

  useEffect(() => {
    const loadRecentSales = async () => {
      if (!currentBusiness) return
      
      try {
        const outletId = currentOutlet?.id || tenantOutlet?.id
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
    }
  }, [currentBusiness, currentOutlet, tenantOutlet])

  const handleViewSale = async (saleId: string) => {
    try {
      const sale = await saleService.get(saleId)
      setSelectedSale(sale)
      setShowSaleDetails(true)
    } catch (error) {
      console.error("Failed to load sale:", error)
    }
  }
  
  // Show loading or nothing while redirecting
  if (!currentBusiness || isLoadingData || !kpiData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
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
              <h1 className="text-3xl font-bold">Dashboard</h1>
              {!isLoading && currentOutlet && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                  <Store className="h-4 w-4" />
                  <span>{currentOutlet.name}</span>
                </div>
              )}
            </div>
            {!isLoading && currentTenant && (
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
        <KPICards data={kpiData} business={currentBusiness} />

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
