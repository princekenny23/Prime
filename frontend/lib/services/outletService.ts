import { api, apiEndpoints } from "@/lib/api"
import type { Outlet } from "@/lib/types/mock-data"

export interface Till {
  id: string
  name: string
  outlet: string
  is_active: boolean
  is_in_use: boolean
}

export const outletService = {
  async list(): Promise<Outlet[]> {
    const response = await api.get<{ results: Outlet[] } | Outlet[]>(apiEndpoints.outlets.list)
    // Handle both paginated and non-paginated responses
    const outlets = Array.isArray(response) ? response : (response.results || [])
    
    // Transform backend response to frontend format
    return outlets.map((outlet: any) => {
      const tenantIdValue = outlet.tenant 
        ? (typeof outlet.tenant === 'object' ? String(outlet.tenant.id) : String(outlet.tenant))
        : String(outlet.businessId || "")
      
      return {
        id: String(outlet.id),
        businessId: tenantIdValue,
        name: outlet.name,
        address: outlet.address || "",
        phone: outlet.phone || "",
        isActive: outlet.is_active !== undefined ? outlet.is_active : (outlet.isActive !== undefined ? outlet.isActive : true),
        createdAt: outlet.created_at || outlet.createdAt || new Date().toISOString(),
      } as Outlet
    })
  },

  async get(id: string): Promise<Outlet> {
    return api.get(apiEndpoints.outlets.get(id))
  },

  async create(data: Partial<Outlet>): Promise<Outlet> {
    // Transform frontend data to backend format
    // Backend expects tenant as FK (integer ID or object)
    const tenantId = data.tenant || data.businessId
    
    const backendData: any = {
      tenant: tenantId ? (typeof tenantId === 'string' ? parseInt(tenantId) : tenantId) : undefined,
      name: data.name,
      address: data.address || "",
      phone: data.phone || "",
      email: data.email || "",
      is_active: data.isActive !== undefined ? data.isActive : (data.is_active !== undefined ? data.is_active : true),
    }
    
    const response = await api.post<any>(apiEndpoints.outlets.create, backendData)
    
    // Transform backend response to frontend format
    const tenantIdValue = response.tenant 
      ? (typeof response.tenant === 'object' ? String(response.tenant.id) : String(response.tenant))
      : String(response.businessId || "")
    
    return {
      id: String(response.id),
      businessId: tenantIdValue,
      name: response.name,
      address: response.address || "",
      phone: response.phone || "",
      isActive: response.is_active !== undefined ? response.is_active : (response.isActive !== undefined ? response.isActive : true),
      createdAt: response.created_at || response.createdAt || new Date().toISOString(),
    } as Outlet
  },

  async update(id: string, data: Partial<Outlet>): Promise<Outlet> {
    return api.put(apiEndpoints.outlets.update(id), data)
  },

  async getTills(outletId: string): Promise<Till[]> {
    return api.get(`${apiEndpoints.outlets.get(outletId)}tills/`)
  },
}

