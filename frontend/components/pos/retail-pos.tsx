"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { usePOSStore } from "@/stores/posStore"
import { useBusinessStore } from "@/stores/businessStore"
import { productService, categoryService, variationService } from "@/lib/services/productService"
import { formatCurrency } from "@/lib/utils/currency"
import { DiscountModal } from "@/components/modals/discount-modal"
import { SaleDiscountModal, type SaleDiscount } from "@/components/modals/sale-discount-modal"
import { CloseRegisterModal } from "@/components/modals/close-register-modal"
import { CustomerSelectModal } from "@/components/modals/customer-select-modal"
import { SelectUnitModal } from "@/components/modals/select-unit-modal"
import { SelectVariationModal } from "@/components/modals/select-variation-modal"
import { AddEditProductModal } from "@/components/modals/add-edit-product-modal"
import { PaymentMethodModal, type DeliveryInfo } from "@/components/modals/payment-method-modal"
import { deliveryService } from "@/lib/services/deliveryService"
import { useShift } from "@/contexts/shift-context"
import { saleService } from "@/lib/services/saleService"
import { useToast } from "@/components/ui/use-toast"
import { printReceipt } from "@/lib/print"
import type { Customer } from "@/lib/services/customerService"
import type { Product } from "@/lib/types"
import { useI18n } from "@/contexts/i18n-context"
import { useBarcodeScanner } from "@/lib/hooks/useBarcodeScanner"
// Printing helper removed - reverted to receipt preview flow

type SaleType = "retail" | "wholesale"

interface ProductUnit {
  id: string | number
  unit_name: string
  conversion_factor: number | string
  retail_price: number | string
  wholesale_price?: number | string
  is_active?: boolean
  stock_in_unit?: number
}

export function RetailPOS() {
  const { currentBusiness, currentOutlet } = useBusinessStore()
  const { cart, addToCart, updateCartItem, removeFromCart, clearCart, holdSale } = usePOSStore()
  const { activeShift } = useShift()
  const { toast } = useToast()
  const { t } = useI18n()
  const [saleType, setSaleType] = useState<SaleType>("retail")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerSelect, setShowCustomerSelect] = useState(false)
  const [showSaleTypeConfirm, setShowSaleTypeConfirm] = useState(false)
  const [pendingSaleType, setPendingSaleType] = useState<SaleType | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showDiscount, setShowDiscount] = useState(false)
  const [showCloseRegister, setShowCloseRegister] = useState(false)
  // Receipt preview in POS has been removed; printing is handled automatically
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [showUnitSelector, setShowUnitSelector] = useState(false)
  const [selectedProductForUnit, setSelectedProductForUnit] = useState<any>(null)
  const [showVariationModal, setShowVariationModal] = useState(false)
  const [selectedProductForVariation, setSelectedProductForVariation] = useState<any>(null)
  // Add product modal for creating product from barcode lookup
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [productToCreate, setProductToCreate] = useState<any | null>(null)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [showQuickSelectDropdown, setShowQuickSelectDropdown] = useState(false)
  const [showPaymentMethod, setShowPaymentMethod] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [showRefund, setShowRefund] = useState(false)
  const [showSaleDiscount, setShowSaleDiscount] = useState(false)
  const [saleDiscount, setSaleDiscount] = useState<SaleDiscount | null>(null)
  
  // Focus search on mount and after actions
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debounce search term for performance with bulk data
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Filter search results for dropdown (limit to 10 for performance)
  useEffect(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
      setSearchResults([])
      setShowSearchDropdown(false)
      return
    }

    const term = debouncedSearchTerm.toLowerCase()
    const results = products
      .filter((product: any) => {
        const matchesSearch = product.name?.toLowerCase().includes(term) ||
                             product.sku?.toLowerCase().includes(term) ||
                             product.barcode?.toLowerCase().includes(term)
        const matchesCategory = selectedCategory === "all" || 
                               product.categoryId === selectedCategory ||
                               (product.category && (product.category.id === selectedCategory || product.category.name === selectedCategory))
        return matchesSearch && matchesCategory && product.isActive
      })
      .slice(0, 10) // Limit to 10 results for performance

    setSearchResults(results)
    setShowSearchDropdown(results.length > 0)
  }, [debouncedSearchTerm, products, selectedCategory])

  // Get quick select items (all active products, limited to 20 for performance)
  const quickSelectItems = useMemo(() => {
    return products
      .filter((product: any) => {
        const matchesCategory = selectedCategory === "all" || 
                               product.categoryId === selectedCategory ||
                               (product.category && (product.category.id === selectedCategory || product.category.name === selectedCategory))
        return product.isActive
      })
      .slice(0, 20) // Limit to 20 items for quick selection
  }, [products, selectedCategory])

  const fetchProductsAndCategories = async () => {
    if (!currentBusiness) {
      setIsLoadingProducts(false)
      return
    }
    
    setIsLoadingProducts(true)
    setProductsError(null)
    
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.list({ is_active: true }),
        categoryService.list(),
      ])
      setProducts(productsData.results || productsData)
      setCategories(["all", ...(categoriesData.map((c: any) => c.name) || [])])
    } catch (error: any) {
      console.error("Failed to load products:", error)
      setProductsError("Failed to load products. Please refresh the page.")
      setProducts([])
      setCategories(["all"])
    } finally {
      setIsLoadingProducts(false)
    }
  }

  useEffect(() => {
    fetchProductsAndCategories()
  }, [currentBusiness])

  // Global barcode scanner handler (keyboard-wedge)
  const handleBarcodeScanned = async (code: string) => {
    const term = String(code).trim()
    if (!term) return

    try {
      const { products: matchedProducts, variations: matchedVariations } = await productService.lookup(term)

      // Exact one variation -> add to cart directly
      if (matchedVariations && matchedVariations.length === 1) {
        const v = matchedVariations[0]
        const productName = typeof v.product === 'object' ? v.product.name : ''
        const productId = typeof v.product === 'object' ? v.product.id : v.product
        addToCart({
          id: `cart_${Date.now()}_${Math.random()}`,
          productId: String(productId),
          variationId: v.id,
          name: `${productName ? productName + ' - ' : ''}${v.name}`,
          price: parseFloat(String(v.price || 0)),
          quantity: 1,
          saleType: saleType,
        })

        toast({ title: "Added to cart", description: `${productName} - ${v.name} added via barcode` })
        return
      }

      // Multiple variations -> allow selecting from list
      if (matchedVariations && matchedVariations.length > 1) {
        setSelectedProductForVariation({ id: null, name: `Barcode: ${term}`, variations: matchedVariations })
        setShowVariationModal(true)
        return
      }

      // Single product match (no variations) -> add to cart or open variation modal if variations exist
      if (matchedProducts && matchedProducts.length === 1) {
        const p = matchedProducts[0]
        // If product has variations, open variation modal
        if (p.variations && p.variations.length > 0) {
          setSelectedProductForVariation(p)
          setShowVariationModal(true)
          return
        }

        // No variations - add product directly
        const price = getProductPrice(p)
        addToCart({
          id: `cart_${Date.now()}_${Math.random()}`,
          productId: String(p.id),
          name: p.name,
          price: price,
          quantity: 1,
          saleType: saleType,
        })
        toast({ title: "Added to cart", description: `${p.name} added via barcode` })
        return
      }

      // No matches - offer to create product prefilled with barcode
      toast({ title: "No product found", description: "Would you like to create a product with this barcode?" })
      setProductToCreate({ barcode: term })
      setShowAddProductModal(true)
      return

    } catch (err: any) {
      console.error("Barcode lookup failed:", err)
      toast({ title: "Lookup failed", description: err.message || String(err), variant: "destructive" })
      return
    }
  }

  useBarcodeScanner({ onScan: handleBarcodeScanned })


  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || 
                           product.categoryId === selectedCategory ||
                           (product.category && (product.category.id === selectedCategory || product.category.name === selectedCategory))
    return matchesSearch && matchesCategory && product.isActive
  })

  const cartSubtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  
  // Calculate discount amount
  const discountAmount = useMemo(() => {
    if (!saleDiscount) return 0
    if (saleDiscount.type === "percentage") {
      return (cartSubtotal * saleDiscount.value) / 100
    }
    return saleDiscount.value
  }, [saleDiscount, cartSubtotal])
  
  // Calculate final total
  const cartTotal = cartSubtotal - discountAmount

  // Get price based on sale type
  const getProductPrice = (product: any): number => {
    if (saleType === "wholesale") {
      return product.wholesale_price || product.wholesalePrice || product.price || 0
    }
    return product.price || 0
  }

  const handleAddToCart = async (product: any) => {
    // Check if product has variations
    try {
      const variations = await variationService.list({ product: product.id, is_active: true })
      
      if (variations.length > 0) {
        setSelectedProductForVariation(product)
        setShowVariationModal(true)
        return
      }
    } catch (error) {
      console.error("Failed to check variations:", error)
    }

    // Check if product has selling units
    const sellingUnits = (product as any).selling_units || []
    const activeUnits = sellingUnits.filter((u: any) => u.is_active !== false)
    
    if (activeUnits.length > 0) {
      // Show unit selector popup
      setSelectedProductForUnit(product)
      setShowUnitSelector(true)
      return
    }

    // No variations or units - add directly to cart
    const price = getProductPrice(product)
    addToCart({
      id: `cart_${Date.now()}_${Math.random()}`,
      productId: String(product.id),
      name: product.name,
      price: price,
      quantity: 1,
      saleType: saleType,
    })
  }

  const handleUnitSelected = (unit: ProductUnit | null) => {
    if (!selectedProductForUnit) return

    // If unit is null, use base unit
    if (!unit) {
      const price = getProductPrice(selectedProductForUnit)
      addToCart({
        id: `cart_${Date.now()}_${Math.random()}`,
        productId: String(selectedProductForUnit.id),
        name: selectedProductForUnit.name,
        price: price,
        quantity: 1,
        saleType: saleType,
      })
      setSelectedProductForUnit(null)
      setShowUnitSelector(false)
      return
    }

    // Use selected unit
    const price = saleType === "wholesale" && unit.wholesale_price
      ? parseFloat(String(unit.wholesale_price))
      : parseFloat(String(unit.retail_price))

    const displayName = `${selectedProductForUnit.name} (${unit.unit_name})`

    addToCart({
      id: `cart_${Date.now()}_${Math.random()}`,
      productId: String(selectedProductForUnit.id),
      name: displayName,
      price: price,
      quantity: 1,
      saleType: saleType,
    })

    setSelectedProductForUnit(null)
    setShowUnitSelector(false)
  }

  const handleVariationSelected = (variation: any) => {
    if (!selectedProductForVariation) return

    const price = variation.price || getProductPrice(selectedProductForVariation)
    addToCart({
      id: `cart_${Date.now()}_${Math.random()}`,
      productId: String(selectedProductForVariation.id),
      name: `${selectedProductForVariation.name} - ${variation.name}`,
      price: price,
      quantity: 1,
      saleType: saleType,
    })

    setSelectedProductForVariation(null)
    setShowVariationModal(false)
  }

  const handleQuantityChange = (itemId: string, change: number) => {
    const item = cart.find(i => i.id === itemId)
    if (item) {
      const newQuantity = Math.max(1, item.quantity + change)
      updateCartItem(itemId, { quantity: newQuantity })
    }
  }

  const handleHoldSale = () => {
    const holdId = holdSale()
    alert(`Sale held with ID: ${holdId}`)
  }

  const handleSaleTypeChange = (newType: SaleType) => {
    if (cart.length > 0 && saleType !== newType) {
      setPendingSaleType(newType)
      setShowSaleTypeConfirm(true)
    } else {
      setSaleType(newType)
    }
  }

  const handleConfirmSaleTypeChange = () => {
    if (pendingSaleType) {
      clearCart()
      setSelectedCustomer(null)
      setSaleType(pendingSaleType)
      setPendingSaleType(null)
      setShowSaleTypeConfirm(false)
    }
  }

  const handleCancelSaleTypeChange = () => {
    setPendingSaleType(null)
    setShowSaleTypeConfirm(false)
  }

  const handleCheckout = async () => {
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

    // Show payment method selection modal
    setShowPaymentMethod(true)
  }

  const handlePaymentConfirm = async (method: "cash" | "card" | "mobile" | "tab", amount?: number, change?: number, deliveryInfo?: DeliveryInfo) => {
    setShowPaymentMethod(false)
    
    // Re-validate (shouldn't happen, but safety check)
    if (!currentOutlet || !activeShift) {
      toast({
        title: "Error",
        description: "Outlet or shift not available.",
        variant: "destructive",
      })
      setIsProcessingPayment(false)
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
        // Extract variation_id and unit_id from item if stored
        // For now, we'll use product_id only (backend will handle variations if needed)
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
      // TypeScript knows currentOutlet and activeShift are not null due to the check above
      const saleData = {
        outlet: currentOutlet!.id,
        shift: activeShift!.id,
        customer: selectedCustomer?.id || undefined,
        items_data: items_data,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        discount: Math.round(discount * 100) / 100,
        discount_type: saleDiscount?.type,
        discount_reason: saleDiscount?.reason,
        total: Math.round(total * 100) / 100,
        payment_method: method,
        notes: method === "tab" ? "Credit sale" : deliveryInfo ? "Delivery order" : "",
      }

      // Call backend API
      const sale = await saleService.create(saleData)
      // Fetch canonical sale from backend to ensure printed receipt matches DB
      let fullSale = sale
      try {
        fullSale = await saleService.get(String(sale.id))
      } catch (err) {
        // If fetching fails, fall back to the created sale response
        console.warn('Failed to fetch full sale from backend, using immediate response', err)
      }

      // Create delivery if delivery info was provided
      if (deliveryInfo && deliveryInfo.delivery_address) {
        try {
          // Convert IDs to integers for backend compatibility
          const saleId = typeof sale.id === 'string' ? parseInt(sale.id, 10) : sale.id
          const outletId = typeof currentOutlet!.id === 'string' ? parseInt(String(currentOutlet!.id), 10) : currentOutlet!.id
          const customerId = selectedCustomer?.id ? (typeof selectedCustomer.id === 'string' ? parseInt(String(selectedCustomer.id), 10) : selectedCustomer.id) : undefined
          
          const deliveryData: any = {
            sale_id: saleId,
            outlet: outletId,
            customer: customerId,
            delivery_address: deliveryInfo.delivery_address,
            delivery_city: deliveryInfo.delivery_city || "",
            delivery_state: deliveryInfo.delivery_state || "",
            delivery_postal_code: deliveryInfo.delivery_postal_code || "",
            delivery_country: deliveryInfo.delivery_country || "",
            delivery_contact_name: deliveryInfo.delivery_contact_name || selectedCustomer?.name || "",
            delivery_contact_phone: deliveryInfo.delivery_contact_phone || selectedCustomer?.phone || "",
            delivery_method: "own_vehicle" as const,
            delivery_fee: deliveryInfo.delivery_fee || 0,
            delivery_instructions: deliveryInfo.delivery_instructions || "",
            status: "pending" as const,
          }
          await deliveryService.create(deliveryData)
          toast({
            title: "Delivery created",
            description: "Delivery order has been created successfully.",
          })
          // Dispatch event to refresh deliveries page
          window.dispatchEvent(new CustomEvent("delivery-created", {
            detail: { saleId: sale.id }
          }))
        } catch (error: any) {
          console.error("Failed to create delivery:", error)
          // Don't fail the sale if delivery creation fails, just log it
          toast({
            title: "Warning",
            description: error.message || "Sale completed but delivery creation failed. Please create delivery manually.",
            variant: "destructive",
          })
        }
      }

      // Show success message
      const saleAny = sale as any
      const receiptNumber = saleAny._raw?.receipt_number || saleAny.receipt_number || sale.id
      toast({
        title: "Sale completed successfully",
        description: `Receipt #${receiptNumber}`,
      })

      // Dispatch event to notify other components (e.g., sales history page)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sale-completed', { 
          detail: { saleId: sale.id, receiptNumber: receiptNumber }
        }))
      }

      // Prepare receipt data for modal
      // Prefer items from the backend canonical sale when available
      const receiptCartItems = (fullSale.items || []).map((it: any, idx: number) => ({
        id: it.productId ? `${it.productId}-${idx}` : `item-${idx}`,
        name: it.productName || it.product_name || it.name || "Item",
        price: it.price || 0,
        quantity: it.quantity || 0,
        discount: 0,
        total: it.total || (it.quantity || 0) * (it.price || 0),
      }))

      // Do not show receipt preview in the POS terminal; printing is handled automatically

      // Clear cart and discount
      clearCart()
      setSelectedCustomer(null)
      setSaleDiscount(null)

  // Receipt preview removed: we no longer open a preview modal in the POS terminal
      // Attempt to auto-print (non-blocking). Uses QZ Tray and saved default printer.
      ;(async () => {
        try {
          const outletId = typeof currentOutlet!.id === 'string' ? parseInt(String(currentOutlet!.id), 10) : currentOutlet!.id
          await printReceipt({ cart: receiptCartItems, subtotal: fullSale.subtotal ?? subtotal, discount: fullSale.discount ?? discount, tax: fullSale.tax ?? tax, total: fullSale.total ?? total, sale: fullSale }, outletId)
          // optional: show a subtle toast on success
          toast({ title: "Printed receipt", description: `Receipt ${receiptNumber} sent to printer.` })
        } catch (err: any) {
          // Non-blocking failure - inform user but don't interrupt flow
          console.error("Auto-print failed:", err)
          toast({ title: "Print failed", description: err?.message || "Unable to print receipt. Check printer settings.", variant: "destructive" })
        }
      })()
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

  const handleReturn = () => {
    // TODO: Implement return functionality
    toast({
      title: "Return",
      description: "Return functionality coming soon.",
    })
  }

  const handleRefund = () => {
    // TODO: Implement refund functionality
    toast({
      title: "Refund",
      description: "Refund functionality coming soon.",
    })
  }

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Please select a business first</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-background h-screen">
      {/* Compact Header */}
      <div className="border-b bg-card px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-lg font-bold">POS Terminal</div>
            <div className="text-xs text-muted-foreground">{currentBusiness.name}</div>
          </div>
          <Tabs value={saleType} onValueChange={(value) => handleSaleTypeChange(value as SaleType)}>
            <TabsList>
              <TabsTrigger value="retail">Retail</TabsTrigger>
              <TabsTrigger value="wholesale">Wholesale</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReturn}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            Return
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefund}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Refund
          </Button>
          <Button variant="outline" size="sm" onClick={handleHoldSale}>
            Hold
          </Button>
          <Button 
            variant={saleDiscount ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowSaleDiscount(true)}
          >
            {saleDiscount ? "Discount Applied" : "Apply Discount"}
          </Button>
          {cart.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearCart}>
              Clear
            </Button>
          )}
          {activeShift && (
            <Button variant="outline" size="sm" onClick={() => setShowCloseRegister(true)}>
              Close
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Products Panel - Clean List View */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {/* Search Bar with Dropdown */}
          <div className="p-3 border-b bg-card">
            <div className="relative">
              <Input
                ref={searchInputRef}
                placeholder={t("pos.search_placeholder")}
                className="w-full"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  if (e.target.value.length >= 2) {
                    setShowSearchDropdown(true)
                    setShowQuickSelectDropdown(false)
                  } else {
                    setShowSearchDropdown(false)
                  }
                }}
                onFocus={() => {
                  if (searchTerm.length >= 2 && searchResults.length > 0) {
                    setShowSearchDropdown(true)
                    setShowQuickSelectDropdown(false)
                  } else if (searchTerm.length === 0) {
                    setShowQuickSelectDropdown(true)
                    setShowSearchDropdown(false)
                  }
                }}
                onBlur={() => {
                  // Delay to allow click on dropdown items
                  setTimeout(() => {
                    setShowSearchDropdown(false)
                    setShowQuickSelectDropdown(false)
                  }, 200)
                }}
                onClick={() => {
                  if (searchTerm.length === 0) {
                    setShowQuickSelectDropdown(true)
                    setShowSearchDropdown(false)
                  }
                }}
                autoFocus
                onKeyDown={async (e) => {
                  // If Enter is pressed, handle barcode lookup professionally when input looks like a barcode
                  if (e.key === "Enter") {
                    const term = searchTerm.trim()
                    const barcodeLike = /^[0-9A-Za-z]{6,}$/.test(term) // flexible barcode heuristic

                    if (barcodeLike) {
                      try {
                        const { products: matchedProducts, variations: matchedVariations } = await productService.lookup(term)

                        // Exact one variation -> add to cart directly
                        if (matchedVariations && matchedVariations.length === 1) {
                          const v = matchedVariations[0]
                          const productName = typeof v.product === 'object' ? v.product.name : ''
                          const productId = typeof v.product === 'object' ? v.product.id : v.product
                          addToCart({
                            id: `cart_${Date.now()}_${Math.random()}`,
                            productId: String(productId),
                            variationId: v.id,
                            name: `${productName ? productName + ' - ' : ''}${v.name}`,
                            price: parseFloat(String(v.price || 0)),
                            quantity: 1,
                            saleType: saleType,
                          })

                          toast({ title: "Added to cart", description: `${productName} - ${v.name} added via barcode` })
                          setSearchTerm("")
                          setShowSearchDropdown(false)
                          return
                        }

                        // Multiple variations -> allow selecting from list
                        if (matchedVariations && matchedVariations.length > 1) {
                          // Use select variation modal - provide product shape with variations
                          setSelectedProductForVariation({ id: null, name: `Barcode: ${term}`, variations: matchedVariations })
                          setShowVariationModal(true)
                          setSearchTerm("")
                          setShowSearchDropdown(false)
                          return
                        }

                        // Single product match (no variations) -> add to cart or open variation modal if variations exist
                        if (matchedProducts && matchedProducts.length === 1) {
                          const p = matchedProducts[0]
                          // If product has variations, open variation modal
                          if (p.variations && p.variations.length > 0) {
                            setSelectedProductForVariation(p)
                            setShowVariationModal(true)
                            setSearchTerm("")
                            setShowSearchDropdown(false)
                            return
                          }

                          // No variations - add product directly
                          const price = getProductPrice(p)
                          addToCart({
                            id: `cart_${Date.now()}_${Math.random()}`,
                            productId: String(p.id),
                            name: p.name,
                            price: price,
                            quantity: 1,
                            saleType: saleType,
                          })
                          toast({ title: "Added to cart", description: `${p.name} added via barcode` })
                          setSearchTerm("")
                          setShowSearchDropdown(false)
                          return
                        }

                        // No matches - offer to create product prefilled with barcode
                        toast({ title: "No product found", description: "Would you like to create a product with this barcode?" })
                        setProductToCreate({ barcode: term })
                        setShowAddProductModal(true)
                        setSearchTerm("")
                        setShowSearchDropdown(false)
                        return

                      } catch (err: any) {
                        console.error("Barcode lookup failed:", err)
                        toast({ title: "Lookup failed", description: err.message || String(err), variant: "destructive" })
                        return
                      }
                    }

                    // Fallback: if searchResults available, add first
                    if (searchResults.length > 0) {
                      handleAddToCart(searchResults[0])
                      setSearchTerm("")
                      setShowSearchDropdown(false)
                    }

                  } else if (e.key === "Escape") {
                    setShowSearchDropdown(false)
                    setShowQuickSelectDropdown(false)
                  }
                }}
              />
              
              {/* Quick Select Dropdown - Shows when search bar is clicked and empty */}
              {showQuickSelectDropdown && quickSelectItems.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-[400px] overflow-y-auto">
                  <div className="px-3 py-2 border-b bg-muted/50">
                    <div className="text-xs font-medium text-muted-foreground">
                      Quick Select ({quickSelectItems.length} items)
                    </div>
                  </div>
                  {quickSelectItems.map((product: any) => {
                    const price = getProductPrice(product)
                    const sellingUnits = product.selling_units || []
                    const activeUnits = sellingUnits.filter((u: any) => u.is_active !== false)
                    const hasUnits = activeUnits.length > 0
                    
                    const handleQuickSelectUnitSelect = (unitId: string) => {
                      if (unitId === "base") {
                        // Use base unit
                        const price = getProductPrice(product)
                        addToCart({
                          id: `cart_${Date.now()}_${Math.random()}`,
                          productId: String(product.id),
                          name: product.name,
                          price: price,
                          quantity: 1,
                          saleType: saleType,
                        })
                      } else {
                        // Find selected unit
                        const selectedUnit = activeUnits.find((u: any) => String(u.id) === unitId)
                        if (selectedUnit) {
                          const unitPrice = saleType === "wholesale" && selectedUnit.wholesale_price
                            ? parseFloat(String(selectedUnit.wholesale_price))
                            : parseFloat(String(selectedUnit.retail_price))
                          const displayName = `${product.name} (${selectedUnit.unit_name})`
                          addToCart({
                            id: `cart_${Date.now()}_${Math.random()}`,
                            productId: String(product.id),
                            name: displayName,
                            price: unitPrice,
                            quantity: 1,
                            saleType: saleType,
                          })
                        }
                      }
                      setShowQuickSelectDropdown(false)
                      setTimeout(() => {
                        searchInputRef.current?.focus()
                      }, 100)
                    }
                    
                    return (
                      <div
                        key={product.id}
                        className="w-full px-4 py-3 hover:bg-accent border-b last:border-b-0 transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          if (!hasUnits) {
                            handleAddToCart(product)
                            setShowQuickSelectDropdown(false)
                            setTimeout(() => {
                              searchInputRef.current?.focus()
                            }, 100)
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{product.name}</div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              {product.sku && <span>SKU: {product.sku}</span>}
                              {product.barcode && <span>Barcode: {product.barcode}</span>}
                              {product.stock !== undefined && (
                                <span className={product.stock <= 10 ? "text-destructive font-medium" : ""}>
                                  Stock: {product.stock}
                                </span>
                              )}
                            </div>
                            {hasUnits && (
                              <div className="mt-2">
                                <Select onValueChange={handleQuickSelectUnitSelect}>
                                  <SelectTrigger className="w-full h-8 text-xs">
                                    <SelectValue placeholder={t("pos.select_unit")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="base">
                                      Base Unit - {formatCurrency(price, currentBusiness)}
                                    </SelectItem>
                                    {activeUnits.map((unit: any) => {
                                      const unitPrice = saleType === "wholesale" && unit.wholesale_price
                                        ? parseFloat(String(unit.wholesale_price))
                                        : parseFloat(String(unit.retail_price))
                                      return (
                                        <SelectItem key={unit.id} value={String(unit.id)}>
                                          {unit.unit_name} - {formatCurrency(unitPrice, currentBusiness)}
                                        </SelectItem>
                                      )
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                          {!hasUnits && (
                            <div className="ml-4 text-right">
                              <div className="font-bold text-sm">{formatCurrency(price, currentBusiness)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              
              {/* Search Results Dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-[400px] overflow-y-auto">
                  {searchResults.map((product: any) => {
                    const price = getProductPrice(product)
                    const sellingUnits = product.selling_units || []
                    const activeUnits = sellingUnits.filter((u: any) => u.is_active !== false)
                    const hasUnits = activeUnits.length > 0
                    
                    const handleSearchUnitSelect = (unitId: string) => {
                      if (unitId === "base") {
                        // Use base unit
                        const price = getProductPrice(product)
                        addToCart({
                          id: `cart_${Date.now()}_${Math.random()}`,
                          productId: String(product.id),
                          name: product.name,
                          price: price,
                          quantity: 1,
                          saleType: saleType,
                        })
                      } else {
                        // Find selected unit
                        const selectedUnit = activeUnits.find((u: any) => String(u.id) === unitId)
                        if (selectedUnit) {
                          const unitPrice = saleType === "wholesale" && selectedUnit.wholesale_price
                            ? parseFloat(String(selectedUnit.wholesale_price))
                            : parseFloat(String(selectedUnit.retail_price))
                          const displayName = `${product.name} (${selectedUnit.unit_name})`
                          addToCart({
                            id: `cart_${Date.now()}_${Math.random()}`,
                            productId: String(product.id),
                            name: displayName,
                            price: unitPrice,
                            quantity: 1,
                            saleType: saleType,
                          })
                        }
                      }
                      setSearchTerm("")
                      setShowSearchDropdown(false)
                      setTimeout(() => {
                        searchInputRef.current?.focus()
                      }, 100)
                    }
                    
                    return (
                      <div
                        key={product.id}
                        className="w-full px-4 py-3 hover:bg-accent border-b last:border-b-0 transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          if (!hasUnits) {
                            handleAddToCart(product)
                            setSearchTerm("")
                            setShowSearchDropdown(false)
                            setTimeout(() => {
                              searchInputRef.current?.focus()
                            }, 100)
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{product.name}</div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              {product.sku && <span>SKU: {product.sku}</span>}
                              {product.barcode && <span>Barcode: {product.barcode}</span>}
                              {product.stock !== undefined && (
                                <span className={product.stock <= 10 ? "text-destructive font-medium" : ""}>
                                  Stock: {product.stock}
                                </span>
                              )}
                            </div>
                            {hasUnits && (
                              <div className="mt-2">
                                <Select onValueChange={handleSearchUnitSelect}>
                                  <SelectTrigger className="w-full h-8 text-xs">
                                    <SelectValue placeholder={t("pos.select_unit")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="base">
                                      Base Unit - {formatCurrency(price, currentBusiness)}
                                    </SelectItem>
                                    {activeUnits.map((unit: any) => {
                                      const unitPrice = saleType === "wholesale" && unit.wholesale_price
                                        ? parseFloat(String(unit.wholesale_price))
                                        : parseFloat(String(unit.retail_price))
                                      return (
                                        <SelectItem key={unit.id} value={String(unit.id)}>
                                          {unit.unit_name} - {formatCurrency(unitPrice, currentBusiness)}
                                        </SelectItem>
                                      )
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                          {!hasUnits && (
                            <div className="ml-4 text-right">
                              <div className="font-bold text-sm">{formatCurrency(price, currentBusiness)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Category Filter - Compact */}
          {categories.length > 1 && (
            <div className="px-3 py-2 border-b bg-muted/30 flex gap-1 flex-wrap">
              {categories.slice(0, 8).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          )}

          {/* Products Grid - Text Only Cards */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoadingProducts ? (
              <div className="p-8 text-center text-muted-foreground">Loading products...</div>
            ) : productsError ? (
              <div className="p-8 text-center text-destructive">{productsError}</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No products found</div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {filteredProducts.map((product: any) => {
                  const price = getProductPrice(product)
                  const sellingUnits = product.selling_units || []
                  const activeUnits = sellingUnits.filter((u: any) => u.is_active !== false)
                  const hasUnits = activeUnits.length > 0
                  
                  const handleUnitSelect = (unitId: string) => {
                    if (unitId === "base") {
                      // Use base unit
                      const price = getProductPrice(product)
                      addToCart({
                        id: `cart_${Date.now()}_${Math.random()}`,
                        productId: String(product.id),
                        name: product.name,
                        price: price,
                        quantity: 1,
                        saleType: saleType,
                      })
                    } else {
                      // Find selected unit
                      const selectedUnit = activeUnits.find((u: any) => String(u.id) === unitId)
                      if (selectedUnit) {
                        const unitPrice = saleType === "wholesale" && selectedUnit.wholesale_price
                          ? parseFloat(String(selectedUnit.wholesale_price))
                          : parseFloat(String(selectedUnit.retail_price))
                        const displayName = `${product.name} (${selectedUnit.unit_name})`
                        addToCart({
                          id: `cart_${Date.now()}_${Math.random()}`,
                          productId: String(product.id),
                          name: displayName,
                          price: unitPrice,
                          quantity: 1,
                          saleType: saleType,
                        })
                      }
                    }
                  }
                  
                  return (
                    <div
                      key={product.id}
                      className="bg-blue-500 hover:bg-blue-600 border border-blue-500 rounded-lg p-4 text-center transition-all duration-150 shadow-sm hover:shadow-md min-h-[120px] flex flex-col justify-center items-center text-white"
                    >
                      <div className="font-medium text-sm text-white mb-2 line-clamp-2">
                        {product.name}
                      </div>
                      {hasUnits ? (
                        <Select onValueChange={handleUnitSelect}>
                          <SelectTrigger className="w-full bg-white/10 hover:bg-white/20 border-white/30 text-white text-xs h-8 mb-2">
                            <SelectValue placeholder="Select Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="base">
                              Base Unit - {formatCurrency(price, currentBusiness)}
                            </SelectItem>
                            {activeUnits.map((unit: any) => {
                              const unitPrice = saleType === "wholesale" && unit.wholesale_price
                                ? parseFloat(String(unit.wholesale_price))
                                : parseFloat(String(unit.retail_price))
                              return (
                                <SelectItem key={unit.id} value={String(unit.id)}>
                                  {unit.unit_name} - {formatCurrency(unitPrice, currentBusiness)}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      ) : (
                        <>
                          <div className="font-bold text-base text-white">
                            {formatCurrency(price, currentBusiness)}
                          </div>
                          <button
                            className="mt-2 w-full bg-white/20 hover:bg-white/30 rounded px-2 py-1 text-xs font-medium transition-colors"
                            onClick={() => handleAddToCart(product)}
                          >
                            Add to Cart
                          </button>
                        </>
                      )}
                      {product.stock !== undefined && product.stock <= 10 && (
                        <div className="text-xs text-red-200 mt-1 font-medium">
                          Low Stock
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cart Panel - Compact */}
        <div className="w-80 border-l bg-card flex flex-col">
          {/* Cart Header */}
          <div className="p-3 border-b">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Cart ({cartItemCount})</div>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearCart}>
                  Clear
                </Button>
              )}
            </div>
            
            {/* Customer Selection */}
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                <span className="truncate">{selectedCustomer.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-xs"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() => setShowCustomerSelect(true)}
              >
                Add Customer
              </Button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Cart is empty
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="p-2 border rounded bg-background">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(item.price, currentBusiness)} each
                      </div>
                    </div>
                    <div className="ml-2 text-right">
                      <div className="text-sm font-bold">{formatCurrency(item.total, currentBusiness)}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0 text-xs"
                        onClick={() => handleQuantityChange(item.id, -1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0 text-xs"
                        onClick={() => handleQuantityChange(item.id, 1)}
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Footer */}
          {cart.length > 0 && (
            <div className="border-t p-3 bg-muted/30">
              <div className="space-y-2 mb-3">
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
                <div className="border-t pt-2 flex items-center justify-between">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-lg font-bold">{formatCurrency(cartTotal, currentBusiness)}</span>
                </div>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessingPayment || cart.length === 0}
              >
                {isProcessingPayment ? (
                  <>
                    <span className="mr-2">Processing...</span>
                  </>
                ) : (
                  `Process ${saleType === "wholesale" ? "Wholesale" : "Retail"} Payment`
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
      <CustomerSelectModal
        open={showCustomerSelect}
        onOpenChange={setShowCustomerSelect}
        onSelect={setSelectedCustomer}
        selectedCustomer={selectedCustomer || undefined}
      />
      
      {/* Unit Selection Modal - Shows popup when product has multiple units */}
      {selectedProductForUnit && (
        <SelectUnitModal
          open={showUnitSelector}
          onOpenChange={(open) => {
            setShowUnitSelector(open)
            if (!open) {
              setSelectedProductForUnit(null)
            }
          }}
          product={selectedProductForUnit}
          saleType={saleType}
          onSelect={handleUnitSelected}
        />
      )}

      {/* Variation Selection Modal */}
      {selectedProductForVariation && (
        <SelectVariationModal
          open={showVariationModal}
          onOpenChange={(open) => {
            setShowVariationModal(open)
            if (!open) {
              setSelectedProductForVariation(null)
            }
          }}
          productId={selectedProductForVariation.id}
          productName={selectedProductForVariation.name}
          onSelect={handleVariationSelected}
          saleType={saleType}
        />
      )}
      
      {/* Sale Type Change Confirmation */}
      <AlertDialog open={showSaleTypeConfirm} onOpenChange={setShowSaleTypeConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Switching to <strong>{pendingSaleType}</strong> will clear your current cart. 
              All items in the cart will be removed. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSaleTypeChange}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSaleTypeChange}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Receipt preview removed from POS terminal - printing is automatic */}

      {/* Payment Method Selection Modal */}
      <PaymentMethodModal
        open={showPaymentMethod}
        onOpenChange={setShowPaymentMethod}
        total={cartTotal}
        business={currentBusiness}
        selectedCustomer={selectedCustomer}
        onConfirm={handlePaymentConfirm}
        onCancel={() => {
          setShowPaymentMethod(false)
          setIsProcessingPayment(false)
        }}
      />

      {/* Add/Edit Product Modal used when barcode lookup returns no result */}
      <AddEditProductModal
        open={showAddProductModal}
        onOpenChange={(open) => {
          setShowAddProductModal(open)
          if (!open) {
            setProductToCreate(null)
          }
        }}
        product={productToCreate || undefined}
        onProductSaved={async () => {
          // Refresh product list so newly created product is available immediately
          await fetchProductsAndCategories()
          setShowAddProductModal(false)
          setProductToCreate(null)
        }}
      />
    </div>
  )
}
