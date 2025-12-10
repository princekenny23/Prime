import { api, apiEndpoints } from "@/lib/api"

export interface KitchenOrderTicket {
  id: string
  kot_number: string
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
  priority: 'normal' | 'high' | 'urgent'
  table?: {
    id: string
    number: string
  } | null
  sale?: {
    id: string
    receipt_number: string
    total: string
  } | null
  items: Array<{
    id: string
    product_name: string
    quantity: number
    kitchen_status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
    notes: string
  }>
  sent_to_kitchen_at: string
  started_at?: string | null
  ready_at?: string | null
  served_at?: string | null
  notes?: string
  created_at: string
  updated_at: string
}

export interface KitchenOrderFilters {
  outlet?: string
  status?: string
  priority?: string
  table?: string
}

export const kitchenService = {
  async list(filters?: KitchenOrderFilters): Promise<{ results: KitchenOrderTicket[]; count?: number }> {
    const params = new URLSearchParams()
    if (filters?.outlet) params.append("outlet", filters.outlet)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.priority) params.append("priority", filters.priority)
    if (filters?.table) params.append("table", filters.table)
    
    const query = params.toString()
    const response = await api.get<any>(`${apiEndpoints.kitchenOrders.list}${query ? `?${query}` : ""}`)
    
    if (Array.isArray(response)) {
      return { results: response, count: response.length }
    }
    return {
      results: response.results || [],
      count: response.count || (response.results?.length || 0),
    }
  },

  async get(id: string): Promise<KitchenOrderTicket> {
    return api.get(apiEndpoints.kitchenOrders.get(id))
  },

  async create(data: { sale_id: number; table_id?: number; priority?: string; notes?: string }): Promise<KitchenOrderTicket> {
    return api.post(apiEndpoints.kitchenOrders.create, data)
  },

  async updateItemStatus(kotId: string, itemId: string, status: string): Promise<any> {
    return api.post(`${apiEndpoints.kitchenOrders.get(kotId)}update_item_status/`, {
      item_id: itemId,
      status: status,
    })
  },

  async getPending(): Promise<KitchenOrderTicket[]> {
    const response = await api.get(`${apiEndpoints.kitchenOrders.list}pending/`)
    return Array.isArray(response) ? response : response.results || []
  },

  async getReady(): Promise<KitchenOrderTicket[]> {
    const response = await api.get(`${apiEndpoints.kitchenOrders.list}ready/`)
    return Array.isArray(response) ? response : response.results || []
  },
}











