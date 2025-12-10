"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search, ShoppingCart, CheckCircle, XCircle, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

import { purchaseOrderService } from "@/lib/services/purchaseOrderService"

export default function PurchaseOrdersPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    purchaseOrderService.list()
      .then((response) => setPurchaseOrders(response.results))
      .catch((error) => {
        console.error("Failed to load purchase orders:", error)
        toast({
          title: "Error",
          description: "Failed to load purchase orders",
          variant: "destructive",
        })
      })
      .finally(() => setLoading(false))
  }, [toast])

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      draft: { bg: "bg-gray-100", text: "text-gray-800", icon: Clock, label: "Draft" },
      pending_supplier: { bg: "bg-orange-100", text: "text-orange-800", icon: Clock, label: "Needs Supplier" },
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock, label: "Pending" },
      approved: { bg: "bg-blue-100", text: "text-blue-800", icon: CheckCircle, label: "Approved" },
      ready_to_order: { bg: "bg-indigo-100", text: "text-indigo-800", icon: CheckCircle, label: "Ready to Order" },
      ordered: { bg: "bg-purple-100", text: "text-purple-800", icon: ShoppingCart, label: "Ordered" },
      received: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle, label: "Received" },
      partial: { bg: "bg-orange-100", text: "text-orange-800", icon: Clock, label: "Partial" },
      cancelled: { bg: "bg-red-100", text: "text-red-800", icon: XCircle, label: "Cancelled" },
    }
    
    const config = statusConfig[status] || statusConfig.draft
    const Icon = config.icon
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Purchase Orders</h1>
            <p className="text-muted-foreground">Create and manage purchase orders from suppliers</p>
          </div>
          <Link href="/dashboard/office/suppliers/purchase-orders/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Purchase Order
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Purchase Orders</CardTitle>
            <CardDescription>
              {purchaseOrders.length} purchase order{purchaseOrders.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search purchase orders..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : purchaseOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No purchase orders found. Create your first purchase order to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {po.po_number}
                          {po.status === 'pending_supplier' && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
                              Needs Supplier
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {po.supplier?.name || (
                          <span className="text-muted-foreground italic">No Supplier</span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(po.order_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {po.expected_delivery_date
                          ? new Date(po.expected_delivery_date).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>${po.total?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                      <TableCell>
                        <Link href={`/dashboard/office/suppliers/purchase-orders/${po.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

