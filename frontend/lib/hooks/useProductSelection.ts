import { useState } from "react"
import type { ProductSelectionResult } from "@/components/modals/product-selection-orchestrator"

/**
 * Product Selection Hook
 * 
 * Provides a simple interface to use the product selection orchestrator
 * 
 * Example usage:
 * ```tsx
 * const { openProductSelection, ProductSelectionModal } = useProductSelection({
 *   onComplete: (result) => {
 *     console.log("Selected:", result.product.name)
 *     if (result.variation) console.log("Variation:", result.variation.name)
 *     if (result.unit) console.log("Unit:", result.unit.unit_name)
 *   }
 * })
 * 
 * return (
 *   <>
 *     <button onClick={openProductSelection}>Add Product</button>
 *     <ProductSelectionModal />
 *   </>
 * )
 * ```
 */
export function useProductSelection(config: {
  onComplete: (result: ProductSelectionResult) => void
  outletId?: string
  saleType?: "retail" | "wholesale"
}) {
  const [isOpen, setIsOpen] = useState(false)

  const openProductSelection = () => {
    setIsOpen(true)
  }

  const closeProductSelection = () => {
    setIsOpen(false)
  }

  return {
    isOpen,
    openProductSelection,
    closeProductSelection,
    setIsOpen,
    config,
  }
}
