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
import {
  Search,
  CreditCard,
  ArrowLeft,
  Eye,
  AlertCircle,
} from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { saleService } from "@/lib/services/saleService"
import { useBusinessStore } from "@/stores/businessStore"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import Link from "next/link"
import type { Sale } from "@/lib/types"

interface CreditDetail extends Sale {
  payment_method?: string
  discount?: number
  receipt_number?: string
  payment_status?: string
  amount_paid?: number
  due_date?: string
  _raw?: any
  customer?: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  user?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
  outlet?: {
    id: string
    name: string
  }
}

export default function CreditsPage() {
  const { currentBusiness } = useBusinessStore()
  const { toast } = useToast()
  
  const [credits, setCredits] = useState<CreditDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "unpaid" | "partially_paid" | "paid" | "overdue">("all")

  const loadCredits = useCallback(async () => {
    if (!currentBusiness) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await saleService.list({ payment_method: "credit" })
      let creditsData = response.results || []

      // Enrich with customer and outlet info
      const enrichedCredits = creditsData.map((credit: any) => {
        const creditDetail: CreditDetail = { ...credit, _raw: credit._raw || credit }
        
        if (credit._raw?.customer) {
          creditDetail.customer = typeof credit._raw.customer === 'object'
            ? {
                id: String(credit._raw.customer.id || ""),
                name: credit._raw.customer.name || "",
                email: credit._raw.customer.email,
                phone: credit._raw.customer.phone,
              }
            : undefined
        }

        if (credit._raw?.outlet) {
          creditDetail.outlet = typeof credit._raw.outlet === 'object'
            ? {
                id: String(credit._raw.outlet.id || ""),
                name: credit._raw.outlet.name || "",
              }
            : undefined
        }

        if (credit._raw?.user) {
          creditDetail.user = typeof credit._raw.user === 'object'
            ? {
                id: String(credit._raw.user.id || ""),
                email: credit._raw.user.email || "",
                first_name: credit._raw.user.first_name,
                last_name: credit._raw.user.last_name,
              }
            : undefined
        }

        return creditDetail
      })

      setCredits(enrichedCredits)
    } catch (error) {
      console.error("Failed to load credits:", error)
      toast({
        title: "Error",
        description: "Failed to load credit sales data",
        variant: "destructive",
      })
      setCredits([])
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness, toast])

  useEffect(() => {
    loadCredits()
  }, [loadCredits])

  const filteredCredits = useMemo(() => {
    let filtered = credits

    // Filter by payment status
    if (statusFilter !== "all") {
      filtered = filtered.filter(credit => {
        const paymentStatus = credit.payment_status || credit._raw?.payment_status || "unpaid"
        return paymentStatus === statusFilter
      })
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(credit => {
        const receiptMatch = credit._raw?.receipt_number?.toLowerCase().includes(searchLower)
        const customerMatch = credit.customer?.name?.toLowerCase().includes(searchLower)
        return receiptMatch || customerMatch
      })
    }

    return filtered
  }, [credits, searchTerm, statusFilter])

  const formatCurrency = (amount: number) => {
    return `${currentBusiness?.currencySymbol || "MWK"} ${amount.toFixed(2)}`
  }

  const summaryStats = useMemo(() => {
    const total = filteredCredits.reduce((sum, credit) => sum + credit.total, 0)
    const paid = filteredCredits
      .filter(c => (c.payment_status || c._raw?.payment_status) === "paid")
      .reduce((sum, credit) => sum + credit.total, 0)
    const outstanding = filteredCredits
      .filter(c => {
        const status = c.payment_status || c._raw?.payment_status
        return status === "unpaid" || status === "partially_paid"
      })
      .reduce((sum, credit) => {
        const amountPaid = credit.amount_paid || credit._raw?.amount_paid || 0
        return sum + (credit.total - amountPaid)
      }, 0)

    return { total, paid, outstanding }
  }, [filteredCredits])

  const getPaymentStatusBadge = (status?: string) => {
    const paymentStatus = status || "unpaid"
    switch (paymentStatus) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case "partially_paid":
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unpaid</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/sales">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Credit Sales</h1>
                <p className="text-muted-foreground mt-1">
                  Track credit sales and outstanding payments
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Credit Sales</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                    {formatCurrency(summaryStats.total)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {formatCurrency(summaryStats.outstanding)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Paid</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {formatCurrency(summaryStats.paid)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by receipt number or customer..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "unpaid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("unpaid")}
                >
                  Unpaid
                </Button>
                <Button
                  variant={statusFilter === "partially_paid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("partially_paid")}
                >
                  Partial
                </Button>
                <Button
                  variant={statusFilter === "paid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("paid")}
                >
                  Paid
                </Button>
                <Button
                  variant={statusFilter === "overdue" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("overdue")}
                >
                  Overdue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credits Table */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Sales</CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `${filteredCredits.length} credit sale${filteredCredits.length !== 1 ? "s" : ""} found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading credit sales...</p>
              </div>
            ) : filteredCredits.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No credit sales found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCredits.map((credit) => {
                      const amountPaid = credit.amount_paid || credit._raw?.amount_paid || 0
                      const balance = credit.total - amountPaid
                      const paymentStatus = credit.payment_status || credit._raw?.payment_status || "unpaid"
                      
                      return (
                        <TableRow key={credit.id}>
                          <TableCell className="font-medium">
                            {credit._raw?.receipt_number || `#${credit.id}`}
                          </TableCell>
                          <TableCell>
                            {format(new Date(credit.createdAt), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            {credit.customer ? (
                              <div>
                                <p className="font-medium">{credit.customer.name}</p>
                                {credit.customer.email && (
                                  <p className="text-xs text-muted-foreground">{credit.customer.email}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Walk-in</span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(credit.total)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(amountPaid)}
                          </TableCell>
                          <TableCell className={balance > 0 ? "font-semibold text-red-600 dark:text-red-400" : "font-semibold"}>
                            {formatCurrency(balance)}
                          </TableCell>
                          <TableCell>
                            {getPaymentStatusBadge(paymentStatus)}
                          </TableCell>
                          <TableCell>
                            {credit.due_date || credit._raw?.due_date
                              ? format(new Date(credit.due_date || credit._raw.due_date), "MMM dd, yyyy")
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Link href={`/dashboard/sales/transactions?receipt=${credit.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

