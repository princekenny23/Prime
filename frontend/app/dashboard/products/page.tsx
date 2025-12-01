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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, Package, Upload, Filter, Folder, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { AddEditProductModal } from "@/components/modals/add-edit-product-modal"
import { ImportProductsModal } from "@/components/modals/import-products-modal"
import { productService, categoryService } from "@/lib/services/productService"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"
import { getProducts, getCategories } from "@/lib/mockApi"
import { useToast } from "@/components/ui/use-toast"

export default function ProductsPage() {
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const { currentBusiness } = useBusinessStore()
  const useReal = useRealAPI()
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      if (!currentBusiness) return
      
      setIsLoading(true)
      try {
        if (useReal) {
          const [productsResponse, categoriesResponse] = await Promise.all([
            productService.list({ is_active: true }),
            categoryService.list(),
          ])
          setProducts(Array.isArray(productsResponse) ? productsResponse : productsResponse.results || [])
          setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : categoriesResponse || [])
        } else {
          // Simulation mode - use mockApi
          const businessProducts = getProducts(currentBusiness.id)
          const businessCategories = getCategories(currentBusiness.id)
          setProducts(businessProducts)
          setCategories(businessCategories.map((c: any) => c.name))
        }
      } catch (error) {
        console.error("Failed to load products:", error)
        setProducts([])
        setCategories([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [currentBusiness, useReal])

  const getProductStatus = (product: any) => {
    // Convert stock to number if it's a string
    const stock = typeof product.stock === 'string' ? parseFloat(product.stock) : (product.stock || 0)
    const lowStockThreshold = typeof product.lowStockThreshold === 'string' 
      ? parseFloat(product.lowStockThreshold) 
      : (product.lowStockThreshold || 0)
    
    // Only show out of stock if stock is exactly 0
    if (stock === 0 || stock === null || stock === undefined) return "out-of-stock"
    
    // Show low stock if threshold is set and stock is at or below threshold
    if (lowStockThreshold > 0 && stock <= lowStockThreshold) return "low-stock"
    
    // Otherwise, it's in stock
    return "active"
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === "all" || 
                           (product.categoryId && categories.find(c => c.id === product.categoryId)?.name === categoryFilter) ||
                           (product.category?.name && product.category.name === categoryFilter)
    return matchesSearch && matchesCategory
  })

  const handleProductSaved = () => {
    // Reload products after save
    if (currentBusiness) {
      const loadData = async () => {
        setIsLoading(true)
        try {
          if (useReal) {
            const [productsResponse, categoriesResponse] = await Promise.all([
              productService.list({ is_active: true }),
              categoryService.list(),
            ])
            setProducts(Array.isArray(productsResponse) ? productsResponse : productsResponse.results || [])
            setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : categoriesResponse || [])
          } else {
            const businessProducts = getProducts(currentBusiness.id)
            const businessCategories = getCategories(currentBusiness.id)
            setProducts(businessProducts)
            setCategories(businessCategories.map((c: any) => c.name))
          }
        } catch (error) {
          console.error("Failed to load products:", error)
        } finally {
          setIsLoading(false)
        }
      }
      loadData()
    }
  }

  const handleDeleteProduct = async (product: any) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return
    }

    setDeletingProductId(product.id)
    try {
      await productService.delete(product.id)
      toast({
        title: "Product Deleted",
        description: `${product.name} has been deleted successfully.`,
      })
      // Reload products after deletion
      handleProductSaved()
    } catch (error: any) {
      console.error("Failed to delete product:", error)
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingProductId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products</h1>
            <p className="text-muted-foreground">Manage your product catalog</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/products/categories">
              <Button variant="outline">
                <Folder className="mr-2 h-4 w-4" />
                Categories
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={() => {
              setSelectedProduct(null)
              setShowAddProduct(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name or SKU..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id || cat} value={cat.name || cat}>{cat.name || cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Products</CardTitle>
            <CardDescription>
              {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const status = getProductStatus(product)
                  const categoryName = product.category?.name || (product.categoryId ? categories.find(c => c.id === product.categoryId)?.name : "N/A")
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Link 
                          href={`/dashboard/products/${product.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {product.name}
                        </Link>
                      </TableCell>
                      <TableCell>{product.sku || "N/A"}</TableCell>
                      <TableCell>{categoryName}</TableCell>
                      <TableCell>MWK {product.cost ? product.cost.toFixed(2) : "0.00"}</TableCell>
                      <TableCell>MWK {product.price.toFixed(2)}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product)
                              setShowAddProduct(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product)}
                            disabled={deletingProductId === product.id}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AddEditProductModal
        open={showAddProduct}
        onOpenChange={(open) => {
          setShowAddProduct(open)
          if (!open) {
            setSelectedProduct(null)
            handleProductSaved()
          }
        }}
        product={selectedProduct}
      />
      <ImportProductsModal
        open={showImport}
        onOpenChange={setShowImport}
        onSuccess={() => {
          handleProductSaved() // Reload products after successful import
        }}
      />
    </DashboardLayout>
  )
}
