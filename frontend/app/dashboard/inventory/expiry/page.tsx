"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
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
import { Search, CalendarX, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { productService } from "@/lib/services/productService"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { useI18n } from "@/contexts/i18n-context"

export default function ExpiryManagementPage() {
  const { toast } = useToast()
  const { t } = useI18n()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const response = await productService.list({ is_active: true })
      const allProducts = response.results || response || []
      
      // Filter products that have expiry dates
      const productsWithExpiry = allProducts.filter((p: any) => 
        p.expiry_date || p.manufacturing_date || p.track_expiration
      )
      
      setProducts(productsWithExpiry)
    } catch (error) {
      console.error("Failed to load products:", error)
      toast({
        title: "Error",
        description: "Failed to load products with expiry information",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getExpiryStatus = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return { status: "none", label: "No Expiry", color: "bg-gray-100 text-gray-800" }
    
    const expiry = new Date(expiryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) {
      return { status: "expired", label: "Expired", color: "bg-red-100 text-red-800", days: Math.abs(daysUntilExpiry) }
    } else if (daysUntilExpiry === 0) {
      return { status: "expires-today", label: "Expires Today", color: "bg-red-100 text-red-800" }
    } else if (daysUntilExpiry <= 7) {
      return { status: "expiring-soon", label: `Expires in ${daysUntilExpiry} days`, color: "bg-orange-100 text-orange-800", days: daysUntilExpiry }
    } else if (daysUntilExpiry <= 30) {
      return { status: "expiring-month", label: `Expires in ${daysUntilExpiry} days`, color: "bg-yellow-100 text-yellow-800", days: daysUntilExpiry }
    } else {
      return { status: "valid", label: `Expires in ${daysUntilExpiry} days`, color: "bg-green-100 text-green-800", days: daysUntilExpiry }
    }
  }

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (statusFilter === "all") return matchesSearch
    
    const expiryStatus = getExpiryStatus(product.expiry_date)
    return matchesSearch && expiryStatus.status === statusFilter
  })

  const expiredCount = products.filter(p => {
    const status = getExpiryStatus(p.expiry_date)
    return status.status === "expired"
  }).length

  const expiringSoonCount = products.filter(p => {
    const status = getExpiryStatus(p.expiry_date)
    return status.status === "expiring-soon" || status.status === "expires-today"
  }).length

  const totalWithExpiry = products.length

  return (
    <DashboardLayout>
      <PageLayout
        title={t("inventory.menu.expiry")}
        description={t("inventory.expiry.description")}
      >

        {/* Filters */}
        <div className="mb-6 pb-4 border-b border-gray-300">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder={t("common.search_products_placeholder")}
                className="pl-10 bg-white border-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-white border-gray-300">
                <SelectValue placeholder={t("common.filter_by_status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="expires-today">Expires Today</SelectItem>
                <SelectItem value="expiring-soon">Expiring Soon (≤7 days)</SelectItem>
                <SelectItem value="expiring-month">Expiring This Month</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Table */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Products with Expiry Dates</h3>
            <p className="text-sm text-gray-600">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="rounded-md border border-gray-300 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-gray-900 font-semibold">Product</TableHead>
                  <TableHead className="text-gray-900 font-semibold">SKU</TableHead>
                  <TableHead className="text-gray-900 font-semibold">Manufacturing Date</TableHead>
                  <TableHead className="text-gray-900 font-semibold">Expiry Date</TableHead>
                  <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                  <TableHead className="text-gray-900 font-semibold">Stock</TableHead>
                  <TableHead className="text-gray-900 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-gray-600">Loading products...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-gray-600">No products with expiry information found.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const expiryStatus = getExpiryStatus(product.expiry_date)
                    return (
                      <TableRow key={product.id} className="border-gray-300">
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku || "N/A"}</TableCell>
                        <TableCell>
                          {product.manufacturing_date 
                            ? new Date(product.manufacturing_date).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {product.expiry_date 
                            ? new Date(product.expiry_date).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge className={expiryStatus.color}>
                            {expiryStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{product.stock || 0}</TableCell>
                        <TableCell>
                          <Link href={`/dashboard/inventory/products/${product.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </div>
        </div>
      </PageLayout>
    </DashboardLayout>
  )
}

