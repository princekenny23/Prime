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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, CreditCard, DollarSign, AlertCircle, TrendingUp, TrendingDown,
  Users, Calendar, Filter
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { customerService, type Customer, type CreditSummary } from "@/lib/services/customerService"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function CreditsPage() {
  const { currentBusiness } = useBusinessStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [creditSummary, setCreditSummary] = useState<CreditSummary | null>(null)
  const [showCreditDetails, setShowCreditDetails] = useState(false)
  const useReal = useRealAPI()

  const loadCustomers = useCallback(async () => {
    if (!currentBusiness) {
      setCustomers([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      if (useReal) {
        const data = await customerService.list({ is_active: true })
        // Filter to only credit-enabled customers
        const creditCustomers = data.filter(c => c.credit_enabled)
        setCustomers(creditCustomers)
      } else {
        setCustomers([])
      }
    } catch (error) {
      console.error("Failed to load customers:", error)
      setCustomers([])
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness?.id, useReal])

  const loadCreditSummary = useCallback(async (customerId: string) => {
    if (!useReal) return

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
    } else {
      setCreditSummary(null)
    }
  }, [selectedCustomer, loadCreditSummary])

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
    
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && customer.credit_status === "active") ||
      (statusFilter === "suspended" && customer.credit_status === "suspended") ||
      (statusFilter === "closed" && customer.credit_status === "closed") ||
      (statusFilter === "overdue" && (Number(customer.outstanding_balance) || 0) > 0)
    
    return matchesSearch && matchesStatus
  })

  // Calculate statistics
  const totalCreditLimit = customers.reduce((sum, c) => {
    const limit = Number(c.credit_limit) || 0
    return sum + limit
  }, 0)
  const totalOutstanding = customers.reduce((sum, c) => {
    const balance = Number(c.outstanding_balance) || 0
    return sum + balance
  }, 0)
  const totalAvailable = customers.reduce((sum, c) => {
    const available = Number(c.available_credit) || 0
    return sum + available
  }, 0)
  const overdueCount = customers.filter(c => {
    // This would ideally come from credit summary, but for now we check outstanding balance
    const balance = Number(c.outstanding_balance) || 0
    return balance > 0
  }).length

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowCreditDetails(true)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Credit Management</h1>
            <p className="text-muted-foreground">Manage customer credit accounts and outstanding balances</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Credit Limit</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentBusiness?.currencySymbol || "MWK"} {Number(totalCreditLimit).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {customers.length} customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {currentBusiness?.currencySymbol || "MWK"} {Number(totalOutstanding).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {overdueCount} customers with balance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Credit</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {currentBusiness?.currencySymbol || "MWK"} {Number(totalAvailable).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Remaining credit capacity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credit Utilization</CardTitle>
              <TrendingDown className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Number(totalCreditLimit) > 0 
                  ? ((Number(totalOutstanding) / Number(totalCreditLimit)) * 100).toFixed(1)
                  : "0"}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Of total credit limit used
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Accounts</CardTitle>
            <CardDescription>View and manage customer credit accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="overdue">With Balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Payment Terms</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">Loading credit accounts...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No credit accounts found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => {
                    const creditLimit = Number(customer.credit_limit) || 0
                    const outstandingBalance = Number(customer.outstanding_balance) || 0
                    const utilization = creditLimit > 0
                      ? (outstandingBalance / creditLimit) * 100
                      : 0
                    
                    return (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.email || customer.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {currentBusiness?.currencySymbol || "MWK"} {creditLimit.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className={`font-medium ${
                              outstandingBalance > 0 ? "text-orange-600" : "text-muted-foreground"
                            }`}>
                              {currentBusiness?.currencySymbol || "MWK"} {outstandingBalance.toFixed(2)}
                            </span>
                            {utilization > 0 && (
                              <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    utilization > 80 ? "bg-red-600" :
                                    utilization > 50 ? "bg-orange-600" : "bg-blue-600"
                                  }`}
                                  style={{ width: `${Math.min(utilization, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            {currentBusiness?.currencySymbol || "MWK"} {Number(customer.available_credit || 0).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            Net {customer.payment_terms_days || 30}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              customer.credit_status === "active" ? "default" :
                              customer.credit_status === "suspended" ? "secondary" : "outline"
                            }
                          >
                            {customer.credit_status || "active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(customer)}
                          >
                            View Details
                          </Button>
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

      {/* Credit Details Dialog */}
      <Dialog open={showCreditDetails} onOpenChange={setShowCreditDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Credit Account Details</DialogTitle>
            <DialogDescription>
              {selectedCustomer?.name} - Credit Account Information
            </DialogDescription>
          </DialogHeader>
          
          {creditSummary ? (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="history">Payment History</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Credit Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Credit Limit:</span>
                        <span className="font-medium">
                          {currentBusiness?.currencySymbol || "MWK"} {Number(creditSummary.credit_limit).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Outstanding Balance:</span>
                        <span className="font-medium text-orange-600">
                          {currentBusiness?.currencySymbol || "MWK"} {Number(creditSummary.outstanding_balance).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Available Credit:</span>
                        <span className="font-medium text-green-600">
                          {currentBusiness?.currencySymbol || "MWK"} {Number(creditSummary.available_credit).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Payment Terms:</span>
                        <span className="font-medium">Net {creditSummary.payment_terms_days}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge variant={creditSummary.credit_status === "active" ? "default" : "secondary"}>
                          {creditSummary.credit_status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Overdue Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Overdue Amount:</span>
                        <span className="font-medium text-red-600">
                          {currentBusiness?.currencySymbol || "MWK"} {Number(creditSummary.overdue_amount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Overdue Invoices:</span>
                        <span className="font-medium">{creditSummary.overdue_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Unpaid Invoices:</span>
                        <span className="font-medium">{creditSummary.unpaid_count}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="invoices" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Unpaid Invoices</h3>
                  {creditSummary.unpaid_invoices.length > 0 ? (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Paid</TableHead>
                            <TableHead>Remaining</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {creditSummary.unpaid_invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">{invoice.receipt_number}</TableCell>
                              <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "-"}
                              </TableCell>
                              <TableCell>
                                {currentBusiness?.currencySymbol || "MWK"} {Number(invoice.total).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {currentBusiness?.currencySymbol || "MWK"} {Number(invoice.amount_paid).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <span className={invoice.is_overdue ? "text-red-600 font-medium" : ""}>
                                  {currentBusiness?.currencySymbol || "MWK"} {Number(invoice.remaining).toFixed(2)}
                                </span>
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
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No unpaid invoices
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Payment history will be displayed here once payments are recorded.
                </p>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading credit details...</p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowCreditDetails(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

