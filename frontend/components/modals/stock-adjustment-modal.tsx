"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { inventoryService } from "@/lib/services/inventoryService"
import { productService } from "@/lib/services/productService"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import type { Product } from "@/lib/types"
import { Plus, Trash2, Search, Package } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"

interface StockAdjustmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface AdjustmentItem {
  id: string
  product_id: string
  product_name?: string
  current_qty: number
  adjustmentType: "increase" | "decrease"
  quantity: string
}

export function StockAdjustmentModal({ open, onOpenChange, onSuccess }: StockAdjustmentModalProps) {
  const { toast } = useToast()
  const { currentOutlet } = useBusinessStore()
  const { currentOutlet: tenantOutlet, outlets } = useTenant()
  const { t } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [adjustmentItems, setAdjustmentItems] = useState<AdjustmentItem[]>([])
  const [commonReason, setCommonReason] = useState("")
  const [commonNotes, setCommonNotes] = useState("")
  const [selectedOutlet, setSelectedOutlet] = useState<string>("")
  const [trackingNumber, setTrackingNumber] = useState<string>("")
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [searchTerm, setSearchTerm] = useState("")
  const [showProductSearch, setShowProductSearch] = useState(false)

  const outlet = tenantOutlet || currentOutlet

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true)
    try {
      const response = await productService.list({ is_active: true })
      setProducts(response.results || [])
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
  }, [toast])

  useEffect(() => {
    if (open) {
      loadProducts()
      // Generate tracking number
      const tracking = `ADJ-${Date.now().toString().slice(-8)}`
      setTrackingNumber(tracking)
      
      // Set default outlet
      if (outlet) {
        setSelectedOutlet(String(outlet.id))
      } else if (outlets.length > 0) {
        setSelectedOutlet(String(outlets[0].id))
      }
      
      // Initialize with one empty item
      setAdjustmentItems([{
        id: Date.now().toString(),
        product_id: "",
        current_qty: 0,
        adjustmentType: "increase",
        quantity: "",
      }])
      setCommonReason("")
      setCommonNotes("")
      setDate(new Date().toISOString().split('T')[0])
      setSearchTerm("")
      setShowProductSearch(false)
    }
  }, [open, outlet, outlets, loadProducts])

  useEffect(() => {
    if (open) {
      loadProducts()
    }
  }, [open, loadProducts])

  const addAdjustmentItem = () => {
    setAdjustmentItems([...adjustmentItems, {
      id: Date.now().toString(),
      product_id: "",
      current_qty: 0,
      adjustmentType: "increase",
      quantity: "",
    }])
    setShowProductSearch(true)
  }

  const handleSelectProduct = (product: Product) => {
    // Add product to the last empty item or create new one
    const emptyItemIndex = adjustmentItems.findIndex(item => !item.product_id)
    if (emptyItemIndex >= 0) {
      updateAdjustmentItem(adjustmentItems[emptyItemIndex].id, "product_id", product.id)
    } else {
      addAdjustmentItem()
      setTimeout(() => {
        const newItem = adjustmentItems[adjustmentItems.length - 1]
        if (newItem) {
          updateAdjustmentItem(newItem.id, "product_id", product.id)
        }
      }, 100)
    }
    setShowProductSearch(false)
    setSearchTerm("")
  }

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [products, searchTerm])

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
    
    // Validate common fields
    if (!commonReason) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for the adjustments.",
        variant: "destructive",
      })
      return
    }

    if (!selectedOutlet) {
      toast({
        title: "Error",
        description: "Please select an outlet.",
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
          reason: commonReason + (commonNotes ? ` - ${commonNotes}` : ""),
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
      
      // Close modal first
      onOpenChange(false)
      
      // Call onSuccess callback AFTER closing to reload data
      if (onSuccess && results.length > 0) {
        setTimeout(() => {
          onSuccess()
        }, 500)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Stock Adjustment</DialogTitle>
          <DialogDescription>
            Adjust inventory levels for multiple products at once
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Common Fields */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold text-sm">Common Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tracking">Tracking Number</Label>
                  <Input
                    id="tracking"
                    value={trackingNumber}
                    disabled
                    className="bg-muted"
                  />
                </div>

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
              </div>

              <div className="space-y-2">
                <Label htmlFor="outlet">Outlet *</Label>
                <Select 
                  value={selectedOutlet}
                  onValueChange={setSelectedOutlet}
                  required
                >
                  <SelectTrigger id="outlet">
                    <SelectValue placeholder={t("common.select_outlet")} />
                  </SelectTrigger>
                  <SelectContent>
                    {outlets.map(outlet => (
                      <SelectItem key={outlet.id} value={String(outlet.id)}>
                        {outlet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Select 
                  value={commonReason}
                  onValueChange={setCommonReason}
                  required
                >
                  <SelectTrigger id="reason">
                    <SelectValue placeholder={t("inventory.stock_adjustment.select_reason")} />
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

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder={t("common.notes_placeholder")}
                  value={commonNotes}
                  onChange={(e) => setCommonNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Adjustment Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Products to Adjust</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAdjustmentItem}
                  disabled={loadingProducts}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>

              {/* Product Search */}
              {showProductSearch && (
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("common.search_products_placeholder")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredProducts.slice(0, 10).map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSelectProduct(product)}
                        className="w-full text-left p-2 hover:bg-muted rounded flex items-center gap-2"
                      >
                        <Package className="h-4 w-4" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {product.sku || "N/A"} | Stock: {product.stock || 0}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {adjustmentItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No items added. Click &quot;Add Product&quot; to add products.</p>
                  </div>
                ) : (
                  adjustmentItems.map((item, index) => {
                    const changeQty = parseInt(item.quantity) || 0
                    const newQty = item.adjustmentType === "increase" 
                      ? item.current_qty + changeQty 
                      : item.current_qty - changeQty

                    return (
                      <div key={item.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            Product {index + 1}
                          </span>
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="space-y-2">
                            <Label>Product *</Label>
                            <Select 
                              value={item.product_id}
                              onValueChange={(value) => updateAdjustmentItem(item.id, "product_id", value)}
                              required
                              disabled={loadingProducts}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t("common.select_product")} />
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
                          </div>

                          <div className="space-y-2">
                            <Label>Current Qty</Label>
                            <Input
                              value={item.current_qty}
                              disabled
                              className="bg-muted"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Change *</Label>
                            <div className="flex items-center gap-2">
                              <Select 
                                value={item.adjustmentType}
                                onValueChange={(value: "increase" | "decrease") => updateAdjustmentItem(item.id, "adjustmentType", value)}
                                required
                              >
                                <SelectTrigger className="w-[100px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="increase">+</SelectItem>
                                  <SelectItem value="decrease">-</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                min="1"
                                required
                                value={item.quantity}
                                onChange={(e) => updateAdjustmentItem(item.id, "quantity", e.target.value)}
                                placeholder={t("common.qty")}
                                className="flex-1"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>New Quantity</Label>
                            <Input
                              value={item.product_id ? newQty : "—"}
                              disabled
                              className={newQty < 0 ? "bg-red-50 text-red-600 font-semibold" : "bg-muted font-semibold"}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || loadingProducts || !selectedOutlet || adjustmentItems.length === 0}
            >
              {isLoading ? `Processing ${adjustmentItems.length} adjustment${adjustmentItems.length > 1 ? 's' : ''}...` : `Apply ${adjustmentItems.length} Adjustment${adjustmentItems.length > 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

