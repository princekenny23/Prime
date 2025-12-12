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
  Tag,
  Eye,
} from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { saleService } from "@/lib/services/saleService"
import { useBusinessStore } from "@/stores/businessStore"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import Link from "next/link"
import type { Sale } from "@/lib/types"

interface DiscountDetail extends Sale {
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
}

export default function DiscountsPage() {
  const { currentBusiness } = useBusinessStore()
  const { toast } = useToast()
  
  const [sales, setSales] = useState<DiscountDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const loadSales = useCallback(async () => {
    if (!currentBusiness) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await saleService.list({})
      let salesData = response.results || []

      // Filter only sales with discounts
      salesData = salesData.filter((sale: any) => {
        const discount = sale.discount || sale._raw?.discount || 0
        return discount > 0
      })

      // Enrich with customer and outlet info
      const enrichedSales = salesData.map((sale: any) => {
        const discountDetail: DiscountDetail = { ...sale, _raw: sale._raw || sale }
        
        if (sale._raw?.customer) {
          discountDetail.customer = typeof sale._raw.customer === 'object'
            ? {
                id: String(sale._raw.customer.id || ""),
                name: sale._raw.customer.name || "",
                email: sale._raw.customer.email,
                phone: sale._raw.customer.phone,
              }
            : undefined
        }

        if (sale._raw?.outlet) {
          discountDetail.outlet = typeof sale._raw.outlet === 'object'
            ? {
                id: String(sale._raw.outlet.id || ""),
                name: sale._raw.outlet.name || "",
              }
            : undefined
        }

        if (sale._raw?.user) {
          discountDetail.user = typeof sale._raw.user === 'object'
            ? {
                id: String(sale._raw.user.id || ""),
                email: sale._raw.user.email || "",
                first_name: sale._raw.user.first_name,
                last_name: sale._raw.user.last_name,
              }
            : undefined
        }

        return discountDetail
      })

      setSales(enrichedSales)
    } catch (error) {
      console.error("Failed to load sales with discounts:", error)
      toast({
        title: "Error",
        description: "Failed to load discounts data",
        variant: "destructive",
      })
      setSales([])
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness, toast])

  useEffect(() => {
    loadSales()
  }, [loadSales])

  const filteredSales = useMemo(() => {
    if (!searchTerm) return sales

    const searchLower = searchTerm.toLowerCase()
    return sales.filter(sale => {
      const receiptMatch = sale._raw?.receipt_number?.toLowerCase().includes(searchLower)
      const customerMatch = sale.customer?.name?.toLowerCase().includes(searchLower)
      return receiptMatch || customerMatch
    })
  }, [sales, searchTerm])

  const formatCurrency = (amount: number) => {
    return `${currentBusiness?.currencySymbol || "MWK"} ${amount.toFixed(2)}`
  }

  const totalDiscountsAmount = useMemo(() => {
    return filteredSales.reduce((sum, sale) => {
      const discount = sale.discount || sale._raw?.discount || 0
      return sum + discount
    }, 0)
  }, [filteredSales])

  const calculateDiscountPercentage = (sale: DiscountDetail) => {
    const discount = sale.discount || sale._raw?.discount || 0
    const subtotal = sale.subtotal || sale._raw?.subtotal || sale.total
    if (subtotal === 0) return 0
    return ((discount / subtotal) * 100).toFixed(1)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Discounts</h1>
                <p className="text-muted-foreground mt-1">
                  View all sales with applied discounts and promotions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Discounts Applied</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                  {formatCurrency(totalDiscountsAmount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {filteredSales.length} sale{filteredSales.length !== 1 ? "s" : ""} with discount{filteredSales.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="h-16 w-16 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <Tag className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by receipt number or customer..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Discounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales with Discounts</CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `${filteredSales.length} sale${filteredSales.length !== 1 ? "s" : ""} with discount${filteredSales.length !== 1 ? "s" : ""} found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading discounts...</p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No discounts found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead>Discount Amount</TableHead>
                      <TableHead>Discount %</TableHead>
                      <TableHead>Total After Discount</TableHead>
                      <TableHead>Outlet</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => {
                      const discount = sale.discount || sale._raw?.discount || 0
                      const subtotal = sale.subtotal || sale._raw?.subtotal || sale.total
                      const discountPercent = calculateDiscountPercentage(sale)
                      
                      return (
                        <TableRow key={sale.id}>
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
                          <TableCell>
                            {formatCurrency(subtotal)}
                          </TableCell>
                          <TableCell className="font-semibold text-orange-600 dark:text-orange-400">
                            -{formatCurrency(discount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{discountPercent}%</Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(sale.total)}
                          </TableCell>
                          <TableCell>
                            {sale.outlet?.name || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Link href={`/dashboard/sales/transactions?receipt=${sale.id}`}>
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

