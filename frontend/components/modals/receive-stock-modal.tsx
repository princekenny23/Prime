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
import { PackageCheck, Plus, Trash2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { inventoryService } from "@/lib/services/inventoryService"
import { productService } from "@/lib/services/productService"
import { useTenant } from "@/contexts/tenant-context"
import type { Product } from "@/lib/types"

interface ReceiveStockModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface ReceiveItem {
  id: string
  product_id: string
  product_name?: string
  quantity: string
  cost: string
}

export function ReceiveStockModal({ open, onOpenChange, onSuccess }: ReceiveStockModalProps) {
  const { toast } = useToast()
  const { outlets } = useTenant()
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>([])
  const [outletId, setOutletId] = useState("")
  const [supplier, setSupplier] = useState("")
  const [reason, setReason] = useState("")

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
      // Initialize with one empty item
      setReceiveItems([{
        id: Date.now().toString(),
        product_id: "",
        quantity: "",
        cost: "",
      }])
      setOutletId("")
      setSupplier("")
      setReason("")
    }
  }, [open, loadProducts])

  useEffect(() => {
    if (open) {
      loadProducts()
    }
  }, [open, loadProducts])

  const addReceiveItem = () => {
    setReceiveItems([...receiveItems, {
      id: Date.now().toString(),
      product_id: "",
      quantity: "",
      cost: "",
    }])
  }

  const removeReceiveItem = (id: string) => {
    setReceiveItems(receiveItems.filter(item => item.id !== id))
  }

  const updateReceiveItem = (id: string, field: keyof ReceiveItem, value: string) => {
    setReceiveItems(receiveItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        // Update product_name when product_id changes
        if (field === "product_id") {
          const product = products.find(p => p.id === value)
          updated.product_name = product?.name
          // Auto-fill cost if product has cost
          if (product?.cost && !updated.cost) {
            updated.cost = String(product.cost)
          }
        }
        return updated
      }
      return item
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate outlet
    if (!outletId) {
      toast({
        title: "Validation Error",
        description: "Please select an outlet.",
        variant: "destructive",
      })
      return
    }

    // Validate all items
    const validItems = receiveItems.filter(item => 
      item.product_id && item.quantity && parseInt(item.quantity) > 0
    )

    if (validItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one product with valid quantity.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Prepare receiving data
      const items = validItems.map(item => ({
        product_id: item.product_id,
        quantity: parseInt(item.quantity),
        cost: item.cost ? parseFloat(item.cost) : undefined,
      }))

      const response = await inventoryService.receive({
        outlet_id: outletId,
        supplier: supplier || undefined,
        items: items,
        reason: reason || undefined,
      })

      // Show results
      if (response.errors && response.errors.length > 0) {
        if (response.results && response.results.length > 0) {
          toast({
            title: "Partial Success",
            description: `${response.results.length} product(s) received, ${response.errors.length} failed.`,
            variant: "default",
          })
        } else {
          toast({
            title: "Receiving Failed",
            description: "All items failed. Please check and try again.",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Receiving Successful",
          description: `Successfully received ${response.results?.length || validItems.length} product(s).`,
        })
      }
      
      // Close modal first
      onOpenChange(false)
      
      // Call onSuccess callback AFTER closing to reload data
      if (onSuccess && response.results && response.results.length > 0) {
        setTimeout(() => {
          onSuccess()
        }, 500)
      }
    } catch (error: any) {
      console.error("Failed to receive stock:", error)
      toast({
        title: "Receiving Failed",
        description: error.message || "Failed to receive stock. Please try again.",
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
            <PackageCheck className="h-5 w-5" />
            Bulk Stock Receiving
          </DialogTitle>
          <DialogDescription>
            Receive multiple products from suppliers
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Outlet and Supplier Selection */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold text-sm">Receiving Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="outlet">Outlet *</Label>
                  <Select 
                    value={outletId}
                    onValueChange={setOutletId}
                    required
                  >
                    <SelectTrigger id="outlet">
                      <SelectValue placeholder="Select outlet" />
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
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Supplier name (optional)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Notes</Label>
                <textarea
                  id="reason"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Optional notes about this receiving"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            {/* Receive Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Products to Receive</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addReceiveItem}
                  disabled={loadingProducts}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>

              <div className="space-y-3">
                {receiveItems.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Product {index + 1}
                      </span>
                      {receiveItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeReceiveItem(item.id)}
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
                          onValueChange={(value) => updateReceiveItem(item.id, "product_id", value)}
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
                          onChange={(e) => updateReceiveItem(item.id, "quantity", e.target.value)}
                          placeholder="Enter quantity"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Cost (Optional)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.cost}
                          onChange={(e) => updateReceiveItem(item.id, "cost", e.target.value)}
                          placeholder="Product cost"
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
              disabled={isLoading || loadingProducts || !outletId || receiveItems.length === 0}
            >
              {isLoading ? `Processing ${receiveItems.length} product(s)...` : `Receive ${receiveItems.length} Product(s)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

