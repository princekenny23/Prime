"use client"

/**
 * POS Translation Wrapper Components
 * 
 * These components provide translated strings for the POS interface.
 * They use the i18n system for production-ready multi-language support.
 */

import { useMemo } from "react"
import { useI18n, useTranslation } from "@/contexts/i18n-context"
import type { Locale } from "@/lib/i18n"

/**
 * Hook that provides all POS-related translations
 * Pre-computes commonly used strings for performance
 */
export function usePOSLabels() {
  const { t, locale, isReady } = useI18n()
  
  // Pre-compute all POS labels for performance
  const labels = useMemo(() => ({
    // Header
    title: t("pos.title"),
    terminal: t("pos.title"),
    
    // Sale Types
    retail: t("pos.pricing.retail"),
    wholesale: t("pos.pricing.wholesale"),
    
    // Cart
    cart: t("pos.cart.title"),
    cartEmpty: t("pos.cart.empty"),
    cartEmptyHint: t("pos.cart.empty_hint"),
    cartItems: t("pos.cart.items"),
    clearCart: t("pos.cart.clear"),
    clearCartConfirm: t("pos.cart.clear_confirm"),
    
    // Products
    searchProducts: t("pos.product.search"),
    searchByName: t("pos.product.search_by_name"),
    scanBarcode: t("pos.product.scan_barcode"),
    noProducts: t("pos.product.no_products"),
    outOfStock: t("pos.product.out_of_stock"),
    lowStock: t("pos.product.low_stock"),
    selectVariation: t("pos.product.select_variation"),
    selectUnit: t("pos.product.select_unit"),
    
    // Pricing
    price: t("pos.pricing.price"),
    unitPrice: t("pos.pricing.unit_price"),
    quantity: t("pos.pricing.quantity"),
    subtotal: t("pos.pricing.subtotal"),
    discount: t("pos.pricing.discount"),
    tax: t("pos.pricing.tax"),
    total: t("pos.pricing.total"),
    change: t("pos.pricing.change"),
    
    // Payment
    payment: t("pos.payment.title"),
    paymentMethod: t("pos.payment.method"),
    cash: t("pos.payment.cash"),
    card: t("pos.payment.card"),
    mobile: t("pos.payment.mobile"),
    credit: t("pos.payment.credit"),
    splitPayment: t("pos.payment.split"),
    amount: t("pos.payment.amount"),
    amountReceived: t("pos.payment.received"),
    amountDue: t("pos.payment.due"),
    balance: t("pos.payment.balance"),
    tender: t("pos.payment.tender"),
    completeSale: t("pos.payment.complete"),
    processingPayment: t("pos.payment.processing"),
    insufficientPayment: t("pos.payment.insufficient"),
    
    // Customer
    selectCustomer: t("pos.customer.select"),
    addCustomer: t("pos.customer.add"),
    walkIn: t("pos.customer.walk_in"),
    searchCustomer: t("pos.customer.search"),
    creditSale: t("pos.customer.credit_sale"),
    creditLimit: t("pos.customer.credit_limit"),
    availableCredit: t("pos.customer.available_credit"),
    outstandingBalance: t("pos.customer.outstanding"),
    
    // Shift
    shift: t("pos.shift.title"),
    currentShift: t("pos.shift.current"),
    selectShift: t("pos.shift.select"),
    noActiveShift: t("pos.shift.no_active"),
    startShift: t("pos.shift.start"),
    endShift: t("pos.shift.end"),
    openingCash: t("pos.shift.opening_cash"),
    closingCash: t("pos.shift.closing_cash"),
    cashInDrawer: t("pos.shift.cash_in_drawer"),
    shiftRequired: t("pos.shift.required"),
    
    // Receipt
    receipt: t("pos.receipt.title"),
    receiptNumber: t("pos.receipt.number"),
    printReceipt: t("pos.receipt.print"),
    emailReceipt: t("pos.receipt.email"),
    newSale: t("pos.receipt.new_sale"),
    thankYou: t("pos.receipt.thank_you"),
    visitAgain: t("pos.receipt.visit_again"),
    
    // Actions
    hold: t("pos.hold.title"),
    holdSale: t("pos.hold.save"),
    retrieveSale: t("pos.hold.retrieve"),
    heldSales: t("pos.hold.held_sales"),
    noHeldSales: t("pos.hold.no_held"),
    
    // Refund
    refund: t("pos.refund.title"),
    processRefund: t("pos.refund.process"),
    refundReason: t("pos.refund.reason"),
    refundAmount: t("pos.refund.amount"),
    confirmRefund: t("pos.refund.confirm"),
    
    // Quick Actions
    openDrawer: t("pos.quick_actions.open_drawer"),
    addDiscount: t("pos.quick_actions.add_discount"),
    addNote: t("pos.quick_actions.add_note"),
    voidItem: t("pos.quick_actions.void_item"),
    voidSale: t("pos.quick_actions.void_sale"),
    reprint: t("pos.quick_actions.reprint"),
    
    // Common Actions
    add: t("common.actions.add"),
    edit: t("common.actions.edit"),
    delete: t("common.actions.delete"),
    save: t("common.actions.save"),
    cancel: t("common.actions.cancel"),
    confirm: t("common.actions.confirm"),
    close: t("common.actions.close"),
    back: t("common.actions.back"),
    search: t("common.actions.search"),
    clear: t("common.actions.clear"),
    loading: t("common.actions.loading"),
    processing: t("common.actions.processing"),
    remove: t("common.actions.delete"),
    
    // Messages
    saleComplete: t("pos.messages.sale_complete"),
    saleFailed: t("pos.messages.sale_failed"),
    cartCleared: t("pos.messages.cart_cleared"),
    productAdded: t("pos.messages.product_added"),
    productRemoved: t("pos.messages.product_removed"),
    quantityUpdated: t("pos.messages.quantity_updated"),
    paymentReceived: t("pos.messages.payment_received"),
    refundProcessed: t("pos.messages.refund_processed"),
    stockInsufficient: t("pos.messages.stock_insufficient"),
    creditExceeded: t("pos.messages.credit_exceeded"),
    
    // Return
    return: t("pos.refund.title"), // Using refund as return
    
    // Quick select
    quickSelect: locale === "ny" ? "Sankhani Mwachangu" : "Quick Select",
    baseUnit: locale === "ny" ? "Umo Woyamba" : "Base Unit",
    addToCart: locale === "ny" ? "Onjezani ku Dengu" : "Add to Cart",
    items: locale === "ny" ? "zinthu" : "items",
    each: locale === "ny" ? "iliyonse" : "each",
    processPayment: locale === "ny" ? "Lipira" : "Process Payment",
  }), [t, locale])
  
  return { labels, locale, isReady }
}

/**
 * Hook for POS validation messages
 */
export function usePOSValidation() {
  const { t, locale } = useI18n()
  
  const validation = useMemo(() => ({
    cartEmpty: t("pos.messages.cart_empty") || t("pos.cart.empty"),
    noOutlet: locale === "ny" ? "Chonde sankhani outlet" : "Please select an outlet",
    noShift: t("pos.shift.required"),
    insufficientPayment: t("pos.payment.insufficient"),
    creditExceeded: t("pos.messages.credit_exceeded"),
    stockInsufficient: t("pos.messages.stock_insufficient"),
  }), [t, locale])
  
  return validation
}

/**
 * Hook for toast/alert messages in POS
 */
export function usePOSMessages() {
  const { t, locale } = useI18n()
  
  const messages = useMemo(() => ({
    // Success
    saleComplete: t("pos.messages.sale_complete"),
    paymentReceived: t("pos.messages.payment_received"),
    refundProcessed: t("pos.messages.refund_processed"),
    cartCleared: t("pos.messages.cart_cleared"),
    productAdded: t("pos.messages.product_added"),
    
    // Errors
    saleFailed: t("pos.messages.sale_failed"),
    stockInsufficient: t("pos.messages.stock_insufficient"),
    creditExceeded: t("pos.messages.credit_exceeded"),
    shiftRequired: t("pos.messages.shift_required"),
    
    // Info
    loading: t("common.actions.loading"),
    processing: t("common.actions.processing"),
    
    // Coming soon
    comingSoon: locale === "ny" ? "Ikubwera posachedwa" : "Coming soon",
    returnComingSoon: locale === "ny" ? "Kubweza - ikubwera posachedwa" : "Return functionality coming soon",
    refundComingSoon: locale === "ny" ? "Kubweza ndalama - ikubwera posachedwa" : "Refund functionality coming soon",
  }), [t, locale])
  
  return messages
}

/**
 * Hook for shift-related translations
 */
export function useShiftLabels() {
  const { t, locale, isReady } = useI18n()
  
  const labels = useMemo(() => ({
    title: t("shifts.title"),
    current: t("shifts.current.title"),
    noActive: t("shifts.current.no_active"),
    startPrompt: t("shifts.current.start_prompt"),
    
    // Start shift
    startTitle: t("shifts.start.title"),
    selectTill: t("shifts.start.select_till"),
    openingCash: t("shifts.start.opening_cash"),
    float: t("shifts.start.float"),
    notes: t("shifts.start.notes"),
    startButton: t("shifts.start.start_button"),
    
    // Close shift
    closeTitle: t("shifts.close.title"),
    closingCash: t("shifts.close.closing_cash"),
    countCash: t("shifts.close.count_cash"),
    expected: t("shifts.close.expected"),
    actual: t("shifts.close.actual"),
    difference: t("shifts.close.difference"),
    closeButton: t("shifts.close.close_button"),
    
    // Summary
    summary: t("shifts.summary.title"),
    outlet: t("shifts.summary.outlet"),
    till: t("shifts.summary.till"),
    cashier: t("shifts.summary.cashier"),
    date: t("shifts.summary.date"),
    startTime: t("shifts.summary.start_time"),
    endTime: t("shifts.summary.end_time"),
    duration: t("shifts.summary.duration"),
    totalSales: t("shifts.summary.total_sales"),
    cashSales: t("shifts.summary.cash_sales"),
    cardSales: t("shifts.summary.card_sales"),
    creditSales: t("shifts.summary.credit_sales"),
    refunds: t("shifts.summary.refunds"),
    netSales: t("shifts.summary.net_sales"),
    
    // Status
    statusOpen: t("shifts.status.open"),
    statusClosed: t("shifts.status.closed"),
    
    // Messages
    started: t("shifts.messages.started"),
    closed: t("shifts.messages.closed"),
    alreadyOpen: t("shifts.messages.already_open"),
    closeRequired: t("shifts.messages.close_required"),
    cashAdded: t("shifts.messages.cash_added"),
    cashDropped: t("shifts.messages.cash_dropped"),
  }), [t, locale])
  
  return { labels, locale, isReady }
}

/**
 * Format payment method name based on locale
 */
export function usePaymentMethodLabel() {
  const { t, locale } = useI18n()
  
  const getLabel = (method: string): string => {
    switch (method.toLowerCase()) {
      case "cash":
        return t("pos.payment.cash")
      case "card":
        return t("pos.payment.card")
      case "mobile":
        return t("pos.payment.mobile")
      case "credit":
      case "tab":
        return t("pos.payment.credit")
      case "split":
        return t("pos.payment.split")
      default:
        return method
    }
  }
  
  return { getLabel, locale }
}

export default usePOSLabels

