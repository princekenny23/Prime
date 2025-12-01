"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Printer, CheckCircle, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { KitchenOrderTicketModal } from "@/components/modals/kitchen-order-ticket-modal"
import { saleService } from "@/lib/services/saleService"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"

export default function KitchenPage() {
  const { currentBusiness, currentOutlet } = useBusinessStore()
  const [showKOT, setShowKOT] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("pending")
  const [kitchenOrders, setKitchenOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const useReal = useRealAPI()

  useEffect(() => {
    const loadKitchenOrders = async () => {
      if (!currentBusiness) return
      
      setIsLoading(true)
      try {
        if (useReal) {
          // Kitchen orders are sales with table_id and status != completed
          const salesData = await saleService.list({
            tenant: currentBusiness.id,
            outlet: currentOutlet?.id,
            status: "pending",
            limit: 100,
          })
          
          const sales = Array.isArray(salesData) ? salesData : salesData.results || []
          setKitchenOrders(sales
            .filter((sale: any) => sale.table_id || sale.table)
            .map((sale: any) => ({
              id: sale.id,
              orderId: sale.receipt_number || `ORD-${sale.id.slice(-6)}`,
              table: sale.table_id || sale.table || 0,
              time: new Date(sale.created_at || sale.date).toLocaleTimeString(),
              items: (sale.items || []).map((item: any) => ({
                name: item.product_name || item.name || "Unknown",
                quantity: item.quantity || 0,
                notes: item.notes || item.modifiers?.join(", ") || "",
                status: item.kitchen_status || "Pending",
              })),
              priority: sale.priority || "Normal",
            })))
        } else {
          setKitchenOrders([])
        }
      } catch (error) {
        console.error("Failed to load kitchen orders:", error)
        setKitchenOrders([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadKitchenOrders()
  }, [currentBusiness, currentOutlet, useReal])

  const pendingOrders = kitchenOrders.filter(o => 
    o.items.some((item: any) => item.status === "Pending" || item.status === "Preparing")
  )
  const readyOrders = kitchenOrders.filter(o => 
    o.items.every((item: any) => item.status === "Ready")
  )

  const filteredOrders = activeTab === "pending" ? pendingOrders : readyOrders

  const handleItemStatusChange = async (orderId: string, itemName: string, newStatus: string) => {
    try {
      if (useReal) {
        // TODO: Implement kitchen status update API
        // await saleService.updateKitchenStatus(orderId, itemName, newStatus)
        // Reload orders
      }
    } catch (error) {
      console.error("Failed to update item status:", error)
    }
  }

  const handlePrintKOT = (order: any) => {
    setSelectedOrder(order)
    setShowKOT(true)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Kitchen Display</h1>
            <p className="text-muted-foreground">Kitchen Order Tickets (KOT) management</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingOrders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready Orders</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{readyOrders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kitchenOrders.reduce((sum, o) => sum + o.items.length, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Prep Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18 min</div>
            </CardContent>
          </Card>
        </div>

        {/* Kitchen Orders */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="ready">Ready</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading kitchen orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No {activeTab === "pending" ? "pending" : "ready"} orders</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.map((order) => (
                <Card key={order.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{order.orderId}</CardTitle>
                        <CardDescription>Table {order.table} • {order.time}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant={order.priority === "High" ? "destructive" : "outline"}
                        >
                          {order.priority}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrintKOT(order)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-3 border rounded-lg ${
                            item.status === "Ready" ? "bg-green-50 dark:bg-green-950 border-green-200" :
                            item.status === "Preparing" ? "bg-orange-50 dark:bg-orange-950 border-orange-200" :
                            "bg-gray-50 dark:bg-gray-950"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium">
                              {item.quantity}x {item.name}
                            </div>
                            <Badge
                              variant={
                                item.status === "Ready" ? "default" :
                                item.status === "Preparing" ? "secondary" :
                                "outline"
                              }
                            >
                              {item.status}
                            </Badge>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground italic">
                              Note: {item.notes}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            {item.status === "Pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleItemStatusChange(order.id, item.name, "Preparing")}
                              >
                                Start
                              </Button>
                            )}
                            {item.status === "Preparing" && (
                              <Button
                                size="sm"
                                onClick={() => handleItemStatusChange(order.id, item.name, "Ready")}
                              >
                                Mark Ready
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <KitchenOrderTicketModal
        open={showKOT}
        onOpenChange={setShowKOT}
        order={selectedOrder}
      />
    </DashboardLayout>
  )
}

