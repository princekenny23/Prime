import { api, apiEndpoints } from "@/lib/api"

export interface PriceList {
  id: string
  tenant: string
  name: string
  description?: string
  type: "standard" | "wholesale" | "custom"
  customer_group?: string | { id: string; name: string }
  is_active: boolean
  created_at?: string
  updated_at?: string
  product_count?: number
}

export interface PriceListFilters {
  search?: string
  type?: string
  is_active?: boolean
  customer_group?: string
}

export const priceListService = {
  async list(filters?: PriceListFilters): Promise<{ results: PriceList[]; count: number }> {
    const params = new URLSearchParams()
    if (filters?.search) params.append("search", filters.search)
    if (filters?.type) params.append("type", filters.type)
    if (filters?.is_active !== undefined) params.append("is_active", String(filters.is_active))
    if (filters?.customer_group) params.append("customer_group", filters.customer_group)
    
    const query = params.toString()
    const response = await api.get<any>(`${apiEndpoints.priceLists.list}${query ? `?${query}` : ""}`)
    
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

  async get(id: string): Promise<PriceList> {
    return api.get<PriceList>(apiEndpoints.priceLists.get(id))
  },

  async create(data: Partial<PriceList>): Promise<PriceList> {
    return api.post<PriceList>(apiEndpoints.priceLists.create, data)
  },

  async update(id: string, data: Partial<PriceList>): Promise<PriceList> {
    return api.put<PriceList>(apiEndpoints.priceLists.update(id), data)
  },

  async delete(id: string): Promise<void> {
    await api.delete(apiEndpoints.priceLists.delete(id))
  },
}

