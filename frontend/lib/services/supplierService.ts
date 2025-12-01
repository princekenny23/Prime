import { api, apiEndpoints } from "@/lib/api"

export interface Supplier {
  id: string
  tenant: string
  outlet?: string
  outlet_id?: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  tax_id?: string
  payment_terms?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SupplierFilters {
  outlet?: string
  is_active?: boolean
  search?: string
}

export const supplierService = {
  async list(filters?: SupplierFilters): Promise<{ results: Supplier[]; count?: number }> {
    const params = new URLSearchParams()
    if (filters?.outlet) params.append("outlet", filters.outlet)
    if (filters?.is_active !== undefined) params.append("is_active", String(filters.is_active))
    if (filters?.search) params.append("search", filters.search)
    
    const query = params.toString()
    const response = await api.get<any>(`${apiEndpoints.suppliers.list}${query ? `?${query}` : ""}`)
    return {
      results: Array.isArray(response) ? response : (response.results || []),
      count: response.count || (Array.isArray(response) ? response.length : 0),
    }
  },

  async get(id: string): Promise<Supplier> {
    return api.get(apiEndpoints.suppliers.get(id))
  },

  async create(data: Partial<Supplier>): Promise<Supplier> {
    return api.post(apiEndpoints.suppliers.create, data)
  },

  async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
    return api.put(apiEndpoints.suppliers.update(id), data)
  },

  async delete(id: string): Promise<void> {
    return api.delete(apiEndpoints.suppliers.delete(id))
  },
}

