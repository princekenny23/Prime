import { api, apiEndpoints } from "@/lib/api"

export interface CustomerGroup {
  id: string
  tenant: string
  name: string
  description?: string
  type: "standard" | "wholesale" | "vip" | "discount"
  discount?: number
  is_active: boolean
  created_at?: string
  updated_at?: string
  customer_count?: number
}

export interface CustomerGroupFilters {
  search?: string
  type?: string
  is_active?: boolean
}

export const customerGroupService = {
  async list(filters?: CustomerGroupFilters): Promise<{ results: CustomerGroup[]; count: number }> {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.type) params.append("type", filters.type)
    if (filters?.is_active !== undefined) params.append("is_active", String(filters.is_active))
    
    const query = params.toString()
    const response = await api.get<any>(`${apiEndpoints.customerGroups.list}${query ? `?${query}` : ""}`)
    
    if (Array.isArray(response)) {
      return {
        results: response,
        count: response.length,
      }
    }
    
    return {
      results: response.results || [],
      count: response.count || 0,
    }
  },

  async get(id: string): Promise<CustomerGroup> {
    return api.get<CustomerGroup>(apiEndpoints.customerGroups.get(id))
  },

  async create(data: Partial<CustomerGroup>): Promise<CustomerGroup> {
    return api.post<CustomerGroup>(apiEndpoints.customerGroups.create, data)
  },

  async update(id: string, data: Partial<CustomerGroup>): Promise<CustomerGroup> {
    return api.put<CustomerGroup>(apiEndpoints.customerGroups.update(id), data)
  },

  async delete(id: string): Promise<void> {
    await api.delete(apiEndpoints.customerGroups.delete(id))
  },
}

