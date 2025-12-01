// Hook for formatting currency with current business
"use client"

import { useBusinessStore } from "@/stores/businessStore"
import { formatCurrency } from "@/lib/utils/currency"

/**
 * Hook version of formatCurrency for use in React components
 * Automatically uses current business from store
 */
export function useFormatCurrency() {
  const { currentBusiness } = useBusinessStore()
  
  return (amount: number, options?: { showSymbol?: boolean; decimals?: number }) => {
    return formatCurrency(amount, currentBusiness, options)
  }
}

