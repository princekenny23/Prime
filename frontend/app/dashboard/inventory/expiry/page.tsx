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

export default function ExpiryManagementPage() {
  const { toast } = useToast()
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Expiry Management</h1>
          <p className="text-muted-foreground">Track and manage product expiration dates</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total with Expiry</CardTitle>
              <CalendarX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWithExpiry}</div>
              <p className="text-xs text-muted-foreground">Products tracking expiry</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{expiredCount}</div>
              <p className="text-xs text-muted-foreground">Products past expiry date</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{expiringSoonCount}</div>
              <p className="text-xs text-muted-foreground">Expiring within 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Products with Expiry Dates</CardTitle>
            <CardDescription>
              {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
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

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No products with expiry information found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Manufacturing Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const expiryStatus = getExpiryStatus(product.expiry_date)
                    return (
                      <TableRow key={product.id}>
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

