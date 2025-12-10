// Admin Dashboard Stats Utilities
import type { Business } from "../types"
import { tenantService } from "../services/tenantService"
import { outletService } from "../services/outletService"
import { saleService } from "../services/saleService"

export interface AdminStats {
  totalBusinesses: number
  totalOutlets: number
  totalUsers: number
  totalRevenue: number
  activeBusinesses: number
  businessesByType: {
    retail: number
    restaurant: number
    bar: number
  }
  recentBusinesses: Business[]
  platformGrowth: Array<{
    date: string
    businesses: number
    revenue: number
  }>
}

/**
 * Generate platform-wide statistics for SaaS admin dashboard
 */
export async function generateAdminStats(): Promise<AdminStats> {
  try {
    // Use real API - Note: Admin endpoints would need to be implemented
    // For now, this is a placeholder that would use adminService
    // const stats = await adminService.getPlatformAnalytics()
    // return stats
    
    // For now, fetch data from services
    const businesses = await tenantService.list()
    const allOutlets: any[] = []
    const allUsers: any[] = []
    const allSales: any[] = []
    
    // Fetch outlets, users, and sales for all businesses
    for (const business of businesses) {
      try {
        const outlets = await outletService.list()
        allOutlets.push(...outlets)
        
        // Note: User service would need to be implemented
        // const users = await userService.list({ tenant: business.id })
        // allUsers.push(...users)
        
        const sales = await saleService.list({ tenant: business.id })
        const salesArray = Array.isArray(sales) ? sales : sales.results || []
        allSales.push(...salesArray)
      } catch (error) {
        console.error(`Failed to load data for business ${business.id}:`, error)
      }
    }
    
    const totalRevenue = allSales.reduce((sum: number, s: any) => sum + (s.total || 0), 0)
    const activeBusinesses = businesses.length
    
    const businessesByType = {
      retail: businesses.filter((b: any) => b.type === "wholesale and retail").length,
      restaurant: businesses.filter((b: any) => b.type === "restaurant").length,
      bar: businesses.filter((b: any) => b.type === "bar").length,
    }
    
    // Get recent businesses (last 5)
    const recentBusinesses = [...businesses]
      .sort((a: any, b: any) => new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime())
      .slice(0, 5)
    
    // Generate platform growth data (last 7 days)
    const platformGrowth = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      
      // Count businesses created on or before this date
      const businessesOnDate = businesses.filter((b: any) => {
        const createdAt = b.created_at || b.createdAt
        if (!createdAt) return false
        return new Date(createdAt).toISOString().split("T")[0] <= dateStr
      }).length
      
      // Calculate revenue for this date
      const salesOnDate = allSales.filter((s: any) => {
        const saleDate = s.created_at || s.createdAt || s.date
        return saleDate && saleDate.startsWith(dateStr)
      })
      const revenueOnDate = salesOnDate.reduce((sum: number, s: any) => sum + (s.total || 0), 0)
      
      platformGrowth.push({
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        businesses: businessesOnDate,
        revenue: revenueOnDate,
      })
    }
    
    return {
      totalBusinesses: businesses.length,
      totalOutlets: allOutlets.length,
      totalUsers: allUsers.length,
      totalRevenue,
      activeBusinesses,
      businessesByType,
      recentBusinesses: recentBusinesses as Business[],
      platformGrowth,
    }
  } catch (error) {
    console.error("Failed to load admin stats from API:", error)
    // Return empty stats on error
    return {
      totalBusinesses: 0,
      totalOutlets: 0,
      totalUsers: 0,
      totalRevenue: 0,
      activeBusinesses: 0,
      businessesByType: {
        retail: 0,
        restaurant: 0,
        bar: 0,
      },
      recentBusinesses: [],
      platformGrowth: [],
    }
  }
}




