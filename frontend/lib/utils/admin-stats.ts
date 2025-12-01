// Admin Dashboard Stats Utilities
import { getBusinesses, getOutlets, getUsers, getSales } from "../mockApi"
import type { Business } from "../types/mock-data"
import { tenantService } from "../services/tenantService"
import { outletService } from "../services/outletService"
import { saleService } from "../services/saleService"
import { useRealAPI } from "./api-config"

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
  if (useRealAPI()) {
    try {
      // Use real API - Note: Admin endpoints would need to be implemented
      // For now, this is a placeholder that would use adminService
      // const stats = await adminService.getPlatformAnalytics()
      // return stats
      
      // Fall through to mock for now since admin API may not be fully implemented
    } catch (error) {
      console.error("Failed to load admin stats from API:", error)
      // Fall through to mock
    }
  }
  
  // Mock API fallback
  const businesses = getBusinesses()
  const allOutlets = businesses.flatMap(b => getOutlets(b.id))
  const allUsers = businesses.flatMap(b => getUsers(b.id))
  const allSales = businesses.flatMap(b => getSales(b.id))
  
  const totalRevenue = allSales.reduce((sum, s) => sum + s.total, 0)
  const activeBusinesses = businesses.length // All businesses are active in simulation
  
  const businessesByType = {
    retail: businesses.filter(b => b.type === "retail").length,
    restaurant: businesses.filter(b => b.type === "restaurant").length,
    bar: businesses.filter(b => b.type === "bar").length,
  }
  
  // Get recent businesses (last 5)
  const recentBusinesses = [...businesses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
  
  // Generate platform growth data (last 7 days)
  const platformGrowth = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    
    // Count businesses created on or before this date
    const businessesOnDate = businesses.filter(b => 
      new Date(b.createdAt).toISOString().split("T")[0] <= dateStr
    ).length
    
    // Calculate revenue for this date
    const salesOnDate = allSales.filter(s => s.createdAt.startsWith(dateStr))
    const revenueOnDate = salesOnDate.reduce((sum, s) => sum + s.total, 0)
    
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
    recentBusinesses,
    platformGrowth,
  }
}




