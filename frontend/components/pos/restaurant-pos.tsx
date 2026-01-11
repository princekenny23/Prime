"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePOSStore } from "@/stores/posStore"
import { useBusinessStore } from "@/stores/businessStore"
import { productService, categoryService } from "@/lib/services/productService"
import { tableService, Table as TableType } from "@/lib/services/tableService"
import { saleService } from "@/lib/services/saleService"
import { formatCurrency } from "@/lib/utils/currency"
import { 
  Search, UtensilsCrossed, ChefHat, Send, Plus, Minus, X, Square, Lock, 
  ShoppingCart, Clock, Users, AlertCircle, CheckCircle, Filter, 
  ArrowLeft, RefreshCw, Printer, Receipt, CreditCard
} from "lucide-react"
import { CloseRegisterModal } from "@/components/modals/close-register-modal"
// Receipt preview removed from POS terminal
import { SaleDiscountModal, type SaleDiscount } from "@/components/modals/sale-discount-modal"
import { printReceipt } from "@/lib/print"
import { useShift } from "@/contexts/shift-context"
import { useTenant } from "@/contexts/tenant-context"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
// printReceiptAuto removed; reverted to ReceiptPreviewModal flow

interface RestaurantTable {
  id: string
  number: string
  status: "available" | "occupied" | "reserved" | "out_of_service"
  guests?: number
  capacity?: number
  location?: string
}

interface Category {
  id: string
  name: string
  description?: string
}

const modifiers = [
  "No salt",
  "Extra cheese",
  "No onions",
  "Spicy",
  "Well done",
  "Medium rare",
  "Extra sauce",
  "No ice",
  "Extra ice",
  "Lemon",
]

export function RestaurantPOS() {
  const { toast } = useToast()
  const { currentBusiness, currentOutlet } = useBusinessStore()
  const { currentOutlet: tenantOutlet } = useTenant()
  const { cart, addToCart, updateCartItem, removeFromCart, clearCart, selectedTable, setSelectedTable } = usePOSStore()
  const { activeShift } = useShift()
  const [view, setView] = useState<"tables" | "order">("tables")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">("all")
  const [showPayment, setShowPayment] = useState(false)
  const [showCloseRegister, setShowCloseRegister] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({})
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingTables, setLoadingTables] = useState(true)
  const [isSendingToKitchen, setIsSendingToKitchen] = useState(false)
  const [showSaleDiscount, setShowSaleDiscount] = useState(false)
  const [saleDiscount, setSaleDiscount] = useState<SaleDiscount | null>(null)

  // Load categories from database
  const loadCategories = useCallback(async () => {
    if (!currentBusiness) {
      setCategories([])
      setLoadingCategories(false)
      return
    }
    
    setLoadingCategories(true)
    try {
      const categoriesData = await categoryService.list()
      setCategories(categoriesData)
    } catch (error: any) {
      console.error("Failed to load categories:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load categories. Please try again.",
        variant: "destructive",
      })
      setCategories([])
    } finally {
      setLoadingCategories(false)
    }
  }, [currentBusiness, toast])

  // Load products from database
  const loadProducts = useCallback(async () => {
    if (!currentBusiness) {
      setProducts([])
      setLoadingProducts(false)
      return
    }
    
    setLoadingProducts(true)
    try {
      const productsData = await productService.list({ is_active: true })
      const productsList = Array.isArray(productsData) ? productsData : productsData.results || []
      setProducts(productsList)
    } catch (error: any) {
      console.error("Failed to load products:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load products. Please try again.",
        variant: "destructive",
      })
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }, [currentBusiness, toast])

  // Load tables from API
  const loadTables = useCallback(async () => {
    if (!currentBusiness) {
      setTables([])
      setLoadingTables(false)
      return
    }
    
    setLoadingTables(true)
    try {
      // Don't filter by outlet - load all tables for the tenant
      // Tables can be assigned to outlets later, but should still be visible
      const filters: any = { is_active: true }
      // Only filter by outlet if explicitly needed, but don't require it
      // if (currentOutlet?.id) {
      //   filters.outlet = currentOutlet.id.toString()
      // }
      
      console.log("Loading tables with filters:", filters)
      console.log("Current outlet:", currentOutlet)
      const response = await tableService.list(filters)
      console.log("Tables API response:", response)
      
      const tablesData = response.results || []
      console.log("Tables data extracted:", tablesData, "Count:", tablesData.length)
      
      // Map backend table format to frontend format
      const mappedTables: RestaurantTable[] = tablesData.map((table: TableType) => ({
        id: table.id,
        number: table.number,
        status: table.status as "available" | "occupied" | "reserved" | "out_of_service",
        capacity: table.capacity,
        location: table.location,
      }))
      
      console.log("Mapped tables:", mappedTables, "Count:", mappedTables.length)
      setTables(mappedTables)
    } catch (error: any) {
      console.error("Failed to load tables:", error)
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        data: error.data,
      })
      toast({
        title: "Error",
        description: error.message || error.data?.detail || "Failed to load tables. Please try again.",
        variant: "destructive",
      })
      setTables([])
    } finally {
      setLoadingTables(false)
    }
  }, [currentBusiness, currentOutlet, toast])

  useEffect(() => {
    loadCategories()
    loadProducts()
    loadTables()
  }, [loadCategories, loadProducts, loadTables])

  // Filter products by category and search
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategoryId === "all" || 
      (product.categoryId && product.categoryId === selectedCategoryId) ||
      (!product.categoryId && selectedCategoryId === "uncategorized")
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch && product.isActive
  })

  const cartSubtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const cartTax = 0 // Can be calculated based on business settings
  
  // Calculate discount amount
  const cartDiscount = saleDiscount
    ? saleDiscount.type === "percentage"
      ? (cartSubtotal * saleDiscount.value) / 100
      : saleDiscount.value
    : 0
  
  const cartFinalTotal = cartSubtotal + cartTax - cartDiscount

  const handleSelectTable = (table: RestaurantTable) => {
    if (table.status === "out_of_service") {
      toast({
        title: "Table Unavailable",
        description: "This table is out of service and cannot be selected.",
        variant: "destructive",
      })
      return
    }
    
    if (table.status === "available" || table.status === "occupied" || table.status === "reserved") {
      // Map RestaurantTable to POS Store Table format
      setSelectedTable({
        id: table.id,
        number: table.number,
        status: table.status as "available" | "occupied" | "reserved",
        guests: table.guests,
      })
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
    
    toast({
      title: "Added to Cart",
      description: `${product.name} added to order`,
    })
  }

  const handleAddModifier = (itemId: string, modifier: string) => {
    setSelectedModifiers(prev => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), modifier]
    }))
  }

  const handleSendToKitchen = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to the cart before sending to kitchen.",
        variant: "destructive",
      })
      return
    }

    if (!selectedTable) {
      toast({
        title: "No Table Selected",
        description: "Please select a table before sending to kitchen.",
        variant: "destructive",
      })
      return
    }

    if (!currentOutlet) {
      toast({
        title: "No Outlet Selected",
        description: "Please select an outlet.",
        variant: "destructive",
      })
      return
    }

    if (!activeShift) {
      toast({
        title: "No Active Shift",
        description: "Please start a shift before sending orders to kitchen.",
        variant: "destructive",
      })
      return
    }

    setIsSendingToKitchen(true)
    try {
      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price.toString()) * item.quantity), 0)
      const tax = 0
      const discount = 0
      const total = Math.round((subtotal - discount + tax) * 100) / 100

        // Create sale with proper data format
        const saleData = {
          outlet: currentOutlet.id.toString(),
          shift: activeShift.id.toString(),
          items_data: cart.map(item => ({
            product_id: item.productId, // Service will convert to integer
            quantity: item.quantity,
            price: parseFloat(item.price.toString()),
            notes: item.modifiers?.join(", ") || "",
            kitchen_status: "pending",
          })),
          subtotal: Math.round(subtotal * 100) / 100,
          tax: Math.round(tax * 100) / 100,
          discount: Math.round(discount * 100) / 100,
          total: Math.round(total * 100) / 100,
          payment_method: "cash" as const,
          status: "pending" as const,
          notes: `Table ${selectedTable.number} - Kitchen Order`,
          table_id: selectedTable.id,
          guests: (selectedTable as any).capacity || 1,
          priority: "normal" as const,
        }

        const saleResponse = await saleService.create(saleData)
        
        // Get KOT number from response (from _raw data which contains backend response)
        const rawResponse = (saleResponse as any)._raw || saleResponse
        const kotNumber = rawResponse?.kitchen_tickets?.[0]?.kot_number || 'N/A'

        toast({
          title: "Order Sent to Kitchen",
          description: `Order sent to kitchen for Table ${selectedTable.number}. KOT: ${kotNumber}`,
        })

        // Clear cart after sending to kitchen (order is saved)
        clearCart()
    } catch (error: any) {
      console.error("Failed to send order to kitchen:", error)
      const errorMessage = error.response?.data?.errors 
        ? JSON.stringify(error.response.data.errors)
        : error.message || "Failed to send order to kitchen. Please try again."
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSendingToKitchen(false)
    }
  }

  const handleQuantityChange = (itemId: string, change: number) => {
    const item = cart.find(i => i.id === itemId)
    if (item) {
      const newQuantity = Math.max(1, item.quantity + change)
      updateCartItem(itemId, { quantity: newQuantity })
    }
  }

  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

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

    if (!currentOutlet) {
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
      const discount = Math.round(cartDiscount * 100) / 100
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
          notes: item.modifiers?.join(", ") || item.notes || "",
        }
      })

      // Create sale data - ensure all decimal values are rounded to 2 decimal places
      const saleData = {
        outlet: currentOutlet.id,
        shift: activeShift.id,
        customer: undefined, // Restaurant can add customer later if needed
        items_data: items_data,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        discount: Math.round(discount * 100) / 100,
        discount_type: saleDiscount?.type,
        discount_reason: saleDiscount?.reason,
        total: Math.round(total * 100) / 100,
        payment_method: "cash" as const,
        notes: selectedTable ? `Table ${selectedTable.number}` : "",
        // Restaurant-specific fields
        table_id: selectedTable?.id || undefined,
        guests: (selectedTable as any)?.capacity || undefined,
        priority: "normal" as const,
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

      // Attempt to auto-print the canonical saved sale (non-blocking)
      try {
        const fullSale = await saleService.get(String(sale.id))
        const receiptCartItems = (fullSale.items || []).map((it: any, idx: number) => ({
          id: it.productId ? `${it.productId}-${idx}` : `item-${idx}`,
          name: it.productName || it.product_name || it.name || "Item",
          price: it.price || 0,
          quantity: it.quantity || 0,
          total: it.total || (it.quantity || 0) * (it.price || 0),
        }))
        await printReceipt({ cart: receiptCartItems, subtotal: fullSale.subtotal || subtotal, discount: fullSale.discount || 0, tax: fullSale.tax || 0, total: fullSale.total || total, sale: fullSale }, (currentOutlet || tenantOutlet).id)
        toast({ title: 'Printed receipt', description: `Receipt ${fullSale.id} sent to printer.` })
      } catch (err: any) {
        console.warn('Auto-print failed in RestaurantPOS:', err)
      }

      // Clear cart and discount
      clearCart()
      setSelectedTable(null)
      setSaleDiscount(null)
      // Receipt preview removed from POS terminal
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

  if (view === "tables") {
    return (
      <div className="flex flex-col bg-background min-h-[calc(100vh-8rem)]">
        {/* Header */}
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

        {/* Tables Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingTables ? (
            <div className="col-span-full text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading tables...</p>
            </div>
          ) : tables.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Square className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">No tables configured</p>
              <p className="text-sm text-muted-foreground">Please add tables in the Tables management page</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {tables.map((table) => (
                <Card
                  key={table.id}
                  className={cn(
                    "cursor-pointer hover:shadow-lg transition-all border-2",
                    table.status === "occupied" && "border-primary bg-primary/5",
                    table.status === "reserved" && "border-orange-500 bg-orange-50 dark:bg-orange-950",
                    table.status === "out_of_service" && "border-gray-400 opacity-60"
                  )}
                  onClick={() => handleSelectTable(table)}
                >
                  <CardContent className="p-6">
                    <div className="text-center space-y-2">
                      <Square className={cn(
                        "h-16 w-16 mx-auto",
                        table.status === "available" && "text-green-500",
                        table.status === "occupied" && "text-primary",
                        table.status === "reserved" && "text-orange-500",
                        table.status === "out_of_service" && "text-gray-400"
                      )} />
                      <h3 className="text-xl font-bold">Table {table.number}</h3>
                      <Badge variant={
                        table.status === "available" ? "default" :
                        table.status === "occupied" ? "secondary" :
                        table.status === "reserved" ? "outline" : "secondary"
                      }>
                        {table.status === "available" ? "Available" :
                         table.status === "occupied" ? "Occupied" :
                         table.status === "reserved" ? "Reserved" : "Out of Service"}
                      </Badge>
                      {table.capacity && (
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                          <Users className="h-3 w-3" />
                          {table.capacity} seats
                        </p>
                      )}
                      {table.location && (
                        <p className="text-xs text-muted-foreground">{table.location}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setView("tables")
                clearCart()
                setSelectedTable(null)
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tables
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Restaurant POS</h1>
              <div className="flex items-center gap-2 mt-1">
                {selectedTable && (
                  <>
                    <Badge variant="secondary" className="text-sm">
                      <Square className="h-3 w-3 mr-1" />
                      Table {selectedTable.number}
                    </Badge>
                    {(selectedTable as any).capacity && (
                      <Badge variant="outline" className="text-sm">
                        <Users className="h-3 w-3 mr-1" />
                        {(selectedTable as any).capacity} seats
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <Button variant="outline" onClick={clearCart}>
                <X className="h-4 w-4 mr-2" />
                Clear Cart
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
        {/* Menu Section */}
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/30 min-w-0">
          {/* Category Filter */}
          <div className="border-b bg-card p-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategoryId === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategoryId("all")}
                className="whitespace-nowrap"
              >
                <Filter className="h-4 w-4 mr-2" />
                All Items
              </Button>
              {loadingCategories ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading categories...</span>
                </div>
              ) : (
                categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategoryId === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className="whitespace-nowrap"
                  >
                    {category.name}
                  </Button>
                ))
              )}
              {!loadingCategories && (
                <Button
                  variant={selectedCategoryId === "uncategorized" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategoryId("uncategorized")}
                  className="whitespace-nowrap"
                >
                  Uncategorized
                </Button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b bg-card">
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

          {/* Product Grid - Single grid without category headers */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {loadingProducts ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading products...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <UtensilsCrossed className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">No products found</p>
                  {searchTerm && (
                    <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {filteredProducts.map((product: any) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover:shadow-md transition-all hover:border-primary group"
                      onClick={() => handleAddToCart(product)}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <UtensilsCrossed className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                            )}
                          </div>
                          <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                          <p className="font-bold text-primary text-sm">
                            {formatCurrency(product.price, currentBusiness)}
                          </p>
                          {product.stock !== undefined && product.stock <= 0 && (
                            <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Order Sidebar */}
        <div className="w-96 border-l bg-card flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order
                </h2>
                {selectedTable && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Table {selectedTable.number}
                  </p>
                )}
              </div>
              {cart.length > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {cart.length} {cart.length === 1 ? "item" : "items"}
                </Badge>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">No items in order</p>
                  <p className="text-sm mt-1">Add items from the menu to get started</p>
                </div>
              ) : (
                cart.map((item) => (
                  <Card key={item.id} className="border">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
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
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                        <p className="font-bold text-sm">
                          {formatCurrency(item.total, currentBusiness)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          {cart.length > 0 && (
            <div className="border-t bg-muted/50 p-4 space-y-3">
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(cartSubtotal, currentBusiness)}</span>
                </div>
                {cartTax > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{formatCurrency(cartTax, currentBusiness)}</span>
                  </div>
                )}
                {saleDiscount && cartDiscount > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        -{formatCurrency(cartDiscount, currentBusiness)}
                      </span>
                    </div>
                    {saleDiscount.reason && (
                      <div className="text-xs text-muted-foreground italic">
                        Reason: {saleDiscount.reason}
                      </div>
                    )}
                  </>
                )}
                <div className="border-t my-1" />
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(cartFinalTotal, currentBusiness)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleSendToKitchen}
                  disabled={isSendingToKitchen}
                >
                  {isSendingToKitchen ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <ChefHat className="mr-2 h-5 w-5" />
                      Send to Kitchen
                    </>
                  )}
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleProcessPayment}
                  className="flex-1"
                  disabled={isProcessingPayment || cart.length === 0}
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Pay Now
                    </>
                  )}
                </Button>
              </div>
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
      {/* Receipt preview removed from POS terminal - printing is automatic */}
    </div>
  )
}
