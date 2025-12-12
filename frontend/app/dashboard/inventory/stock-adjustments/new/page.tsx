"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Plus, Trash2, Search, Upload, Info } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { inventoryService } from "@/lib/services/inventoryService"
import { productService } from "@/lib/services/productService"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import { outletService } from "@/lib/services/outletService"
import type { Product } from "@/lib/types"
import Link from "next/link"

interface AdjustmentItem {
  id: string
  product_id: string
  product_name?: string
  current_qty: number
  adjustmentType: "increase" | "decrease"
  quantity: string
}

export default function NewStockAdjustmentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentBusiness, currentOutlet } = useBusinessStore()
  const { currentOutlet: tenantOutlet, outlets } = useTenant()
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [adjustmentItems, setAdjustmentItems] = useState<AdjustmentItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOutlet, setSelectedOutlet] = useState<string>("")
  const [trackingNumber, setTrackingNumber] = useState<string>("")
  const [adjustmentType, setAdjustmentType] = useState<"increase" | "decrease" | "">("")
  const [reason, setReason] = useState("")
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState("")

  const outlet = tenantOutlet || currentOutlet

  useEffect(() => {
    // Generate tracking number
    const tracking = `ADJ-${Date.now().toString().slice(-8)}`
    setTrackingNumber(tracking)
    
    // Set default outlet
    if (outlet) {
      setSelectedOutlet(String(outlet.id))
    } else if (outlets.length > 0) {
      setSelectedOutlet(String(outlets[0].id))
    }
    
    loadProducts()
    // Initialize with one empty item
    setAdjustmentItems([{
      id: Date.now().toString(),
      product_id: "",
      current_qty: 0,
      adjustmentType: "increase",
      quantity: "",
    }])
  }, [])

  const loadProducts = async () => {
    setLoadingProducts(true)
    try {
      const response = await productService.list({ is_active: true })
      setProducts(response.results || response || [])
    } catch (error) {
      console.error("Failed to load products:", error)
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingProducts(false)
    }
  }

  const addAdjustmentItem = () => {
    setAdjustmentItems([...adjustmentItems, {
      id: Date.now().toString(),
      product_id: "",
      current_qty: 0,
      adjustmentType: "increase",
      quantity: "",
    }])
  }

  const removeAdjustmentItem = (id: string) => {
    setAdjustmentItems(adjustmentItems.filter(item => item.id !== id))
  }

  const updateAdjustmentItem = (id: string, field: keyof AdjustmentItem, value: string | "increase" | "decrease" | number) => {
    setAdjustmentItems(adjustmentItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        // Update product_name and current_qty when product_id changes
        if (field === "product_id") {
          const product = products.find(p => p.id === value)
          updated.product_name = product?.name
          updated.current_qty = product?.stock || 0
        }
        return updated
      }
      return item
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!selectedOutlet) {
      toast({
        title: "Validation Error",
        description: "Please select an outlet.",
        variant: "destructive",
      })
      return
    }

    if (!reason) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for the adjustment.",
        variant: "destructive",
      })
      return
    }

    // Validate all items
    const validItems = adjustmentItems.filter(item => 
      item.product_id && item.quantity && parseInt(item.quantity) > 0
    )

    if (validItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one product adjustment with valid quantity.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Process all adjustments
      const adjustments = validItems.map(item => {
        const quantity = parseInt(item.quantity)
        const adjustmentQuantity = item.adjustmentType === "increase" ? quantity : -quantity
        return {
          product_id: item.product_id,
          outlet_id: selectedOutlet,
          quantity: adjustmentQuantity,
          reason: reason + (notes ? ` - ${notes}` : ""),
          type: "adjustment" as const,
        }
      })

      // Submit all adjustments sequentially
      const results = []
      const errors = []
      
      for (const adjustment of adjustments) {
        try {
          await inventoryService.adjust(adjustment)
          results.push(adjustment.product_id)
        } catch (error: any) {
          const productName = products.find(p => p.id === adjustment.product_id)?.name || "Unknown"
          errors.push({ product: productName, error: error.message || "Failed to adjust" })
        }
      }

      // Show results
      if (errors.length === 0) {
        toast({
          title: "Stock Adjustments Applied",
          description: `Successfully adjusted ${results.length} product${results.length > 1 ? 's' : ''}.`,
        })
        router.push("/dashboard/inventory/stock-adjustments")
      } else if (results.length > 0) {
        toast({
          title: "Partial Success",
          description: `${results.length} adjustment${results.length > 1 ? 's' : ''} succeeded, ${errors.length} failed.`,
          variant: "default",
        })
      } else {
        toast({
          title: "Adjustment Failed",
          description: "All adjustments failed. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Failed to adjust stock:", error)
      toast({
        title: "Adjustment Failed",
        description: error.message || "Failed to adjust stock. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter products for search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="space-y-2">
          <Link href="/dashboard/inventory/stock-adjustments">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Adjustments
            </Button>
          </Link>
          <h1 className="text-4xl font-bold">Stock Adjustment</h1>
        </div>

        {/* Guide Section - Aligned Left */}
        <div className="space-y-4">
          <p className="text-base text-foreground leading-relaxed max-w-4xl">
            By adjusting stock, you are adding new quantities of the stock in your warehouse. 
            This helps you increase or decrease the goods you hold in stock. 
            It is generally used to write-off damaged stock, or to adjust quantities after a stock take.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Tracking Number */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="tracking">Tracking Number</Label>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="tracking"
                  value={trackingNumber}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-generated unique reference number.
                </p>
              </div>

              {/* Adjustment Type */}
              <div className="space-y-2">
                <Label htmlFor="adjustmentType">Adjustment Type *</Label>
                <Select 
                  value={adjustmentType}
                  onValueChange={(value: "increase" | "decrease") => {
                    setAdjustmentType(value)
                    // Update all items to match
                    setAdjustmentItems(adjustmentItems.map(item => ({
                      ...item,
                      adjustmentType: value
                    })))
                  }}
                  required
                >
                  <SelectTrigger id="adjustmentType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase">Increase Stock</SelectItem>
                    <SelectItem value="decrease">Decrease Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Select 
                  value={reason}
                  onValueChange={setReason}
                  required
                >
                  <SelectTrigger id="reason">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Damaged">Damaged</SelectItem>
                    <SelectItem value="Theft">Theft</SelectItem>
                    <SelectItem value="Found">Found</SelectItem>
                    <SelectItem value="Return">Return</SelectItem>
                    <SelectItem value="Stock Take">Stock Take</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Outlet */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="outlet">Outlet *</Label>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                <Select 
                  value={selectedOutlet}
                  onValueChange={setSelectedOutlet}
                  required
                >
                  <SelectTrigger id="outlet">
                    <SelectValue placeholder="Select outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    {outlets.map(outlet => (
                      <SelectItem key={outlet.id} value={String(outlet.id)}>
                        {outlet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This is the outlet whose stock will be updated.
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <textarea
                  id="notes"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Enter any additional notes or details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <Separator className="my-8" />
          
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Items</h2>
              <p className="text-sm text-muted-foreground">
                Select items you want to adjust by searching or scanning. You can also import via Excel.
              </p>
            </div>

            {/* Search Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products by name, SKU, or barcode..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button type="button" variant="outline" disabled>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Excel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Adjustment Items</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAdjustmentItem}
                      disabled={loadingProducts}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Current Qty</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead>New Quantity</TableHead>
                        <TableHead className="w-[100px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adjustmentItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No items added. Click "Add Item" to start.
                          </TableCell>
                        </TableRow>
                      ) : (
                        adjustmentItems.map((item) => {
                          const product = products.find(p => p.id === item.product_id)
                          const changeQty = parseInt(item.quantity) || 0
                          const newQty = item.adjustmentType === "increase" 
                            ? item.current_qty + changeQty 
                            : item.current_qty - changeQty

                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Select 
                                  value={item.product_id}
                                  onValueChange={(value) => updateAdjustmentItem(item.id, "product_id", value)}
                                  required
                                  disabled={loadingProducts}
                                >
                                  <SelectTrigger className="w-[250px]">
                                    <SelectValue placeholder="Select product" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {filteredProducts.length > 0 ? (
                                      filteredProducts.map(product => (
                                        <SelectItem key={product.id} value={product.id}>
                                          {product.name} {product.sku && `(${product.sku})`}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="no-results" disabled>
                                        No products found
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="font-medium">
                                {item.current_qty}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Select 
                                    value={item.adjustmentType}
                                    onValueChange={(value: "increase" | "decrease") => updateAdjustmentItem(item.id, "adjustmentType", value)}
                                    required
                                  >
                                    <SelectTrigger className="w-[120px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="increase">+ Increase</SelectItem>
                                      <SelectItem value="decrease">- Decrease</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    type="number"
                                    min="1"
                                    required
                                    value={item.quantity}
                                    onChange={(e) => updateAdjustmentItem(item.id, "quantity", e.target.value)}
                                    placeholder="Qty"
                                    className="w-[100px]"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className={newQty < 0 ? "text-red-600 font-semibold" : "font-semibold"}>
                                {item.product_id ? newQty : "—"}
                              </TableCell>
                              <TableCell>
                                {adjustmentItems.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeAdjustmentItem(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-6">
            <Link href="/dashboard/inventory/stock-adjustments">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={isLoading || loadingProducts || !selectedOutlet || adjustmentItems.length === 0}
              className="min-w-[120px]"
            >
              {isLoading ? "Processing..." : "Apply Adjustment"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

