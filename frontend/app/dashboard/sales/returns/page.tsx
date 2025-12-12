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
  RotateCcw,
  Eye,
} from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { saleService, type SaleFilters } from "@/lib/services/saleService"
import { useBusinessStore } from "@/stores/businessStore"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import Link from "next/link"
import type { Sale } from "@/lib/types"

interface ReturnDetail extends Sale {
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

export default function ReturnsPage() {
  const { currentBusiness } = useBusinessStore()
  const { toast } = useToast()
  
  const [returns, setReturns] = useState<ReturnDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const loadReturns = useCallback(async () => {
    if (!currentBusiness) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await saleService.list({ status: "refunded" })
      let returnsData = response.results || []

      // Enrich with customer and outlet info
      const enrichedReturns = returnsData.map((ret: any) => {
        const returnDetail: ReturnDetail = { ...ret, _raw: ret._raw || ret }
        
        if (ret._raw?.customer) {
          returnDetail.customer = typeof ret._raw.customer === 'object'
            ? {
                id: String(ret._raw.customer.id || ""),
                name: ret._raw.customer.name || "",
                email: ret._raw.customer.email,
                phone: ret._raw.customer.phone,
              }
            : undefined
        }

        if (ret._raw?.outlet) {
          returnDetail.outlet = typeof ret._raw.outlet === 'object'
            ? {
                id: String(ret._raw.outlet.id || ""),
                name: ret._raw.outlet.name || "",
              }
            : undefined
        }

        if (ret._raw?.user) {
          returnDetail.user = typeof ret._raw.user === 'object'
            ? {
                id: String(ret._raw.user.id || ""),
                email: ret._raw.user.email || "",
                first_name: ret._raw.user.first_name,
                last_name: ret._raw.user.last_name,
              }
            : undefined
        }

        return returnDetail
      })

      setReturns(enrichedReturns)
    } catch (error) {
      console.error("Failed to load returns:", error)
      toast({
        title: "Error",
        description: "Failed to load returns data",
        variant: "destructive",
      })
      setReturns([])
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness, toast])

  useEffect(() => {
    loadReturns()
  }, [loadReturns])

  const filteredReturns = useMemo(() => {
    if (!searchTerm) return returns

    const searchLower = searchTerm.toLowerCase()
    return returns.filter(ret => {
      const receiptMatch = ret._raw?.receipt_number?.toLowerCase().includes(searchLower)
      const customerMatch = ret.customer?.name?.toLowerCase().includes(searchLower)
      return receiptMatch || customerMatch
    })
  }, [returns, searchTerm])

  const formatCurrency = (amount: number) => {
    return `${currentBusiness?.currencySymbol || "MWK"} ${amount.toFixed(2)}`
  }

  const totalReturnsAmount = useMemo(() => {
    return filteredReturns.reduce((sum, ret) => sum + ret.total, 0)
  }, [filteredReturns])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Returns</h1>
                <p className="text-muted-foreground mt-1">
                  View and manage product returns and refunds
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
                <p className="text-sm font-medium text-muted-foreground">Total Returns</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                  {formatCurrency(totalReturnsAmount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {filteredReturns.length} return{filteredReturns.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <RotateCcw className="h-8 w-8 text-red-600 dark:text-red-400" />
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

        {/* Returns Table */}
        <Card>
          <CardHeader>
            <CardTitle>Returns & Refunds</CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `${filteredReturns.length} return${filteredReturns.length !== 1 ? "s" : ""} found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading returns...</p>
              </div>
            ) : filteredReturns.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <RotateCcw className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No returns found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Original Sale</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Return Amount</TableHead>
                      <TableHead>Outlet</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReturns.map((ret) => (
                      <TableRow key={ret.id}>
                        <TableCell className="font-medium">
                          {ret._raw?.receipt_number || `#${ret.id}`}
                        </TableCell>
                        <TableCell>
                          {format(new Date(ret.createdAt), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          {ret.customer ? (
                            <div>
                              <p className="font-medium">{ret.customer.name}</p>
                              {ret.customer.email && (
                                <p className="text-xs text-muted-foreground">{ret.customer.email}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Walk-in</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Refunded</Badge>
                        </TableCell>
                        <TableCell>
                          {ret.items?.length || 0} item{(ret.items?.length || 0) !== 1 ? "s" : ""}
                        </TableCell>
                        <TableCell className="font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(ret.total)}
                        </TableCell>
                        <TableCell>
                          {ret.outlet?.name || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/sales/transactions?receipt=${ret.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
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
    </DashboardLayout>
  )
}

