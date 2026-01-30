"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Users, Building2, DollarSign, CreditCard, Calendar } from "lucide-react"
import { SalesChart } from "@/components/dashboard/sales-chart"

export default function AdminAnalyticsPage() {
  // Mock analytics data
  const totalTenants = 150
  const activeTenants = 142
  const totalRevenue = 125000
  const monthlyRecurringRevenue = 45000
  const averageRevenuePerTenant = 833.33
  const churnRate = 2.5

  // Mock chart data
  const revenueData = [
    { date: "Jan", sales: 35000, profit: 8750 },
    { date: "Feb", sales: 42000, profit: 10500 },
    { date: "Mar", sales: 38000, profit: 9500 },
    { date: "Apr", sales: 45000, profit: 11250 },
    { date: "May", sales: 50000, profit: 12500 },
    { date: "Jun", sales: 55000, profit: 13750 },
  ]

  const tenantGrowthData = [
    { date: "Jan", sales: 120, profit: 0 },
    { date: "Feb", sales: 125, profit: 0 },
    { date: "Mar", sales: 130, profit: 0 },
    { date: "Apr", sales: 135, profit: 0 },
    { date: "May", sales: 142, profit: 0 },
    { date: "Jun", sales: 150, profit: 0 },
  ]

  return (
    <DashboardLayout>
      <PageLayout
        title="Platform Analytics"
        description="Comprehensive analytics and insights"
      >

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTenants}</div>
              <p className="text-xs text-muted-foreground">
                {activeTenants} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">MWK {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">MWK {monthlyRecurringRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">
                Monthly recurring
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{churnRate}%</div>
              <p className="text-xs text-muted-foreground">
                Monthly
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="tenants">Tenant Growth</TabsTrigger>
            <TabsTrigger value="plans">Plan Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <SalesChart data={revenueData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tenants" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Growth</CardTitle>
                <CardDescription>Number of tenants over time</CardDescription>
              </CardHeader>
              <CardContent>
                <SalesChart data={tenantGrowthData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
                <CardDescription>Tenants by subscription plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Starter</p>
                      <p className="text-sm text-muted-foreground">45 tenants</p>
                    </div>
                    <div className="text-2xl font-bold">30%</div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Professional</p>
                      <p className="text-sm text-muted-foreground">75 tenants</p>
                    </div>
                    <div className="text-2xl font-bold">50%</div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Enterprise</p>
                      <p className="text-sm text-muted-foreground">30 tenants</p>
                    </div>
                    <div className="text-2xl font-bold">20%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageLayout>
    </DashboardLayout>
  )
}

