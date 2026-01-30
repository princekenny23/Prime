"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Plus, ShoppingCart, Loader2, Building2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supplierService, type Supplier } from "@/lib/services/supplierService"
import { purchaseOrderService } from "@/lib/services/purchaseOrderService"
import { useTenant } from "@/contexts/tenant-context"
import { useBusinessStore } from "@/stores/businessStore"

interface OrderProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  onSuccess?: () => void
}

export function OrderProductModal({ open, onOpenChange, product, onSuccess }: OrderProductModalProps) {
  const { toast } = useToast()
  const { currentOutlet, outlets } = useTenant()
  const { currentBusiness } = useBusinessStore()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [outletId, setOutletId] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("1")
  const [unitPrice, setUnitPrice] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
  })

  const loadSuppliers = useCallback(async () => {
    setIsLoadingSuppliers(true)
    try {
      const response = await supplierService.list({ is_active: true })
      setSuppliers(Array.isArray(response) ? response : (response.results || []))
    } catch (error) {
      console.error("Failed to load suppliers:", error)
      toast({
        title: "Error",
        description: "Failed to load suppliers",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSuppliers(false)
    }
  }, [toast])

  useEffect(() => {
    if (open) {
      loadSuppliers()
      if (currentOutlet) {
        setOutletId(String(currentOutlet.id))
      }
      // Set default unit price to product cost if available
      if (product?.cost) {
        setUnitPrice(String(product.cost))
      } else if (product?.retail_price) {
        // Fallback to retail price if cost not available
        setUnitPrice(String(product.retail_price))
      }
    }
  }, [open, currentOutlet, product, loadSuppliers])

  useEffect(() => {
    if (open) {
      loadSuppliers()
    }
  }, [open, loadSuppliers])

  const handleCreateSupplier = async () => {
    if (!newSupplier.name.trim()) {
      toast({
        title: "Error",
        description: "Supplier name is required",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const created = await supplierService.create({
        ...newSupplier,
        is_active: true,
        outlet_id: outletId || undefined,
      })
      await loadSuppliers()
      setSelectedSupplierId(String(created.id))
      setShowCreateForm(false)
      setNewSupplier({ name: "", contact_name: "", email: "", phone: "", address: "" })
      toast({
        title: "Success",
        description: "Supplier created successfully",
      })
    } catch (error: any) {
      console.error("Failed to create supplier:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create supplier",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateOrder = async () => {
    if (!selectedSupplierId) {
      toast({
        title: "Error",
        description: "Please select or create a supplier",
        variant: "destructive",
      })
      return
    }

    if (!outletId) {
      toast({
        title: "Error",
        description: "Please select an outlet",
        variant: "destructive",
      })
      return
    }

    if (!product?.id) {
      toast({
        title: "Error",
        description: "Product information is missing",
        variant: "destructive",
      })
      return
    }

    const qty = parseInt(quantity) || 1
    if (qty <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      })
      return
    }

    const price = parseFloat(unitPrice) || 0
    if (price <= 0) {
      toast({
        title: "Error",
        description: "Unit price must be greater than 0",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const subtotal = qty * price
      const tax = 0 // Can be calculated later if needed
      const discount = 0
      const total = subtotal + tax - discount

      const purchaseOrderData = {
        supplier_id: Number(selectedSupplierId),
        outlet_id: Number(outletId),
        order_date: new Date().toISOString().split('T')[0],
        status: "draft" as const,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        discount: discount.toFixed(2),
        total: total.toFixed(2),
        notes: notes || undefined,
        items_data: [{
          product_id: Number(product.id),
          quantity: qty,
          unit_price: price.toFixed(2),
          notes: notes || undefined,
        }],
      }

      const createdPO = await purchaseOrderService.create(purchaseOrderData)
      
      toast({
        title: "Success",
        description: "Purchase order created successfully",
      })

      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Failed to create purchase order:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create purchase order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const productName = product?.name || "Unknown Product"
  const totalAmount = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Order Product
          </DialogTitle>
          <DialogDescription>
            Create a purchase order for {productName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">Product Information</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Product:</span> {productName}</p>
              {product?.sku && <p><span className="font-medium">SKU:</span> {product.sku}</p>}
              {product?.stock !== undefined && (
                <p><span className="font-medium">Current Stock:</span> {product.stock}</p>
              )}
            </div>
          </div>

          {/* Supplier Selection/Creation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Supplier</h3>
              {!showCreateForm && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(true)}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Supplier
                </Button>
              )}
            </div>

            {!showCreateForm ? (
              <div className="space-y-2">
                <Label htmlFor="supplier">Select Supplier *</Label>
                <Select
                  value={selectedSupplierId}
                  onValueChange={setSelectedSupplierId}
                  disabled={isLoadingSuppliers}
                >
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Choose a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.length === 0 && !isLoadingSuppliers && (
                      <SelectItem value="none" disabled>
                        No suppliers found
                      </SelectItem>
                    )}
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={String(supplier.id)}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-4 border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Create New Supplier
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewSupplier({ name: "", contact_name: "", email: "", phone: "", address: "" })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="name">Supplier Name *</Label>
                    <Input
                      id="name"
                      value={newSupplier.name}
                      onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                      placeholder="Enter supplier name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Contact Name</Label>
                    <Input
                      id="contact_name"
                      value={newSupplier.contact_name}
                      onChange={(e) => setNewSupplier({ ...newSupplier, contact_name: e.target.value })}
                      placeholder="Contact person name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newSupplier.email}
                        onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newSupplier.phone}
                        onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={newSupplier.address}
                      onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                      placeholder="Supplier address"
                      rows={2}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleCreateSupplier}
                    disabled={isLoading || !newSupplier.name.trim()}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Supplier
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Details */}
          {!showCreateForm && selectedSupplierId && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-sm">Order Details</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="outlet">Outlet *</Label>
                  <Select value={outletId} onValueChange={setOutletId} required>
                    <SelectTrigger id="outlet">
                      <SelectValue placeholder="Select outlet" />
                    </SelectTrigger>
                    <SelectContent>
                      {outlets.filter(o => o.isActive).map((outlet) => (
                        <SelectItem key={outlet.id} value={String(outlet.id)}>
                          {outlet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price ({currentBusiness?.currencySymbol || "MWK"}) *</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total Amount</Label>
                  <div className="p-2 bg-muted rounded-md font-semibold">
                    {currentBusiness?.currencySymbol || "MWK"} {totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes for this order"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          {!showCreateForm && selectedSupplierId && (
            <Button onClick={handleCreateOrder} disabled={isLoading || !outletId || !quantity || !unitPrice}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Order...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Create Purchase Order
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

