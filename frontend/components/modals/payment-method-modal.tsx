"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils/currency"
import type { Business } from "@/stores/businessStore"
import { CreditCard, Smartphone, Wallet, Receipt, Truck } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { Customer } from "@/lib/services/customerService"
import { useI18n } from "@/contexts/i18n-context"

type PaymentMethod = "cash" | "card" | "mobile" | "tab"

export interface DeliveryInfo {
  delivery_address: string
  delivery_city?: string
  delivery_state?: string
  delivery_postal_code?: string
  delivery_country?: string
  delivery_contact_name?: string
  delivery_contact_phone?: string
  delivery_fee?: number
  delivery_instructions?: string
}

interface PaymentMethodModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  business: Business | null
  selectedCustomer?: Customer | null
  onConfirm?: (method: PaymentMethod, amount?: number, change?: number, deliveryInfo?: DeliveryInfo) => void
  onCancel?: () => void
}

export function PaymentMethodModal({
  open,
  onOpenChange,
  total,
  business,
  selectedCustomer,
  onConfirm,
  onCancel,
}: PaymentMethodModalProps) {
  const { t } = useI18n()
  const [step, setStep] = useState<"delivery" | "payment">("delivery")
  const [isDelivery, setIsDelivery] = useState<boolean>(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [amount, setAmount] = useState<string>("")
  const [change, setChange] = useState<number>(0)
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    delivery_address: "",
    delivery_city: "",
    delivery_state: "",
    delivery_postal_code: "",
    delivery_country: "",
    delivery_contact_name: "",
    delivery_contact_phone: "",
    delivery_fee: 0,
    delivery_instructions: "",
  })
  const amountInputRef = useRef<HTMLInputElement | null>(null)

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setStep("delivery")
      setIsDelivery(false)
      setSelectedMethod(null)
      setAmount("")
      setChange(0)
      // Pre-fill delivery address from customer if available
      if (selectedCustomer?.address) {
        setDeliveryInfo(prev => ({
          ...prev,
          delivery_address: selectedCustomer.address || "",
          delivery_contact_name: selectedCustomer.name || "",
          delivery_contact_phone: selectedCustomer.phone || "",
        }))
      } else {
        setDeliveryInfo({
          delivery_address: "",
          delivery_city: "",
          delivery_state: "",
          delivery_postal_code: "",
          delivery_country: "",
          delivery_contact_name: selectedCustomer?.name || "",
          delivery_contact_phone: selectedCustomer?.phone || "",
          delivery_fee: 0,
          delivery_instructions: "",
        })
      }
    }
  }, [open, selectedCustomer])

  // Calculate change when amount changes
  useEffect(() => {
    if (selectedMethod === "cash" && amount) {
      const amountNum = parseFloat(amount) || 0
      const changeAmount = amountNum >= total ? amountNum - total : 0
      setChange(Math.round(changeAmount * 100) / 100)
    } else {
      setChange(0)
    }
  }, [amount, total, selectedMethod])

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method)
    if (method === "cash") {
      // Auto-focus amount input for cash
      setTimeout(() => {
        amountInputRef.current?.focus()
      }, 100)
    } else {
      setAmount("")
      setChange(0)
    }
  }

  const handleDeliveryInfoChange = (field: keyof DeliveryInfo, value: string | number) => {
    setDeliveryInfo(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const cleaned = value.replace(/[^0-9.]/g, "")
    // Only allow one decimal point
    const parts = cleaned.split(".")
    if (parts.length > 2) {
      return
    }
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return
    }
    setAmount(cleaned)
  }

  const handleQuickAmount = (multiplier: number) => {
    const quickAmount = Math.ceil(total * multiplier)
    setAmount(quickAmount.toFixed(2))
  }

  const handleDeliverySelection = (isDeliveryOrder: boolean) => {
    setIsDelivery(isDeliveryOrder)
    if (isDeliveryOrder) {
      // If delivery, validate address before proceeding
      if (!deliveryInfo.delivery_address.trim()) {
        // Stay on delivery step to fill address
        return
      }
    }
    // Move to payment step
    setStep("payment")
  }

  const handleBackToDelivery = () => {
    setStep("delivery")
  }

  const handleConfirm = () => {
    if (!selectedMethod) return
    if (!onConfirm || typeof onConfirm !== 'function') {
      console.error('onConfirm is not a function')
      return
    }

    if (selectedMethod === "cash") {
      const amountNum = parseFloat(amount) || 0
      if (amountNum < total) {
        return // Amount is less than total, can't proceed
      }
      onConfirm(selectedMethod, amountNum, change, isDelivery ? deliveryInfo : undefined)
    } else if (selectedMethod === "tab") {
      // For credit/tab, amount is the total
      onConfirm(selectedMethod, total, 0, isDelivery ? deliveryInfo : undefined)
    } else {
      // Card or mobile - no change needed
      onConfirm(selectedMethod, total, 0, isDelivery ? deliveryInfo : undefined)
    }
  }

  const canProceedToPayment = () => {
    if (isDelivery) {
      return deliveryInfo.delivery_address.trim().length > 0
    }
    return true
  }

  const canConfirm = () => {
    if (!selectedMethod) return false
    if (selectedMethod === "cash") {
      const amountNum = parseFloat(amount) || 0
      return amountNum >= total
    }
    return true
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {step === "delivery" ? "Order Type" : "Select Payment Method"}
          </DialogTitle>
          <DialogDescription>
            Total: {formatCurrency(total, business)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-y-auto min-h-0">
          {/* Step 1: Delivery/Walk-in Selection */}
          {step === "delivery" && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button
                  variant={!isDelivery ? "default" : "outline"}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => handleDeliverySelection(false)}
                >
                  <Wallet className="h-8 w-8" />
                  <span className="text-sm font-medium">Walk-in</span>
                  <span className="text-xs text-muted-foreground">In-store sale</span>
                </Button>
                <Button
                  variant={isDelivery ? "default" : "outline"}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => handleDeliverySelection(true)}
                >
                  <Truck className="h-8 w-8" />
                  <span className="text-sm font-medium">Delivery</span>
                  <span className="text-xs text-muted-foreground">Home delivery</span>
                </Button>
              </div>

              {/* Delivery Address Form */}
              {isDelivery && (
                <div className="space-y-2.5 pt-2 border-t">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5 mb-2">
                    <div className="text-xs font-medium text-blue-900 dark:text-blue-100">
                      Delivery Information
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                      Enter delivery address and contact information
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="delivery_address" className="text-xs mb-1">Delivery Address *</Label>
                    <Textarea
                      id="delivery_address"
                      placeholder="Street address, building, apartment, etc."
                      value={deliveryInfo.delivery_address}
                      onChange={(e) => handleDeliveryInfoChange("delivery_address", e.target.value)}
                      className="min-h-[60px] text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="delivery_city" className="text-xs mb-1">City</Label>
                      <Input
                        id="delivery_city"
                        placeholder="City"
                        value={deliveryInfo.delivery_city || ""}
                        onChange={(e) => handleDeliveryInfoChange("delivery_city", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="delivery_state" className="text-xs mb-1">State/Province</Label>
                      <Input
                        id="delivery_state"
                        placeholder="State"
                        value={deliveryInfo.delivery_state || ""}
                        onChange={(e) => handleDeliveryInfoChange("delivery_state", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="delivery_postal_code" className="text-xs mb-1">Postal Code</Label>
                      <Input
                        id="delivery_postal_code"
                        placeholder="Postal Code"
                        value={deliveryInfo.delivery_postal_code || ""}
                        onChange={(e) => handleDeliveryInfoChange("delivery_postal_code", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="delivery_country" className="text-xs mb-1">Country</Label>
                      <Input
                        id="delivery_country"
                        placeholder="Country"
                        value={deliveryInfo.delivery_country || ""}
                        onChange={(e) => handleDeliveryInfoChange("delivery_country", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="delivery_contact_name" className="text-xs mb-1">Contact Name</Label>
                      <Input
                        id="delivery_contact_name"
                        placeholder="Contact person name"
                        value={deliveryInfo.delivery_contact_name || ""}
                        onChange={(e) => handleDeliveryInfoChange("delivery_contact_name", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="delivery_contact_phone" className="text-xs mb-1">Contact Phone</Label>
                      <Input
                        id="delivery_contact_phone"
                        placeholder="Phone number"
                        value={deliveryInfo.delivery_contact_phone || ""}
                        onChange={(e) => handleDeliveryInfoChange("delivery_contact_phone", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="delivery_fee" className="text-xs mb-1">Delivery Fee</Label>
                    <Input
                      id="delivery_fee"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={deliveryInfo.delivery_fee || 0}
                      onChange={(e) => handleDeliveryInfoChange("delivery_fee", parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="delivery_instructions" className="text-xs mb-1">Delivery Instructions</Label>
                    <Textarea
                      id="delivery_instructions"
                      placeholder="Special instructions for delivery (optional)"
                      value={deliveryInfo.delivery_instructions || ""}
                      onChange={(e) => handleDeliveryInfoChange("delivery_instructions", e.target.value)}
                      className="min-h-[50px] text-sm"
                    />
                  </div>

                  {!deliveryInfo.delivery_address.trim() && (
                    <div className="text-xs text-destructive text-center py-1">
                      Delivery address is required
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Step 2: Payment Method Selection */}
          {step === "payment" && (
            <>
              <div className="mb-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Order Type:</span>
                  <Badge variant={isDelivery ? "default" : "secondary"} className="text-xs">
                    {isDelivery ? "Delivery" : "Walk-in"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={selectedMethod === "cash" ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => handleMethodSelect("cash")}
                >
                  <Wallet className="h-6 w-6" />
                  <span className="text-sm font-medium">Cash</span>
                </Button>
                <Button
                  variant={selectedMethod === "card" ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => handleMethodSelect("card")}
                >
                  <CreditCard className="h-6 w-6" />
                  <span className="text-sm font-medium">Card</span>
                </Button>
                <Button
                  variant={selectedMethod === "mobile" ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => handleMethodSelect("mobile")}
                >
                  <Smartphone className="h-6 w-6" />
                  <span className="text-sm font-medium">Mobile</span>
                </Button>
                <Button
                  variant={selectedMethod === "tab" ? "default" : "outline"}
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => handleMethodSelect("tab")}
                >
                  <Receipt className="h-6 w-6" />
                  <span className="text-sm font-medium">Credit</span>
                </Button>
              </div>
            </>
          )}

          {/* Cash Amount Input */}
          {step === "payment" && selectedMethod === "cash" && (
            <div className="space-y-3 pt-2 border-t">
              <div>
                <Label htmlFor="amount" className="text-sm">Amount Received</Label>
                <Input
                  id="amount"
                  ref={amountInputRef}
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canConfirm()) {
                      handleConfirm()
                    }
                  }}
                  className="text-2xl font-bold text-center h-12"
                  autoFocus
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(1)}
                  className="text-xs h-8"
                >
                  Exact
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(1.1)}
                  className="text-xs h-8"
                >
                  +10%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(1.2)}
                  className="text-xs h-8"
                >
                  +20%
                </Button>
              </div>

              {/* Change Display */}
              {change > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">Change</div>
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(change, business)}
                  </div>
                </div>
              )}

              {amount && parseFloat(amount) < total && (
                <div className="text-xs text-destructive text-center">
                  Amount is less than total
                </div>
              )}
            </div>
          )}

          {/* Credit/Tab Confirmation */}
          {step === "payment" && selectedMethod === "tab" && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Credit Sale
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Customer will be charged: {formatCurrency(total, business)}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t flex-shrink-0">
          {step === "delivery" ? (
            <>
              <Button variant="outline" onClick={onCancel || (() => onOpenChange(false))}>
                Cancel
              </Button>
              <Button onClick={() => setStep("payment")} disabled={!canProceedToPayment()}>
                Continue to Payment
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleBackToDelivery}>
                Back
              </Button>
              <Button variant="outline" onClick={onCancel || (() => onOpenChange(false))}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={!canConfirm()}>
                Confirm Payment
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

