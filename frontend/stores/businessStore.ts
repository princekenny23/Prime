// Zustand Store for Business Management
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Business, Outlet } from "@/lib/types"
import { tenantService } from "@/lib/services/tenantService"
import { outletService } from "@/lib/services/outletService"
import { useRealAPI } from "@/lib/utils/api-config"

interface BusinessState {
  currentBusiness: Business | null
  currentOutlet: Outlet | null
  businesses: Business[]
  outlets: Outlet[]
  isLoading: boolean
  setCurrentBusiness: (businessId: string) => Promise<void>
  setCurrentOutlet: (outletId: string) => void
  loadBusinesses: () => Promise<void>
  loadOutlets: (businessId: string) => Promise<void>
  clearCurrent: () => void
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      currentBusiness: null as Business | null,
      currentOutlet: null as Outlet | null,
      businesses: [] as Business[],
      outlets: [] as Outlet[],
      isLoading: false,
      
      setCurrentBusiness: async (businessId: string): Promise<void> => {
        try {
          set({ isLoading: true })
          const business = await tenantService.get(businessId)
          set({ currentBusiness: business })
          await get().loadOutlets(businessId)
          
          const outlets = get().outlets
          if (outlets.length > 0 && !get().currentOutlet) {
            set({ currentOutlet: outlets[0] })
          }
        } catch (error) {
          console.error("Failed to set current business:", error)
          throw error
        } finally {
          set({ isLoading: false })
        }
      },
      
      setCurrentOutlet: (outletId: string) => {
        const outlet = get().outlets.find((o) => o.id === outletId)
        if (outlet) {
          set({ currentOutlet: outlet })
        }
      },
      
      loadBusinesses: async () => {
        try {
          set({ isLoading: true })
          const businesses = await tenantService.list()
          set({ businesses })
        } catch (error) {
          console.error("Failed to load businesses:", error)
        } finally {
          set({ isLoading: false })
        }
      },
      
      loadOutlets: async (businessId: string) => {
        try {
          // Get outlets from tenant data (which includes outlets) or from outlet service
          // Backend filters by tenant automatically via TenantFilterMixin
          const outlets = await outletService.list()
          // Filter outlets to ensure they belong to this tenant (extra safety check)
          const tenantOutlets = outlets.filter((outlet: any) => {
            const outletTenantId = outlet.tenant 
              ? (typeof outlet.tenant === 'object' ? String(outlet.tenant.id) : String(outlet.tenant))
              : String(outlet.businessId || "")
            return outletTenantId === String(businessId)
          })
          set({ outlets: tenantOutlets })
          
          // Set current outlet if not set and we have outlets
          const current = get().currentOutlet
          if (!current && tenantOutlets.length > 0) {
            const defaultOutlet = tenantOutlets.find((o: any) => o.isActive) || tenantOutlets[0]
            set({ currentOutlet: defaultOutlet })
          }
        } catch (error) {
          console.error("Failed to load outlets:", error)
          set({ outlets: [] })
        }
      },
      
      clearCurrent: () => {
        set({ currentBusiness: null, currentOutlet: null, outlets: [] })
      },
    }),
    {
      name: "primepos-business",
      storage: createJSONStorage(() => localStorage),
    }
  )
)

