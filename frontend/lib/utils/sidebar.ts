// Sidebar Configuration Utilities
import type { BusinessType } from "../types/mock-data"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Building2,
  History,
  Shield,
  Settings,
  RotateCcw,
  Truck,
  ClipboardList,
  Square,
  ChefHat,
  BookOpen,
  Calendar,
  Wine,
  CreditCard,
  FlaskConical,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  permission: string
}

// Full navigation menu (common for all industries)
export const fullNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { name: "Sales", href: "/dashboard/sales", icon: ShoppingCart, permission: "sales" },
  { name: "POS", href: "/dashboard/pos", icon: ShoppingCart, permission: "pos" },
  { name: "Products", href: "/dashboard/products", icon: Package, permission: "products" },
  { name: "Inventory", href: "/dashboard/inventory", icon: Package, permission: "inventory" },
  { name: "Office", href: "/dashboard/office", icon: Building2, permission: "office" },
  { name: "Shift History", href: "/dashboard/shift-history", icon: History, permission: "pos" },
  { name: "Admin", href: "/admin", icon: Shield, permission: "admin" },
  { name: "Settings", href: "/dashboard/settings", icon: Settings, permission: "settings" },
]

// Retail-specific navigation items
export const retailNavigation: NavigationItem[] = [
  { name: "Returns", href: "/dashboard/retail/returns", icon: RotateCcw, permission: "sales" },
  { name: "Suppliers", href: "/dashboard/retail/suppliers", icon: Truck, permission: "inventory" },
  { name: "Purchase Orders", href: "/dashboard/retail/purchase-orders", icon: ClipboardList, permission: "inventory" },
]

// Restaurant-specific navigation items
export const restaurantNavigation: NavigationItem[] = [
  { name: "Tables", href: "/dashboard/restaurant/tables", icon: Square, permission: "pos" },
  { name: "Kitchen Orders", href: "/dashboard/restaurant/kitchen-orders", icon: ChefHat, permission: "pos" },
  { name: "Menu Builder", href: "/dashboard/restaurant/menu", icon: BookOpen, permission: "products" },
  { name: "Reservations", href: "/dashboard/restaurant/reservations", icon: Calendar, permission: "pos" },
]

// Bar-specific navigation items
export const barNavigation: NavigationItem[] = [
  { name: "Drinks Menu", href: "/dashboard/bar/drinks", icon: Wine, permission: "products" },
  { name: "Bar Tabs", href: "/dashboard/bar/tabs", icon: CreditCard, permission: "sales" },
  { name: "Mix Recipes", href: "/dashboard/bar/recipes", icon: FlaskConical, permission: "products" },
]

/**
 * Get sidebar navigation configuration for a specific industry
 * Combines fullNavigation with industry-specific items
 * 
 * @param industry - The business industry type (retail, restaurant, bar)
 * @returns Combined navigation array
 */
export function getIndustrySidebarConfig(
  industry: BusinessType | null | undefined
): NavigationItem[] {
  const baseNavigation = [...fullNavigation]
  
  if (!industry) {
    return baseNavigation
  }
  
  switch (industry) {
    case "retail":
      return [...baseNavigation, ...retailNavigation]
    case "restaurant":
      return [...baseNavigation, ...restaurantNavigation]
    case "bar":
      return [...baseNavigation, ...barNavigation]
    default:
      return baseNavigation
  }
}

