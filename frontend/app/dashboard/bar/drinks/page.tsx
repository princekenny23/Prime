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
import { Plus, Search, Wine, TrendingUp, AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"
import { NewDrinkModal } from "@/components/modals/new-drink-modal"
import { productService } from "@/lib/services/productService"
import { useBusinessStore } from "@/stores/businessStore"
import type { Product } from "@/lib/types/mock-data"

export default function DrinksPage() {
  const { currentBusiness } = useBusinessStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewDrink, setShowNewDrink] = useState(false)
  const [drinks, setDrinks] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  const totalDrinks = drinks.length
  const lowStockCount = drinks.filter(d => d.lowStockThreshold && d.stock <= d.lowStockThreshold).length
  const totalValue = drinks.reduce((sum, d) => sum + ((d.cost || 0) * d.stock), 0)
  const categories = new Set(drinks.map(d => d.categoryId).filter(Boolean)).size

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Drink Inventory</h1>
            <p className="text-muted-foreground">Manage bar drinks and inventory</p>
          </div>
          <Button onClick={() => setShowNewDrink(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Drink
          </Button>
        </div>

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
                  <TableHead>Type/Size</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Bottle:Shot</TableHead>
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
                    const isLowStock = drink.lowStockThreshold ? drink.stock <= drink.lowStockThreshold : false
                    return (
                      <TableRow key={drink.id}>
                        <TableCell className="font-medium">{drink.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{drink.categoryId || "Uncategorized"}</Badge>
                        </TableCell>
                        <TableCell>{drink.unit || "pcs"}</TableCell>
                        <TableCell className="font-semibold">
                          {currentBusiness?.currencySymbol || "MWK"} {(drink.cost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {currentBusiness?.currencySymbol || "MWK"} {drink.price.toFixed(2)}
                        </TableCell>
                        <TableCell>{drink.stock}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>
                          <Badge variant={isLowStock ? "destructive" : "default"}>
                            {isLowStock ? "Low Stock" : "In Stock"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">View</Button>
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
        onOpenChange={setShowNewDrink}
      />
    </DashboardLayout>
  )
}

