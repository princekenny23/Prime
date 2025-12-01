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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { inventoryService } from "@/lib/services/inventoryService"
import { productService } from "@/lib/services/productService"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import type { Product } from "@/lib/types/mock-data"
import { Plus, Trash2, X } from "lucide-react"

interface StockAdjustmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface AdjustmentItem {
  id: string
  product_id: string
  product_name?: string
  adjustmentType: "increase" | "decrease"
  quantity: string
}

export function StockAdjustmentModal({ open, onOpenChange, onSuccess }: StockAdjustmentModalProps) {
  const { toast } = useToast()
  const { currentOutlet } = useBusinessStore()
  const { currentOutlet: tenantOutlet } = useTenant()
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [adjustmentItems, setAdjustmentItems] = useState<AdjustmentItem[]>([])
  const [commonReason, setCommonReason] = useState("")
  const [commonNotes, setCommonNotes] = useState("")

  const outlet = tenantOutlet || currentOutlet

  useEffect(() => {
    if (open) {
      loadProducts()
      // Initialize with one empty item
      setAdjustmentItems([{
        id: Date.now().toString(),
        product_id: "",
        adjustmentType: "increase",
        quantity: "",
      }])
      setCommonReason("")
      setCommonNotes("")
    }
  }, [open])

  const loadProducts = async () => {
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
  }

  const addAdjustmentItem = () => {
    setAdjustmentItems([...adjustmentItems, {
      id: Date.now().toString(),
      product_id: "",
      adjustmentType: "increase",
      quantity: "",
    }])
  }

  const removeAdjustmentItem = (id: string) => {
    setAdjustmentItems(adjustmentItems.filter(item => item.id !== id))
  }

  const updateAdjustmentItem = (id: string, field: keyof AdjustmentItem, value: string | "increase" | "decrease") => {
    setAdjustmentItems(adjustmentItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        // Update product_name when product_id changes
        if (field === "product_id") {
          const product = products.find(p => p.id === value)
          updated.product_name = product?.name
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

    if (!outlet) {
      toast({
        title: "Error",
        description: "Please select an outlet first.",
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
          outlet_id: outlet.id,
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
              
              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Select 
                  value={commonReason}
                  onValueChange={setCommonReason}
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
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Additional notes (optional)"
                  value={commonNotes}
                  onChange={(e) => setCommonNotes(e.target.value)}
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

              <div className="space-y-3">
                {adjustmentItems.map((item, index) => (
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Product *</Label>
                        <Select 
                          value={item.product_id}
                          onValueChange={(value) => updateAdjustmentItem(item.id, "product_id", value)}
                          required
                          disabled={loadingProducts}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} (Stock: {product.stock})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Type *</Label>
                        <Select 
                          value={item.adjustmentType}
                          onValueChange={(value: "increase" | "decrease") => updateAdjustmentItem(item.id, "adjustmentType", value)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="increase">Increase</SelectItem>
                            <SelectItem value="decrease">Decrease</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => updateAdjustmentItem(item.id, "quantity", e.target.value)}
                          placeholder={item.adjustmentType === "increase" ? "Qty to add" : "Qty to remove"}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || loadingProducts || !outlet || adjustmentItems.length === 0}
            >
              {isLoading ? `Processing ${adjustmentItems.length} adjustment${adjustmentItems.length > 1 ? 's' : ''}...` : `Apply ${adjustmentItems.length} Adjustment${adjustmentItems.length > 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

