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
import { Plus, ArrowRightLeft } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { TransferStockModal } from "@/components/modals/transfer-stock-modal"
import { inventoryService } from "@/lib/services/inventoryService"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"

export default function TransfersPage() {
  const { currentBusiness, outlets } = useBusinessStore()
  const [showTransfer, setShowTransfer] = useState(false)
  const [transfers, setTransfers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const useReal = useRealAPI()

  const loadTransfers = useCallback(async () => {
    if (!currentBusiness) {
      setTransfers([])
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    try {
      if (useReal) {
        // Load transfer movements (transfer_in and transfer_out)
        const transferOutMovements = await inventoryService.getMovements({
          movement_type: "transfer_out",
        })
        
        // Group transfers by reference_id (which contains to_outlet_id)
        const transferMap = new Map()
        
        // Process transfer_out movements (these are the main transfer records)
        const transferOutResults = transferOutMovements.results || []
        transferOutResults.forEach((movement: any) => {
          // Use reference_id as unique identifier (it contains to_outlet_id)
          // Combine with product_id and created_at for uniqueness
          const transferId = `${movement.id}_${movement.product?.id || movement.product}_${movement.created_at}`
          
          if (!transferMap.has(transferId)) {
            const fromOutletId = movement.outlet || (typeof movement.outlet === 'object' ? movement.outlet.id : movement.outlet)
            const toOutletId = movement.reference_id || "N/A" // reference_id contains to_outlet_id
            
            transferMap.set(transferId, {
              id: movement.id,
              product_id: movement.product?.id || movement.product,
              product_name: movement.product_name || movement.product?.name || "N/A",
              from_outlet_id: fromOutletId,
              from_outlet_name: movement.outlet_name || (typeof movement.outlet === 'object' ? movement.outlet.name : "N/A"),
              to_outlet_id: toOutletId,
              to_outlet_name: "N/A", // Will be filled from transfer_in
              quantity: movement.quantity,
              reason: movement.reason || "",
              date: movement.created_at,
              status: "completed",
            })
          }
        })
        
        // Get transfer_in movements to get to_outlet names
        const transferInMovements = await inventoryService.getMovements({
          movement_type: "transfer_in",
        })
        
        const transferInResults = transferInMovements.results || []
        transferInResults.forEach((movement: any) => {
          // Match by product, quantity, and reference_id (which should match transfer_out id)
          const matchingTransfer = Array.from(transferMap.values()).find((t: any) => 
            String(t.product_id) === String(movement.product?.id || movement.product) &&
            t.quantity === movement.quantity &&
            // Match by date proximity (within same day) or by reference_id
            (movement.reference_id === String(t.id) || 
             new Date(t.date).toDateString() === new Date(movement.created_at).toDateString())
          )
          if (matchingTransfer) {
            matchingTransfer.to_outlet_id = movement.outlet || (typeof movement.outlet === 'object' ? movement.outlet.id : movement.outlet)
            matchingTransfer.to_outlet_name = movement.outlet_name || (typeof movement.outlet === 'object' ? movement.outlet.name : "N/A")
          }
        })
        
        const transfersList = Array.from(transferMap.values())
        setTransfers(transfersList)
      } else {
        setTransfers([])
      }
    } catch (error) {
      console.error("Failed to load transfers:", error)
      setTransfers([])
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness?.id, useReal])

  useEffect(() => {
    if (currentBusiness) {
      loadTransfers()
    }
  }, [currentBusiness?.id, loadTransfers])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stock Transfers</h1>
            <p className="text-muted-foreground">Transfer inventory between outlets</p>
          </div>
          <Button onClick={() => setShowTransfer(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Transfer
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transfer History</CardTitle>
            <CardDescription>
              Track all stock transfers between outlets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">Loading transfers...</p>
                    </TableCell>
                  </TableRow>
                ) : transfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No transfers found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  transfers.map((transfer) => {
                    const fromOutlet = transfer.from_outlet_name || 
                                     outlets.find(o => o.id === transfer.from_outlet_id)?.name || 
                                     transfer.from || 
                                     "N/A"
                    const toOutlet = transfer.to_outlet_name || 
                                   outlets.find(o => o.id === transfer.to_outlet_id)?.name || 
                                   transfer.to || 
                                   "N/A"
                    return (
                      <TableRow key={transfer.id}>
                        <TableCell>
                          {transfer.date 
                            ? new Date(transfer.date).toLocaleDateString() 
                            : transfer.created_at 
                            ? new Date(transfer.created_at).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell className="font-medium">{transfer.product_name || transfer.product || "N/A"}</TableCell>
                        <TableCell>{fromOutlet}</TableCell>
                        <TableCell>{toOutlet}</TableCell>
                        <TableCell>{transfer.quantity}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transfer.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {transfer.status || "completed"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <TransferStockModal
        open={showTransfer}
        onOpenChange={setShowTransfer}
        onSuccess={loadTransfers}
      />
    </DashboardLayout>
  )
}

