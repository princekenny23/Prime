// Mock API Layer - Simulates backend API using localStorage
import type {
  Business,
  Outlet,
  User,
  Product,
  Category,
  Sale,
  Staff,
  MockDatabase,
  BusinessType,
} from "./types/mock-data"

const STORAGE_KEY = "primepos_mock_db"

// Initialize empty database
const getEmptyDB = (): MockDatabase => ({
  businesses: [],
  outlets: [],
  users: [],
  products: [],
  categories: [],
  sales: [],
  staff: [],
})

// Load database from localStorage
export const loadDB = (): MockDatabase => {
  if (typeof window === "undefined") return getEmptyDB()
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error("Error loading mock DB:", error)
  }
  
  return getEmptyDB()
}

// Save database to localStorage
export const saveDB = (db: MockDatabase): void => {
  if (typeof window === "undefined") return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch (error) {
    console.error("Error saving mock DB:", error)
  }
}

// Business Operations
export const getBusinesses = (): Business[] => {
  return loadDB().businesses
}

export const getBusiness = (id: string): Business | undefined => {
  return loadDB().businesses.find((b) => b.id === id)
}

export const addBusiness = (business: Business): Business => {
  const db = loadDB()
  db.businesses.push(business)
  saveDB(db)
  return business
}

export const updateBusiness = (id: string, updates: Partial<Business>): Business | null => {
  const db = loadDB()
  const index = db.businesses.findIndex((b) => b.id === id)
  if (index === -1) return null
  
  db.businesses[index] = { ...db.businesses[index], ...updates }
  saveDB(db)
  return db.businesses[index]
}

// Outlet Operations
export const getOutlets = (businessId?: string): Outlet[] => {
  const db = loadDB()
  if (businessId) {
    return db.outlets.filter((o) => o.businessId === businessId)
  }
  return db.outlets
}

export const getOutlet = (id: string): Outlet | undefined => {
  return loadDB().outlets.find((o) => o.id === id)
}

export const addOutlet = (outlet: Outlet): Outlet => {
  const db = loadDB()
  db.outlets.push(outlet)
  saveDB(db)
  return outlet
}

// User Operations
export const getUsers = (businessId?: string): User[] => {
  const db = loadDB()
  if (businessId) {
    return db.users.filter((u) => u.businessId === businessId)
  }
  return db.users
}

export const getUser = (id: string): User | undefined => {
  return loadDB().users.find((u) => u.id === id)
}

export const getUserByEmail = (email: string): User | undefined => {
  return loadDB().users.find((u) => u.email === email)
}

export const addUser = (user: User): User => {
  const db = loadDB()
  db.users.push(user)
  saveDB(db)
  return user
}

export const updateUser = (id: string, updates: Partial<User>): User | null => {
  const db = loadDB()
  const index = db.users.findIndex((u) => u.id === id)
  if (index === -1) return null
  
  db.users[index] = { ...db.users[index], ...updates }
  saveDB(db)
  return db.users[index]
}

// Product Operations
export const getProducts = (businessId?: string): Product[] => {
  const db = loadDB()
  if (businessId) {
    return db.products.filter((p) => p.businessId === businessId)
  }
  return db.products
}

export const getProduct = (id: string): Product | undefined => {
  return loadDB().products.find((p) => p.id === id)
}

export const addProduct = (product: Product): Product => {
  const db = loadDB()
  db.products.push(product)
  saveDB(db)
  return product
}

export const updateProduct = (id: string, updates: Partial<Product>): Product | null => {
  const db = loadDB()
  const index = db.products.findIndex((p) => p.id === id)
  if (index === -1) return null
  
  db.products[index] = { ...db.products[index], ...updates }
  saveDB(db)
  return db.products[index]
}

export const deleteProduct = (id: string): boolean => {
  const db = loadDB()
  const index = db.products.findIndex((p) => p.id === id)
  if (index === -1) return false
  
  db.products.splice(index, 1)
  saveDB(db)
  return true
}

// Category Operations
export const getCategories = (businessId?: string): Category[] => {
  const db = loadDB()
  if (businessId) {
    return db.categories.filter((c) => c.businessId === businessId)
  }
  return db.categories
}

export const addCategory = (category: Category): Category => {
  const db = loadDB()
  db.categories.push(category)
  saveDB(db)
  return category
}

// Sale Operations
export const getSales = (businessId?: string, outletId?: string): Sale[] => {
  const db = loadDB()
  let sales = db.sales
  
  if (businessId) {
    sales = sales.filter((s) => s.businessId === businessId)
  }
  if (outletId) {
    sales = sales.filter((s) => s.outletId === outletId)
  }
  
  return sales
}

export const getSalesToday = (businessId?: string, outletId?: string): Sale[] => {
  const today = new Date().toISOString().split("T")[0]
  return getSales(businessId, outletId).filter((s) => 
    s.createdAt.startsWith(today)
  )
}

export const addSale = (sale: Sale): Sale => {
  const db = loadDB()
  db.sales.push(sale)
  saveDB(db)
  return sale
}

// Staff Operations
export const getStaff = (businessId?: string): Staff[] => {
  const db = loadDB()
  if (businessId) {
    return db.staff.filter((s) => s.businessId === businessId)
  }
  return db.staff
}

export const addStaff = (staff: Staff): Staff => {
  const db = loadDB()
  db.staff.push(staff)
  saveDB(db)
  return staff
}

// Dashboard Stats
export const getDashboardStats = (businessId: string, outletId?: string) => {
  const sales = getSales(businessId, outletId)
  const salesToday = getSalesToday(businessId, outletId)
  const products = getProducts(businessId)
  const outlets = getOutlets(businessId)
  const staff = getStaff(businessId)
  
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0)
  const todaySales = salesToday.reduce((sum, s) => sum + s.total, 0)
  const totalProducts = products.length
  const activeOutlets = outlets.filter((o) => o.isActive).length
  const activeStaff = staff.filter((s) => s.isActive).length
  
  const lowStockProducts = products.filter(
    (p) => p.lowStockThreshold && p.stock <= p.lowStockThreshold
  )
  
  return {
    totalSales,
    todaySales,
    totalProducts,
    activeOutlets,
    activeStaff,
    lowStockCount: lowStockProducts.length,
    recentSales: sales.slice(-10).reverse(),
  }
}

// Clear all data (for testing)
export const clearMockDB = (): void => {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}

