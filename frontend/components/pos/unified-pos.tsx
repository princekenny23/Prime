"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePOSStore } from "@/stores/posStore"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import { productService, categoryService, variationService, type ItemVariation } from "@/lib/services/productService"
import { formatCurrency } from "@/lib/utils/currency"
import { Search, ShoppingCart, Percent, Save, Trash2, Plus, Minus, X, Lock, Store, Package, Filter, ChevronDown, Check } from "lucide-react"
import { DiscountModal } from "@/components/modals/discount-modal"
import { CloseRegisterModal } from "@/components/modals/close-register-modal"
import { ReceiptPreviewModal } from "@/components/modals/receipt-preview-modal"
import { SelectVariationModal } from "@/components/modals/select-variation-modal"
import { SelectUnitModal } from "@/components/modals/select-unit-modal"
import { useShift } from "@/contexts/shift-context"
import { cn } from "@/lib/utils"
import { CartPanel } from "./cart-panel"
import { CustomerSelectModal } from "@/components/modals/customer-select-modal"
import type { Customer } from "@/lib/services/customerService"

type SaleType = "retail" | "wholesale"
type SearchType = "product" | "sku" | "barcode" | "category"

// Search type constants
const SEARCH_TYPES: { value: SearchType; label: string }[] = [
  { value: "product", label: "Product" },
  { value: "sku", label: "SKU" },
  { value: "barcode", label: "Barcode" },
  { value: "category", label: "Category" },
]

// Virtualized rendering constants
const ITEMS_PER_PAGE = 50
const ITEM_HEIGHT = 200 // Approximate height of each product card
const CONTAINER_HEIGHT = 600 // Fixed height for product grid container

interface Category {
  id: string
  name: string
}

export function UnifiedPOS() {
  const { currentBusiness, currentOutlet, outlets } = useBusinessStore()
  const { currentOutlet: tenantOutlet } = useTenant()
  const { cart, addToCart, updateCartItem, removeFromCart, clearCart, holdSale } = usePOSStore()
  const { activeShift } = useShift()
  const [saleType, setSaleType] = useState<SaleType>("retail")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerSelect, setShowCustomerSelect] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState<SearchType>("product")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]) // Multi-select
  const [showCategoryPopover, setShowCategoryPopover] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showDiscount, setShowDiscount] = useState(false)
  const [showCloseRegister, setShowCloseRegister] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categorySearchTerm, setCategorySearchTerm] = useState("")
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<any[]>([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [showVariationModal, setShowVariationModal] = useState(false)
  const [selectedProductForVariation, setSelectedProductForVariation] = useState<any>(null)
  const [showUnitSelector, setShowUnitSelector] = useState(false)
  const [selectedProductForUnit, setSelectedProductForUnit] = useState<any>(null)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const productGridRef = useRef<HTMLDivElement>(null)

  // Use tenant outlet if available, otherwise fall back to business store outlet
  const activeOutlet = tenantOutlet || currentOutlet
  
  // Check if single outlet (hide outlet selector)
  const isSingleOutlet = outlets.length <= 1

  // Load categories with lazy-loading support
  useEffect(() => {
    const loadCategories = async () => {
      if (!currentBusiness) {
        setIsLoadingCategories(false)
        return
      }
      
      setIsLoadingCategories(true)
      setCategoriesError(null)
      
      try {
        const categoriesData = await categoryService.list()
        // Sort alphabetically
        const sorted = (categoriesData || []).sort((a: any, b: any) => 
          (a.name || "").localeCompare(b.name || "")
        )
        setCategories(sorted.map((c: any) => ({ 
          id: String(c.id), 
          name: c.name || "" 
        })))
      } catch (error: any) {
        console.error("Failed to load categories:", error)
        setCategoriesError("Failed to load categories. Please refresh the page.")
        setCategories([])
      } finally {
        setIsLoadingCategories(false)
      }
    }
    
    loadCategories()
  }, [currentBusiness])

  // Load products
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

  // Filtered and sorted categories for dropdown (lazy-loading if >50)
  const displayCategories = useMemo(() => {
    let filtered = categories
    
    // Filter by search term if category popover is open
    if (categorySearchTerm) {
      filtered = categories.filter(cat => 
        cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
      )
    }
    
    // Sort alphabetically
    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }, [categories, categorySearchTerm])

  // Autocomplete suggestions (max 15 items)
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setAutocompleteSuggestions([])
      setShowAutocomplete(false)
      return
    }

    const suggestions = products
      .filter((product) => {
        const term = searchTerm.toLowerCase()
        switch (searchType) {
          case "product":
            return product.name?.toLowerCase().includes(term)
          case "sku":
            return product.sku?.toLowerCase().includes(term)
          case "barcode":
            return product.barcode?.toLowerCase().includes(term)
          case "category":
            return product.category?.name?.toLowerCase().includes(term) ||
                   product.categoryId?.toLowerCase().includes(term)
          default:
            return false
        }
      })
      .slice(0, 15) // Limit to 15 suggestions

    setAutocompleteSuggestions(suggestions)
    setShowAutocomplete(suggestions.length > 0)
  }, [searchTerm, searchType, products])

  // Filter products based on sale type, search, and categories
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search filtering based on search type
      let matchesSearch = true
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        switch (searchType) {
          case "product":
            matchesSearch = product.name?.toLowerCase().includes(term) || false
            break
          case "sku":
            matchesSearch = product.sku?.toLowerCase().includes(term) || false
            break
          case "barcode":
            matchesSearch = product.barcode?.toLowerCase().includes(term) || false
            break
          case "category":
            matchesSearch = product.category?.name?.toLowerCase().includes(term) ||
                           product.categoryId?.toLowerCase().includes(term) || false
            break
        }
      }
      
      // Multi-category filtering
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes("all") ||
        selectedCategories.some(cat => 
          product.categoryId === cat || 
          product.category?.id === cat ||
          product.category?.name === cat
        )
      
      // For wholesale, only show products with wholesale enabled
      if (saleType === "wholesale") {
        const hasWholesale = product.wholesale_enabled === true || product.wholesaleEnabled === true
        return matchesSearch && matchesCategory && product.isActive && hasWholesale
      }
      
      return matchesSearch && matchesCategory && product.isActive
    })
  }, [products, searchTerm, searchType, selectedCategories, saleType])

  // Virtualized rendering - calculate visible range
  const visibleProducts = useMemo(() => {
    const startIndex = Math.floor(scrollPosition / ITEM_HEIGHT)
    const endIndex = Math.min(
      startIndex + Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT) + 2,
      filteredProducts.length
    )
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, scrollPosition])

  // Calculate total height for virtual scrolling
  const totalHeight = filteredProducts.length * ITEM_HEIGHT

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Get price based on sale type and unit
  const getProductPrice = (product: any, unit?: any): number => {
    // If unit is provided, use unit price
    if (unit) {
      if (saleType === "wholesale" && unit.wholesale_price) {
        return parseFloat(unit.wholesale_price) || 0
      }
      return parseFloat(unit.retail_price) || 0
    }
    
    // Otherwise use product price
    if (saleType === "wholesale") {
      return product.wholesale_price || product.wholesalePrice || product.price || 0
    }
    return product.price || 0
  }

  // Get stock in selected unit
  const getStockInUnit = (product: any, unit?: any): number => {
    const baseStock = product.stock || 0
    if (!unit || !unit.conversion_factor) return baseStock
    return Math.floor(baseStock / parseFloat(unit.conversion_factor))
  }

  // Check if product meets minimum wholesale quantity
  const canAddToWholesale = (product: any, quantity: number): boolean => {
    if (saleType === "retail") return true
    const minQty = product.minimum_wholesale_quantity || product.minimumWholesaleQuantity || 1
    return quantity >= minQty
  }

  const handleAddToCart = async (product: any) => {
    // Check if product has variations
    try {
      const variations = await variationService.list({ product: product.id, is_active: true })
      
      if (variations.length > 0) {
        // Show variation selection modal
        setSelectedProductForVariation(product)
        setShowVariationModal(true)
        setShowAutocomplete(false)
        return
      }
    } catch (error) {
      console.error("Failed to check variations:", error)
      // Continue with normal add to cart if variation check fails
    }

    // Check if product has selling units
    const sellingUnits = product.selling_units || []
    const activeUnits = sellingUnits.filter((u: any) => u.is_active !== false)
    
    if (activeUnits.length > 0) {
      // Show unit selector
      setSelectedProductForUnit(product)
      setShowUnitSelector(true)
      setShowAutocomplete(false)
      return
    }

    // No variations or units - add directly to cart with base unit
    const price = getProductPrice(product)
    const quantity = 1

    if (saleType === "wholesale" && !canAddToWholesale(product, quantity)) {
      const minQty = product.minimum_wholesale_quantity || product.minimumWholesaleQuantity || 1
      alert(`Minimum wholesale quantity for ${product.name} is ${minQty}`)
      return
    }

    addToCart({
      id: `cart_${Date.now()}_${Math.random()}`,
      productId: product.id,
      name: product.name,
      price: price,
      quantity: quantity,
      saleType: saleType,
      total: price * quantity,
    })
    
    // Close autocomplete after adding
    setShowAutocomplete(false)
  }

  const handleUnitSelected = (unit: any) => {
    if (!selectedProductForUnit) return

    // If unit is null, use base unit
    if (!unit) {
      const price = getProductPrice(selectedProductForUnit)
      const quantity = 1

      if (saleType === "wholesale" && !canAddToWholesale(selectedProductForUnit, quantity)) {
        const minQty = selectedProductForUnit.minimum_wholesale_quantity || selectedProductForUnit.minimumWholesaleQuantity || 1
        alert(`Minimum wholesale quantity for ${selectedProductForUnit.name} is ${minQty}`)
        return
      }

      addToCart({
        id: `cart_${Date.now()}_${Math.random()}`,
        productId: selectedProductForUnit.id,
        name: selectedProductForUnit.name,
        price: price,
        quantity: quantity,
        saleType: saleType,
        total: price * quantity,
      })

      setSelectedProductForUnit(null)
      setShowUnitSelector(false)
      return
    }

    // Use selected unit
    const price = getProductPrice(selectedProductForUnit, unit)
    const quantity = 1
    const stockInUnit = getStockInUnit(selectedProductForUnit, unit)

    if (stockInUnit < quantity) {
      alert(`Insufficient stock. Available: ${stockInUnit} ${unit.unit_name}`)
      return
    }

    if (saleType === "wholesale" && !canAddToWholesale(selectedProductForUnit, quantity)) {
      const minQty = selectedProductForUnit.minimum_wholesale_quantity || selectedProductForUnit.minimumWholesaleQuantity || 1
      alert(`Minimum wholesale quantity for ${selectedProductForUnit.name} is ${minQty}`)
      return
    }

    addToCart({
      id: `cart_${Date.now()}_${Math.random()}`,
      productId: selectedProductForUnit.id,
      unitId: unit.id,
      unitName: unit.unit_name,
      conversionFactor: unit.conversion_factor,
      name: `${selectedProductForUnit.name} (${unit.unit_name})`,
      price: price,
      quantity: quantity,
      saleType: saleType,
      total: price * quantity,
    })

    setSelectedProductForUnit(null)
    setShowUnitSelector(false)
  }

  const handleVariationSelected = (variation: ItemVariation) => {
    if (!selectedProductForVariation) return

    const price = variation.price
    const quantity = 1

    if (saleType === "wholesale" && !canAddToWholesale(selectedProductForVariation, quantity)) {
      const minQty = selectedProductForVariation.minimum_wholesale_quantity || selectedProductForVariation.minimumWholesaleQuantity || 1
      alert(`Minimum wholesale quantity for ${selectedProductForVariation.name} is ${minQty}`)
      return
    }

    addToCart({
      id: `cart_${Date.now()}_${Math.random()}`,
      productId: selectedProductForVariation.id,
      variationId: variation.id,
      name: `${selectedProductForVariation.name} - ${variation.name}`,
      price: price,
      quantity: quantity,
      saleType: saleType,
      total: price * quantity,
    })

    setSelectedProductForVariation(null)
  }

  const handleQuantityChange = (itemId: string, change: number) => {
    const item = cart.find(i => i.id === itemId)
    if (item) {
      const newQuantity = Math.max(1, item.quantity + change)
      
      if (saleType === "wholesale" && item.productId) {
        const product = products.find(p => p.id === item.productId)
        if (product && !canAddToWholesale(product, newQuantity)) {
          const minQty = product.minimum_wholesale_quantity || product.minimumWholesaleQuantity || 1
          alert(`Minimum wholesale quantity is ${minQty}`)
          return
        }
      }
      
      updateCartItem(itemId, { quantity: newQuantity })
    }
  }

  const handleHoldSale = () => {
    const holdId = holdSale()
    alert(`Sale held with ID: ${holdId}`)
  }

  const handleSaleTypeChange = (newType: SaleType) => {
    if (cart.length > 0 && saleType !== newType) {
      const shouldClear = window.confirm(
        `Switching to ${newType} will clear your current cart. Continue?`
      )
      if (shouldClear) {
        clearCart()
        setSelectedCustomer(null)
        setSaleType(newType)
      }
    } else {
      setSaleType(newType)
    }
  }

  // Handle category toggle (multi-select)
  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (categoryId === "all") {
        return prev.includes("all") ? [] : ["all"]
      }
      if (prev.includes("all")) {
        return [categoryId]
      }
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId)
      }
      return [...prev, categoryId]
    })
  }

  // Handle scroll for virtualized rendering
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    setScrollPosition(target.scrollTop)
  }, [])

  // Handle autocomplete selection
  const handleAutocompleteSelect = (product: any) => {
    handleAddToCart(product)
    setSearchTerm("")
    setShowAutocomplete(false)
  }

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Please select a business first</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-8rem)]">
      {/* Header with Sale Type Toggle */}
      <div className="border-b bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold">POS Terminal</h1>
            <p className="text-sm text-muted-foreground">{currentBusiness.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleHoldSale}>
              <Save className="h-4 w-4 mr-2" />
              Hold Sale
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDiscount(true)}>
              <Percent className="h-4 w-4 mr-2" />
              Discount
            </Button>
            {cart.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearCart}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
            {activeShift && (
              <Button variant="outline" size="sm" onClick={() => setShowCloseRegister(true)}>
                <Lock className="h-4 w-4 mr-2" />
                Close Register
              </Button>
            )}
          </div>
        </div>
        
        {/* Sale Type Toggle */}
        <div className="flex items-center gap-4">
          <Tabs value={saleType} onValueChange={(value) => handleSaleTypeChange(value as SaleType)}>
            <TabsList>
              <TabsTrigger value="retail" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Retail
              </TabsTrigger>
              <TabsTrigger value="wholesale" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Wholesale
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Outlet Selector - Only show if multiple outlets */}
          {!isSingleOutlet && activeOutlet && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">Outlet:</span>
              <Badge variant="outline">{activeOutlet.name}</Badge>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content - Products */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search and Filters */}
          <div className="p-4 border-b bg-card space-y-4 shadow-sm">
            {/* Search Bar with Type Selector */}
            <div className="relative">
              <div className="flex gap-2">
                {/* Search Type Dropdown */}
                <Select value={searchType} onValueChange={(value) => setSearchType(value as SearchType)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEARCH_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Search Input with Autocomplete */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    ref={searchInputRef}
                    placeholder={`Search by ${searchType}...`}
                    className="pl-10 rounded-lg shadow-sm"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setShowAutocomplete(true)
                    }}
                    onFocus={() => {
                      if (autocompleteSuggestions.length > 0) {
                        setShowAutocomplete(true)
                      }
                    }}
                    onBlur={() => {
                      // Delay to allow click on autocomplete items
                      setTimeout(() => setShowAutocomplete(false), 200)
                    }}
                  />
                  
                  {/* Autocomplete Dropdown */}
                  {showAutocomplete && autocompleteSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
                      {autocompleteSuggestions.map((product) => (
                        <div
                          key={product.id}
                          className="px-4 py-2 hover:bg-accent cursor-pointer border-b last:border-b-0"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleAutocompleteSelect(product)
                          }}
                        >
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {product.sku && `SKU: ${product.sku}`}
                            {product.barcode && ` | Barcode: ${product.barcode}`}
                            {product.category?.name && ` | ${product.category.name}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Category Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Popover open={showCategoryPopover} onOpenChange={setShowCategoryPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="rounded-lg shadow-sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Categories
                    {selectedCategories.length > 0 && selectedCategories[0] !== "all" && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedCategories.length}
                      </Badge>
                    )}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-3 border-b">
                    <Input
                      placeholder="Search categories..."
                      value={categorySearchTerm}
                      onChange={(e) => setCategorySearchTerm(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  <ScrollArea className="h-[300px]">
                    <div className="p-2">
                      {/* All Categories Option */}
                      <div
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => handleCategoryToggle("all")}
                      >
                        <Checkbox
                          checked={selectedCategories.includes("all") || selectedCategories.length === 0}
                          onCheckedChange={() => handleCategoryToggle("all")}
                        />
                        <label className="text-sm font-medium cursor-pointer flex-1">
                          All Categories
                        </label>
                      </div>
                      
                      {/* Category List - Lazy load if >50 */}
                      {displayCategories.length > 50 ? (
                        // For large lists, show first 50 + load more button
                        <>
                          {displayCategories.slice(0, 50).map((category) => (
                            <div
                              key={category.id}
                              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent cursor-pointer"
                              onClick={() => handleCategoryToggle(category.id)}
                            >
                              <Checkbox
                                checked={selectedCategories.includes(category.id) || 
                                        selectedCategories.includes(category.name)}
                                onCheckedChange={() => handleCategoryToggle(category.id)}
                              />
                              <label className="text-sm cursor-pointer flex-1">
                                {category.name}
                              </label>
                            </div>
                          ))}
                          <div className="p-2 text-xs text-muted-foreground text-center">
                            Showing 50 of {displayCategories.length} categories
                          </div>
                        </>
                      ) : (
                        // Show all if <=50
                        displayCategories.map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent cursor-pointer"
                            onClick={() => handleCategoryToggle(category.id)}
                          >
                            <Checkbox
                              checked={selectedCategories.includes(category.id) || 
                                      selectedCategories.includes(category.name)}
                              onCheckedChange={() => handleCategoryToggle(category.id)}
                            />
                            <label className="text-sm cursor-pointer flex-1">
                              {category.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              
              {/* Selected Categories Badges */}
              {selectedCategories.length > 0 && selectedCategories[0] !== "all" && (
                <div className="flex gap-2 flex-wrap">
                  {selectedCategories.slice(0, 3).map((catId) => {
                    const cat = categories.find(c => c.id === catId || c.name === catId)
                    return cat ? (
                      <Badge key={catId} variant="secondary" className="rounded-lg">
                        {cat.name}
                        <X 
                          className="h-3 w-3 ml-1 cursor-pointer" 
                          onClick={() => handleCategoryToggle(catId)}
                        />
                      </Badge>
                    ) : null
                  })}
                  {selectedCategories.length > 3 && (
                    <Badge variant="secondary" className="rounded-lg">
                      +{selectedCategories.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Product Grid with Virtualized Scrolling */}
          <div 
            ref={productGridRef}
            className="flex-1 overflow-y-auto p-4"
            style={{ height: `${CONTAINER_HEIGHT}px` }}
            onScroll={handleScroll}
          >
            {filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    {saleType === "wholesale" 
                      ? "No wholesale products available. Enable wholesale pricing in product settings."
                      : "No products found"}
                  </p>
                </div>
              </div>
            ) : (
              <div 
                className="relative"
                style={{ height: `${totalHeight}px` }}
              >
                <div
                  className="absolute top-0 left-0 right-0"
                  style={{ transform: `translateY(${Math.floor(scrollPosition / ITEM_HEIGHT) * ITEM_HEIGHT}px)` }}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {visibleProducts.map((product) => {
                      const price = getProductPrice(product)
                      const isWholesale = saleType === "wholesale"
                      const minQty = isWholesale ? (product.minimum_wholesale_quantity || product.minimumWholesaleQuantity || 1) : 1
                      
                      return (
                        <Card
                          key={product.id}
                          className={cn(
                            "cursor-pointer hover:shadow-lg transition-all duration-200 rounded-lg border-2",
                            isWholesale && !product.wholesale_enabled && !product.wholesaleEnabled && "opacity-50"
                          )}
                          onClick={() => handleAddToCart(product)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-2 shadow-inner">
                                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <h3 className="font-medium text-sm leading-tight">{product.name}</h3>
                              <p className="text-xs text-muted-foreground">{product.sku}</p>
                              <div className="space-y-1">
                                <p className="font-bold text-primary text-base">
                                  {formatCurrency(price, currentBusiness)}
                                </p>
                                {isWholesale && product.price && product.price !== price && (
                                  <p className="text-xs text-muted-foreground line-through">
                                    Retail: {formatCurrency(product.price, currentBusiness)}
                                  </p>
                                )}
                                {isWholesale && minQty > 1 && (
                                  <p className="text-xs text-muted-foreground">
                                    Min: {minQty} units
                                  </p>
                                )}
                              </div>
                              {product.stock !== undefined && (
                                <Badge 
                                  variant={product.stock > 10 ? "default" : "destructive"} 
                                  className="text-xs rounded-md"
                                >
                                  Stock: {product.stock}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="w-96 border-l bg-card flex flex-col shadow-lg">
          <CartPanel
            cart={cart}
            onUpdateQuantity={handleQuantityChange}
            onRemove={removeFromCart}
            onApplyDiscount={(id) => setShowDiscount(true)}
            onClearCart={clearCart}
            customer={selectedCustomer}
            onCustomerChange={setSelectedCustomer}
          />

          {/* Payment Section */}
          {cart.length > 0 && (
            <div className="border-t p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(cartTotal, currentBusiness)}</span>
              </div>
              <Button
                className="w-full rounded-lg shadow-md"
                size="lg"
                onClick={() => setShowPayment(true)}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Process {saleType === "wholesale" ? "Wholesale" : "Retail"} Payment
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {/* PaymentModal removed - new payment system will be implemented */}
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
      {receiptData && (
        <ReceiptPreviewModal
          open={showReceipt}
          onOpenChange={setShowReceipt}
          cart={receiptData.cart}
          subtotal={receiptData.subtotal}
          discount={receiptData.discount}
          tax={receiptData.tax}
          total={receiptData.total}
          saleType={receiptData.saleType}
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
    </div>
  )
}
