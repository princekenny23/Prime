"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageCard } from "@/components/layouts/page-card"
import { PageHeader } from "@/components/layouts/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Receipt,
  RotateCcw,
  CreditCard,
  Tag,
  Eye,
  Filter,
  CalendarIcon,
  Menu,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import { saleService } from "@/lib/services/saleService"
import { useToast } from "@/components/ui/use-toast"
import { format, subDays } from "date-fns"
import { useEffect, useCallback, useMemo } from "react"
import type { Sale } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { ViewSaleDetailsModal } from "@/components/modals/view-sale-details-modal"
import { receiptService } from "@/lib/services/receiptService"
import type { Receipt as ReceiptType } from "@/lib/services/receiptService"
import { Download, FileText } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"

interface SaleDetail extends Sale {
  payment_method?: string
  payment_status?: string
  discount?: number
  receipt_number?: string
  created_at?: string
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

export default function SalesPage() {
  const { currentBusiness } = useBusinessStore()
  const { currentOutlet } = useTenant()
  const { toast } = useToast()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState("sales")
  
  // Sales/Transactions state
  const [sales, setSales] = useState<SaleDetail[]>([])
  const [isLoadingSales, setIsLoadingSales] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  
  // Returns state
  const [returns, setReturns] = useState<SaleDetail[]>([])
  const [isLoadingReturns, setIsLoadingReturns] = useState(true)
  
  // Credits state
  const [credits, setCredits] = useState<SaleDetail[]>([])
  const [isLoadingCredits, setIsLoadingCredits] = useState(true)
  const [statusFilter, setStatusFilter] = useState<"all" | "unpaid" | "partially_paid" | "paid" | "overdue">("all")
  
  // Discounts state
  const [discounts, setDiscounts] = useState<SaleDetail[]>([])
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(true)
  
  // Receipts state
  const [receipts, setReceipts] = useState<ReceiptType[]>([])
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(true)
  
  // Sale details modal state
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null)
  const [showSaleDetails, setShowSaleDetails] = useState(false)
  const [isLoadingSaleDetails, setIsLoadingSaleDetails] = useState(false)

  // Load sales/transactions
  const loadSales = useCallback(async () => {
    if (!currentBusiness) {
      setIsLoadingSales(false)
      return
    }

    setIsLoadingSales(true)
    try {
      const filters: any = {
        status: "completed",
        outlet: currentOutlet?.id,
      }
      
      if (dateRange.from) {
        filters.date_from = format(dateRange.from, "yyyy-MM-dd")
      }
      if (dateRange.to) {
        filters.date_to = format(dateRange.to, "yyyy-MM-dd")
      }

      const response = await saleService.list(filters)
      let salesData = response.results || []

      const enrichedSales = salesData.map((sale: any) => {
        const saleDetail: SaleDetail = { ...sale, _raw: sale._raw || sale }
        
        if (sale._raw?.customer_detail) {
          saleDetail.customer = {
            id: String(sale._raw.customer_detail.id),
            name: sale._raw.customer_detail.name,
            email: sale._raw.customer_detail.email || '',
            phone: sale._raw.customer_detail.phone || '',
          }
        }

        if (sale._raw?.outlet_detail) {
          saleDetail.outlet = {
            id: String(sale._raw.outlet_detail.id),
            name: sale._raw.outlet_detail.name,
          }
        }

        if (sale._raw?.user_detail) {
          saleDetail.user = {
            id: String(sale._raw.user_detail.id),
            email: sale._raw.user_detail.email || '',
            first_name: sale._raw.user_detail.first_name || '',
            last_name: sale._raw.user_detail.last_name || '',
          }
        }

        // Extract receipt_number and payment_method from _raw
        saleDetail.receipt_number = sale._raw?.receipt_number || sale.receipt_number
        saleDetail.payment_method = sale._raw?.payment_method || sale.payment_method || sale.paymentMethod

        return saleDetail
      })

      setSales(enrichedSales)
    } catch (error: any) {
      console.error("Failed to load sales:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load sales",
        variant: "destructive",
      })
      setSales([])
    } finally {
      setIsLoadingSales(false)
    }
  }, [currentBusiness, currentOutlet, dateRange, toast])

  // Load returns
  const loadReturns = useCallback(async () => {
    if (!currentBusiness) {
      setIsLoadingReturns(false)
      return
    }

    setIsLoadingReturns(true)
    try {
      const filters: any = {
        status: "refunded",
        outlet: currentOutlet?.id,
      }
      
      if (dateRange.from) {
        filters.date_from = format(dateRange.from, "yyyy-MM-dd")
      }
      if (dateRange.to) {
        filters.date_to = format(dateRange.to, "yyyy-MM-dd")
      }

      const response = await saleService.list(filters)
      let returnsData = response.results || []

      const enrichedReturns = returnsData.map((ret: any) => {
        const returnDetail: SaleDetail = { ...ret, _raw: ret._raw || ret }
        
        if (ret._raw?.customer_detail) {
          returnDetail.customer = {
            id: String(ret._raw.customer_detail.id),
            name: ret._raw.customer_detail.name || "",
            email: ret._raw.customer_detail.email,
            phone: ret._raw.customer_detail.phone,
          }
        }

        if (ret._raw?.outlet_detail) {
          returnDetail.outlet = {
            id: String(ret._raw.outlet_detail.id),
            name: ret._raw.outlet_detail.name || "",
          }
        }

        // Extract receipt_number and payment_method from _raw
        returnDetail.receipt_number = ret._raw?.receipt_number || ret.receipt_number
        returnDetail.payment_method = ret._raw?.payment_method || ret.payment_method || ret.paymentMethod

        return returnDetail
      })

      setReturns(enrichedReturns)
    } catch (error: any) {
      console.error("Failed to load returns:", error)
      setReturns([])
    } finally {
      setIsLoadingReturns(false)
    }
  }, [currentBusiness, currentOutlet, dateRange])

  // Load credits
  const loadCredits = useCallback(async () => {
    if (!currentBusiness) {
      setIsLoadingCredits(false)
      return
    }

    setIsLoadingCredits(true)
    try {
      const filters: any = {
        payment_method: "credit",
        outlet: currentOutlet?.id,
      }
      
      if (dateRange.from) {
        filters.date_from = format(dateRange.from, "yyyy-MM-dd")
      }
      if (dateRange.to) {
        filters.date_to = format(dateRange.to, "yyyy-MM-dd")
      }

      const response = await saleService.list(filters)
      let creditsData = response.results || []

      const enrichedCredits = creditsData.map((credit: any) => {
        const creditDetail: SaleDetail = { ...credit, _raw: credit._raw || credit }
        
        if (credit._raw?.customer_detail) {
          creditDetail.customer = {
            id: String(credit._raw.customer_detail.id),
            name: credit._raw.customer_detail.name || "",
            email: credit._raw.customer_detail.email,
            phone: credit._raw.customer_detail.phone,
          }
        }

        if (credit._raw?.outlet_detail) {
          creditDetail.outlet = {
            id: String(credit._raw.outlet_detail.id),
            name: credit._raw.outlet_detail.name || "",
          }
        }

        // Extract receipt_number and payment_method from _raw
        creditDetail.receipt_number = credit._raw?.receipt_number || credit.receipt_number
        creditDetail.payment_method = credit._raw?.payment_method || credit.payment_method || credit.paymentMethod

        return creditDetail
      })

      setCredits(enrichedCredits)
    } catch (error: any) {
      console.error("Failed to load credits:", error)
      setCredits([])
    } finally {
      setIsLoadingCredits(false)
    }
  }, [currentBusiness, currentOutlet, dateRange])

  // Load discounts
  const loadDiscounts = useCallback(async () => {
    if (!currentBusiness) {
      setIsLoadingDiscounts(false)
      return
    }

    setIsLoadingDiscounts(true)
    try {
      const filters: any = {
        outlet: currentOutlet?.id,
      }
      
      if (dateRange.from) {
        filters.date_from = format(dateRange.from, "yyyy-MM-dd")
      }
      if (dateRange.to) {
        filters.date_to = format(dateRange.to, "yyyy-MM-dd")
      }

      const response = await saleService.list(filters)
      let salesData = response.results || []

      // Filter only sales with discounts
      salesData = salesData.filter((sale: any) => {
        const discount = sale.discount || sale._raw?.discount || 0
        return discount > 0
      })

      const enrichedSales = salesData.map((sale: any) => {
        const discountDetail: SaleDetail = { ...sale, _raw: sale._raw || sale }
        
        if (sale._raw?.customer_detail) {
          discountDetail.customer = {
            id: String(sale._raw.customer_detail.id),
            name: sale._raw.customer_detail.name || "",
            email: sale._raw.customer_detail.email,
            phone: sale._raw.customer_detail.phone,
          }
        }

        if (sale._raw?.outlet_detail) {
          discountDetail.outlet = {
            id: String(sale._raw.outlet_detail.id),
            name: sale._raw.outlet_detail.name || "",
          }
        }

        // Extract receipt_number and payment_method from _raw
        discountDetail.receipt_number = sale._raw?.receipt_number || sale.receipt_number
        discountDetail.payment_method = sale._raw?.payment_method || sale.payment_method || sale.paymentMethod

        return discountDetail
      })

      setDiscounts(enrichedSales)
    } catch (error: any) {
      console.error("Failed to load discounts:", error)
      setDiscounts([])
    } finally {
      setIsLoadingDiscounts(false)
    }
  }, [currentBusiness, currentOutlet, dateRange])

  // Load receipts
  const loadReceipts = useCallback(async () => {
    if (!currentBusiness) {
      setIsLoadingReceipts(false)
      return
    }

    setIsLoadingReceipts(true)
    try {
      // Check if receiptService is available
      if (!receiptService || typeof receiptService.list !== 'function') {
        throw new Error("Receipt service is not available")
      }
      
      const filters: any = {
        outlet: currentOutlet?.id ? String(currentOutlet.id) : undefined,
      }
      
      if (dateRange.from) {
        filters.date_from = format(dateRange.from, "yyyy-MM-dd")
      }
      if (dateRange.to) {
        filters.date_to = format(dateRange.to, "yyyy-MM-dd")
      }
      
      const response = await receiptService.list(filters)
      console.log("Receipts loaded:", response)
      setReceipts(response.results || [])
    } catch (error: any) {
      console.error("Failed to load receipts:", error)
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        receiptService: typeof receiptService,
      })
      toast({
        title: "Error",
        description: error.message || "Failed to load receipts. Please check if the receipts API is configured.",
        variant: "destructive",
      })
      setReceipts([])
    } finally {
      setIsLoadingReceipts(false)
    }
  }, [currentBusiness, currentOutlet, dateRange, toast])

  // Load data when tab changes or date range changes
  useEffect(() => {
    if (activeTab === "sales") {
      loadSales()
    } else if (activeTab === "returns") {
      loadReturns()
    } else if (activeTab === "credits") {
      loadCredits()
    } else if (activeTab === "discounts") {
      loadDiscounts()
    } else if (activeTab === "receipts") {
      loadReceipts()
    }
  }, [activeTab, dateRange, loadSales, loadReturns, loadCredits, loadDiscounts, loadReceipts])

  // Filtered data
  const filteredSales = useMemo(() => {
    if (!searchTerm) return sales
    return sales.filter((sale) => {
      const receiptNum = sale.receipt_number || sale.id.slice(-6)
      const customerName = sale.customer?.name || ""
      return (
        receiptNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }, [sales, searchTerm])

  const filteredReturns = useMemo(() => {
    if (!searchTerm) return returns
    return returns.filter((ret) => {
      const receiptNum = ret.receipt_number || ret.id.slice(-6)
      const customerName = ret.customer?.name || ""
      return (
        receiptNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }, [returns, searchTerm])

  const filteredCredits = useMemo(() => {
    let filtered = credits
    if (searchTerm) {
      filtered = filtered.filter((credit) => {
        const receiptNum = credit.receipt_number || credit.id.slice(-6)
        const customerName = credit.customer?.name || ""
        return (
          receiptNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customerName.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }
    if (statusFilter !== "all") {
      // Filter by payment status if needed
      filtered = filtered.filter((credit) => {
        const status = (credit as any).payment_status || credit._raw?.payment_status || "unpaid"
        return status === statusFilter
      })
    }
    return filtered
  }, [credits, searchTerm, statusFilter])

  const filteredDiscounts = useMemo(() => {
    if (!searchTerm) return discounts
    return discounts.filter((discount) => {
      const receiptNum = discount.receipt_number || discount.id.slice(-6)
      const customerName = discount.customer?.name || ""
      return (
        receiptNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }, [discounts, searchTerm])

  const filteredReceipts = useMemo(() => {
    if (!searchTerm) return receipts
    return receipts.filter((receipt) => {
      const receiptNum = receipt.receipt_number || ""
      return receiptNum.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [receipts, searchTerm])

  // Handle download receipt
  const handleDownloadReceipt = async (receipt: ReceiptType) => {
    try {
      const blob = await receiptService.download(receipt.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `receipt_${receipt.receipt_number}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Download Successful",
        description: "Receipt downloaded successfully",
      })
    } catch (error: any) {
      console.error("Failed to download receipt:", error)
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download receipt",
        variant: "destructive",
      })
    }
  }

  // Handle view receipt
  const handleViewReceipt = (receipt: ReceiptType) => {
    // Open receipt content in a new window
    const newWindow = window.open()
    if (newWindow) {
      newWindow.document.write(receipt.content)
      newWindow.document.close()
    }
  }

  // Handle view sale details
  const handleViewSale = async (sale: SaleDetail) => {
    setIsLoadingSaleDetails(true)
    try {
      // Fetch full sale details from API
      const fullSale = await saleService.get(sale.id)
      
      // Transform to SaleDetail format
      const saleDetail: SaleDetail = {
        ...fullSale,
        _raw: (fullSale as any)._raw || fullSale,
        customer: (fullSale as any).customer || sale.customer,
        outlet: (fullSale as any).outlet || sale.outlet,
        receipt_number: (fullSale as any)._raw?.receipt_number || (fullSale as any).receipt_number || sale.receipt_number,
        payment_method: (fullSale as any)._raw?.payment_method || (fullSale as any).payment_method || sale.payment_method,
      }
      
      setSelectedSale(saleDetail)
      setShowSaleDetails(true)
    } catch (error: any) {
      console.error("Failed to load sale details:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load sale details",
        variant: "destructive",
      })
      // Fallback to showing the sale we already have
      setSelectedSale(sale)
      setShowSaleDetails(true)
    } finally {
      setIsLoadingSaleDetails(false)
    }
  }

  // Get tab-specific title and actions
  const getTabTitle = () => {
    switch (activeTab) {
      case "sales": return t("sales.list.title")
      case "returns": return t("sales.menu.returns")
      case "credits": return t("sales.credit.title")
      case "discounts": return t("sales.menu.discounts")
      case "receipts": return t("sales.menu.receipts")
      default: return t("sales.title")
    }
  }

  const getTabActions = () => {
    if (activeTab === "sales") {
      return (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="bg-white border-white text-[#1e3a8a] hover:bg-blue-50 hover:border-blue-50">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to
                  ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                  : "Select date range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range) => {
                  setDateRange({
                    from: range?.from,
                    to: range?.to,
                  })
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      )
    }
    if (activeTab === "credits") {
      return (
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-[180px] bg-white border-white text-[#1e3a8a] hover:bg-blue-50">
            <SelectValue placeholder={t("common.filter_by_status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="partially_paid">Partially Paid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      )
    }
    return null
  }

  return (
    <DashboardLayout>
      {/* Page Card */}
      <PageCard className="mt-6">
        {/* Page Header with Title */}
        <PageHeader
          title={getTabTitle()}
        />

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-gray-300">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 bg-gray-50">
              <TabsTrigger 
                value="sales" 
                className="flex items-center gap-2 data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#1e3a8a]"
              >
                <Receipt className="h-4 w-4" />
                {t("sales.title")}
              </TabsTrigger>
              <TabsTrigger 
                value="returns" 
                className="flex items-center gap-2 data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#1e3a8a]"
              >
                <RotateCcw className="h-4 w-4" />
                {t("sales.menu.returns")}
              </TabsTrigger>
              <TabsTrigger 
                value="credits" 
                className="flex items-center gap-2 data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#1e3a8a]"
              >
                <CreditCard className="h-4 w-4" />
                {t("sales.credit.title")}
              </TabsTrigger>
              <TabsTrigger 
                value="discounts" 
                className="flex items-center gap-2 data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#1e3a8a]"
              >
                <Tag className="h-4 w-4" />
                {t("sales.menu.discounts")}
              </TabsTrigger>
              <TabsTrigger 
                value="receipts" 
                className="flex items-center gap-2 data-[state=active]:bg-[#1e3a8a] data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#1e3a8a]"
              >
                <FileText className="h-4 w-4" />
                {t("sales.menu.receipts")}
              </TabsTrigger>
            </TabsList>

            {/* Sales Tab */}
            <TabsContent value="sales" className="mt-0">
              {/* Filters/Search */}
              <div className="px-6 py-4 border-b border-gray-300">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder={t("sales.list.search")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white border-gray-300"
                    />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-white border-white text-[#1e3a8a] hover:bg-blue-50 hover:border-blue-50">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from && dateRange.to
                          ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                          : "Select date range"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={{
                          from: dateRange.from,
                          to: dateRange.to,
                        }}
                        onSelect={(range) => {
                          setDateRange({
                            from: range?.from,
                            to: range?.to,
                          })
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Table Content */}
              <div className="px-6 py-4">
                {isLoadingSales ? (
                  <div className="text-center py-8 text-gray-600">{t("common.actions.loading")}</div>
                ) : filteredSales.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">{t("sales.list.empty")}</div>
                ) : (
                  <div className="rounded-md border border-gray-300 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-gray-900 font-semibold">Receipt #</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Customer</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Date</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Outlet</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Payment Method</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Amount</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                          <TableHead className="text-right text-gray-900 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSales.map((sale) => (
                          <TableRow key={sale.id} className="border-gray-300">
                            <TableCell className="font-medium">
                              {sale._raw?.receipt_number || sale.receipt_number || sale.id.slice(-6)}
                            </TableCell>
                            <TableCell>{sale.customer?.name || "Walk-in"}</TableCell>
                            <TableCell>
                              {format(new Date((sale as any).created_at || sale.createdAt), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>{sale.outlet?.name || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize border-gray-300">
                                {sale._raw?.payment_method || sale.payment_method || sale.paymentMethod || "cash"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {currentBusiness?.currencySymbol || "MWK"} {sale.total.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={sale.status === "completed" ? "default" : "secondary"}>
                                {sale.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="border-gray-300">
                                    <Menu className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>{t("common.actions.select")}</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleViewSale(sale)}
                                    disabled={isLoadingSaleDetails}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t("common.actions.view")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Returns Tab */}
            <TabsContent value="returns" className="mt-0">
              {/* Filters/Search */}
              <div className="px-6 py-4 border-b border-gray-300">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder={t("sales.list.search")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white border-gray-300"
                    />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-white border-white text-[#1e3a8a] hover:bg-blue-50 hover:border-blue-50">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from && dateRange.to
                          ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                          : "Select date range"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={{
                          from: dateRange.from,
                          to: dateRange.to,
                        }}
                        onSelect={(range) => {
                          setDateRange({
                            from: range?.from,
                            to: range?.to,
                          })
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Table Content */}
              <div className="px-6 py-4">
                {isLoadingReturns ? (
                  <div className="text-center py-8 text-gray-600">{t("common.actions.loading")}</div>
                ) : filteredReturns.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">{t("common.messages.no_results")}</div>
                ) : (
                  <div className="rounded-md border border-gray-300 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-gray-900 font-semibold">Receipt #</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Customer</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Date</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Outlet</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Payment Method</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Amount</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                          <TableHead className="text-right text-gray-900 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReturns.map((ret) => (
                          <TableRow key={ret.id} className="border-gray-300">
                            <TableCell className="font-medium">
                              {ret._raw?.receipt_number || ret.receipt_number || ret.id.slice(-6)}
                            </TableCell>
                            <TableCell>{ret.customer?.name || "Walk-in"}</TableCell>
                            <TableCell>
                              {format(new Date((ret as any).created_at || ret.createdAt), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>{ret.outlet?.name || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize border-gray-300">
                                {ret._raw?.payment_method || ret.payment_method || ret.paymentMethod || "cash"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {currentBusiness?.currencySymbol || "MWK"} {ret.total.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">Refunded</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="border-gray-300">
                                    <Menu className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleViewSale(ret)}
                                    disabled={isLoadingSaleDetails}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Credits Tab */}
            <TabsContent value="credits" className="mt-0">
              {/* Filters/Search */}
              <div className="px-6 py-4 border-b border-gray-300">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder={t("sales.list.search")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white border-gray-300"
                    />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-white border-white text-[#1e3a8a] hover:bg-blue-50 hover:border-blue-50">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from && dateRange.to
                          ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                          : "Select date range"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={{
                          from: dateRange.from,
                          to: dateRange.to,
                        }}
                        onSelect={(range) => {
                          setDateRange({
                            from: range?.from,
                            to: range?.to,
                          })
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                    <SelectTrigger className="w-[180px] bg-white border-white text-[#1e3a8a] hover:bg-blue-50">
                      <SelectValue placeholder={t("common.filter_by_status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partially_paid">Partially Paid</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Table Content */}
              <div className="px-6 py-4">
                {isLoadingCredits ? (
                  <div className="text-center py-8 text-gray-600">{t("common.actions.loading")}</div>
                ) : filteredCredits.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">{t("common.messages.no_results")}</div>
                ) : (
                  <div className="rounded-md border border-gray-300 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-gray-900 font-semibold">Receipt #</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Customer</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Date</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Outlet</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Payment Method</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Amount</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                          <TableHead className="text-right text-gray-900 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCredits.map((credit) => (
                          <TableRow key={credit.id} className="border-gray-300">
                            <TableCell className="font-medium">
                              {credit._raw?.receipt_number || credit.receipt_number || credit.id.slice(-6)}
                            </TableCell>
                            <TableCell>{credit.customer?.name || "Walk-in"}</TableCell>
                            <TableCell>
                              {format(new Date((credit as any).created_at || credit.createdAt), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>{credit.outlet?.name || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize border-gray-300">
                                {credit._raw?.payment_method || credit.payment_method || credit.paymentMethod || "credit"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {currentBusiness?.currencySymbol || "MWK"} {credit.total.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  ((credit as any).payment_status || credit._raw?.payment_status) === "paid" ? "default" :
                                  ((credit as any).payment_status || credit._raw?.payment_status) === "partially_paid" ? "secondary" :
                                  "destructive"
                                }
                              >
                                {(credit as any).payment_status || credit._raw?.payment_status || "unpaid"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="border-gray-300">
                                    <Menu className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleViewSale(credit)}
                                    disabled={isLoadingSaleDetails}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Discounts Tab */}
            <TabsContent value="discounts" className="mt-0">
              {/* Filters/Search */}
              <div className="px-6 py-4 border-b border-gray-300">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder={t("sales.list.search")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white border-gray-300"
                    />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-white border-white text-[#1e3a8a] hover:bg-blue-50 hover:border-blue-50">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from && dateRange.to
                          ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                          : "Select date range"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={{
                          from: dateRange.from,
                          to: dateRange.to,
                        }}
                        onSelect={(range) => {
                          setDateRange({
                            from: range?.from,
                            to: range?.to,
                          })
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Table Content */}
              <div className="px-6 py-4">
                {isLoadingDiscounts ? (
                  <div className="text-center py-8 text-gray-600">{t("common.actions.loading")}</div>
                ) : filteredDiscounts.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">{t("common.messages.no_results")}</div>
                ) : (
                  <div className="rounded-md border border-gray-300 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-gray-900 font-semibold">Receipt #</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Customer</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Date</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Outlet</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Payment Method</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Total</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Discount</TableHead>
                          <TableHead className="text-right text-gray-900 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDiscounts.map((discount) => (
                          <TableRow key={discount.id} className="border-gray-300">
                            <TableCell className="font-medium">
                              {discount._raw?.receipt_number || discount.receipt_number || discount.id.slice(-6)}
                            </TableCell>
                            <TableCell>{discount.customer?.name || "Walk-in"}</TableCell>
                            <TableCell>
                              {format(new Date((discount as any).created_at || discount.createdAt), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>{discount.outlet?.name || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize border-gray-300">
                                {discount._raw?.payment_method || discount.payment_method || discount.paymentMethod || "cash"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {currentBusiness?.currencySymbol || "MWK"} {discount.total.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {currentBusiness?.currencySymbol || "MWK"} {(discount.discount || 0).toFixed(2)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="border-gray-300">
                                    <Menu className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleViewSale(discount)}
                                    disabled={isLoadingSaleDetails}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Receipts Tab */}
            <TabsContent value="receipts" className="mt-0">
              {/* Filters/Search */}
              <div className="px-6 py-4 border-b border-gray-300">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder={t("sales.search_receipt_placeholder")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white border-gray-300"
                    />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-white border-white text-[#1e3a8a] hover:bg-blue-50 hover:border-blue-50">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from && dateRange.to
                          ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                          : "Select date range"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={{
                          from: dateRange.from,
                          to: dateRange.to,
                        }}
                        onSelect={(range) => {
                          setDateRange({
                            from: range?.from,
                            to: range?.to,
                          })
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Table Content */}
              <div className="px-6 py-4">
                {isLoadingReceipts ? (
                  <div className="text-center py-8 text-gray-600">{t("common.actions.loading")}</div>
                ) : filteredReceipts.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">{t("common.messages.no_results")}</div>
                ) : (
                  <div className="rounded-md border border-gray-300 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-gray-900 font-semibold">Receipt #</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Sale ID</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Format</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Generated</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Sent</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Access Count</TableHead>
                          <TableHead className="text-right text-gray-900 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReceipts.map((receipt) => (
                          <TableRow key={receipt.id} className="border-gray-300">
                            <TableCell className="font-medium">
                              {receipt.receipt_number}
                            </TableCell>
                            <TableCell>
                              {receipt.sale?.id || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="uppercase border-gray-300">
                                {receipt.format}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(receipt.generated_at), "MMM dd, yyyy HH:mm")}
                            </TableCell>
                            <TableCell>
                              {receipt.is_sent ? (
                                <Badge variant="default">
                                  {receipt.sent_via || "Sent"}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Not Sent</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {receipt.access_count}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="border-gray-300">
                                    <Menu className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleViewReceipt(receipt)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t("common.actions.view")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownloadReceipt(receipt)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    {t("common.actions.download")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        </PageCard>

      {/* Sale Details Modal */}
      {selectedSale && (
        <ViewSaleDetailsModal
          open={showSaleDetails}
          onOpenChange={(open) => {
            setShowSaleDetails(open)
            if (!open) {
              setSelectedSale(null)
            }
          }}
          sale={{
            id: selectedSale._raw?.receipt_number || selectedSale.receipt_number || selectedSale.id,
            date: (selectedSale as any).created_at || selectedSale.createdAt,
            customer: selectedSale.customer?.name,
            outlet: selectedSale.outlet?.name,
            items: (selectedSale.items || []).map((item: any, index: number) => ({
              id: item.id || item.productId || `item-${index}`,
              name: item.productName || item.name || "Unknown Product",
              quantity: item.quantity || 0,
              price: item.price || 0,
              total: item.total || (item.price || 0) * (item.quantity || 0),
            })),
            subtotal: selectedSale.subtotal || 0,
            tax: selectedSale.tax || 0,
            discount: selectedSale.discount || 0,
            total: selectedSale.total || 0,
            paymentMethod: selectedSale._raw?.payment_method || selectedSale.payment_method || selectedSale.paymentMethod || "cash",
            status: selectedSale.status || "completed",
          }}
        />
      )}
    </DashboardLayout>
  )
}
