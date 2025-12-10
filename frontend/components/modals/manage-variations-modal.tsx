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
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Package } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { variationService, type ItemVariation } from "@/lib/services/productService"
import { useTenant } from "@/contexts/tenant-context"

interface ManageVariationsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  productName: string
  onVariationsUpdated?: () => void
}

interface VariationFormData {
  name: string
  price: string
  cost: string
  sku: string
  barcode: string
  track_inventory: boolean
  unit: string
  low_stock_threshold: string
  is_active: boolean
  sort_order: string
}

export function ManageVariationsModal({
  open,
  onOpenChange,
  productId,
  productName,
  onVariationsUpdated,
}: ManageVariationsModalProps) {
  const { toast } = useToast()
  const { currentOutlet } = useTenant()
  const [variations, setVariations] = useState<ItemVariation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVariation, setEditingVariation] = useState<ItemVariation | null>(null)
  const [formData, setFormData] = useState<VariationFormData>({
    name: "",
    price: "",
    cost: "",
    sku: "",
    barcode: "",
    track_inventory: true,
    unit: "pcs",
    low_stock_threshold: "0",
    is_active: true,
    sort_order: "0",
  })

  useEffect(() => {
    if (open && productId) {
      loadVariations()
    }
  }, [open, productId])

  const loadVariations = async () => {
    setIsLoading(true)
    try {
      const filters: any = { product: productId }
      if (currentOutlet?.id) {
        filters.outlet = currentOutlet.id
      }
      const data = await variationService.list(filters)
      setVariations(data.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)))
    } catch (error: any) {
      console.error("Failed to load variations:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load variations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Variation name is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: "Validation Error",
        description: "Price must be greater than 0",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const variationData: Partial<ItemVariation> = {
        product: productId,
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        sku: formData.sku.trim() || undefined,
        barcode: formData.barcode.trim() || undefined,
        track_inventory: formData.track_inventory,
        unit: formData.unit,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 0,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order) || 0,
      }

      if (editingVariation) {
        await variationService.update(editingVariation.id, variationData)
        toast({
          title: "Variation Updated",
          description: `${formData.name} has been updated successfully.`,
        })
      } else {
        await variationService.create(variationData)
        toast({
          title: "Variation Created",
          description: `${formData.name} has been created successfully.`,
        })
      }

      resetForm()
      loadVariations()
      onVariationsUpdated?.()
    } catch (error: any) {
      console.error("Failed to save variation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save variation",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (variation: ItemVariation) => {
    if (!confirm(`Are you sure you want to delete "${variation.name}"? This action cannot be undone.`)) {
      return
    }

    setIsLoading(true)
    try {
      await variationService.delete(variation.id)
      toast({
        title: "Variation Deleted",
        description: `${variation.name} has been deleted successfully.`,
      })
      loadVariations()
      onVariationsUpdated?.()
    } catch (error: any) {
      console.error("Failed to delete variation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete variation",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (variation: ItemVariation) => {
    setEditingVariation(variation)
    setFormData({
      name: variation.name,
      price: variation.price.toString(),
      cost: variation.cost?.toString() || "",
      sku: variation.sku || "",
      barcode: variation.barcode || "",
      track_inventory: variation.track_inventory,
      unit: variation.unit,
      low_stock_threshold: variation.low_stock_threshold.toString(),
      is_active: variation.is_active,
      sort_order: variation.sort_order.toString(),
    })
    setShowAddForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      cost: "",
      sku: "",
      barcode: "",
      track_inventory: true,
      unit: "pcs",
      low_stock_threshold: "0",
      is_active: true,
      sort_order: "0",
    })
    setEditingVariation(null)
    setShowAddForm(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Variations - {productName}</DialogTitle>
          <DialogDescription>
            Create and manage variations for this product (e.g., sizes, colors, pack sizes)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {editingVariation ? "Edit Variation" : "Add New Variation"}
                </h3>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Variation Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Large, 500ml, Pack of 12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Cost (Optional)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="pcs, ml, kg, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU (Optional)</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Enter SKU (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode (Optional)</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Barcode"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="track_inventory"
                    checked={formData.track_inventory}
                    onCheckedChange={(checked) => setFormData({ ...formData, track_inventory: checked })}
                  />
                  <Label htmlFor="track_inventory">Track Inventory</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {editingVariation ? "Update" : "Create"} Variation
                </Button>
              </div>
            </div>
          )}

          {/* Variations List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Variations ({variations.length})</h3>
              {!showAddForm && (
                <Button onClick={() => setShowAddForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variation
                </Button>
              )}
            </div>

            {isLoading && variations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading variations...
              </div>
            ) : variations.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">No variations yet</p>
                <Button onClick={() => setShowAddForm(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Variation
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variations.map((variation) => (
                    <TableRow key={variation.id}>
                      <TableCell className="font-medium">{variation.name}</TableCell>
                      <TableCell>MWK {variation.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {variation.cost ? `MWK ${variation.cost.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell>{variation.sku || "—"}</TableCell>
                      <TableCell>{variation.unit}</TableCell>
                      <TableCell>
                        {variation.track_inventory ? (
                          <span className={variation.is_low_stock ? "text-orange-600 font-medium" : ""}>
                            {variation.total_stock !== undefined ? variation.total_stock : "—"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {variation.is_active ? (
                            <Badge variant="default" className="w-fit">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="w-fit">Inactive</Badge>
                          )}
                          {variation.track_inventory && variation.is_low_stock && (
                            <Badge variant="outline" className="w-fit text-orange-600 border-orange-600">
                              Low Stock
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(variation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(variation)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

