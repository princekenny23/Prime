// Type Definitions for PrimePOS

export type BusinessType = "wholesale and retail" | "restaurant" | "bar"
export type POSType = "standard" | "single_product"

export interface Business {
  id: string
  name: string
  type: BusinessType
  posType: POSType
  currency: string
  currencySymbol: string
  phone: string
  email: string
  address?: string
  createdAt: string
  settings: BusinessSettings
}

export interface BusinessSettings {
  posMode: "standard" | "restaurant" | "bar"
  receiptTemplate: string
  taxEnabled: boolean
  taxRate: number
  printerSettings?: any
  timezone?: string
  taxId?: string
}

export interface Outlet {
  id: string
  businessId: string
  name: string
  address?: string
  phone?: string
  isActive: boolean
  createdAt: string
}

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "manager" | "cashier" | "staff"
  effective_role?: string
  businessId: string
  outletIds: string[]
  createdAt: string
  tenant?: {
    id: string | number
    name?: string
    type?: string
  } | string | number
  is_saas_admin?: boolean
  permissions?: {
    can_sales: boolean
    can_inventory: boolean
    can_products: boolean
    can_customers: boolean
    can_reports: boolean
    can_staff: boolean
    can_settings: boolean
    can_dashboard: boolean
  }
  staff_role?: {
    id: string | number
    name: string
    description?: string
  }
}

export interface Product {
  id: string
  businessId: string
  name: string
  description?: string
  sku?: string
  barcode?: string
  price: number
  retail_price?: number
  cost?: number
  categoryId?: string
  stock: number
  lowStockThreshold?: number
  is_low_stock?: boolean // Backend-calculated low stock flag
  unit?: string
  variations?: Array<{
    id: string | number
    name: string
    price: number
    cost?: number
    sku?: string
    barcode?: string
    track_inventory: boolean
    low_stock_threshold: number
    total_stock?: number
    stock?: number
    is_low_stock?: boolean
    unit?: string
    is_active?: boolean
  }>
  image?: string
  isActive: boolean
  createdAt: string
}

export interface Category {
  id: string
  businessId: string
  name: string
  description?: string
  createdAt: string
}

export interface Sale {
  id: string
  businessId: string
  outletId: string
  userId: string
  items: SaleItem[]
  subtotal: number
  tax: number
  total: number
  discount?: number
  discountType?: "percentage" | "amount"
  discountReason?: string
  paymentMethod: "cash" | "card" | "mobile" | "tab"
  status: "completed" | "pending" | "refunded"
  createdAt: string
  _raw?: any
}

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  price: number
  total: number
}

export interface Staff {
  id: string
  businessId: string
  name: string
  email: string
  phone?: string
  role: "admin" | "manager" | "cashier" | "staff"
  outletIds: string[]
  isActive: boolean
  createdAt: string
}

