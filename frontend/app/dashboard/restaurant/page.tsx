"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { useBusinessStore } from "@/stores/businessStore"
import { useAuthStore } from "@/stores/authStore"
import { useTenant } from "@/contexts/tenant-context"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { TopSellingItems } from "@/components/dashboard/top-selling-items"
import { generateKPIData, generateChartData, generateActivityData, generateTopSellingItems } from "@/lib/utils/dashboard-stats"
import { useRouter } from "next/navigation"

export default function RestaurantDashboard() {
  const { currentBusiness, currentOutlet: businessOutlet } = useBusinessStore()
  const { currentOutlet: tenantOutlet, isLoading: tenantLoading } = useTenant()
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [kpiData, setKpiData] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [topItems, setTopItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
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
    
    if (currentBusiness.type !== "restaurant") {
      router.push(`/dashboard/${currentBusiness.type}`)
      return
    }
    
    // Load dashboard data
    const loadDashboardData = async () => {
      setIsLoading(true)
      try {
        const outletId = currentOutlet?.id
        const [kpi, chart, activity, top] = await Promise.all([
          generateKPIData(currentBusiness.id, currentBusiness, outletId),
          generateChartData(currentBusiness.id, outletId),
          generateActivityData(currentBusiness.id, outletId),
          generateTopSellingItems(currentBusiness.id, outletId),
        ])
        setKpiData(kpi)
        setChartData(chart)
        setActivities(activity)
        setTopItems(top)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadDashboardData()
  }, [currentBusiness, currentOutlet, isAuthenticated, router])
  
  if (!currentBusiness || currentBusiness.type !== "restaurant" || isLoading || tenantLoading || !kpiData) {
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
          <h1 className="text-3xl font-bold">Restaurant Dashboard</h1>
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

        {/* Top Selling Menu Items */}
        <TopSellingItems items={topItems} business={currentBusiness} />
      </div>
    </DashboardLayout>
  )
}
