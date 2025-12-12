"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { CloseRegisterModal } from "@/components/modals/close-register-modal"
import { ReceiptPreviewModal } from "@/components/modals/receipt-preview-modal"
import { CustomerSelectModal } from "@/components/modals/customer-select-modal"
import { SelectUnitModal } from "@/components/modals/select-unit-modal"
import { SelectVariationModal } from "@/components/modals/select-variation-modal"
import { useShift } from "@/contexts/shift-context"
import type { Customer } from "@/lib/services/customerService"
import type { Product } from "@/lib/types"

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
  const [saleType, setSaleType] = useState<SaleType>("retail")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerSelect, setShowCustomerSelect] = useState(false)
  const [showSaleTypeConfirm, setShowSaleTypeConfirm] = useState(false)
  const [pendingSaleType, setPendingSaleType] = useState<SaleType | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showDiscount, setShowDiscount] = useState(false)
  const [showCloseRegister, setShowCloseRegister] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [showUnitSelector, setShowUnitSelector] = useState(false)
  const [selectedProductForUnit, setSelectedProductForUnit] = useState<any>(null)
  const [showVariationModal, setShowVariationModal] = useState(false)
  const [selectedProductForVariation, setSelectedProductForVariation] = useState<any>(null)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  
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

  useEffect(() => {
    const loadData = async () => {
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
    
    loadData()
  }, [currentBusiness])

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || 
                           product.categoryId === selectedCategory ||
                           (product.category && (product.category.id === selectedCategory || product.category.name === selectedCategory))
    return matchesSearch && matchesCategory && product.isActive
  })

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

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
      productId: product.id,
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
        productId: selectedProductForUnit.id,
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
      productId: selectedProductForUnit.id,
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
      productId: selectedProductForVariation.id,
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
          <Button variant="outline" size="sm" onClick={handleHoldSale}>
            Hold
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowDiscount(true)}>
            Discount
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
                placeholder="Search by name, SKU, or barcode..."
                className="w-full"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  if (e.target.value.length >= 2) {
                    setShowSearchDropdown(true)
                  } else {
                    setShowSearchDropdown(false)
                  }
                }}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowSearchDropdown(true)
                  }
                }}
                onBlur={() => {
                  // Delay to allow click on dropdown items
                  setTimeout(() => setShowSearchDropdown(false), 200)
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchResults.length > 0) {
                    handleAddToCart(searchResults[0])
                    setSearchTerm("")
                    setShowSearchDropdown(false)
                  } else if (e.key === "Escape") {
                    setShowSearchDropdown(false)
                  }
                }}
              />
              
              {/* Search Results Dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-[400px] overflow-y-auto">
                  {searchResults.map((product: any) => {
                    const price = getProductPrice(product)
                    const sellingUnits = product.selling_units || []
                    const activeUnits = sellingUnits.filter((u: any) => u.is_active !== false)
                    const hasUnits = activeUnits.length > 0
                    
                    return (
                      <button
                        key={product.id}
                        className="w-full px-4 py-3 text-left hover:bg-accent border-b last:border-b-0 transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleAddToCart(product)
                          setSearchTerm("")
                          setShowSearchDropdown(false)
                          setTimeout(() => {
                            searchInputRef.current?.focus()
                          }, 100)
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
                              {hasUnits && <span className="text-primary font-medium">Multi-unit</span>}
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <div className="font-bold text-sm">{formatCurrency(price, currentBusiness)}</div>
                          </div>
                        </div>
                      </button>
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
                  
                  return (
                    <button
                      key={product.id}
                      className="bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 rounded-lg p-4 text-center transition-all duration-150 shadow-sm hover:shadow-md min-h-[120px] flex flex-col justify-center items-center"
                      onClick={() => handleAddToCart(product)}
                    >
                      <div className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </div>
                      <div className="font-bold text-base text-gray-900">
                        {formatCurrency(price, currentBusiness)}
                      </div>
                      {product.stock !== undefined && product.stock <= 10 && (
                        <div className="text-xs text-red-600 mt-1 font-medium">
                          Low Stock
                        </div>
                      )}
                      {hasUnits && (
                        <div className="text-xs text-blue-600 mt-1 font-medium">
                          Select Unit
                        </div>
                      )}
                    </button>
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
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-lg font-bold">{formatCurrency(cartTotal, currentBusiness)}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled
                title="Payment system will be implemented"
              >
                Process {saleType === "wholesale" ? "Wholesale" : "Retail"} Payment
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DiscountModal
        open={showDiscount}
        onOpenChange={setShowDiscount}
        item={null}
        onApply={() => {}}
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
