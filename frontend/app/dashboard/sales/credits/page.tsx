"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search,
  Menu,
  CalendarIcon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import { saleService } from "@/lib/services/saleService"
import { useToast } from "@/components/ui/use-toast"
import { format, subDays } from "date-fns"
import { useRouter } from "next/navigation"
import { ViewSaleDetailsModal } from "@/components/modals/view-sale-details-modal"
import type { Sale } from "@/lib/types"

interface SaleDetail extends Sale {
  payment_method?: string
  payment_status?: string
  receipt_number?: string
  created_at?: string
  _raw?: any
  customer?: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  outlet?: {
    id: string
    name: string
  }
}

export default function CreditsPage() {
  const router = useRouter()
  const { currentBusiness } = useBusinessStore()
  const { currentOutlet } = useTenant()
  const { toast } = useToast()

  const [credits, setCredits] = useState<SaleDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "unpaid" | "partially_paid" | "paid" | "overdue">("all")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null)
  const [showSaleDetails, setShowSaleDetails] = useState(false)
  const [isLoadingSaleDetails, setIsLoadingSaleDetails] = useState(false)

  // Load credits
  const loadCredits = useCallback(async () => {
    if (!currentBusiness || !currentOutlet) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const filters: any = {
        payment_method: "tab",
        outlet: currentOutlet.id,
      }
      
      if (dateRange.from) {
        filters.date_from = format(dateRange.from, "yyyy-MM-dd")
      }
      if (dateRange.to) {
        filters.date_to = format(dateRange.to, "yyyy-MM-dd")
      }

      const response = await saleService.list(filters)
      const creditsData = response.results || []

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

        creditDetail.receipt_number = credit._raw?.receipt_number || credit.receipt_number
        creditDetail.payment_method = credit._raw?.payment_method || credit.payment_method || credit.paymentMethod

        return creditDetail
      })

      setCredits(enrichedCredits)
    } catch (error: any) {
      console.error("Failed to load credits:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load credits",
        variant: "destructive",
      })
      setCredits([])
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness, currentOutlet, dateRange, toast])

  useEffect(() => {
    loadCredits()
  }, [loadCredits])

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
      filtered = filtered.filter((credit) => {
        const status = (credit as any).payment_status || credit._raw?.payment_status || "unpaid"
        return status === statusFilter
      })
    }
    return filtered
  }, [credits, searchTerm, statusFilter])

  const handleViewSale = async (sale: SaleDetail) => {
    setIsLoadingSaleDetails(true)
    try {
      const fullSale = await saleService.get(sale.id)
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
      setSelectedSale(sale)
      setShowSaleDetails(true)
    } finally {
      setIsLoadingSaleDetails(false)
    }
  }

  return (
    <div className="w-full">
      <div className="px-6 pt-4 pb-2">
        <h2 className="text-xl font-semibold text-gray-900">Credits & Tabs</h2>
      </div>

        <div className="px-6 py-4 border-b border-gray-300">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by receipt number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white border-white text-[#1e3a8a] hover:bg-blue-50">
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
                <SelectValue placeholder="Filter by status" />
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

        <div className="px-6 py-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-600">Loading credits...</div>
          ) : filteredCredits.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No credits found</div>
          ) : (
            <div className="rounded-md border border-gray-300 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-gray-900 font-semibold">Receipt #</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Customer</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Date</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Outlet</TableHead>
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
            paymentMethod: selectedSale._raw?.payment_method || selectedSale.payment_method || selectedSale.paymentMethod || "tab",
            status: selectedSale.status || "completed",
          }}
        />
      )}
    </div>
  )
}
