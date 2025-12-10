// Type Definitions for PrimePOS

export type BusinessType = "wholesale and retail" | "restaurant" | "bar"

export interface Business {
  id: string
  name: string
  type: BusinessType
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
  businessId: string
  outletIds: string[]
  createdAt: string
  tenant?: {
    id: string | number
    name?: string
    type?: string
  } | string | number
  is_saas_admin?: boolean
}

export interface Product {
  id: string
  businessId: string
  name: string
  description?: string
  sku?: string
  barcode?: string
  price: number
  cost?: number
  categoryId?: string
  stock: number
  lowStockThreshold?: number
  is_low_stock?: boolean // Backend-calculated low stock flag
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
  paymentMethod: "cash" | "card" | "mobile" | "tab"
  status: "completed" | "pending" | "refunded"
  createdAt: string
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

