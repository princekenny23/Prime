"use client"

import { useState, useEffect } from "react"
import { SelectProductModal } from "./select-product-modal"
import { SelectVariationModal } from "./select-variation-modal"
import { SelectUnitModal } from "./select-unit-modal"
import type { Product } from "@/lib/types"
import type { ItemVariation } from "@/lib/services/productService"

/**
 * Product Selection Result
 * Contains the complete selection made by the user
 */
export interface ProductSelectionResult {
  product: Product
  variation?: ItemVariation | null
  unit?: any | null
  quantity?: number
}

/**
 * Product Selection Step
 * Tracks which modal should be displayed
 */
type SelectionStep = "product" | "variation" | "unit" | "complete"

interface ProductSelectionOrchestratorProps {
  /** Whether the orchestrator is active */
  open: boolean
  /** Callback to close the orchestrator */
  onOpenChange: (open: boolean) => void
  /** Callback when final selection is made */
  onComplete: (result: ProductSelectionResult) => void
  /** Optional outlet ID for filtering */
  outletId?: string
  /** Sale type for pricing (retail/wholesale) */
  saleType?: "retail" | "wholesale"
  /** Show quantity input after selection */
  showQuantityInput?: boolean
}

/**
 * Product Selection Orchestrator
 * 
 * Manages the intelligent flow between three modals:
 * 1. Select Product (catalog browsing)
 * 2. Select Variation (if product has variations)
 * 3. Select Unit (if product/variation has selling units)
 * 
 * Flow Logic:
 * - Simple products (no variations, no units) → Add directly
 * - Products with 1 variation only → Auto-select, skip variation modal
 * - Products with variations → Show variation modal
 * - Products/variations with selling units → Show unit modal
 * 
 * Features:
 * - Breadcrumb navigation
 * - Back button support
 * - State preservation
 * - Auto-skip unnecessary steps
 */
export function ProductSelectionOrchestrator({
  open,
  onOpenChange,
  onComplete,
  outletId,
  saleType = "retail",
  showQuantityInput = false,
}: ProductSelectionOrchestratorProps) {
  // Current step in the selection flow
  const [currentStep, setCurrentStep] = useState<SelectionStep>("product")
  
  // Selection state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVariation, setSelectedVariation] = useState<ItemVariation | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null)

  // Reset state when orchestrator closes
  useEffect(() => {
    if (!open) {
      setCurrentStep("product")
      setSelectedProduct(null)
      setSelectedVariation(null)
      setSelectedUnit(null)
    }
  }, [open])

  /**
   * Step 1: Product Selected
   * Determines next step based on product configuration
   */
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)

    // Check if product has variations
    const hasVariations = product.variations && product.variations.length > 0

    // Check if product has selling units (from backend)
    const hasSellingUnits = (product as any).selling_units && 
                           (product as any).selling_units.filter((u: any) => u.is_active !== false).length > 0

    // Decision tree for next step
    if (hasVariations) {
      // Product has variations → go to variation selection
      setCurrentStep("variation")
    } else if (hasSellingUnits) {
      // No variations but has units → go to unit selection
      setCurrentStep("unit")
    } else {
      // Simple product (no variations, no units) → complete immediately
      completeSelection(product, null, null)
    }
  }

  /**
   * Step 2: Variation Selected
   * Determines if unit selection is needed
   */
  const handleVariationSelect = (variation: ItemVariation) => {
    setSelectedVariation(variation)

    // Check if variation has selling units
    const product = selectedProduct
    const hasSellingUnits = (product as any)?.selling_units && 
                           (product as any).selling_units.filter((u: any) => u.is_active !== false).length > 0

    if (hasSellingUnits) {
      // Has units → show unit selection
      setCurrentStep("unit")
    } else {
      // No units → complete with variation only
      completeSelection(product!, variation, null)
    }
  }

  /**
   * Step 3: Unit Selected
   * Completes the selection flow
   */
  const handleUnitSelect = (unit: any) => {
    setSelectedUnit(unit)
    completeSelection(selectedProduct!, selectedVariation, unit)
  }

  /**
   * Complete Selection
   * Packages the result and calls onComplete callback
   */
  const completeSelection = (
    product: Product,
    variation: ItemVariation | null,
    unit: any | null
  ) => {
    const result: ProductSelectionResult = {
      product,
      variation,
      unit,
      quantity: 1, // Default quantity, can be modified by parent
    }

    onComplete(result)
    onOpenChange(false) // Close the orchestrator
  }

  /**
   * Back Navigation
   * Allows user to go back to previous step
   */
  const handleBack = () => {
    switch (currentStep) {
      case "variation":
        setCurrentStep("product")
        setSelectedVariation(null)
        break
      case "unit":
        // If we have a variation, go back to variation modal
        // Otherwise, go back to product modal
        if (selectedVariation) {
          setCurrentStep("variation")
        } else {
          setCurrentStep("product")
        }
        setSelectedUnit(null)
        break
    }
  }

  /**
   * Cancel/Close
   * Closes all modals and resets state
   */
  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <>
      {/* Step 1: Product Selection Modal */}
      <SelectProductModal
        open={open && currentStep === "product"}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleCancel()
        }}
        onSelect={handleProductSelect}
        outletId={outletId}
      />

      {/* Step 2: Variation Selection Modal */}
      {selectedProduct && (
        <SelectVariationModal
          open={open && currentStep === "variation"}
          onOpenChange={(isOpen) => {
            if (!isOpen) handleBack()
          }}
          productId={selectedProduct.id?.toString() || ""}
          productName={selectedProduct.name || ""}
          onSelect={handleVariationSelect}
          saleType={saleType}
        />
      )}

      {/* Step 3: Unit Selection Modal */}
      {selectedProduct && (
        <SelectUnitModal
          open={open && currentStep === "unit"}
          onOpenChange={(isOpen) => {
            if (!isOpen) handleBack()
          }}
          product={selectedProduct}
          saleType={saleType}
          onSelect={handleUnitSelect}
        />
      )}
    </>
  )
}
