import { api, apiEndpoints } from "@/lib/api"
import type { Business } from "@/lib/types/mock-data"

export const tenantService = {
  async list(): Promise<Business[]> {
    const response = await api.get<{ results: Business[] } | Business[]>(apiEndpoints.tenants.list)
    // Handle both paginated and non-paginated responses
    if (Array.isArray(response)) {
      return response
    }
    return response.results || []
  },

  async get(id: string): Promise<Business & { outlets?: any[] }> {
    const response = await api.get<any>(apiEndpoints.tenants.get(id))
    
    // Transform backend response to frontend format
    return {
      id: String(response.id),
      name: response.name,
      type: response.type,
      currency: response.currency || "MWK",
      currencySymbol: response.currency_symbol || response.currencySymbol || "MK",
      phone: response.phone || "",
      email: response.email || "",
      address: response.address || "",
      createdAt: response.created_at || response.createdAt || new Date().toISOString(),
      settings: response.settings || {
        posMode: "standard",
        receiptTemplate: "standard",
        taxEnabled: false,
        taxRate: 0,
      },
      outlets: response.outlets || [], // Include outlets from backend
    } as Business & { outlets?: any[] }
  },

  async getCurrent(): Promise<Business> {
    return api.get(`${apiEndpoints.tenants.list}current/`)
  },

  async create(data: Partial<Business>): Promise<Business> {
    // Transform frontend data to backend format
    const backendData: any = {
      name: data.name,
      type: data.type,
      currency: data.currency || "MWK",
      currency_symbol: data.currencySymbol || data.currency_symbol || "MK",
      phone: data.phone || "",
      email: data.email || "",
      address: data.address || "",
      settings: data.settings || {},
    }
    
    const response = await api.post<any>(apiEndpoints.tenants.create, backendData)
    
    // Transform backend response to frontend format
    return {
      id: String(response.id),
      name: response.name,
      type: response.type,
      currency: response.currency,
      currencySymbol: response.currency_symbol || response.currencySymbol || "MK",
      phone: response.phone || "",
      email: response.email || "",
      address: response.address || "",
      createdAt: response.created_at || response.createdAt || new Date().toISOString(),
      settings: response.settings || {},
    } as Business
  },

  async update(id: string, data: Partial<Business>): Promise<Business> {
    return api.put(apiEndpoints.tenants.update(id), data)
  },
}

