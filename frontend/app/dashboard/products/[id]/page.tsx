"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Package, TrendingUp, History, Building2 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ViewProductHistoryModal } from "@/components/modals/view-product-history-modal"
import { useState, useEffect } from "react"
import { productService } from "@/lib/services/productService"
import { saleService } from "@/lib/services/saleService"
import { inventoryService } from "@/lib/services/inventoryService"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"
import { getProduct } from "@/lib/mockApi"

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const { currentBusiness } = useBusinessStore()
  const [showHistory, setShowHistory] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [stockHistory, setStockHistory] = useState<any[]>([])
  const [salesHistory, setSalesHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const useReal = useRealAPI()

  useEffect(() => {
    const loadProductData = async () => {
      if (!currentBusiness) return
      
      setIsLoading(true)
      try {
        if (useReal) {
          const [productData, movementsData, salesData] = await Promise.all([
            productService.get(productId),
            inventoryService.getMovements({ product: productId }),
            saleService.list({ tenant: currentBusiness.id, limit: 50 }),
          ])
          
          setProduct(productData)
          
          // Transform movements to stock history
          const movements = movementsData.results || []
          setStockHistory(movements.map((m: any) => ({
            date: m.created_at || m.date,
            type: m.movement_type || m.type,
            quantity: m.quantity,
            balance: m.balance_after || m.balance,
            user: m.user?.name || m.user_name || "System",
          })))
          
          // Filter sales for this product
          const sales = Array.isArray(salesData) ? salesData : salesData.results || []
          const productSales: any[] = []
          sales.forEach((sale: any) => {
            sale.items?.forEach((item: any) => {
              if ((item.product_id || item.productId) === productId) {
                productSales.push({
                  date: sale.created_at || sale.date,
                  saleId: sale.receipt_number || sale.id,
                  quantity: item.quantity,
                  price: item.price,
                  total: item.price * item.quantity,
                  customer: sale.customer?.name || "Walk-in",
                })
              }
            })
          })
          setSalesHistory(productSales.slice(0, 20))
        } else {
          const mockProduct = getProduct(productId)
          setProduct(mockProduct)
          setStockHistory([])
          setSalesHistory([])
        }
      } catch (error) {
        console.error("Failed to load product data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProductData()
  }, [productId, currentBusiness, useReal])

  if (isLoading || !product) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">SKU: {product.sku}</p>
          </div>
        </div>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="stock-history">Stock History</TabsTrigger>
            <TabsTrigger value="sales-history">Sales History</TabsTrigger>
            <TabsTrigger value="supplier">Supplier Info</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Product Name</p>
                    <p className="font-medium">{product.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">SKU</p>
                    <p className="font-medium">{product.sku}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{product.category?.name || product.categoryId || product.category || "Uncategorized"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Barcode</p>
                    <p className="font-medium">{product.barcode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unit</p>
                    <p className="font-medium">{product.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{product.description}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Stock</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cost</p>
                    <p className="font-medium">{currentBusiness?.currencySymbol || "MWK"} {(product.cost || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-medium">{currentBusiness?.currencySymbol || "MWK"} {product.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tax Rate</p>
                    <p className="font-medium">{(product.tax_rate || product.tax || 0)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Stock</p>
                    <p className="font-medium text-2xl">{product.stock || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Minimum Stock</p>
                    <p className="font-medium">{product.low_stock_threshold || product.minStock || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {(() => {
                      // Calculate status using same logic as other pages
                      const stock = typeof product.stock === 'string' ? parseFloat(product.stock) : (product.stock || 0)
                      const lowStockThreshold = typeof product.lowStockThreshold === 'string' 
                        ? parseFloat(product.lowStockThreshold) 
                        : (product.lowStockThreshold || product.low_stock_threshold || product.minStock || 0)
                      
                      let status = "active"
                      if (stock === 0 || stock === null || stock === undefined) {
                        status = "out-of-stock"
                      } else if (lowStockThreshold > 0 && stock <= lowStockThreshold) {
                        status = "low-stock"
                      }
                      
                      return (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          status === "active"
                            ? "bg-green-100 text-green-800"
                            : status === "low-stock"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {status === "active" ? "In Stock" : 
                           status === "low-stock" ? "Low Stock" : "Out of Stock"}
                        </span>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stock-history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Stock History</CardTitle>
                <CardDescription>Track all stock movements for this product</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <p className="text-muted-foreground">No stock history available</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      stockHistory.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                          <TableCell>{entry.type}</TableCell>
                          <TableCell className={entry.quantity > 0 ? "text-green-600" : "text-red-600"}>
                            {entry.quantity > 0 ? "+" : ""}{entry.quantity}
                          </TableCell>
                          <TableCell>{entry.balance}</TableCell>
                          <TableCell>{entry.user}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <div className="mt-4">
                  <Button variant="outline" onClick={() => setShowHistory(true)}>
                    <History className="mr-2 h-4 w-4" />
                    View Full History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales-history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales History</CardTitle>
                <CardDescription>Recent sales transactions for this product</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Sale ID</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Customer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <p className="text-muted-foreground">No sales history available</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      salesHistory.map((sale, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                          <TableCell>{sale.saleId}</TableCell>
                          <TableCell>{sale.quantity}</TableCell>
                          <TableCell>{currentBusiness?.currencySymbol || "MWK"} {sale.price.toFixed(2)}</TableCell>
                          <TableCell className="font-semibold">{currentBusiness?.currencySymbol || "MWK"} {sale.total.toFixed(2)}</TableCell>
                          <TableCell>{sale.customer}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supplier" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Supplier Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Supplier Name</p>
                  <p className="font-medium">{product.supplier}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Email</p>
                  <p className="font-medium">supplier@example.com</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">+1 (555) 123-4567</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">123 Supplier St, City, State 12345</p>
                </div>
                <div className="pt-4">
                  <Link href="/dashboard/office/suppliers">
                    <Button variant="outline">View All Suppliers</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ViewProductHistoryModal
        open={showHistory}
        onOpenChange={setShowHistory}
        productId={productId}
        productName={product.name}
      />
    </DashboardLayout>
  )
}

