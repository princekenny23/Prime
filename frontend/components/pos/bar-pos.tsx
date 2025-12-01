"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { usePOSStore } from "@/stores/posStore"
import { useBusinessStore } from "@/stores/businessStore"
import { getProducts } from "@/lib/mockApi"
import { productService } from "@/lib/services/productService"
import { useRealAPI } from "@/lib/utils/api-config"
import { formatCurrency } from "@/lib/utils/currency"
import { Search, Wine, Receipt, Plus, Minus, X, CreditCard, Smartphone, DollarSign, Lock } from "lucide-react"
import { PaymentModal } from "@/components/modals/payment-modal"
import { CloseRegisterModal } from "@/components/modals/close-register-modal"
import { ReceiptPreviewModal } from "@/components/modals/receipt-preview-modal"
import { useShift } from "@/contexts/shift-context"
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
  const { cart, addToCart, updateCartItem, removeFromCart, clearCart } = usePOSStore()
  const { activeShift } = useShift()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showPayment, setShowPayment] = useState(false)
  const [showCloseRegister, setShowCloseRegister] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const loadData = async () => {
      if (!currentBusiness) return
      
      try {
        if (useRealAPI()) {
          const productsData = await productService.list({ is_active: true })
          setProducts(productsData.results || productsData)
        } else {
          const businessProducts = getProducts(currentBusiness.id)
          if (businessProducts.length > 0) {
            setProducts(businessProducts)
          }
        }
      } catch (error) {
        console.error("Failed to load products:", error)
        const businessProducts = getProducts(currentBusiness.id)
        if (businessProducts.length > 0) {
          setProducts(businessProducts)
        }
      }
    }
    
    loadData()
  }, [currentBusiness])

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch && product.isActive
  })

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

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

  const handleQuickPayment = (method: "cash" | "card" | "mobile") => {
    if (cart.length === 0) return
    // Process quick payment
    alert(`Processing ${method} payment for ${formatCurrency(cartTotal, currentBusiness)}`)
    clearCart()
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
              <div className="flex items-center justify-between text-lg font-bold mb-4">
                <span>Total:</span>
                <span>{formatCurrency(cartTotal, currentBusiness)}</span>
              </div>

              {/* Quick Payment Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={() => handleQuickPayment("cash")}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Cash
                </Button>
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={() => handleQuickPayment("card")}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Card
                </Button>
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={() => handleQuickPayment("mobile")}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Mobile
                </Button>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => setShowPayment(true)}
              >
                <Receipt className="mr-2 h-5 w-5" />
                Process Payment
              </Button>
            </div>
          )}
        </div>
      </div>

      <PaymentModal
        open={showPayment}
        onOpenChange={setShowPayment}
        total={cartTotal}
        onComplete={() => {
          // Prepare receipt data
          const receiptItems = cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            discount: 0,
            total: item.total,
          }))
          
          setReceiptData({
            cart: receiptItems,
            subtotal: cartTotal,
            discount: 0,
            tax: 0,
            total: cartTotal,
          })
          
          clearCart()
          setShowPayment(false)
          setShowReceipt(true)
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

