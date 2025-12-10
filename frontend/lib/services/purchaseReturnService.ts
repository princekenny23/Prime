import { api, apiEndpoints } from "@/lib/api"

export interface PurchaseReturnItem {
  id: string
  product: any
  product_id: number
  purchase_order_item?: any
  purchase_order_item_id?: number
  quantity: number
  unit_price: string
  total: string
  reason?: string
  notes?: string
}

export interface PurchaseReturn {
  id: string
  tenant: string
  supplier: any
  supplier_id: number
  purchase_order?: any
  purchase_order_id?: number
  outlet: any
  outlet_id: number
  return_number: string
  return_date: string
  status: 'draft' | 'pending' | 'approved' | 'returned' | 'cancelled'
  reason: string
  total: string
  notes?: string
  items: PurchaseReturnItem[]
  items_data?: Array<{
    product_id: number
    purchase_order_item_id?: number
    quantity: number
    unit_price: string
    reason?: string
    notes?: string
  }>
  created_by?: string
  created_at: string
  updated_at: string
  returned_at?: string
}

export interface PurchaseReturnFilters {
  supplier?: string
  outlet?: string
  status?: string
  search?: string
}

export const purchaseReturnService = {
  async list(filters?: PurchaseReturnFilters): Promise<{ results: PurchaseReturn[]; count?: number }> {
    const params = new URLSearchParams()
    if (filters?.supplier) params.append("supplier", filters.supplier)
    if (filters?.outlet) params.append("outlet", filters.outlet)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.search) params.append("search", filters.search)
    
    const query = params.toString()
    const response = await api.get<any>(`${apiEndpoints.purchaseReturns.list}${query ? `?${query}` : ""}`)
    return {
      results: Array.isArray(response) ? response : (response.results || []),
      count: response.count || (Array.isArray(response) ? response.length : 0),
    }
  },

  async get(id: string): Promise<PurchaseReturn> {
    return api.get(apiEndpoints.purchaseReturns.get(id))
  },

  async create(data: Partial<PurchaseReturn>): Promise<PurchaseReturn> {
    return api.post(apiEndpoints.purchaseReturns.create, data)
  },

  async update(id: string, data: Partial<PurchaseReturn>): Promise<PurchaseReturn> {
    return api.put(apiEndpoints.purchaseReturns.update(id), data)
  },

  async delete(id: string): Promise<void> {
    return api.delete(apiEndpoints.purchaseReturns.delete(id))
  },

  async approve(id: string): Promise<PurchaseReturn> {
    return api.post(apiEndpoints.purchaseReturns.approve(id))
  },

  async complete(id: string): Promise<PurchaseReturn> {
    return api.post(apiEndpoints.purchaseReturns.complete(id))
  },
}

