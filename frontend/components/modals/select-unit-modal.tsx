"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Package, Check } from "lucide-react"
import { useState } from "react"
import { formatCurrency } from "@/lib/utils/currency"
import { useBusinessStore } from "@/stores/businessStore"

interface ProductUnit {
  id: string | number
  unit_name: string
  conversion_factor: number | string
  retail_price: number | string
  wholesale_price?: number | string
  is_active?: boolean
  stock_in_unit?: number
}

interface SelectUnitModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  saleType?: "retail" | "wholesale"
  onSelect: (unit: ProductUnit) => void
}

export function SelectUnitModal({
  open,
  onOpenChange,
  product,
  saleType = "retail",
  onSelect,
}: SelectUnitModalProps) {
  const { currentBusiness } = useBusinessStore()
  const [selectedUnit, setSelectedUnit] = useState<ProductUnit | null>(null)

  // Get selling units from product
  const sellingUnits = product?.selling_units || []
  const activeUnits = sellingUnits.filter((u: ProductUnit) => u.is_active !== false)

  // Calculate stock in unit
  const getStockInUnit = (unit: ProductUnit): number => {
    const baseStock = product?.stock || 0
    if (!unit.conversion_factor) return baseStock
    const factor = parseFloat(String(unit.conversion_factor)) || 1
    return Math.floor(baseStock / factor)
  }

  // Get price for unit based on sale type
  const getUnitPrice = (unit: ProductUnit): number => {
    if (saleType === "wholesale" && unit.wholesale_price) {
      return parseFloat(String(unit.wholesale_price)) || 0
    }
    return parseFloat(String(unit.retail_price)) || 0
  }

  const handleConfirm = () => {
    // If no unit selected, use base unit (null means base unit)
    onSelect(selectedUnit || null)
    onOpenChange(false)
    setSelectedUnit(null)
  }

  const handleBaseUnitSelect = () => {
    // Pass null to indicate base unit
    onSelect(null)
    onOpenChange(false)
    setSelectedUnit(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Unit</DialogTitle>
          <DialogDescription>
            Choose a selling unit for {product?.name}
          </DialogDescription>
        </DialogHeader>

        {activeUnits.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No active units available</p>
            <p className="text-xs text-muted-foreground mt-2">
              Product will use base unit: {product?.unit || "pcs"}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {/* Base Unit Option */}
              <div
                className={`
                  p-4 border rounded-lg cursor-pointer transition-all
                  ${!selectedUnit ? "border-primary bg-primary/5" : "hover:border-primary/50"}
                `}
                onClick={handleBaseUnitSelect}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{product?.unit || "pcs"} (Base Unit)</span>
                      {!selectedUnit && (
                        <Badge variant="default" className="ml-2">
                          <Check className="h-3 w-3 mr-1" />
                          Selected
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        Stock: {product?.stock || 0} {product?.unit || "pcs"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>
                        Price: {formatCurrency(
                          saleType === "wholesale" 
                            ? (product?.wholesale_price || product?.price || 0)
                            : (product?.price || product?.retail_price || 0),
                          currentBusiness
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selling Units */}
              {activeUnits.map((unit: ProductUnit) => {
                const isSelected = selectedUnit?.id === unit.id
                const stockInUnit = getStockInUnit(unit)
                const unitPrice = getUnitPrice(unit)
                const isOutOfStock = stockInUnit <= 0

                return (
                  <div
                    key={unit.id}
                    className={`
                      p-4 border rounded-lg cursor-pointer transition-all
                      ${isSelected ? "border-primary bg-primary/5" : "hover:border-primary/50"}
                      ${isOutOfStock ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                    onClick={() => !isOutOfStock && setSelectedUnit(unit)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{unit.unit_name}</span>
                          {isSelected && (
                            <Badge variant="default" className="ml-2">
                              <Check className="h-3 w-3 mr-1" />
                              Selected
                            </Badge>
                          )}
                          <Badge 
                            variant={stockInUnit <= 0 ? "outline" : "secondary"}
                            className={stockInUnit <= 0 ? "text-orange-600 border-orange-600" : ""}
                          >
                            Stock: {stockInUnit} {unit.unit_name}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>
                            Price: {formatCurrency(unitPrice, currentBusiness)}
                          </div>
                          <div className="text-xs">
                            = {unit.conversion_factor} {product?.unit || "pcs"}
                          </div>
                        </div>
                      </div>
                    </div>
                    {isOutOfStock && (
                      <div className="mt-2 text-xs text-destructive">
                        Out of stock
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => {
            onOpenChange(false)
            setSelectedUnit(null)
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
          >
            Add to Cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

