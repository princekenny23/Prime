import { api, apiEndpoints } from "@/lib/api"

export interface ProductSupplier {
  id: string
  tenant: string
  product: string | { id: string; name: string }
  supplier: string | { id: string; name: string }
  reorder_quantity: number
  reorder_point: number
  unit_cost?: number
  is_preferred: boolean
  is_active: boolean
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface ProductSupplierFilters {
  product?: string
  supplier?: string
  is_preferred?: boolean
  is_active?: boolean
}

export const productSupplierService = {
  async list(filters?: ProductSupplierFilters): Promise<{ results: ProductSupplier[]; count: number }> {
    const params = new URLSearchParams()
    if (filters?.product) params.append("product", filters.product)
    if (filters?.supplier) params.append("supplier", filters.supplier)
    if (filters?.is_preferred !== undefined) params.append("is_preferred", String(filters.is_preferred))
    if (filters?.is_active !== undefined) params.append("is_active", String(filters.is_active))
    
    const query = params.toString()
    const response = await api.get<any>(`${apiEndpoints.productSuppliers.list}${query ? `?${query}` : ""}`)
    
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

  async get(id: string): Promise<ProductSupplier> {
    return api.get<ProductSupplier>(apiEndpoints.productSuppliers.get(id))
  },

  async create(data: Partial<ProductSupplier>): Promise<ProductSupplier> {
    return api.post<ProductSupplier>(apiEndpoints.productSuppliers.create, data)
  },

  async update(id: string, data: Partial<ProductSupplier>): Promise<ProductSupplier> {
    return api.put<ProductSupplier>(apiEndpoints.productSuppliers.update(id), data)
  },

  async delete(id: string): Promise<void> {
    await api.delete(apiEndpoints.productSuppliers.delete(id))
  },
}

