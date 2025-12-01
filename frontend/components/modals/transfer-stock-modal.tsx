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
import { ArrowRightLeft, Plus, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { inventoryService } from "@/lib/services/inventoryService"
import { productService } from "@/lib/services/productService"
import { useTenant } from "@/contexts/tenant-context"
import type { Product } from "@/lib/types/mock-data"

interface TransferStockModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface TransferItem {
  id: string
  product_id: string
  product_name?: string
  quantity: string
}

export function TransferStockModal({ open, onOpenChange, onSuccess }: TransferStockModalProps) {
  const { toast } = useToast()
  const { outlets } = useTenant()
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [transferItems, setTransferItems] = useState<TransferItem[]>([])
  const [fromOutletId, setFromOutletId] = useState("")
  const [toOutletId, setToOutletId] = useState("")
  const [commonReason, setCommonReason] = useState("")

  useEffect(() => {
    if (open) {
      loadProducts()
      // Initialize with one empty item
      setTransferItems([{
        id: Date.now().toString(),
        product_id: "",
        quantity: "",
      }])
      setFromOutletId("")
      setToOutletId("")
      setCommonReason("")
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

  const addTransferItem = () => {
    setTransferItems([...transferItems, {
      id: Date.now().toString(),
      product_id: "",
      quantity: "",
    }])
  }

  const removeTransferItem = (id: string) => {
    setTransferItems(transferItems.filter(item => item.id !== id))
  }

  const updateTransferItem = (id: string, field: keyof TransferItem, value: string) => {
    setTransferItems(transferItems.map(item => {
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
    
    // Validate outlets
    if (!fromOutletId || !toOutletId) {
      toast({
        title: "Validation Error",
        description: "Please select both source and destination outlets.",
        variant: "destructive",
      })
      return
    }

    if (fromOutletId === toOutletId) {
      toast({
        title: "Validation Error",
        description: "Source and destination outlets must be different.",
        variant: "destructive",
      })
      return
    }

    // Validate all items
    const validItems = transferItems.filter(item => 
      item.product_id && item.quantity && parseInt(item.quantity) > 0
    )

    if (validItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one product transfer with valid quantity.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Process all transfers
      const transfers = validItems.map(item => {
        const quantity = parseInt(item.quantity)
        return {
          product_id: item.product_id,
          from_outlet_id: fromOutletId,
          to_outlet_id: toOutletId,
          quantity: quantity,
          reason: commonReason || "Stock transfer",
        }
      })

      // Submit all transfers sequentially
      const results = []
      const errors = []
      
      for (const transfer of transfers) {
        try {
          await inventoryService.transfer(transfer)
          results.push(transfer.product_id)
        } catch (error: any) {
          const productName = products.find(p => p.id === transfer.product_id)?.name || "Unknown"
          errors.push({ product: productName, error: error.message || "Failed to transfer" })
        }
      }

      // Show results
      if (errors.length === 0) {
        toast({
          title: "Transfers Initiated",
          description: `Successfully transferred ${results.length} product${results.length > 1 ? 's' : ''}.`,
        })
      } else if (results.length > 0) {
        toast({
          title: "Partial Success",
          description: `${results.length} transfer${results.length > 1 ? 's' : ''} succeeded, ${errors.length} failed.`,
          variant: "default",
        })
      } else {
        toast({
          title: "Transfer Failed",
          description: "All transfers failed. Please try again.",
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
      console.error("Failed to transfer stock:", error)
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to transfer stock. Please try again.",
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
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Bulk Stock Transfer
          </DialogTitle>
          <DialogDescription>
            Transfer multiple products from one outlet to another
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Outlet Selection */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold text-sm">Outlet Selection</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from">From Outlet *</Label>
                  <Select 
                    value={fromOutletId}
                    onValueChange={setFromOutletId}
                    required
                  >
                    <SelectTrigger id="from">
                      <SelectValue placeholder="Select source outlet" />
                    </SelectTrigger>
                    <SelectContent>
                      {outlets.filter(o => o.isActive).map(outlet => (
                        <SelectItem key={outlet.id} value={outlet.id}>
                          {outlet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="to">To Outlet *</Label>
                  <Select 
                    value={toOutletId}
                    onValueChange={setToOutletId}
                    required
                  >
                    <SelectTrigger id="to">
                      <SelectValue placeholder="Select destination outlet" />
                    </SelectTrigger>
                    <SelectContent>
                      {outlets
                        .filter(o => o.isActive && o.id !== fromOutletId)
                        .map(outlet => (
                          <SelectItem key={outlet.id} value={outlet.id}>
                            {outlet.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason/Notes</Label>
                <textarea
                  id="reason"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Optional reason or notes for this transfer"
                  value={commonReason}
                  onChange={(e) => setCommonReason(e.target.value)}
                />
              </div>
            </div>

            {/* Transfer Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Products to Transfer</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTransferItem}
                  disabled={loadingProducts}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>

              <div className="space-y-3">
                {transferItems.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Product {index + 1}
                      </span>
                      {transferItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTransferItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Product *</Label>
                        <Select 
                          value={item.product_id}
                          onValueChange={(value) => updateTransferItem(item.id, "product_id", value)}
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
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => updateTransferItem(item.id, "quantity", e.target.value)}
                          placeholder="Enter quantity"
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
              disabled={isLoading || loadingProducts || outlets.length < 2 || !fromOutletId || !toOutletId || transferItems.length === 0}
            >
              {isLoading ? `Processing ${transferItems.length} transfer${transferItems.length > 1 ? 's' : ''}...` : `Transfer ${transferItems.length} Product${transferItems.length > 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

