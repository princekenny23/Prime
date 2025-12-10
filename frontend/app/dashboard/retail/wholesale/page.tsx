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
import { DollarSign, Plus, Search } from "lucide-react"
import { useState, useEffect } from "react"
import { useBusinessStore } from "@/stores/businessStore"
import { productService } from "@/lib/services/productService"
import { useRouter } from "next/navigation"

export default function WholesalePricingPage() {
  const { currentBusiness } = useBusinessStore()
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Redirect if not wholesale/retail business
    if (currentBusiness && currentBusiness.type !== "wholesale and retail") {
      router.push("/dashboard")
      return
    }
  }, [currentBusiness, router])

  useEffect(() => {
    const loadProducts = async () => {
      if (!currentBusiness || currentBusiness.type !== "wholesale and retail") return
      
      setIsLoading(true)
      try {
        const response = await productService.list({ is_active: true })
        const productsList = Array.isArray(response) ? response : (response.results || [])
        // Filter products with wholesale enabled
        setProducts(productsList.filter((p: any) => p.wholesale_enabled))
      } catch (error) {
        console.error("Failed to load products:", error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProducts()
  }, [currentBusiness])

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Wholesale Pricing</h1>
            <p className="text-muted-foreground mt-1">
              Manage wholesale pricing and minimum order quantities
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Enable Wholesale
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Wholesale Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Wholesale Products</CardTitle>
            <CardDescription>
              Products with wholesale pricing enabled
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No wholesale products found</p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Enable Wholesale Pricing
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Retail Price</TableHead>
                    <TableHead>Wholesale Price</TableHead>
                    <TableHead>Min Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku || "N/A"}</TableCell>
                      <TableCell>
                        {currentBusiness?.currencySymbol || "MWK"} {product.retail_price?.toFixed(2) || product.price?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {currentBusiness?.currencySymbol || "MWK"} {product.wholesale_price?.toFixed(2) || "0.00"}
                      </TableCell>
                      <TableCell>{product.minimum_wholesale_quantity || 1}</TableCell>
                      <TableCell>
                        <Badge variant={product.wholesale_enabled ? "default" : "secondary"}>
                          {product.wholesale_enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

