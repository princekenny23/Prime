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
import { Badge } from "@/components/ui/badge"
import { Plus, Search, ArrowLeft, DollarSign, Calendar } from "lucide-react"
import { useState, useEffect } from "react"
import { NewReturnModal } from "@/components/modals/new-return-modal"
import { RefundConfirmationModal } from "@/components/modals/refund-confirmation-modal"
import { saleService } from "@/lib/services/saleService"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"

export default function ReturnsPage() {
  const { currentBusiness, currentOutlet } = useBusinessStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewReturn, setShowNewReturn] = useState(false)
  const [showRefundConfirm, setShowRefundConfirm] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState<any>(null)
  const [returns, setReturns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const useReal = useRealAPI()

  useEffect(() => {
    const loadReturns = async () => {
      if (!currentBusiness) return
      
      setIsLoading(true)
      try {
        if (useReal) {
          // Returns are sales with status="refunded" or refunded=true
          const salesData = await saleService.list({
            tenant: currentBusiness.id,
            outlet: currentOutlet?.id,
            status: "refunded",
            limit: 100,
          })
          
          const sales = Array.isArray(salesData) ? salesData : salesData.results || []
          setReturns(sales.map((sale: any) => ({
            id: sale.id,
            returnId: sale.refund_number || `RET-${sale.id.slice(-6)}`,
            saleId: sale.receipt_number || sale.id,
            customer: sale.customer?.name || "Walk-in",
            date: sale.refunded_at || sale.updated_at || sale.created_at,
            items: sale.items?.length || 0,
            amount: sale.refund_amount || sale.total,
            reason: sale.refund_reason || "Customer Request",
            status: sale.status === "refunded" ? "Completed" : "Pending",
            refundMethod: sale.refund_method || sale.payment_method || "Cash",
          })))
        } else {
          setReturns([])
        }
      } catch (error) {
        console.error("Failed to load returns:", error)
        setReturns([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadReturns()
  }, [currentBusiness, currentOutlet, useReal])

  const filteredReturns = returns.filter(ret =>
    ret.returnId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ret.saleId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ret.customer?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalReturns = returns.length
  const totalAmount = returns.reduce((sum, r) => sum + (r.amount || 0), 0)
  const pendingReturns = returns.filter(r => r.status === "Pending").length

  const handleRefund = (returnItem: any) => {
    setSelectedReturn(returnItem)
    setShowRefundConfirm(true)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Returns & Refunds</h1>
            <p className="text-muted-foreground">Manage product returns and refunds</p>
          </div>
          <Button onClick={() => setShowNewReturn(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Return
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReturns}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Refunded</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentBusiness?.currencySymbol || "MWK"} {totalAmount.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Returns</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingReturns}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by return ID, sale ID, or customer..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Returns Table */}
        <Card>
          <CardHeader>
            <CardTitle>Return History</CardTitle>
            <CardDescription>
              {filteredReturns.length} return{filteredReturns.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return ID</TableHead>
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-muted-foreground">Loading returns...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredReturns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-muted-foreground">No returns found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReturns.map((returnItem) => (
                    <TableRow key={returnItem.id}>
                      <TableCell className="font-medium">{returnItem.returnId}</TableCell>
                      <TableCell>{returnItem.saleId}</TableCell>
                      <TableCell>{returnItem.customer}</TableCell>
                      <TableCell>
                        {new Date(returnItem.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{returnItem.items}</TableCell>
                      <TableCell className="font-semibold">
                        {currentBusiness?.currencySymbol || "MWK"} {returnItem.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{returnItem.reason}</TableCell>
                      <TableCell>
                        <Badge
                          variant={returnItem.status === "Completed" ? "default" : "secondary"}
                        >
                          {returnItem.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {returnItem.status === "Pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRefund(returnItem)}
                          >
                            Process Refund
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <NewReturnModal
        open={showNewReturn}
        onOpenChange={setShowNewReturn}
      />
      <RefundConfirmationModal
        open={showRefundConfirm}
        onOpenChange={setShowRefundConfirm}
        returnItem={selectedReturn}
      />
    </DashboardLayout>
  )
}

