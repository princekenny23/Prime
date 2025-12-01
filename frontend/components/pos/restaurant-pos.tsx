"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { usePOSStore } from "@/stores/posStore"
import { useBusinessStore } from "@/stores/businessStore"
import { getProducts, getCategories } from "@/lib/mockApi"
import { productService, categoryService } from "@/lib/services/productService"
import { useRealAPI } from "@/lib/utils/api-config"
import { formatCurrency } from "@/lib/utils/currency"
import { Search, UtensilsCrossed, ChefHat, Send, Plus, Minus, X, Square, Lock } from "lucide-react"
import { PaymentModal } from "@/components/modals/payment-modal"
import { CloseRegisterModal } from "@/components/modals/close-register-modal"
import { ReceiptPreviewModal } from "@/components/modals/receipt-preview-modal"
import { useShift } from "@/contexts/shift-context"
import { cn } from "@/lib/utils"

interface Table {
  id: string
  number: string
  status: "available" | "occupied" | "reserved"
  guests?: number
}

const modifiers = [
  "No salt",
  "Extra cheese",
  "No onions",
  "Spicy",
  "Well done",
  "Medium rare",
  "Extra sauce",
]

export function RestaurantPOS() {
  const { currentBusiness, currentOutlet } = useBusinessStore()
  const { cart, addToCart, updateCartItem, removeFromCart, clearCart, selectedTable, setSelectedTable } = usePOSStore()
  const { activeShift } = useShift()
  const [view, setView] = useState<"tables" | "order">("tables")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<"food" | "drinks">("food")
  const [showPayment, setShowPayment] = useState(false)
  const [showCloseRegister, setShowCloseRegister] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({})
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!currentBusiness) return
      
      setLoadingProducts(true)
      try {
        if (useRealAPI()) {
          const productsData = await productService.list({ businessId: currentBusiness.id, is_active: true })
          setProducts(Array.isArray(productsData) ? productsData : productsData.results || [])
        } else {
          const businessProducts = getProducts(currentBusiness.id)
          setProducts(businessProducts)
        }
      } catch (error) {
        console.error("Failed to load products:", error)
        const businessProducts = getProducts(currentBusiness.id)
        setProducts(businessProducts)
      } finally {
        setLoadingProducts(false)
      }
    }
    
    loadData()
  }, [currentBusiness])

  // TODO: Load tables from API when table management is implemented
  // For now, tables are empty - they should be loaded from a table service

  const foodProducts = products.filter(p => selectedCategory === "food" || p.name.toLowerCase().includes("cola") || p.name.toLowerCase().includes("water"))
  const drinkProducts = products.filter(p => selectedCategory === "drinks")

  const filteredProducts = (selectedCategory === "food" ? foodProducts : drinkProducts).filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) && product.isActive
  )

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0)

  const handleSelectTable = (table: Table) => {
    if (table.status === "available" || table.status === "occupied") {
      setSelectedTable(table)
      setView("order")
    }
  }

  const handleAddToCart = (product: typeof products[0]) => {
    const itemId = `cart_${Date.now()}_${Math.random()}`
    const modifiers = selectedModifiers[itemId] || []
    
    addToCart({
      id: itemId,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      modifiers,
    })
    
    // Clear modifiers for next item
    setSelectedModifiers({})
  }

  const handleAddModifier = (itemId: string, modifier: string) => {
    setSelectedModifiers(prev => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), modifier]
    }))
  }

  const handleSendToKitchen = () => {
    // Mock: Send order to kitchen
    alert("Order sent to kitchen!")
  }

  const handleQuantityChange = (itemId: string, change: number) => {
    const item = cart.find(i => i.id === itemId)
    if (item) {
      const newQuantity = Math.max(1, item.quantity + change)
      updateCartItem(itemId, { quantity: newQuantity })
    }
  }

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please select a business first</p>
      </div>
    )
  }

  if (view === "tables") {
    return (
      <div className="flex flex-col bg-background min-h-[calc(100vh-8rem)]">
        <div className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Restaurant POS</h1>
              <p className="text-sm text-muted-foreground">{currentBusiness.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setView("order")}>
                <UtensilsCrossed className="h-4 w-4 mr-2" />
                New Order
              </Button>
              {activeShift && (
                <Button variant="outline" onClick={() => setShowCloseRegister(true)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Close Register
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No tables configured. Please add tables in settings.</p>
              </div>
            ) : (
              tables.map((table) => (
              <Card
                key={table.id}
                className={cn(
                  "cursor-pointer hover:shadow-lg transition-all",
                  table.status === "occupied" && "border-primary",
                  table.status === "reserved" && "border-orange-500"
                )}
                onClick={() => handleSelectTable(table)}
              >
                <CardContent className="p-6">
                  <div className="text-center space-y-2">
                    <Square className={cn(
                      "h-16 w-16 mx-auto",
                      table.status === "available" && "text-green-500",
                      table.status === "occupied" && "text-primary",
                      table.status === "reserved" && "text-orange-500"
                    )} />
                    <h3 className="text-xl font-bold">Table {table.number}</h3>
                    <Badge variant={
                      table.status === "available" ? "default" :
                      table.status === "occupied" ? "secondary" : "outline"
                    }>
                      {table.status}
                    </Badge>
                    {table.guests && (
                      <p className="text-sm text-muted-foreground">{table.guests} guests</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Restaurant POS</h1>
            <div className="flex items-center gap-2 mt-1">
              {selectedTable && (
                <Badge variant="secondary">
                  Table {selectedTable.number}
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={() => {
                setView("tables")
                clearCart()
                setSelectedTable(null)
              }}>
                <X className="h-4 w-4 mr-2" />
                Change Table
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <>
                <Button variant="outline" onClick={handleSendToKitchen}>
                  <ChefHat className="h-4 w-4 mr-2" />
                  Send to Kitchen
                </Button>
                <Button variant="outline" onClick={clearCart}>
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </>
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
        {/* Menu Section */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category Tabs */}
          <div className="border-b p-4">
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === "food" ? "default" : "outline"}
                onClick={() => setSelectedCategory("food")}
              >
                Food
              </Button>
              <Button
                variant={selectedCategory === "drinks" ? "default" : "outline"}
                onClick={() => setSelectedCategory("drinks")}
              >
                Drinks
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleAddToCart(product)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-2">
                        <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-sm">{product.name}</h3>
                      <p className="font-bold text-primary">
                        {formatCurrency(product.price, currentBusiness)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Order Sidebar */}
        <div className="w-96 border-l bg-card flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Order</h2>
            {selectedTable && (
              <p className="text-sm text-muted-foreground">Table {selectedTable.number}</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UtensilsCrossed className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No items in order</p>
              </div>
            ) : (
              cart.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.modifiers.map((mod, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {mod}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
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

          {cart.length > 0 && (
            <div className="border-t p-4 space-y-3">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(cartTotal, currentBusiness)}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => setShowPayment(true)}
              >
                <Send className="mr-2 h-5 w-5" />
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
          setSelectedTable(null)
          setView("tables")
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

