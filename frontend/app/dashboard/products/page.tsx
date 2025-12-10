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
import { Plus, Search, Package, Upload, Filter, Folder, Trash2, RefreshCw, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { AddEditProductModal } from "@/components/modals/add-edit-product-modal"
import { ImportProductsModal } from "@/components/modals/import-products-modal"
import { productService, categoryService } from "@/lib/services/productService"
import { useBusinessStore } from "@/stores/businessStore"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ProductsPage() {
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [productToDelete, setProductToDelete] = useState<any>(null)
  const { currentBusiness } = useBusinessStore()
  const { toast } = useToast()
  
  // Determine business type for conditional rendering
  const businessType = currentBusiness?.type || ""
  const isWholesaleRetail = businessType === "wholesale and retail"
  const isBar = businessType === "bar"
  const isRestaurant = businessType === "restaurant"
  
  // Helper function to parse business-specific fields from description
  const parseBusinessFields = (product: any) => {
    const desc = product.description || ""
    const fields: any = {}
    
    if (isBar) {
      // Parse volume_ml: "Volume: 750ml"
      const volumeMatch = desc.match(/Volume:\s*(\d+)ml/i)
      if (volumeMatch) {
        fields.volume_ml = parseInt(volumeMatch[1])
      }
      
      // Parse alcohol_percentage: "Alcohol: 40%"
      const alcoholMatch = desc.match(/Alcohol:\s*([\d.]+)%/i)
      if (alcoholMatch) {
        fields.alcohol_percentage = parseFloat(alcoholMatch[1])
      }
    }
    
    if (isRestaurant) {
      // Parse preparation_time: "Prep time: 15 min"
      const prepMatch = desc.match(/Prep time:\s*(\d+)\s*min/i)
      if (prepMatch) {
        fields.preparation_time = parseInt(prepMatch[1])
      }
      
      // Check if it's a menu item (not explicitly marked as "Not a menu item")
      fields.is_menu_item = !desc.includes("Not a menu item")
    }
    
    return fields
  }

  const loadData = useCallback(async (isAutoRefresh = false) => {
    if (!currentBusiness) return
    
    if (isAutoRefresh) {
      setIsAutoRefreshing(true)
    } else {
      setIsLoading(true)
    }
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        productService.list({ is_active: true }),
        categoryService.list(),
      ])
      setProducts(Array.isArray(productsResponse) ? productsResponse : productsResponse.results || [])
      setCategories(Array.isArray(categoriesResponse) ? categoriesResponse : categoriesResponse || [])
    } catch (error) {
      console.error("Failed to load products:", error)
      if (!isAutoRefresh) {
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
      setIsAutoRefreshing(false)
    }
  }, [currentBusiness, toast])

  useEffect(() => {
    loadData(false)
    
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      loadData(true)
    }, 30000)
    
    // Refresh when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && currentBusiness) {
        loadData(false)
      }
    }
    
    // Refresh when window gains focus
    const handleFocus = () => {
      if (currentBusiness) {
        loadData(false)
      }
    }
    
    // Listen for custom events from inventory operations
    const handleInventoryUpdate = () => {
      if (currentBusiness) {
        loadData(false)
      }
    }
    
    // Listen for outlet changes
    const handleOutletChange = () => {
      if (currentBusiness) {
        loadData(false)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('inventory-updated', handleInventoryUpdate)
    window.addEventListener('outlet-changed', handleOutletChange)
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('inventory-updated', handleInventoryUpdate)
      window.removeEventListener('outlet-changed', handleOutletChange)
    }
  }, [loadData, currentBusiness])

  const getProductStatus = (product: any) => {
    // Check if backend already marked it as low stock
    if (product.is_low_stock) {
      // Check if it's actually out of stock
      const stock = typeof product.stock === 'string' ? parseFloat(product.stock) : (product.stock || 0)
      if (stock === 0) return "out-of-stock"
      return "low-stock"
    }
    
    // Check product-level stock
    const stock = typeof product.stock === 'string' ? parseFloat(product.stock) : (product.stock || 0)
    const lowStockThreshold = typeof product.lowStockThreshold === 'string' 
      ? parseFloat(product.lowStockThreshold) 
      : (product.lowStockThreshold || 0)
    
    // Check variation-level low stock
    if (product.variations && Array.isArray(product.variations)) {
      const hasLowVariation = product.variations.some((v: any) => {
        if (!v.track_inventory) return false
        const varStock = v.total_stock || v.stock || 0
        const varThreshold = v.low_stock_threshold || 0
        if (varThreshold > 0 && varStock <= varThreshold) {
          return true
        }
        return false
      })
      
      if (hasLowVariation) {
        // Check if any variation is out of stock
        const hasOutOfStock = product.variations.some((v: any) => {
          if (!v.track_inventory) return false
          const varStock = v.total_stock || v.stock || 0
          return varStock === 0
        })
        if (hasOutOfStock && stock === 0) return "out-of-stock"
        return "low-stock"
      }
    }
    
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

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadData()
      toast({
        title: "Refreshed",
        description: "Products list has been refreshed.",
      })
    } catch (error) {
      console.error("Failed to refresh products:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleProductSaved = async () => {
    // Reload products after save with a small delay to ensure backend has processed
    // This ensures all changes (stock, prices, etc.) are immediately visible
    await new Promise(resolve => setTimeout(resolve, 150))
    await loadData()
  }

  const handleDeleteClick = (product: any) => {
    setProductToDelete(product)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    setDeletingProductId(productToDelete.id)
    try {
      await productService.delete(productToDelete.id)
      toast({
        title: "Product Deleted",
        description: `${productToDelete.name} has been deleted successfully.`,
      })
      // Reload products after deletion
      await handleProductSaved()
    } catch (error: any) {
      console.error("Failed to delete product:", error)
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingProductId(null)
      setShowDeleteDialog(false)
      setProductToDelete(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Products</h1>
            </div>
            <p className="text-muted-foreground">
              Manage your product catalog
              {isAutoRefreshing && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (Updating...)
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing || isAutoRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
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
                  <TableHead>Outlet</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Retail Price</TableHead>
                  {isWholesaleRetail && <TableHead>Wholesale Price</TableHead>}
                  {isBar && <TableHead>Volume (ml)</TableHead>}
                  {isBar && <TableHead>Alcohol %</TableHead>}
                  {isRestaurant && <TableHead>Prep Time</TableHead>}
                  {isRestaurant && <TableHead>Menu Item</TableHead>}
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const status = getProductStatus(product)
                  const categoryName = product.category?.name || (product.categoryId ? categories.find(c => c.id === product.categoryId)?.name : "N/A")
                  const businessFields = parseBusinessFields(product)
                  
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
                      <TableCell>{product.outlet?.name || product.outlet_name || "N/A"}</TableCell>
                      <TableCell>{currentBusiness?.currencySymbol || "MWK"} {product.cost ? product.cost.toFixed(2) : "0.00"}</TableCell>
                      <TableCell>
                        {currentBusiness?.currencySymbol || "MWK"} {(product.retail_price || product.price || 0).toFixed(2)}
                      </TableCell>
                      {isWholesaleRetail && (
                        <TableCell>
                          {product.wholesale_enabled || product.wholesaleEnabled ? (
                            <span>
                              {currentBusiness?.currencySymbol || "MWK"} {(product.wholesale_price || product.wholesalePrice || 0).toFixed(2)}
                              {product.minimum_wholesale_quantity > 1 && (
                                <span className="text-xs text-muted-foreground block">
                                  (Min: {product.minimum_wholesale_quantity})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                      {isBar && (
                        <TableCell>
                          {businessFields.volume_ml ? `${businessFields.volume_ml}ml` : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      )}
                      {isBar && (
                        <TableCell>
                          {businessFields.alcohol_percentage !== undefined ? `${businessFields.alcohol_percentage}%` : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      )}
                      {isRestaurant && (
                        <TableCell>
                          {businessFields.preparation_time ? `${businessFields.preparation_time} min` : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      )}
                      {isRestaurant && (
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            businessFields.is_menu_item 
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {businessFields.is_menu_item ? "Yes" : "No"}
                          </span>
                        </TableCell>
                      )}
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
                            onClick={() => handleDeleteClick(product)}
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
            // Always refresh when modal closes to ensure latest data is shown
            // This catches cases where stock might have changed externally
            handleProductSaved()
          }
        }}
        product={selectedProduct}
        onProductSaved={async () => {
          // Refresh immediately after save to show updated data (stock, prices, etc.)
          await handleProductSaved()
        }}
      />
      <ImportProductsModal
        open={showImport}
        onOpenChange={setShowImport}
        onSuccess={() => {
          handleProductSaved() // Reload products after successful import
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{productToDelete?.name}"</strong>? 
              <br />
              <span className="text-destructive font-medium">This action cannot be undone.</span>
              <br />
              <span className="text-xs text-muted-foreground mt-2 block">
                All associated data including sales history, inventory records, and variations will be affected.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingProductId !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deletingProductId !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingProductId !== null ? "Deleting..." : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
