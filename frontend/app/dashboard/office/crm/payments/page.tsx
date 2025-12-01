"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, CreditCard, DollarSign, Calendar, AlertCircle, CheckCircle2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { customerService, creditPaymentService, type Customer, type CreditSummary, type UnpaidInvoice, type CreditPayment } from "@/lib/services/customerService"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

export default function PaymentCollectionPage() {
  const { currentBusiness } = useBusinessStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [creditSummary, setCreditSummary] = useState<CreditSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'bank_transfer' | 'other'>('cash')
  const [referenceNumber, setReferenceNumber] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set())
  const useReal = useRealAPI()

  const loadCustomers = useCallback(async () => {
    if (!currentBusiness) {
      setCustomers([])
      return
    }

    try {
      if (useReal) {
        const data = await customerService.list({ is_active: true })
        // Filter to only customers with credit enabled and outstanding balance
        const creditCustomers = data.filter(c => c.credit_enabled && (c.outstanding_balance || 0) > 0)
        setCustomers(creditCustomers)
      } else {
        setCustomers([])
      }
    } catch (error) {
      console.error("Failed to load customers:", error)
      setCustomers([])
    }
  }, [currentBusiness?.id, useReal])

  const loadCreditSummary = useCallback(async (customerId: string) => {
    if (!useReal) return

    setIsLoading(true)
    try {
      const summary = await customerService.getCreditSummary(customerId)
      setCreditSummary(summary)
    } catch (error: any) {
      console.error("Failed to load credit summary:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load credit summary",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [useReal, toast])

  useEffect(() => {
    if (currentBusiness) {
      loadCustomers()
    }
  }, [currentBusiness?.id, loadCustomers])

  useEffect(() => {
    if (selectedCustomer) {
      loadCreditSummary(selectedCustomer.id)
      setSelectedInvoices(new Set())
      setPaymentAmount("")
    } else {
      setCreditSummary(null)
    }
  }, [selectedCustomer, loadCreditSummary])

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  )

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
  }

  const handleToggleInvoice = (invoiceId: string) => {
    const newSelected = new Set(selectedInvoices)
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId)
    } else {
      newSelected.add(invoiceId)
    }
    setSelectedInvoices(newSelected)
    
    // Calculate total for selected invoices
    if (creditSummary) {
      const selectedInvoicesData = creditSummary.unpaid_invoices.filter(inv => newSelected.has(inv.id))
      const total = selectedInvoicesData.reduce((sum, inv) => sum + inv.remaining, 0)
      setPaymentAmount(total.toFixed(2))
    }
  }

  const handleSelectAll = () => {
    if (!creditSummary) return
    
    if (selectedInvoices.size === creditSummary.unpaid_invoices.length) {
      setSelectedInvoices(new Set())
      setPaymentAmount("")
    } else {
      const allIds = new Set(creditSummary.unpaid_invoices.map(inv => inv.id))
      setSelectedInvoices(allIds)
      const total = creditSummary.unpaid_invoices.reduce((sum, inv) => sum + inv.remaining, 0)
      setPaymentAmount(total.toFixed(2))
    }
  }

  const handleRecordPayment = async () => {
    if (!selectedCustomer || !creditSummary || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please select a customer and enter a valid payment amount",
        variant: "destructive",
      })
      return
    }

    const amount = parseFloat(paymentAmount)
    if (amount > creditSummary.outstanding_balance) {
      toast({
        title: "Validation Error",
        description: "Payment amount cannot exceed outstanding balance",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // For now, we'll allocate payment to the oldest invoice
      // In a full implementation, you'd allocate across multiple invoices (FIFO)
      const invoicesToPay = creditSummary.unpaid_invoices
        .filter(inv => selectedInvoices.has(inv.id))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      if (invoicesToPay.length === 0) {
        // Pay oldest invoice if none selected
        const oldestInvoice = creditSummary.unpaid_invoices
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
        
        if (oldestInvoice) {
          await creditPaymentService.create({
            customer: selectedCustomer.id,
            sale: oldestInvoice.id,
            amount: Math.min(amount, oldestInvoice.remaining),
            payment_method: paymentMethod,
            reference_number: referenceNumber || undefined,
            notes: paymentNotes || undefined,
          })
        }
      } else {
        // Allocate payment across selected invoices (FIFO)
        let remainingAmount = amount
        for (const invoice of invoicesToPay) {
          if (remainingAmount <= 0) break
          
          const paymentForInvoice = Math.min(remainingAmount, invoice.remaining)
          await creditPaymentService.create({
            customer: selectedCustomer.id,
            sale: invoice.id,
            amount: paymentForInvoice,
            payment_method: paymentMethod,
            reference_number: referenceNumber || undefined,
            notes: paymentNotes || undefined,
          })
          
          remainingAmount -= paymentForInvoice
        }
      }

      toast({
        title: "Payment Recorded",
        description: `Payment of ${currentBusiness?.currencySymbol || "MWK"} ${amount.toFixed(2)} has been recorded successfully.`,
      })

      // Reload data
      setShowPaymentDialog(false)
      setPaymentAmount("")
      setReferenceNumber("")
      setPaymentNotes("")
      setSelectedInvoices(new Set())
      if (selectedCustomer) {
        loadCreditSummary(selectedCustomer.id)
        loadCustomers()
      }
    } catch (error: any) {
      console.error("Failed to record payment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to record payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payment Collection</h1>
            <p className="text-muted-foreground">Record payments for customer credit accounts</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Customer</CardTitle>
              <CardDescription>Choose a customer to view their outstanding invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredCustomers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No customers with outstanding balance found
                    </p>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedCustomer?.id === customer.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.email || customer.phone}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-orange-600">
                              {currentBusiness?.currencySymbol || "MWK"} {(customer.outstanding_balance || 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">Outstanding</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Summary & Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Invoices</CardTitle>
              <CardDescription>
                {selectedCustomer
                  ? `Invoices for ${selectedCustomer.name}`
                  : "Select a customer to view invoices"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedCustomer ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Select a customer to view their outstanding invoices</p>
                </div>
              ) : isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : creditSummary ? (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {currentBusiness?.currencySymbol || "MWK"} {creditSummary.outstanding_balance.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">
                        {currentBusiness?.currencySymbol || "MWK"} {creditSummary.overdue_amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">{creditSummary.overdue_count} invoices</p>
                    </div>
                  </div>

                  {/* Invoices Table */}
                  {creditSummary.unpaid_invoices.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Unpaid Invoices ({creditSummary.unpaid_invoices.length})</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAll}
                        >
                          {selectedInvoices.size === creditSummary.unpaid_invoices.length ? "Deselect All" : "Select All"}
                        </Button>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12"></TableHead>
                              <TableHead>Invoice</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {creditSummary.unpaid_invoices.map((invoice) => (
                              <TableRow
                                key={invoice.id}
                                className={selectedInvoices.has(invoice.id) ? "bg-primary/5" : ""}
                              >
                                <TableCell>
                                  <input
                                    type="checkbox"
                                    checked={selectedInvoices.has(invoice.id)}
                                    onChange={() => handleToggleInvoice(invoice.id)}
                                    className="rounded"
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{invoice.receipt_number}</TableCell>
                                <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  {invoice.due_date ? (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(invoice.due_date).toLocaleDateString()}
                                    </div>
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">
                                      {currentBusiness?.currencySymbol || "MWK"} {invoice.remaining.toFixed(2)}
                                    </p>
                                    {invoice.amount_paid > 0 && (
                                      <p className="text-xs text-muted-foreground">
                                        Paid: {currentBusiness?.currencySymbol || "MWK"} {invoice.amount_paid.toFixed(2)}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      invoice.is_overdue
                                        ? "destructive"
                                        : invoice.payment_status === "partially_paid"
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    {invoice.is_overdue
                                      ? `Overdue (${invoice.days_overdue}d)`
                                      : invoice.payment_status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => setShowPaymentDialog(true)}
                        disabled={selectedInvoices.size === 0 && !paymentAmount}
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Record Payment
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No outstanding invoices</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Failed to load credit summary</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record payment for {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
              {creditSummary && (
                <p className="text-xs text-muted-foreground">
                  Outstanding: {currentBusiness?.currencySymbol || "MWK"} {creditSummary.outstanding_balance.toFixed(2)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Receipt number, check number, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Additional notes about this payment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={isLoading || !paymentAmount || parseFloat(paymentAmount) <= 0}>
              {isLoading ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

