"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, User, Mail, Phone, Award, DollarSign, ShoppingCart, Calendar } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useState, useEffect } from "react"
import { customerService } from "@/lib/services/customerService"
import { saleService } from "@/lib/services/saleService"
import { useBusinessStore } from "@/stores/businessStore"

export default function CustomerDetailPage() {
  const params = useParams()
  const customerId = params.id as string
  const { currentBusiness, outlets } = useBusinessStore()
  const [customer, setCustomer] = useState<any>(null)
  const [purchases, setPurchases] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCustomerData = async () => {
      if (!currentBusiness) return
      
      setIsLoading(true)
      try {
        const [customerData, salesData] = await Promise.all([
          customerService.get(customerId),
          saleService.list({ tenant: currentBusiness.id, customer: customerId, status: "completed", limit: 50 }),
        ])
        
        setCustomer(customerData)
        
        // Transform sales to purchases
        const sales = Array.isArray(salesData) ? salesData : salesData.results || []
        setPurchases(sales.map((sale: any) => ({
          id: sale.id,
          date: sale.created_at || sale.date,
          saleId: sale.receipt_number || sale.id,
          items: sale.items?.length || 0,
          total: sale.total,
          points: Math.floor(sale.total / 10) || 0, // Calculate points (1 point per 10 currency units)
        })))
      } catch (error) {
        console.error("Failed to load customer data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadCustomerData()
  }, [customerId, currentBusiness])

  if (isLoading || !customer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading customer...</p>
        </div>
      </DashboardLayout>
    )
  }

  const customerPoints = customer.loyalty_points || customer.points || 0
  const totalSpent = customer.total_spent || customer.totalSpent || 0
  const totalOrders = purchases.length
  const lastVisit = customer.last_visit || customer.lastVisit
  const memberSince = customer.created_at || customer.memberSince
  const outletName = outlets.find(o => o.id === (customer.outlet_id || customer.outlet))?.name || customer.outlet || "N/A"

  return (
    <DashboardLayout>
      <PageLayout
        title={customer.name}
        description="Customer Details & Purchase History"
        actions={
          <Link href="/dashboard/office/customer-management">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        }
      >

        {/* Customer Info Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loyalty Points</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customerPoints.toLocaleString('en-US')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentBusiness?.currencySymbol || "MWK"} {totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Visit</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lastVisit ? new Date(lastVisit).toLocaleDateString() : "Never"}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Customer Details</TabsTrigger>
            <TabsTrigger value="purchases">Purchase History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">{customer.name}</p>
                  </div>
                  {customer.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{customer.email}</p>
                      </div>
                    </div>
                  )}
                  {customer.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{customer.phone}</p>
                      </div>
                    </div>
                  )}
                  {customer.address && (
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{customer.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Membership Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">
                      {memberSince ? new Date(memberSince).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Primary Outlet</p>
                    <p className="font-medium">{outletName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Loyalty Points</p>
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      <p className="font-medium text-2xl">{customerPoints.toLocaleString('en-US')}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lifetime Value</p>
                    <p className="font-medium text-xl">
                      {currentBusiness?.currencySymbol || "MWK"} {totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="purchases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Purchase History</CardTitle>
                <CardDescription>
                  Complete transaction history for this customer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Sale ID</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Points Earned</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <p className="text-muted-foreground">No purchase history available</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      purchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>
                            {new Date(purchase.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">{purchase.saleId}</TableCell>
                          <TableCell>{purchase.items} items</TableCell>
                          <TableCell className="font-semibold">
                            {currentBusiness?.currencySymbol || "MWK"} {purchase.total.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Award className="h-3 w-3 text-yellow-500" />
                              {purchase.points}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">View</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageLayout>
    </DashboardLayout>
  )
}

