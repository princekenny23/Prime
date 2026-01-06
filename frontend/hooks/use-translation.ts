"use client"

import { useCallback, useMemo } from "react"
import { useI18n, useTranslation } from "@/contexts/i18n-context"
import type { TranslationNamespace } from "@/lib/i18n"

/**
 * Hook for quick access to common translations
 * Returns commonly used translation functions
 */
export function useCommonTranslations() {
  const { t, locale, setLocale, isReady } = useI18n()
  
  const actions = useMemo(() => ({
    add: t("common.actions.add"),
    edit: t("common.actions.edit"),
    delete: t("common.actions.delete"),
    save: t("common.actions.save"),
    cancel: t("common.actions.cancel"),
    confirm: t("common.actions.confirm"),
    close: t("common.actions.close"),
    back: t("common.actions.back"),
    next: t("common.actions.next"),
    search: t("common.actions.search"),
    filter: t("common.actions.filter"),
    clear: t("common.actions.clear"),
    refresh: t("common.actions.refresh"),
    export: t("common.actions.export"),
    import: t("common.actions.import"),
    print: t("common.actions.print"),
    loading: t("common.actions.loading"),
    saving: t("common.actions.saving"),
    processing: t("common.actions.processing"),
  }), [t])
  
  const messages = useMemo(() => ({
    success: t("common.messages.success"),
    error: t("common.messages.error"),
    warning: t("common.messages.warning"),
    loading: t("common.messages.loading"),
    noData: t("common.messages.no_data"),
    noResults: t("common.messages.no_results"),
    confirmDelete: t("common.messages.confirm_delete"),
    changesSaved: t("common.messages.changes_saved"),
    operationFailed: t("common.messages.operation_failed"),
    requiredField: t("common.messages.required_field"),
  }), [t])
  
  const status = useMemo(() => ({
    active: t("common.status.active"),
    inactive: t("common.status.inactive"),
    pending: t("common.status.pending"),
    completed: t("common.status.completed"),
    cancelled: t("common.status.cancelled"),
    open: t("common.status.open"),
    closed: t("common.status.closed"),
    paid: t("common.status.paid"),
    unpaid: t("common.status.unpaid"),
  }), [t])
  
  return {
    t,
    locale,
    setLocale,
    isReady,
    actions,
    messages,
    status,
  }
}

/**
 * Hook for POS-specific translations
 */
export function usePOSTranslations() {
  const { t, locale, isReady } = useTranslation("pos")
  
  return {
    t,
    locale,
    isReady,
    // Pre-computed common POS strings for performance
    labels: {
      newSale: t("new_sale"),
      cart: t("cart.title"),
      cartEmpty: t("cart.empty"),
      clearCart: t("cart.clear"),
      searchProducts: t("product.search"),
      total: t("pricing.total"),
      subtotal: t("pricing.subtotal"),
      discount: t("pricing.discount"),
      tax: t("pricing.tax"),
      change: t("pricing.change"),
      paymentMethod: t("payment.method"),
      cash: t("payment.cash"),
      card: t("payment.card"),
      mobile: t("payment.mobile"),
      credit: t("payment.credit"),
      completeSale: t("payment.complete"),
      receipt: t("receipt.title"),
      printReceipt: t("receipt.print"),
    },
  }
}

/**
 * Hook for validation translations
 */
export function useValidationTranslations() {
  const { t, locale } = useTranslation("validation")
  
  const validate = useCallback((key: string, params?: Record<string, string | number>) => {
    return t(key, params)
  }, [t])
  
  return {
    validate,
    locale,
    required: (field?: string) => field ? t(`required.${field}`) : t("required.field"),
    invalid: (type?: string) => type ? t(`invalid.${type}`) : t("messages.check_input"),
    min: (min: number) => t("range.min", { min }),
    max: (max: number) => t("range.max", { max }),
    between: (min: number, max: number) => t("range.between", { min, max }),
    minLength: (min: number) => t("length.min", { min }),
    maxLength: (max: number) => t("length.max", { max }),
    insufficientStock: t("stock.insufficient"),
    insufficientPayment: t("payment.insufficient"),
    creditExceeded: t("payment.credit_exceeded"),
    shiftRequired: t("shift.required"),
  }
}

/**
 * Hook for report translations
 */
export function useReportTranslations() {
  const { t, locale, isReady } = useTranslation("reports")
  
  return {
    t,
    locale,
    isReady,
    titles: {
      dailySales: t("daily_sales.title"),
      topProducts: t("top_products.title"),
      cashSummary: t("cash_summary.title"),
      shiftSummary: t("shift_summary.title"),
      profitLoss: t("profit_loss.title"),
    },
  }
}

// Re-export for convenience
export { useI18n, useTranslation }
export type { TranslationNamespace }

