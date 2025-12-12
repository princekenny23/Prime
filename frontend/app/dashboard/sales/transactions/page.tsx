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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Receipt,
  Filter,
  CalendarIcon,
  User,
  Building2,
  Eye,
  Package,
  CreditCard,
  Clock,
  FileText,
} from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { saleService, type SaleFilters } from "@/lib/services/saleService"
import { customerService } from "@/lib/services/customerService"
import { outletService } from "@/lib/services/outletService"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import { useToast } from "@/components/ui/use-toast"
import { format, subDays } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { Sale } from "@/lib/types"

interface SaleDetail extends Sale {
  payment_method?: string
  discount?: number
  receipt_number?: string
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
  shift?: {
    id: string
    shift_number?: string
    status: string
  }
  payments?: Array<{
    id: string
    amount: number
    payment_method: string
    status: string
    created_at: string
  }>
}

export default function TransactionsPage() {
  const { currentBusiness } = useBusinessStore()
  const { currentOutlet, outlets } = useTenant()
  const { toast } = useToast()
  
  const [sales, setSales] = useState<SaleDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [outletFilter, setOutletFilter] = useState<string>("all")
  const [cashierFilter, setCashierFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [availableOutlets, setAvailableOutlets] = useState<any[]>([])
  const [availableCashiers, setAvailableCashiers] = useState<any[]>([])

  useEffect(() => {
    outletService.list().then((outlets) => {
      setAvailableOutlets(outlets)
    }).catch(console.error)
  }, [])

  const loadSales = useCallback(async () => {
    if (!currentBusiness) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const filters: SaleFilters = {}
      
      if (outletFilter !== "all") {
        filters.outlet = outletFilter
      }
      
      if (dateRange.from) {
        filters.start_date = format(dateRange.from, "yyyy-MM-dd")
      }
      if (dateRange.to) {
        filters.end_date = format(dateRange.to, "yyyy-MM-dd")
      }

      const response = await saleService.list(filters)
      let salesData = response.results || []

      const enrichedSales = await Promise.all(
        salesData.map(async (sale: any) => {
          const saleDetail: SaleDetail = { ...sale, _raw: sale._raw || sale }
          
          if (sale._raw?.customer) {
            try {
              const customerId = typeof sale._raw.customer === 'object' 
                ? sale._raw.customer.id 
                : sale._raw.customer
              if (customerId) {
                const customer = await customerService.get(String(customerId))
                saleDetail.customer = {
                  id: customer.id,
                  name: customer.name,
                  email: customer.email,
                  phone: customer.phone,
                }
              }
            } catch (e) {
              // Customer not found
            }
          }

          // Payment service removed - payments will be implemented in new system
          saleDetail.payments = []

          if (sale._raw?.user) {
            saleDetail.user = typeof sale._raw.user === 'object'
              ? {
                  id: String(sale._raw.user.id || ""),
                  email: sale._raw.user.email || "",
                  first_name: sale._raw.user.first_name,
                  last_name: sale._raw.user.last_name,
                }
              : undefined
          }

          if (sale._raw?.outlet) {
            saleDetail.outlet = typeof sale._raw.outlet === 'object'
              ? {
                  id: String(sale._raw.outlet.id || ""),
                  name: sale._raw.outlet.name || "",
                }
              : undefined
          }

          if (sale._raw?.shift) {
            saleDetail.shift = typeof sale._raw.shift === 'object'
              ? {
                  id: String(sale._raw.shift.id || ""),
                  shift_number: sale._raw.shift.shift_number,
                  status: sale._raw.shift.status || "",
                }
              : undefined
          }

          return saleDetail
        })
      )

      setSales(enrichedSales)
      
      const cashiers = new Map<string, any>()
      enrichedSales.forEach(sale => {
        if (sale.user) {
          cashiers.set(sale.user.id, sale.user)
        }
      })
      setAvailableCashiers(Array.from(cashiers.values()))
      
    } catch (error) {
      console.error("Failed to load sales:", error)
      toast({
        title: "Error",
        description: "Failed to load sales data",
        variant: "destructive",
      })
      setSales([])
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness, outletFilter, dateRange, toast])

  useEffect(() => {
    loadSales()
    
    // Auto-refresh sales list every 30 seconds for real-time updates
    const interval = setInterval(() => {
      loadSales()
    }, 30000)
    
    // Listen for outlet changes
    const handleOutletChange = () => {
      // Reset outlet filter to current outlet when outlet changes
      if (currentOutlet) {
        setOutletFilter(String(currentOutlet.id))
      }
      loadSales()
    }
    
    // Listen for sale completion events to refresh the list immediately
    const handleSaleCompleted = () => {
      loadSales()
    }
    
    window.addEventListener("outlet-changed", handleOutletChange)
    window.addEventListener("sale-completed", handleSaleCompleted)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener("outlet-changed", handleOutletChange)
      window.removeEventListener("sale-completed", handleSaleCompleted)
    }
  }, [loadSales, currentOutlet])

  const filteredSales = useMemo(() => {
    let filtered = sales

    if (cashierFilter !== "all") {
      filtered = filtered.filter(s => s.user?.id === cashierFilter)
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(sale => {
        const receiptMatch = sale._raw?.receipt_number?.toLowerCase().includes(searchLower)
        const customerMatch = sale.customer?.name?.toLowerCase().includes(searchLower)
        const itemMatch = sale.items?.some(item => 
          item.productName?.toLowerCase().includes(searchLower)
        )
        return receiptMatch || customerMatch || itemMatch
      })
    }

    return filtered
  }, [sales, cashierFilter, searchTerm])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "refunded":
        return <Badge className="bg-red-100 text-red-800">Refunded</Badge>
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return `${currentBusiness?.currencySymbol || "MWK"} ${amount.toFixed(2)}`
  }

  const handleRowClick = async (sale: SaleDetail) => {
    try {
      const fullSale = await saleService.get(sale.id)
      setSelectedSale({ 
        ...sale, 
        ...fullSale, 
        _raw: (fullSale as any)._raw || sale._raw || fullSale,
        payment_method: (fullSale as any).payment_method || sale.payment_method || sale.paymentMethod,
        discount: (fullSale as any).discount || sale.discount,
        receipt_number: (fullSale as any).receipt_number || sale.receipt_number || sale._raw?.receipt_number
      })
      setShowDetailPanel(true)
    } catch (error) {
      console.error("Failed to load sale details:", error)
      setSelectedSale(sale)
      setShowDetailPanel(true)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">All Transactions</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive view of all sales transactions
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by receipt, customer, or product..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              <Select value={outletFilter} onValueChange={setOutletFilter}>
                <SelectTrigger className="w-[180px]">
                  <Building2 className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="All Outlets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outlets</SelectItem>
                  {availableOutlets.map((outlet) => (
                    <SelectItem key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={cashierFilter} onValueChange={setCashierFilter}>
                <SelectTrigger className="w-[180px]">
                  <User className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="All Cashiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cashiers</SelectItem>
                  {availableCashiers.map((cashier) => (
                    <SelectItem key={cashier.id} value={cashier.id}>
                      {cashier.first_name && cashier.last_name
                        ? `${cashier.first_name} ${cashier.last_name}`
                        : cashier.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(outletFilter !== "all" || cashierFilter !== "all" || dateRange.from || searchTerm) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOutletFilter("all")
                    setCashierFilter("all")
                    setDateRange({ from: subDays(new Date(), 30), to: new Date() })
                    setSearchTerm("")
                  }}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Transactions</CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `${filteredSales.length} transaction${filteredSales.length !== 1 ? "s" : ""} found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading sales...</p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No sales found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow 
                        key={sale.id}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => handleRowClick(sale)}
                      >
                        <TableCell className="font-medium">
                          {sale._raw?.receipt_number || `#${sale.id}`}
                        </TableCell>
                        <TableCell>
                          {format(new Date(sale.createdAt), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          {sale.customer ? (
                            <div>
                              <p className="font-medium">{sale.customer.name}</p>
                              {sale.customer.email && (
                                <p className="text-xs text-muted-foreground">{sale.customer.email}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Walk-in</span>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">
                          {sale.payment_method || sale.paymentMethod}
                        </TableCell>
                        <TableCell>
                          {((sale.discount || 0) > 0) ? formatCurrency(sale.discount || 0) : "-"}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(sale.total)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(sale.status)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRowClick(sale)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Panel */}
      <Sheet open={showDetailPanel} onOpenChange={setShowDetailPanel}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedSale && (
            <>
              <SheetHeader className="border-b pb-4">
                <SheetTitle className="text-2xl">
                  Sale Details
                </SheetTitle>
                <SheetDescription>
                  Receipt #{selectedSale._raw?.receipt_number || selectedSale.id}
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                <div className="space-y-6 pr-4">
                  {/* Sale Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Sale Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Date & Time</p>
                        <p className="font-medium">
                          {format(new Date(selectedSale.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        {getStatusBadge(selectedSale.status)}
                      </div>
                      <div>
                        <p className="text-muted-foreground">Outlet</p>
                        <p className="font-medium">
                          {selectedSale.outlet?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cashier</p>
                        <p className="font-medium">
                          {selectedSale.user?.email || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Customer Info */}
                  {selectedSale.customer && (
                    <>
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Customer
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Name</p>
                            <p className="font-medium">
                              {selectedSale.customer.name}
                            </p>
                          </div>
                          {selectedSale.customer.email && (
                            <div>
                              <p className="text-muted-foreground">Email</p>
                              <p className="font-medium">
                                {selectedSale.customer.email}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Sale Items */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Items ({selectedSale.items?.length || 0})
                    </h3>
                    <div className="space-y-2">
                      {selectedSale.items?.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} × {formatCurrency(item.price)}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {formatCurrency(item.total)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">
                        {formatCurrency(selectedSale.subtotal)}
                      </span>
                    </div>
                    {selectedSale.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-medium">
                          {formatCurrency(selectedSale.tax)}
                        </span>
                      </div>
                    )}
                    {((selectedSale.discount || 0) > 0) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(selectedSale.discount || 0)}
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(selectedSale.total)}</span>
                    </div>
                  </div>

                  {/* Payments */}
                  {selectedSale.payments && selectedSale.payments.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          Payments ({selectedSale.payments.length})
                        </h3>
                        <div className="space-y-2">
                          {selectedSale.payments.map((payment) => (
                            <div
                              key={payment.id}
                              className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium capitalize">
                                    {payment.payment_method}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(payment.created_at), "MMM dd, yyyy HH:mm")}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">
                                    {formatCurrency(payment.amount)}
                                  </p>
                                  <Badge
                                    className={
                                      payment.status === "completed"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }
                                  >
                                    {payment.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Shift Info */}
                  {selectedSale.shift && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Shift Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Shift Status</p>
                            <Badge
                              className={
                                selectedSale.shift.status === "OPEN"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {selectedSale.shift.status}
                            </Badge>
                          </div>
                          {selectedSale.shift.shift_number && (
                            <div>
                              <p className="text-muted-foreground">Shift Number</p>
                              <p className="font-medium">
                                {selectedSale.shift.shift_number}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}
