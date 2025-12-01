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
import type { Category } from "@/lib/types/mock-data"

interface AddEditProductModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: any
}

export function AddEditProductModal({ open, onOpenChange, product }: AddEditProductModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    categoryId: product?.categoryId || "",
    barcode: product?.barcode || "",
    cost: product?.cost || "",
    price: product?.price || "",
    unit: product?.unit || "pcs",
    stock: product?.stock || 0,
    lowStockThreshold: product?.lowStockThreshold || product?.low_stock_threshold || 0,
    description: product?.description || "",
    isActive: product?.isActive !== undefined ? product.isActive : true,
  })

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await categoryService.list()
        setCategories(cats)
      } catch (error) {
        console.error("Failed to load categories:", error)
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    if (product) {
      // Editing existing product
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        categoryId: product.categoryId || "",
        barcode: product.barcode || "",
        cost: product.cost || "",
        price: product.price || "",
        unit: product.unit || "pcs",
        stock: product.stock || 0,
        lowStockThreshold: product.lowStockThreshold || product.low_stock_threshold || 0,
        description: product.description || "",
        isActive: product.isActive !== undefined ? product.isActive : true,
      })
    } else if (open) {
      // Creating new product - reset form and load preview SKU
      setFormData({
        name: "",
        sku: "",
        categoryId: "",
        barcode: "",
        cost: "",
        price: "",
        unit: "pcs",
        stock: 0,
        lowStockThreshold: 0,
        description: "",
        isActive: true,
      })
      
      // Load preview SKU after form reset
      const loadPreviewSku = async () => {
        try {
          const previewSku = await productService.generateSkuPreview()
          setFormData(prev => ({ ...prev, sku: previewSku }))
        } catch (error) {
          console.error("Failed to load preview SKU:", error)
          // Don't set SKU if preview fails - backend will generate it
        }
      }
      loadPreviewSku()
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

      const priceValue = formData.price ? parseFloat(formData.price.toString()) : 0
      if (isNaN(priceValue) || priceValue <= 0) {
        toast({
          title: "Validation Error",
          description: "Price must be greater than 0.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const productData = {
        name: formData.name.trim(),
        sku: formData.sku && formData.sku.trim() !== "" ? formData.sku.trim() : undefined,
        categoryId: formData.categoryId && String(formData.categoryId).trim() !== "" ? formData.categoryId : undefined,
        barcode: formData.barcode && formData.barcode.trim() !== "" ? formData.barcode.trim() : undefined,
        cost: formData.cost && formData.cost.toString().trim() !== "" ? parseFloat(formData.cost.toString()) : undefined,
        price: priceValue,
        unit: formData.unit || "pcs",
        stock: parseInt(formData.stock.toString()) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold.toString()) || 0,
        description: formData.description || "",
        isActive: formData.isActive,
      }

      if (product) {
        await productService.update(product.id, productData)
        toast({
          title: "Product Updated",
          description: "Product has been updated successfully.",
        })
      } else {
        await productService.create(productData)
        toast({
          title: "Product Created",
          description: "Product has been created successfully.",
        })
      }
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
              <Label htmlFor="sku">SKU {product ? "(Required)" : "(Auto-generated)"}</Label>
              <Input 
                id="sku" 
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder={product ? "Enter SKU" : "Auto-generated SKU"}
                required={!!product}
              />
              {!product && (
                <p className="text-xs text-muted-foreground">
                  SKU is auto-generated. You can edit it if needed.
                </p>
              )}
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
              <Label htmlFor="barcode">Barcode</Label>
              <Input 
                id="barcode" 
                type="text" 
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost</Label>
              <Input 
                id="cost" 
                type="number" 
                step="0.01" 
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input 
                id="price" 
                type="number" 
                step="0.01" 
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required 
              />
            </div>

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
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-stock">Low Stock Threshold</Label>
              <Input 
                id="min-stock" 
                type="number" 
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
              />
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

