"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
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
import { Plus, ArrowRightLeft, Info } from "lucide-react"
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
        const transferOutMovements = await inventoryService.getMovements({
          movement_type: "transfer_out",
        })
        
        const transferMap = new Map()
        
        const transferOutResults = transferOutMovements.results || []
        transferOutResults.forEach((movement: any) => {
          const transferId = `${movement.id}_${movement.product?.id || movement.product}_${movement.created_at}`
          
          if (!transferMap.has(transferId)) {
            const fromOutletId = movement.outlet || (typeof movement.outlet === 'object' ? movement.outlet.id : movement.outlet)
            const toOutletId = movement.reference_id || "N/A"
            
            transferMap.set(transferId, {
              id: movement.id,
              product_id: movement.product?.id || movement.product,
              product_name: movement.product_name || movement.product?.name || "N/A",
              from_outlet_id: fromOutletId,
              from_outlet_name: movement.outlet_name || (typeof movement.outlet === 'object' ? movement.outlet.name : "N/A"),
              to_outlet_id: toOutletId,
              to_outlet_name: "N/A",
              quantity: movement.quantity,
              reason: movement.reason || "",
              date: movement.created_at,
              status: "completed",
            })
          }
        })
        
        const transferInMovements = await inventoryService.getMovements({
          movement_type: "transfer_in",
        })
        
        const transferInResults = transferInMovements.results || []
        transferInResults.forEach((movement: any) => {
          const matchingTransfer = Array.from(transferMap.values()).find((t: any) => 
            String(t.product_id) === String(movement.product?.id || movement.product) &&
            t.quantity === movement.quantity &&
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
      <PageLayout
        title="Stock Transfers"
        description="Transfer inventory between outlets"
        actions={
          <Button onClick={() => setShowTransfer(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Transfer
          </Button>
        }
      >
        {/* Explanation Card */}
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <ArrowRightLeft className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">What is Stock Transfer?</h3>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  Stock transfer is when you move products from one store location (outlet) to another. 
                  For example, if Store A has too much of a product and Store B needs it, you can transfer items between them.
                </p>
                <div className="mt-3 space-y-1 text-sm text-purple-800 dark:text-purple-200">
                  <p className="font-medium">When to use Stock Transfer:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Moving products from one store to another</li>
                    <li>Balancing inventory between locations</li>
                    <li>Sending products to a branch that needs them</li>
                    <li>Moving items from warehouse to retail store</li>
                  </ul>
                </div>
                <div className="mt-3 p-2 bg-purple-100 dark:bg-purple-900/30 rounded text-xs text-purple-900 dark:text-purple-200">
                  <p className="font-medium">💡 Example:</p>
                  <p>Main Store has 100 units of Product X, but Branch Store needs 20 units. 
                  Transfer 20 units from Main Store to Branch Store.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

            {/* Transfer History Table */}
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Transfer History</h3>
                <p className="text-sm text-gray-600">
                  Track all stock transfers between your outlets
                </p>
              </div>
              <div className="rounded-md border border-gray-300 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-gray-900 font-semibold">Date</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Product</TableHead>
                      <TableHead className="text-gray-900 font-semibold">From</TableHead>
                      <TableHead className="text-gray-900 font-semibold">To</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Quantity</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <p className="text-gray-600">Loading transfers...</p>
                        </TableCell>
                      </TableRow>
                    ) : transfers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <p className="text-gray-600">No transfers found</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Create your first transfer to move products between outlets
                          </p>
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
                          <TableRow key={transfer.id} className="border-gray-300">
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
              </div>
            </div>
      </PageLayout>

      <TransferStockModal
        open={showTransfer}
        onOpenChange={setShowTransfer}
        onSuccess={loadTransfers}
      />
    </DashboardLayout>
  )
}
