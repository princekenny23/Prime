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
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, Wine, TrendingUp, AlertTriangle, Edit, Trash2, Eye, MoreVertical, Package, RefreshCw, Menu } from "lucide-react"
import { useState, useEffect } from "react"
import { NewDrinkModal } from "@/components/modals/new-drink-modal"
import { AddEditProductModal } from "@/components/modals/add-edit-product-modal"
import { productService } from "@/lib/services/productService"
import { useBusinessStore } from "@/stores/businessStore"
import { useToast } from "@/components/ui/use-toast"
import type { Product } from "@/lib/types"
import Link from "next/link"

export default function DrinksPage() {
  const { currentBusiness } = useBusinessStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewDrink, setShowNewDrink] = useState(false)
  const [showEditProduct, setShowEditProduct] = useState(false)
  const [selectedDrink, setSelectedDrink] = useState<Product | null>(null)
  const [drinks, setDrinks] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingDrinkId, setDeletingDrinkId] = useState<string | null>(null)

  useEffect(() => {
    const loadDrinks = async () => {
      if (!currentBusiness) return
      
      setIsLoading(true)
      try {
        const productsData = await productService.list({ is_active: true })
        const products = Array.isArray(productsData) ? productsData : productsData.results || []
        setDrinks(products)
      } catch (error) {
        console.error("Failed to load drinks:", error)
        setDrinks([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadDrinks()
  }, [currentBusiness])

  const filteredDrinks = drinks.filter(drink =>
    drink.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (drink.categoryId && drink.categoryId.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Helper function to parse business-specific fields from description
  const parseBusinessFields = (drink: Product) => {
    const desc = drink.description || ""
    const fields: any = {}
    
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
    
    return fields
  }

  const handleDrinkSaved = () => {
    // Reload drinks after save
    if (currentBusiness) {
      const loadDrinks = async () => {
        setIsLoading(true)
        try {
          const productsData = await productService.list({ is_active: true })
          const products = Array.isArray(productsData) ? productsData : productsData.results || []
          setDrinks(products)
        } catch (error) {
          console.error("Failed to load drinks:", error)
        } finally {
          setIsLoading(false)
        }
      }
      loadDrinks()
    }
  }

  const handleEdit = (drink: Product) => {
    setSelectedDrink(drink)
    setShowEditProduct(true)
  }

  const handleDelete = async (drink: Product) => {
    if (!confirm(`Are you sure you want to delete "${drink.name}"? This action cannot be undone.`)) {
      return
    }

    setDeletingDrinkId(drink.id)
    try {
      await productService.delete(drink.id)
      toast({
        title: "Drink Deleted",
        description: `${drink.name} has been deleted successfully.`,
      })
      handleDrinkSaved()
    } catch (error: any) {
      console.error("Failed to delete drink:", error)
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete drink. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingDrinkId(null)
    }
  }

  // Helper to check if a drink is low stock (checks both product and variations)
  const isDrinkLowStock = (drink: Product) => {
    // Check backend flag
    if (drink.is_low_stock) return true
    
    // Check product-level
    const stock = typeof drink.stock === 'number' ? drink.stock : parseFloat(drink.stock?.toString() || '0')
    const threshold = typeof drink.lowStockThreshold === 'number' 
      ? drink.lowStockThreshold 
      : parseFloat(drink.lowStockThreshold?.toString() || '0')
    
    if (threshold > 0 && stock <= threshold) return true
    
    // Check variation-level
    if (drink.variations && Array.isArray(drink.variations)) {
      return drink.variations.some((v: any) => {
        if (!v.track_inventory) return false
        const varStock = v.total_stock || v.stock || 0
        const varThreshold = v.low_stock_threshold || 0
        return varThreshold > 0 && varStock <= varThreshold
      })
    }
    
    return false
  }

  const totalDrinks = drinks.length
  const lowStockCount = drinks.filter(isDrinkLowStock).length
  const totalValue = drinks.reduce((sum, d) => {
    const stock = typeof d.stock === 'number' ? d.stock : parseFloat(d.stock?.toString() || '0')
    return sum + ((d.cost || 0) * stock)
  }, 0)
  const categories = new Set(drinks.map(d => d.categoryId).filter(Boolean)).size

  return (
    <DashboardLayout>
      <PageLayout
        title="Drink Inventory"
        description="Manage bar drinks and inventory"
        actions={
          <Button onClick={() => setShowNewDrink(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Drink
          </Button>
        }
      >

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drinks</CardTitle>
              <Wine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDrinks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">MWK {totalValue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Wine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or category..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Drinks Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Drinks</CardTitle>
            <CardDescription>
              {filteredDrinks.length} drink{filteredDrinks.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Volume (ml)</TableHead>
                  <TableHead>Alcohol %</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-muted-foreground">Loading drinks...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredDrinks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-muted-foreground">No drinks found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDrinks.map((drink) => {
                    const businessFields = parseBusinessFields(drink)
                    const stock = typeof drink.stock === 'number' ? drink.stock : parseFloat(drink.stock?.toString() || '0')
                    const lowStockThreshold = typeof drink.lowStockThreshold === 'number' 
                      ? drink.lowStockThreshold 
                      : parseFloat(drink.lowStockThreshold?.toString() || '0')
                    
                    // Check if any variation is low stock
                    let isLow = false
                    let isOutOfStock = stock === 0
                    
                    if (drink.variations && Array.isArray(drink.variations)) {
                      const lowVariations = drink.variations.filter((v: any) => {
                        if (!v.track_inventory) return false
                        const varStock = v.total_stock || v.stock || 0
                        const varThreshold = v.low_stock_threshold || 0
                        if (varThreshold > 0 && varStock <= varThreshold) {
                          if (varStock === 0) isOutOfStock = true
                          return true
                        }
                        return false
                      })
                      isLow = lowVariations.length > 0
                    }
                    
                    // Also check product-level
                    if (!isLow && lowStockThreshold > 0 && stock <= lowStockThreshold) {
                      isLow = true
                    }
                    
                    // Check backend flag
                    if (drink.is_low_stock) {
                      isLow = true
                    }
                    
                    return (
                      <TableRow key={drink.id}>
                        <TableCell className="font-medium">
                          <Link 
                            href={`/dashboard/inventory/products/${drink.id}`}
                            className="hover:text-primary"
                          >
                            {drink.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{drink.categoryId || "Uncategorized"}</Badge>
                        </TableCell>
                        <TableCell>
                          {businessFields.volume_ml ? (
                            <span className="font-medium">{businessFields.volume_ml}ml</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {businessFields.alcohol_percentage !== undefined ? (
                            <span className="font-medium">{businessFields.alcohol_percentage}%</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {currentBusiness?.currencySymbol || "MWK"} {(drink.cost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {currentBusiness?.currencySymbol || "MWK"} {(drink.retail_price || drink.price || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className={isOutOfStock ? "text-red-600 font-semibold" : isLow ? "text-orange-600 font-semibold" : ""}>
                              {stock}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{drink.unit || "pcs"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={isOutOfStock ? "destructive" : isLow ? "secondary" : "default"}
                            className={
                              isOutOfStock 
                                ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                                : isLow
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200"
                                : "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
                            }
                          >
                            {isOutOfStock ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Menu className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/inventory/products/${drink.id}`} className="flex items-center">
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(drink)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Drink
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/inventory/adjust?product=${drink.id}`} className="flex items-center">
                                  <Package className="mr-2 h-4 w-4" />
                                  Adjust Stock
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(drink)}
                                disabled={deletingDrinkId === drink.id}
                                className="text-destructive focus:text-destructive"
                              >
                                {deletingDrinkId === drink.id ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Drink
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <NewDrinkModal
        open={showNewDrink}
        onOpenChange={(open) => {
          setShowNewDrink(open)
          if (!open) {
            handleDrinkSaved()
          }
        }}
      />
      <AddEditProductModal
        open={showEditProduct}
        onOpenChange={(open) => {
          setShowEditProduct(open)
          if (!open) {
            setSelectedDrink(null)
            handleDrinkSaved()
          }
        }}
        product={selectedDrink}
      />
      </PageLayout>
    </DashboardLayout>
  )
}

