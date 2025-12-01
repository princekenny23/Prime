// Zustand Store for Authentication
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { User } from "@/lib/types/mock-data"
import { getUserByEmail, addUser, updateUser } from "@/lib/mockApi"
import { authService } from "@/lib/services/authService"
import { useRealAPI } from "@/lib/utils/api-config"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true })
        
        try {
          // ALWAYS use real API for login - bypass useRealAPI() check
          // Check if API URL is configured
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
          const shouldUseReal = apiUrl.includes("localhost:8000") || process.env.NEXT_PUBLIC_USE_REAL_API === "true"
          
          if (shouldUseReal) {
            // Use real API
            console.log("Using real API for login")
            const response = await authService.login(email, password)
            console.log("Login successful, setting user state")
            set({ 
              user: response.user, 
              isAuthenticated: true,
              isLoading: false 
            })
            return { success: true, user: response.user }
          } else {
            console.log("Using mock API (real API not configured)")
            // Use mock API (simulation mode)
            if (!email || !email.trim()) {
              set({ isLoading: false })
              return { success: false, error: "Email is required" }
            }
            
            const emailLower = email.trim().toLowerCase()
            const isSaaSAdmin = emailLower === "admin@primepos.com" || 
                               emailLower.includes("@primepos") ||
                               (emailLower.includes("admin") && password === "admin123")
            
            let user = getUserByEmail(email.trim())
            
            if (!user) {
              const emailParts = email.trim().split("@")
              user = addUser({
                id: `user_${Date.now()}`,
                email: email.trim(),
                name: emailParts[0] || "User",
                role: "admin",
                businessId: isSaaSAdmin ? "" : "",
                outletIds: [],
                createdAt: new Date().toISOString(),
              })
            } else {
              if (isSaaSAdmin && user.businessId) {
                user = updateUser(user.id, { businessId: "" }) || user
              }
            }
            
            set({ user, isAuthenticated: true, isLoading: false })
            return { success: true, user }
          }
        } catch (error: any) {
          set({ isLoading: false })
          return { 
            success: false, 
            error: error.message || "Login failed. Please check your credentials." 
          }
        }
      },
      
      logout: async () => {
        try {
          // Always try to logout from API if token exists
          const hasToken = typeof window !== "undefined" && !!localStorage.getItem("authToken")
          if (hasToken) {
            await authService.logout()
          }
        } catch (error) {
          console.error("Logout error:", error)
        } finally {
          // Clear all auth data
          set({ user: null, isAuthenticated: false })
          if (typeof window !== "undefined") {
            localStorage.removeItem("authToken")
            localStorage.removeItem("refreshToken")
            localStorage.removeItem("primepos-auth")
          }
        }
      },
      
      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user })
      },
      
      refreshUser: async () => {
        if (!useRealAPI()) return
        
        try {
          const user = await authService.getCurrentUser()
          set({ user, isAuthenticated: true })
        } catch (error) {
          console.error("Failed to refresh user:", error)
          set({ user: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: "primepos-auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
)

