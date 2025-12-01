// Mock Products Data for POS Simulation
import type { Product } from "./types/mock-data"

export const mockRetailProducts: Product[] = [
  { id: "retail_1", businessId: "", name: "T-Shirt", sku: "TSH-001", price: 25.00, stock: 50, isActive: true, createdAt: new Date().toISOString() },
  { id: "retail_2", businessId: "", name: "Jeans", sku: "JNS-002", price: 45.00, stock: 30, isActive: true, createdAt: new Date().toISOString() },
  { id: "retail_3", businessId: "", name: "Sneakers", sku: "SNK-003", price: 60.00, stock: 25, isActive: true, createdAt: new Date().toISOString() },
  { id: "retail_4", businessId: "", name: "Backpack", sku: "BPK-004", price: 35.00, stock: 40, isActive: true, createdAt: new Date().toISOString() },
  { id: "retail_5", businessId: "", name: "Watch", sku: "WCH-005", price: 80.00, stock: 15, isActive: true, createdAt: new Date().toISOString() },
]

export const mockRestaurantProducts: Product[] = [
  { id: "rest_1", businessId: "", name: "Burger", sku: "BUR-001", price: 12.00, stock: 999, isActive: true, createdAt: new Date().toISOString() },
  { id: "rest_2", businessId: "", name: "Pizza", sku: "PIZ-002", price: 18.00, stock: 999, isActive: true, createdAt: new Date().toISOString() },
  { id: "rest_3", businessId: "", name: "Pasta", sku: "PST-003", price: 15.00, stock: 999, isActive: true, createdAt: new Date().toISOString() },
  { id: "rest_4", businessId: "", name: "Salad", sku: "SLD-004", price: 10.00, stock: 999, isActive: true, createdAt: new Date().toISOString() },
  { id: "rest_5", businessId: "", name: "Coca Cola", sku: "DRK-005", price: 3.00, stock: 999, isActive: true, createdAt: new Date().toISOString() },
  { id: "rest_6", businessId: "", name: "Water", sku: "DRK-006", price: 2.00, stock: 999, isActive: true, createdAt: new Date().toISOString() },
]

export const mockBarProducts: Product[] = [
  { id: "bar_1", businessId: "", name: "Beer", sku: "BR-001", price: 5.00, stock: 999, isActive: true, createdAt: new Date().toISOString() },
  { id: "bar_2", businessId: "", name: "Wine", sku: "WN-002", price: 8.00, stock: 999, isActive: true, createdAt: new Date().toISOString() },
  { id: "bar_3", businessId: "", name: "Whiskey", sku: "WS-003", price: 12.00, stock: 999, isActive: true, createdAt: new Date().toISOString() },
  { id: "bar_4", businessId: "", name: "Cocktail", sku: "CK-004", price: 10.00, stock: 999, isActive: true, createdAt: new Date().toISOString() },
  { id: "bar_5", businessId: "", name: "Soft Drink", sku: "SD-005", price: 3.00, stock: 999, isActive: true, createdAt: new Date().toISOString() },
]

export const getProductsByIndustry = (industry: "retail" | "restaurant" | "bar"): Product[] => {
  switch (industry) {
    case "retail":
      return mockRetailProducts
    case "restaurant":
      return mockRestaurantProducts
    case "bar":
      return mockBarProducts
    default:
      return []
  }
}

