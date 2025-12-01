"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PackageCheck, Calendar, Building2, User } from "lucide-react"

interface ReceivingOrder {
  id: string
  supplier: string
  date: string
  items: Array<{
    product_id: string
    product_name: string
    quantity: number
    cost: number
    total: number
  }>
  total: number
  status: string
  outlet?: string
  outlet_name?: string
  reason?: string
}

interface ViewReceivingDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receivingOrder: ReceivingOrder | null
  currencySymbol?: string
}

export function ViewReceivingDetailsModal({ 
  open, 
  onOpenChange, 
  receivingOrder,
  currencySymbol = "MWK"
}: ViewReceivingDetailsModalProps) {
  if (!receivingOrder) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5" />
            Receiving Order Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this receiving order
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Order Information */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Supplier</p>
                <p className="font-medium">{receivingOrder.supplier || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {receivingOrder.date 
                    ? new Date(receivingOrder.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : "N/A"}
                </p>
              </div>
            </div>
            {receivingOrder.outlet_name && (
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Outlet</p>
                  <p className="font-medium">{receivingOrder.outlet_name}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <PackageCheck className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs inline-block ${
                  receivingOrder.status === "received" || receivingOrder.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {receivingOrder.status || "received"}
                </span>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div>
            <h3 className="font-semibold mb-3">Received Products</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivingOrder.items && receivingOrder.items.length > 0 ? (
                  receivingOrder.items.map((item, index) => (
                    <TableRow key={item.product_id || index}>
                      <TableCell className="font-medium">
                        {item.product_name || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {currencySymbol} {item.cost ? Number(item.cost).toFixed(2) : "0.00"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {currencySymbol} {item.total ? Number(item.total).toFixed(2) : "0.00"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="flex justify-end pt-4 border-t">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Items:</span>
                <span className="font-medium">{receivingOrder.items?.length || 0}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total Value:</span>
                <span>{currencySymbol} {(receivingOrder.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {receivingOrder.reason && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{receivingOrder.reason}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

