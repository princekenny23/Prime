"use client"


import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { useBusinessStore } from "@/stores/businessStore"
import { useAuthStore } from "@/stores/authStore"
import { useTenant } from "@/contexts/tenant-context"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { LowStockAlerts } from "@/components/dashboard/low-stock-alerts"
import { TopSellingItems } from "@/components/dashboard/top-selling-items"
import { generateKPIData, generateChartData, generateActivityData, generateTopSellingItems } from "@/lib/utils/dashboard-stats"
import { productService } from "@/lib/services/productService"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RetailDashboard() {
  const { currentBusiness, currentOutlet: businessOutlet, loadBusinesses, loadOutlets } = useBusinessStore()
  const { currentOutlet: tenantOutlet, isLoading: tenantLoading } = useTenant()
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [kpiData, setKpiData] = useState<any>(null)
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [chartData, setChartData] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [topItems, setTopItems] = useState<any[]>([])
  
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
    
    if (currentBusiness.type !== "retail") {
      router.push(`/dashboard/${currentBusiness.type}`)
      return
    }
    
    loadBusinesses()
    
    // Load outlets if not already loaded
    if (currentBusiness) {
      loadOutlets(currentBusiness.id)
    }
    
    // Load dashboard data
    const loadData = async () => {
      setIsLoading(true)
      try {
        const outletId = currentOutlet?.id
        const [kpi, productsData] = await Promise.all([
          generateKPIData(currentBusiness.id, currentBusiness, outletId),
          productService.getLowStock().catch(() => []),
        ])
        
        setKpiData(kpi)
        
        const products = Array.isArray(productsData) ? productsData : []
        const lowStock = products
          .filter((p: any) => p.lowStockThreshold && p.stock <= p.lowStockThreshold)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku || "N/A",
            currentStock: p.stock || 0,
            minStock: p.lowStockThreshold || 0,
            category: p.category?.name || "General",
          }))
        setLowStockItems(lowStock)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [currentBusiness, currentOutlet, isAuthenticated, router, loadBusinesses, loadOutlets])
  
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentBusiness || !currentOutlet) return
      
      try {
        const outletId = currentOutlet.id
        const [chart, activity, top] = await Promise.all([
          generateChartData(currentBusiness.id, outletId),
          generateActivityData(currentBusiness.id, outletId),
          generateTopSellingItems(currentBusiness.id, outletId),
        ])
        setChartData(chart)
        setActivities(activity)
        setTopItems(top)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      }
    }
    
    loadDashboardData()
  }, [currentBusiness, currentOutlet])
  
  if (!currentBusiness || currentBusiness.type !== "retail" || isLoading || tenantLoading || !kpiData) {
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
        {/* Header - No action buttons, just title */}
        <div>
          <h1 className="text-3xl font-bold">Retail Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Business overview for {currentBusiness.name}
          </p>
        </div>

        {/* KPI Cards */}
        <KPICards data={kpiData} business={currentBusiness} />

        {/* Charts and Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <SalesChart data={chartData} type="area" />
          <RecentActivity activities={activities} business={currentBusiness} />
        </div>

        {/* Low Stock and Top Selling */}
        <div className="grid gap-4 md:grid-cols-2">
          <LowStockAlerts items={lowStockItems} />
          <TopSellingItems items={topItems} business={currentBusiness} />
        </div>
      </div>
    </DashboardLayout>
  )
}
