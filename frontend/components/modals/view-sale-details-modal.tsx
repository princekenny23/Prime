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
import { Badge } from "@/components/ui/badge"
import { Receipt, Download, Printer, Store, User, CreditCard } from "lucide-react"
import { useBusinessStore } from "@/stores/businessStore"
import { formatCurrency } from "@/lib/utils/currency"
import { useI18n } from "@/contexts/i18n-context"

interface SaleItem {
  id: string
  name: string
  quantity: number
  price: number
  total: number
}

interface SaleDetails {
  id: string
  date: string
  customer?: string
  outlet?: string
  items: SaleItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: string
  status: string
}

interface ViewSaleDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: SaleDetails | null
}

export function ViewSaleDetailsModal({ open, onOpenChange, sale }: ViewSaleDetailsModalProps) {
  const { currentBusiness } = useBusinessStore()
  
  if (!sale) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Sale Details - Receipt #{sale.id}
          </DialogTitle>
          <DialogDescription>
            Transaction from {new Date(sale.date).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Sale Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Receipt Number</p>
              <p className="font-medium">#{sale.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date & Time</p>
              <p className="font-medium">{new Date(sale.date).toLocaleString()}</p>
            </div>
            {sale.customer && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Customer
                </p>
                <p className="font-medium">{sale.customer}</p>
              </div>
            )}
            {sale.outlet && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Store className="h-3 w-3" />
                  Outlet
                </p>
                <p className="font-medium">{sale.outlet}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                Payment Method
              </p>
              <Badge variant="outline" className="capitalize mt-1">
                {sale.paymentMethod}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge 
                variant={sale.status === "completed" ? "default" : "secondary"}
                className="mt-1"
              >
                {sale.status}
              </Badge>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="font-semibold mb-3">Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  sale.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.price, currentBusiness)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.total, currentBusiness)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(sale.subtotal, currentBusiness)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600 font-medium">
                  -{formatCurrency(sale.discount, currentBusiness)}
                </span>
              </div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">{formatCurrency(sale.tax, currentBusiness)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(sale.total, currentBusiness)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

