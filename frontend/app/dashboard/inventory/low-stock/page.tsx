"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { 
  AlertTriangle,
  ShoppingCart,
  RefreshCw,
  Package
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { productService } from "@/lib/services/productService"
import { purchaseOrderService, type PurchaseOrder } from "@/lib/services/purchaseOrderService"
import { useTenant } from "@/contexts/tenant-context"
import { useBusinessStore } from "@/stores/businessStore"

export default function LowStockPage() {
  const { toast } = useToast()
  const { currentOutlet } = useTenant()
  const { currentOutlet: businessOutlet } = useBusinessStore()
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [isLoadingLowStock, setIsLoadingLowStock] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [orderingItemId, setOrderingItemId] = useState<string | null>(null)

  const outlet = currentOutlet || businessOutlet

  const loadLowStockItems = async () => {
    if (!outlet) return
    
    setIsLoadingLowStock(true)
    try {
      const items = await productService.getLowStock(outlet.id)
      // Filter and transform items to show low stock details
      const lowStock = items
        .filter((p: any) => {
          // Check product-level low stock
          const productLow = p.lowStockThreshold && p.stock <= p.lowStockThreshold
          
          // Check variation-level low stock
          const variationLow = p.variations?.some((v: any) => 
            v.track_inventory && 
            v.low_stock_threshold > 0 && 
            (v.total_stock || v.stock || 0) <= v.low_stock_threshold
          )
          
          // Also check is_low_stock flag from backend
          return p.is_low_stock || productLow || variationLow
        })
        .map((p: any) => {
          // Find the variation with lowest stock if any
          const lowVariation = p.variations?.find((v: any) => 
            v.track_inventory && 
            v.low_stock_threshold > 0 && 
            (v.total_stock || v.stock || 0) <= v.low_stock_threshold
          )
          
          return {
            id: p.id,
            name: p.name,
            sku: p.sku || lowVariation?.sku || "N/A",
            currentStock: lowVariation ? (lowVariation.total_stock || lowVariation.stock || 0) : (p.stock || 0),
            minStock: lowVariation ? (lowVariation.low_stock_threshold || 0) : (p.lowStockThreshold || 0),
            category: p.category?.name || "General",
            cost: p.cost || p.cost_price || 0,
            variation: lowVariation,
            product: p,
          }
        })
      setLowStockItems(lowStock)
    } catch (error) {
      console.error("Failed to load low stock items:", error)
      toast({
        title: "Error",
        description: "Failed to load low stock items",
        variant: "destructive",
      })
    } finally {
      setIsLoadingLowStock(false)
    }
  }

  useEffect(() => {
    loadLowStockItems()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadLowStockItems()
    }, 30000)
    
    // Listen for outlet changes
    const handleOutletChange = () => {
      loadLowStockItems()
    }
    window.addEventListener("outlet-changed", handleOutletChange)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener("outlet-changed", handleOutletChange)
    }
  }, [outlet])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadLowStockItems()
    setIsRefreshing(false)
    toast({
      title: "Refreshed",
      description: "Low stock items updated",
    })
  }

  const handleOrderItem = async (item: any) => {
    if (!outlet) {
      toast({
        title: "Error",
        description: "Please select an outlet",
        variant: "destructive",
      })
      return
    }

    setOrderingItemId(item.id)
    try {
      // Calculate reorder quantity (suggest 2x the threshold or minimum 10)
      const reorderQuantity = Math.max(item.minStock * 2, 10)
      const unitPrice = item.cost > 0 ? item.cost.toString() : "0.00"

      // Create a purchase order with this item
      const purchaseOrderData: Partial<PurchaseOrder> = {
        supplier_id: null, // No supplier initially (supplier-optional system)
        outlet_id: Number(outlet.id),
        order_date: new Date().toISOString().split('T')[0],
        status: "pending_supplier", // Status for items without supplier
        subtotal: (reorderQuantity * parseFloat(unitPrice)).toFixed(2),
        tax: "0.00",
        discount: "0.00",
        total: (reorderQuantity * parseFloat(unitPrice)).toFixed(2),
        items_data: [{
          product_id: Number(item.id),
          quantity: reorderQuantity,
          unit_price: unitPrice,
          notes: `Auto-ordered from low stock alert. Current stock: ${item.currentStock}, Threshold: ${item.minStock}`,
        }],
      }

      const createdPO = await purchaseOrderService.create(purchaseOrderData)
      
      toast({
        title: "Success",
        description: `Purchase order created for ${item.name}. You can assign a supplier later.`,
      })

      // Refresh low stock items
      await loadLowStockItems()
    } catch (error: any) {
      console.error("Failed to create purchase order:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create purchase order",
        variant: "destructive",
      })
    } finally {
      setOrderingItemId(null)
    }
  }

  if (!outlet) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Please select an outlet to view low stock items</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Low Stock Alerts</h1>
          <p className="text-muted-foreground mt-1">
            View and reorder items that are running low on stock
          </p>
        </div>

        {/* Low Stock Alerts Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <CardTitle>Low Stock Items</CardTitle>
                {lowStockItems.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {lowStockItems.length}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoadingLowStock}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>
            <CardDescription>
              Items that need to be reordered. Click "Order Item" to create a purchase order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLowStock ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading low stock items...
              </div>
            ) : lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No low stock items at the moment</p>
                <p className="text-sm mt-2">All items are above their minimum stock thresholds</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min. Stock</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          {item.currentStock}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.minStock}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.category}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOrderItem(item)}
                          disabled={orderingItemId === item.id}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {orderingItemId === item.id ? "Ordering..." : "Order Item"}
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

