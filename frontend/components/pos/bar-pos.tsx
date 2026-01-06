"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { usePOSStore } from "@/stores/posStore"
import { useBusinessStore } from "@/stores/businessStore"
import { productService } from "@/lib/services/productService"
import { formatCurrency } from "@/lib/utils/currency"
import type { Product } from "@/lib/types"
import { Search, Wine, Receipt, Plus, Minus, X, CreditCard, Smartphone, DollarSign, Lock, RefreshCw } from "lucide-react"
import { CloseRegisterModal } from "@/components/modals/close-register-modal"
import { ReceiptPreviewModal } from "@/components/modals/receipt-preview-modal"
import { SaleDiscountModal, type SaleDiscount } from "@/components/modals/sale-discount-modal"
import { useShift } from "@/contexts/shift-context"
import { useTenant } from "@/contexts/tenant-context"
import { saleService } from "@/lib/services/saleService"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

const drinkCategories = [
  { id: "beer", name: "Beer", icon: Wine },
  { id: "spirits", name: "Spirits", icon: Wine },
  { id: "wine", name: "Wine", icon: Wine },
  { id: "soft", name: "Soft Drinks", icon: Wine },
]

const quickAmounts = [5, 10, 20, 50, 100]

export function BarPOS() {
  const { currentBusiness, currentOutlet } = useBusinessStore()
  const { currentOutlet: tenantOutlet } = useTenant()
  const { cart, addToCart, updateCartItem, removeFromCart, clearCart } = usePOSStore()
  const { activeShift } = useShift()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showCloseRegister, setShowCloseRegister] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [showSaleDiscount, setShowSaleDiscount] = useState(false)
  const [saleDiscount, setSaleDiscount] = useState<SaleDiscount | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!currentBusiness) {
        setIsLoadingProducts(false)
        return
      }
      
      setIsLoadingProducts(true)
      setProductsError(null)
      
      try {
        const response = await productService.list({ is_active: true })
        const productsList = Array.isArray(response) 
          ? response 
          : (response.results || [])
        setProducts(productsList)
      } catch (error: any) {
        console.error("Failed to load products:", error)
        setProductsError("Failed to load products. Please refresh the page.")
        setProducts([])
      } finally {
        setIsLoadingProducts(false)
      }
    }
    
    loadData()
  }, [currentBusiness])

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch && product.isActive
  })

  const cartSubtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  
  // Calculate discount amount
  const discountAmount = saleDiscount
    ? saleDiscount.type === "percentage"
      ? (cartSubtotal * saleDiscount.value) / 100
      : saleDiscount.value
    : 0
  
  const cartTotal = cartSubtotal - discountAmount

  const handleAddToCart = (product: typeof products[0]) => {
    addToCart({
      id: `cart_${Date.now()}_${Math.random()}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    })
  }

  const handleQuickAdd = (product: typeof products[0], quantity: number) => {
    addToCart({
      id: `cart_${Date.now()}_${Math.random()}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
    })
  }

  const handleQuantityChange = (itemId: string, change: number) => {
    const item = cart.find(i => i.id === itemId)
    if (item) {
      const newQuantity = Math.max(1, item.quantity + change)
      updateCartItem(itemId, { quantity: newQuantity })
    }
  }

  const handleProcessPayment = async () => {
    // Validation
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to cart before processing payment.",
        variant: "destructive",
      })
      return
    }

    const outlet = tenantOutlet || currentOutlet
    if (!outlet) {
      toast({
        title: "Outlet not selected",
        description: "Please select an outlet before processing payment.",
        variant: "destructive",
      })
      return
    }

    if (!activeShift) {
      toast({
        title: "No active shift",
        description: "Please start a shift before processing payments.",
        variant: "destructive",
      })
      return
    }

    setIsProcessingPayment(true)

    try {
      // Calculate totals - round to 2 decimal places to avoid floating point precision issues
      const subtotal = Math.round(cartSubtotal * 100) / 100
      const discount = Math.round(discountAmount * 100) / 100
      const tax = 0 // TODO: Calculate tax if needed
      const total = Math.round((subtotal - discount + tax) * 100) / 100

      // Transform cart items to backend format
      const items_data = cart.map((item) => {
        return {
          product_id: item.productId,
          variation_id: (item as any).variationId || undefined,
          unit_id: (item as any).unitId || undefined,
          quantity: item.quantity,
          price: Math.round(item.price * 100) / 100, // Round price to 2 decimal places
          notes: item.notes || "",
        }
      })

      // Create sale data - ensure all decimal values are rounded to 2 decimal places
      const saleData = {
        outlet: outlet.id,
        shift: activeShift.id,
        customer: undefined,
        items_data: items_data,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        discount: Math.round(discount * 100) / 100,
        discount_type: saleDiscount?.type,
        discount_reason: saleDiscount?.reason,
        total: Math.round(total * 100) / 100,
        payment_method: "cash" as const,
        notes: "",
      }

      // Call backend API
      const sale = await saleService.create(saleData)

      // Show success message
      toast({
        title: "Sale completed successfully",
        description: `Receipt #${sale._raw?.receipt_number || sale.id}`,
      })

      // Dispatch event to notify other components (e.g., sales history page)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sale-completed', { 
          detail: { saleId: sale.id, receiptNumber: sale._raw?.receipt_number || sale.id }
        }))
      }

      // Prepare receipt data for modal
      const receiptCartItems = cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        discount: 0, // TODO: Calculate from item discounts if implemented
        total: item.total,
      }))

      setReceiptData({
        cart: receiptCartItems,
        subtotal: subtotal,
        discount: discount,
        tax: tax,
        total: total,
        sale: sale,
        discountReason: saleDiscount?.reason,
      })

      // Clear cart and discount
      clearCart()
      setSaleDiscount(null)

      // Show receipt modal
      setShowReceipt(true)
    } catch (error: any) {
      console.error("Checkout error:", error)
      toast({
        title: "Payment failed",
        description: error.message || "An error occurred while processing the payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please select a business first</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bar POS</h1>
            <p className="text-sm text-muted-foreground">{currentBusiness.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <Button variant="outline" onClick={clearCart}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
            {cart.length > 0 && (
              <Button 
                variant={saleDiscount ? "default" : "outline"} 
                onClick={() => setShowSaleDiscount(true)}
              >
                {saleDiscount ? "Discount Applied" : "Apply Discount"}
              </Button>
            )}
            {activeShift && (
              <Button variant="outline" onClick={() => setShowCloseRegister(true)}>
                <Lock className="h-4 w-4 mr-2" />
                Close Register
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content - Drinks */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category Tabs */}
          <div className="border-b p-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                All
              </Button>
              {drinkCategories.map((category) => {
                const Icon = category.icon
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {category.name}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drinks..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Product Grid with Quick Add */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoadingProducts ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            ) : productsError ? (
              <div className="flex flex-col items-center justify-center h-64">
                <p className="text-destructive mb-2">{productsError}</p>
                <Button variant="outline" onClick={async () => {
                  setProductsError(null)
                  setIsLoadingProducts(true)
                  try {
                    const response = await productService.list({ is_active: true })
                    const productsList = Array.isArray(response) 
                      ? response 
                      : (response.results || [])
                    setProducts(productsList)
                  } catch (error: any) {
                    console.error("Failed to load products:", error)
                    setProductsError("Failed to load products. Please refresh the page.")
                    setProducts([])
                  } finally {
                    setIsLoadingProducts(false)
                  }
                }}>
                  Retry
                </Button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Wine className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                        <Wine className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm mb-1">{product.name}</h3>
                        <p className="font-bold text-primary mb-3">
                          {formatCurrency(product.price, currentBusiness)}
                        </p>
                        
                        {/* Quick Add Buttons */}
                        <div className="flex gap-1 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={() => handleAddToCart(product)}
                          >
                            +1
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={() => handleQuickAdd(product, 2)}
                          >
                            +2
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={() => handleQuickAdd(product, 4)}
                          >
                            +4
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart and Payment Sidebar */}
        <div className="w-96 border-l bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Cart ({cartItemCount})</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wine className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Cart is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.price, currentBusiness)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleQuantityChange(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleQuantityChange(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <p className="font-bold">
                        {formatCurrency(item.total, currentBusiness)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Payment Section */}
          {cart.length > 0 && (
            <div className="border-t p-4 space-y-3">
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(cartSubtotal, currentBusiness)}</span>
                </div>
                {saleDiscount && discountAmount > 0 && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Discount:</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        -{formatCurrency(discountAmount, currentBusiness)}
                      </span>
                    </div>
                    {saleDiscount.reason && (
                      <div className="text-xs text-muted-foreground italic">
                        Reason: {saleDiscount.reason}
                      </div>
                    )}
                  </>
                )}
                <div className="border-t pt-2 flex items-center justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(cartTotal, currentBusiness)}</span>
                </div>
              </div>

              {/* Quick payment buttons removed - all payments go through PaymentModal for proper recording */}

              <Button
                className="w-full"
                size="lg"
                onClick={handleProcessPayment}
                disabled={isProcessingPayment || cart.length === 0}
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Receipt className="mr-2 h-5 w-5" />
                    Process Payment
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SaleDiscountModal
        open={showSaleDiscount}
        onOpenChange={setShowSaleDiscount}
        subtotal={cartSubtotal}
        currentDiscount={saleDiscount}
        business={currentBusiness}
        onApply={(discount) => {
          setSaleDiscount(discount)
        }}
        onRemove={() => {
          setSaleDiscount(null)
        }}
      />
      <CloseRegisterModal
        open={showCloseRegister}
        onOpenChange={setShowCloseRegister}
      />
      {receiptData && (
        <ReceiptPreviewModal
          open={showReceipt}
          onOpenChange={setShowReceipt}
          cart={receiptData.cart}
          subtotal={receiptData.subtotal}
          discount={receiptData.discount}
          tax={receiptData.tax}
          total={receiptData.total}
          discountReason={receiptData.discountReason}
          onPrint={() => {
            setShowReceipt(false)
            setReceiptData(null)
          }}
          onSkip={() => {
            setShowReceipt(false)
            setReceiptData(null)
          }}
        />
      )}
    </div>
  )
}

