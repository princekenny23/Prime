"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, PackageCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"
import { inventoryService } from "@/lib/services/inventoryService"
import { ReceiveStockModal } from "@/components/modals/receive-stock-modal"
import { ViewReceivingDetailsModal } from "@/components/modals/view-receiving-details-modal"

export default function ReceivingPage() {
  const { currentBusiness, outlets } = useBusinessStore()
  const [showReceive, setShowReceive] = useState(false)
  const [selectedReceiving, setSelectedReceiving] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [receiving, setReceiving] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const useReal = useRealAPI()

  const loadReceiving = useCallback(async () => {
    if (!currentBusiness) {
      setReceiving([])
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    try {
      if (useReal) {
        // Load purchase movements (receiving)
        console.log("Loading receiving data for tenant:", currentBusiness?.id)
        const purchaseMovements = await inventoryService.getMovements({
          movement_type: "purchase",
        })
        
        console.log("Purchase movements response:", {
          results: purchaseMovements.results,
          count: purchaseMovements.count,
          resultsLength: purchaseMovements.results?.length || 0
        })
        
        // Group by supplier and date for display
        const receivingMap = new Map()
        
        const purchaseResults = purchaseMovements.results || []
        console.log("Processing purchase results:", purchaseResults.length)
        purchaseResults.forEach((movement: any) => {
          console.log("Processing movement:", {
            id: movement.id,
            product: movement.product_name,
            quantity: movement.quantity,
            supplier: movement.reference_id,
            outlet: movement.outlet
          })
          // Use supplier (from reference_id) and date as key
          const supplier = movement.reference_id || "Unknown Supplier"
          const dateKey = new Date(movement.created_at).toDateString()
          const key = `${supplier}_${dateKey}`
          
          const outletId = movement.outlet || (typeof movement.outlet === 'object' ? movement.outlet.id : null)
          const outletName = movement.outlet_name || (typeof movement.outlet === 'object' ? movement.outlet.name : null) || 
                            (outletId ? outlets.find(o => o.id === outletId)?.name : null) || "N/A"
          const reason = movement.reason || ""
          
          if (!receivingMap.has(key)) {
            receivingMap.set(key, {
              id: key,
              supplier: supplier,
              date: movement.created_at,
              outlet: outletId,
              outlet_name: outletName,
              reason: reason,
              items: [],
              total: 0,
              status: "received",
            })
          }
          
          const receiving = receivingMap.get(key)
          const productName = movement.product_name || movement.product?.name || "N/A"
          const quantity = movement.quantity
          const cost = movement.product?.cost || 0
          const itemTotal = cost * quantity
          
          receiving.items.push({
            product_id: movement.product?.id || movement.product,
            product_name: productName,
            quantity: quantity,
            cost: cost,
            total: itemTotal,
          })
          receiving.total += itemTotal
        })
        
        const receivingList = Array.from(receivingMap.values())
        console.log("Final receiving list:", receivingList)
        setReceiving(receivingList)
      } else {
        setReceiving([])
      }
    } catch (error) {
      console.error("Failed to load receiving data:", error)
      setReceiving([])
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness?.id, useReal])

  useEffect(() => {
    if (currentBusiness) {
      loadReceiving()
      
      // Listen for outlet changes
      const handleOutletChange = () => {
        loadReceiving()
      }
      window.addEventListener("outlet-changed", handleOutletChange)
      
      return () => {
        window.removeEventListener("outlet-changed", handleOutletChange)
      }
    }
  }, [currentBusiness?.id, loadReceiving])

  const filteredReceiving = receiving.filter(order =>
    order.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Receiving</h1>
            <p className="text-muted-foreground">Manage incoming inventory from suppliers</p>
          </div>
          <Button onClick={() => setShowReceive(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Receiving
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Receiving Orders</CardTitle>
            <CardDescription>
              Track incoming inventory shipments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search receiving orders..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">Loading receiving orders...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredReceiving.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No receiving orders found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReceiving.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        {order.date 
                          ? new Date(order.date).toLocaleDateString() 
                          : order.created_at 
                          ? new Date(order.created_at).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="font-medium">{order.supplier || "N/A"}</TableCell>
                      <TableCell>{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</TableCell>
                      <TableCell>{currentBusiness?.currencySymbol || "MWK"} {(order.total || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.status === "received" || order.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {order.status || "received"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedReceiving(order)
                            setShowViewModal(true)
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <ReceiveStockModal
        open={showReceive}
        onOpenChange={setShowReceive}
        onSuccess={loadReceiving}
      />

      <ViewReceivingDetailsModal
        open={showViewModal}
        onOpenChange={setShowViewModal}
        receivingOrder={selectedReceiving}
        currencySymbol={currentBusiness?.currencySymbol || "MWK"}
      />
    </DashboardLayout>
  )
}

