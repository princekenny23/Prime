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
import { productService, categoryService } from "@/lib/services/productService"
import { outletService } from "@/lib/services/outletService"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import type { Category } from "@/lib/types"
import { Package, Plus, Trash2, X } from "lucide-react"

interface AddEditProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: any
  onProductSaved?: () => void // Callback when product is saved
}

export function AddEditProductModal({ open, onOpenChange, product, onProductSaved }: AddEditProductModalProps) {
  const { toast } = useToast()
  const { currentBusiness } = useBusinessStore()
  const { outlets } = useTenant()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [sellingUnits, setSellingUnits] = useState<any[]>([])
  const [editingUnitIndex, setEditingUnitIndex] = useState<number | null>(null)
  
  // Determine business type
  const businessType = currentBusiness?.type || ""
  const isWholesaleRetail = businessType === "wholesale and retail"
  const isBar = businessType === "bar"
  const isRestaurant = businessType === "restaurant"
  // Helper function to parse business-specific fields from description
  const parseBusinessFieldsFromDescription = (desc: string) => {
    const fields: any = {}
    if (!desc) return fields
    
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
    
    // Parse preparation_time: "Prep time: 15 min"
    const prepMatch = desc.match(/Prep time:\s*(\d+)\s*min/i)
    if (prepMatch) {
      fields.preparation_time = parseInt(prepMatch[1])
    }
    
    return fields
  }
  
  // Helper function to remove business-specific fields from description
  const cleanDescription = (desc: string) => {
    if (!desc) return ""
    return desc
      .replace(/\s*\|\s*Volume:\s*\d+ml/gi, "")
      .replace(/\s*\|\s*Alcohol:\s*[\d.]+%/gi, "")
      .replace(/\s*\|\s*Prep time:\s*\d+\s*min/gi, "")
      .trim()
  }

  const [formData, setFormData] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    categoryId: product?.categoryId || "",
    barcode: product?.barcode || "",
    cost: product?.cost || product?.cost_price || "",
    retail_price: product?.retail_price || product?.price || "",
    wholesale_price: product?.wholesale_price || product?.wholesalePrice || "",
    wholesale_enabled: product?.wholesale_enabled || product?.wholesaleEnabled || false,
    minimum_wholesale_quantity: product?.minimum_wholesale_quantity || product?.minimumWholesaleQuantity || 1,
    outletId: product?.outlet?.id || product?.outlet_id || "",
    unit: product?.unit || "pcs",
    stock: product?.stock || 0,
    lowStockThreshold: product?.lowStockThreshold || product?.low_stock_threshold || 0,
    description: product?.description || "",
    isActive: product?.isActive !== undefined ? product.isActive : true,
    // Bar-specific fields
    volume_ml: "",
    alcohol_percentage: "",
    // Restaurant-specific fields
    preparation_time: "",
    is_menu_item: true,
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const cats = await categoryService.list()
        setCategories(cats)
        
        // Load selling units if editing product
        if (product?.id) {
          try {
            // Fetch product with selling_units included
            const fullProduct = await productService.get(product.id)
            setSellingUnits(fullProduct.selling_units || [])
          } catch (error) {
            console.error("Failed to load selling units:", error)
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      }
    }
    loadData()
  }, [product?.id])

  useEffect(() => {
    if (product) {
      // Editing existing product - parse business-specific fields from description
      const businessFields = parseBusinessFieldsFromDescription(product.description || "")
      const cleanDesc = cleanDescription(product.description || "")
      
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        categoryId: product.categoryId || "",
        barcode: product.barcode || "",
        cost: product.cost || product.cost_price || "",
        retail_price: product.retail_price || product.price || "",
        wholesale_price: product.wholesale_price || product.wholesalePrice || "",
        wholesale_enabled: product.wholesale_enabled || product.wholesaleEnabled || false,
        minimum_wholesale_quantity: product.minimum_wholesale_quantity || product.minimumWholesaleQuantity || 1,
        unit: product.unit || "pcs",
        stock: product.stock || 0,
        lowStockThreshold: product.lowStockThreshold || product.low_stock_threshold || 0,
        description: cleanDesc,
        isActive: product.isActive !== undefined ? product.isActive : true,
        // Bar-specific fields
        volume_ml: businessFields.volume_ml ? String(businessFields.volume_ml) : "",
        alcohol_percentage: businessFields.alcohol_percentage ? String(businessFields.alcohol_percentage) : "",
        // Restaurant-specific fields
        preparation_time: businessFields.preparation_time ? String(businessFields.preparation_time) : "",
        is_menu_item: true, // Default to true, will be inferred from track_inventory if needed
      })
    } else if (open) {
      // Creating new product - reset form and load preview SKU
      setFormData({
        name: "",
        sku: "",
        categoryId: "",
        barcode: "",
        cost: "",
        retail_price: "",
        wholesale_price: "",
        wholesale_enabled: false,
        minimum_wholesale_quantity: 1,
        outletId: "",
        unit: "pcs",
        stock: 0,
        lowStockThreshold: 0,
        description: "",
        isActive: true,
        // Bar-specific fields
        volume_ml: "",
        alcohol_percentage: "",
        // Restaurant-specific fields
        preparation_time: "",
        is_menu_item: true,
      })
      setSellingUnits([])
      
      // SKU is now optional - no need to pre-fill
    }
  }, [product, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.name || formData.name.trim() === "") {
        toast({
          title: "Validation Error",
          description: "Product name is required.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const retailPriceValue = formData.retail_price ? parseFloat(formData.retail_price.toString()) : 0
      if (isNaN(retailPriceValue) || retailPriceValue <= 0) {
        toast({
          title: "Validation Error",
          description: "Retail price must be greater than 0.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
      
      // Validate wholesale price if wholesale is enabled (for wholesale/retail businesses)
      if (isWholesaleRetail && formData.wholesale_enabled) {
        const wholesalePriceValue = formData.wholesale_price ? parseFloat(formData.wholesale_price.toString()) : 0
        if (isNaN(wholesalePriceValue) || wholesalePriceValue <= 0) {
          toast({
            title: "Validation Error",
            description: "Wholesale price must be greater than 0 when wholesale is enabled.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
        
        // Validate minimum wholesale quantity
        const minQty = parseInt(formData.minimum_wholesale_quantity.toString()) || 1
        if (minQty < 1) {
          toast({
            title: "Validation Error",
            description: "Minimum wholesale quantity must be at least 1.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
      }
      
      // Validate cost if provided
      if (formData.cost && formData.cost.toString().trim() !== "") {
        const costValue = parseFloat(formData.cost.toString())
        if (isNaN(costValue) || costValue < 0) {
          toast({
            title: "Validation Error",
            description: "Cost must be a valid number greater than or equal to 0.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
      }
      
      // Validate stock
      const stockValue = parseInt(formData.stock.toString()) || 0
      if (stockValue < 0) {
        toast({
          title: "Validation Error",
          description: "Stock cannot be negative.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }
      
      // Validate low stock threshold
      const lowStockValue = parseInt(formData.lowStockThreshold.toString()) || 0
      if (lowStockValue < 0) {
        toast({
          title: "Validation Error",
          description: "Low stock threshold cannot be negative.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Build description with business-specific fields
      let description = formData.description || ""
      const businessSpecificInfo: string[] = []
      
      // Bar-specific fields
      if (isBar) {
        if (formData.volume_ml && formData.volume_ml.trim() !== "") {
          const volume = parseInt(formData.volume_ml)
          if (!isNaN(volume) && volume > 0) {
            businessSpecificInfo.push(`Volume: ${volume}ml`)
          }
        }
        if (formData.alcohol_percentage && formData.alcohol_percentage.trim() !== "") {
          const alcohol = parseFloat(formData.alcohol_percentage)
          if (!isNaN(alcohol) && alcohol >= 0) {
            businessSpecificInfo.push(`Alcohol: ${alcohol}%`)
          }
        }
      }
      
      // Restaurant-specific fields
      if (isRestaurant) {
        if (formData.preparation_time && formData.preparation_time.trim() !== "") {
          const prepTime = parseInt(formData.preparation_time)
          if (!isNaN(prepTime) && prepTime >= 0) {
            businessSpecificInfo.push(`Prep time: ${prepTime} min`)
          }
        }
        // Note: is_menu_item is informational - affects track_inventory at variation level
        // We'll note it in description for reference
        if (!formData.is_menu_item) {
          businessSpecificInfo.push("Not a menu item")
        }
      }
      
      // Append business-specific info to description
      if (businessSpecificInfo.length > 0) {
        if (description) {
          description += " | " + businessSpecificInfo.join(" | ")
        } else {
          description = businessSpecificInfo.join(" | ")
        }
      }

      // Validate outlet
      if (!formData.outletId || formData.outletId.toString().trim() === "") {
        toast({
          title: "Validation Error",
          description: "Outlet is required.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const productData: any = {
        name: formData.name.trim(),
        sku: formData.sku && formData.sku.trim() !== "" ? formData.sku.trim() : undefined,
        categoryId: formData.categoryId && String(formData.categoryId).trim() !== "" ? formData.categoryId : undefined,
        barcode: formData.barcode && formData.barcode.trim() !== "" ? formData.barcode.trim() : undefined,
        cost: formData.cost && formData.cost.toString().trim() !== "" ? parseFloat(formData.cost.toString()) : undefined,
        retail_price: retailPriceValue,
        outlet: formData.outletId,
        unit: formData.unit || "pcs",
        stock: parseInt(formData.stock.toString()) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold.toString()) || 0,
        description: description,
        isActive: formData.isActive,
      }
      
      // Add wholesale fields if wholesale is enabled
      if (formData.wholesale_enabled) {
        productData.wholesale_price = parseFloat(formData.wholesale_price.toString())
        productData.wholesale_enabled = true
        productData.minimum_wholesale_quantity = parseInt(formData.minimum_wholesale_quantity.toString()) || 1
      } else {
        productData.wholesale_enabled = false
      }

      let savedProduct
      if (product) {
        savedProduct = await productService.update(product.id, productData)
        toast({
          title: "Product Updated",
          description: "Product has been updated successfully.",
        })
      } else {
        savedProduct = await productService.create(productData)
        toast({
          title: "Product Created",
          description: "Product has been created successfully.",
        })
      }

      // Save selling units if any
      if (savedProduct?.id && sellingUnits.length > 0) {
        try {
          // TODO: Implement unit service methods
          // For now, units will be managed via product detail page
          // await productUnitService.bulkUpdate(savedProduct.id, sellingUnits)
        } catch (error) {
          console.error("Failed to save selling units:", error)
          // Don't fail the whole operation if units fail
        }
      }

      // Notify parent component immediately after successful save
      // This ensures changes (like stock updates) are reflected immediately
      if (onProductSaved) {
        // Wait for callback to complete before closing modal
        await onProductSaved()
      }

      // Close modal after save and refresh
      onOpenChange(false)
    } catch (error: any) {
      console.error("Failed to save product:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {product ? "Update product information" : "Create a new product in your catalog"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input 
                id="name" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required 
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
              <p className="text-xs text-muted-foreground">
                SKU is optional. Leave blank if not needed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.categoryId} 
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outlet">Outlet *</Label>
              <Select 
                value={formData.outletId} 
                onValueChange={(value) => setFormData({ ...formData, outletId: value })}
                required
              >
                <SelectTrigger id="outlet">
                  <SelectValue placeholder="Select outlet" />
                </SelectTrigger>
                <SelectContent>
                  {outlets.map(outlet => (
                    <SelectItem key={outlet.id} value={outlet.id}>{outlet.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Outlet this product belongs to
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input 
                id="barcode" 
                type="text" 
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost Price</Label>
              <Input 
                id="cost" 
                type="number" 
                step="0.01" 
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Cost per unit (for profit calculations)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="retail_price">Retail Price *</Label>
              <Input 
                id="retail_price" 
                type="number" 
                step="0.01" 
                value={formData.retail_price}
                onChange={(e) => setFormData({ ...formData, retail_price: e.target.value })}
                required 
              />
            </div>

            {/* Wholesale/Retail Business Specific Fields */}
            {isWholesaleRetail && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="wholesale_enabled"
                      checked={formData.wholesale_enabled}
                      onChange={(e) => setFormData({ ...formData, wholesale_enabled: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="wholesale_enabled" className="cursor-pointer">Enable Wholesale Pricing</Label>
                  </div>
                </div>

                {formData.wholesale_enabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="wholesale_price">Wholesale Price *</Label>
                      <Input 
                        id="wholesale_price" 
                        type="number" 
                        step="0.01" 
                        min="0.01"
                        value={formData.wholesale_price}
                        onChange={(e) => setFormData({ ...formData, wholesale_price: e.target.value })}
                        required={formData.wholesale_enabled}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-muted-foreground">
                        Price per unit for wholesale customers
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minimum_wholesale_quantity">Minimum Wholesale Quantity *</Label>
                      <Input 
                        id="minimum_wholesale_quantity" 
                        type="number" 
                        min="1"
                        value={formData.minimum_wholesale_quantity}
                        onChange={(e) => setFormData({ ...formData, minimum_wholesale_quantity: parseInt(e.target.value) || 1 })}
                        required={formData.wholesale_enabled}
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum quantity required to qualify for wholesale pricing
                      </p>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Bar Business Specific Fields */}
            {isBar && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="volume_ml">Volume (ml)</Label>
                  <Input 
                    id="volume_ml" 
                    type="number" 
                    min="0"
                    value={formData.volume_ml}
                    onChange={(e) => setFormData({ ...formData, volume_ml: e.target.value })}
                    placeholder="750"
                  />
                  <p className="text-xs text-muted-foreground">
                    Volume in milliliters (e.g., 750 for a standard bottle)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alcohol_percentage">Alcohol Percentage (%)</Label>
                  <Input 
                    id="alcohol_percentage" 
                    type="number" 
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.alcohol_percentage}
                    onChange={(e) => setFormData({ ...formData, alcohol_percentage: e.target.value })}
                    placeholder="40"
                  />
                  <p className="text-xs text-muted-foreground">
                    Alcohol by volume percentage (e.g., 40 for 40% ABV)
                  </p>
                </div>
              </>
            )}

            {/* Restaurant Business Specific Fields */}
            {isRestaurant && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="preparation_time">Preparation Time (minutes)</Label>
                  <Input 
                    id="preparation_time" 
                    type="number" 
                    min="0"
                    value={formData.preparation_time}
                    onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                    placeholder="15"
                  />
                  <p className="text-xs text-muted-foreground">
                    Estimated preparation time in minutes
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_menu_item"
                      checked={formData.is_menu_item}
                      onChange={(e) => setFormData({ ...formData, is_menu_item: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="is_menu_item" className="cursor-pointer">Is Menu Item</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Menu items typically don't track inventory (made-to-order)
                  </p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select 
                value={formData.unit} 
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
                required
              >
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">Piece</SelectItem>
                  <SelectItem value="kg">Kilogram</SelectItem>
                  <SelectItem value="g">Gram</SelectItem>
                  <SelectItem value="l">Liter</SelectItem>
                  <SelectItem value="ml">Milliliter</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Initial Stock</Label>
              <Input 
                id="stock" 
                type="number" 
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Starting inventory quantity
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-stock">Low Stock Threshold</Label>
              <Input 
                id="min-stock" 
                type="number" 
                min="0"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Alert when stock falls to this level
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Selling Units Section */}
            <div className="space-y-4 md:col-span-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Selling Units</Label>
                  <p className="text-xs text-muted-foreground">
                    Add multiple selling units (e.g., piece, dozen, box). Base unit: <strong>{formData.unit}</strong>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSellingUnits([...sellingUnits, {
                      id: null,
                      unit_name: "",
                      conversion_factor: 1,
                      retail_price: "",
                      wholesale_price: "",
                      is_active: true,
                    }])
                    setEditingUnitIndex(sellingUnits.length)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Unit
                </Button>
              </div>

              {sellingUnits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No selling units added. Products will use base unit ({formData.unit}) only.
                </p>
              ) : (
                <div className="space-y-3">
                  {sellingUnits.map((unit, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Unit {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSellingUnits(sellingUnits.filter((_, i) => i !== index))
                            if (editingUnitIndex === index) setEditingUnitIndex(null)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Unit Name *</Label>
                          <Input
                            placeholder="e.g., dozen, box, pack"
                            value={unit.unit_name}
                            onChange={(e) => {
                              const updated = [...sellingUnits]
                              updated[index].unit_name = e.target.value
                              setSellingUnits(updated)
                            }}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Conversion Factor *</Label>
                          <Input
                            type="number"
                            step="0.0001"
                            min="0.0001"
                            placeholder="e.g., 12 for dozen"
                            value={unit.conversion_factor}
                            onChange={(e) => {
                              const updated = [...sellingUnits]
                              updated[index].conversion_factor = parseFloat(e.target.value) || 1
                              setSellingUnits(updated)
                            }}
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            How many {formData.unit} equals this unit
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Retail Price *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={unit.retail_price}
                            onChange={(e) => {
                              const updated = [...sellingUnits]
                              updated[index].retail_price = e.target.value
                              setSellingUnits(updated)
                            }}
                            required
                          />
                        </div>
                        {isWholesaleRetail && (
                          <div className="space-y-2">
                            <Label>Wholesale Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              placeholder="0.00 (optional)"
                              value={unit.wholesale_price}
                              onChange={(e) => {
                                const updated = [...sellingUnits]
                                updated[index].wholesale_price = e.target.value
                                setSellingUnits(updated)
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : product ? "Update Product" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


