import { api, apiEndpoints } from "@/lib/api"

export interface Delivery {
  id: string
  delivery_number: string
  sale_id: string
  sale?: {
    id: string
    receipt_number: string
    total: number
  }
  customer_id?: string
  customer_name?: string
  outlet: string
  outlet_name?: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'completed' | 'cancelled' | 'failed'
  delivery_method: 'own_vehicle' | 'third_party' | 'customer_pickup' | 'external_shipping'
  delivery_address: string
  delivery_city?: string
  delivery_state?: string
  delivery_postal_code?: string
  delivery_country?: string
  delivery_contact_name?: string
  delivery_contact_phone?: string
  scheduled_date?: string
  scheduled_time_start?: string
  scheduled_time_end?: string
  actual_delivery_date?: string
  courier_name?: string
  tracking_number?: string
  driver_name?: string
  vehicle_number?: string
  delivery_fee: number
  shipping_cost: number
  items: Array<{
    id: string
    sale_item_id: string
    product_name: string
    quantity: number
    is_delivered: boolean
    delivered_quantity: number
  }>
  notes?: string
  customer_notes?: string
  delivery_instructions?: string
  created_by?: string
  created_by_email?: string
  assigned_to?: string
  assigned_to_email?: string
  delivered_by?: string
  delivered_by_email?: string
  created_at: string
  updated_at: string
  confirmed_at?: string
  dispatched_at?: string
  completed_at?: string
  status_history?: Array<{
    id: string
    status: string
    previous_status: string
    changed_by_email?: string
    notes?: string
    created_at: string
  }>
}

export interface DeliveryFilters {
  sale_id?: string
  customer_id?: string
  status?: string
  delivery_method?: string
  scheduled_date?: string
  search?: string
}

export const deliveryService = {
  async list(filters?: DeliveryFilters): Promise<{ results: Delivery[]; count?: number }> {
    const params = new URLSearchParams()
    if (filters?.sale_id) params.append("sale", filters.sale_id)
    if (filters?.customer_id) params.append("customer", filters.customer_id)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.delivery_method) params.append("delivery_method", filters.delivery_method)
    if (filters?.scheduled_date) params.append("scheduled_date", filters.scheduled_date)
    if (filters?.search) params.append("search", filters.search)
    
    const query = params.toString()
    const response = await api.get<any>(`${apiEndpoints.deliveries.list}${query ? `?${query}` : ""}`)
    return {
      results: Array.isArray(response) ? response : (response.results || []),
      count: response.count || (Array.isArray(response) ? response.length : 0),
    }
  },

  async get(id: string): Promise<Delivery> {
    return api.get(apiEndpoints.deliveries.get(id))
  },

  async create(data: Partial<Delivery>): Promise<Delivery> {
    return api.post(apiEndpoints.deliveries.create, data)
  },

  async update(id: string, data: Partial<Delivery>): Promise<Delivery> {
    return api.put(apiEndpoints.deliveries.update(id), data)
  },

  async delete(id: string): Promise<void> {
    return api.delete(apiEndpoints.deliveries.delete(id))
  },

  async confirm(id: string): Promise<Delivery> {
    return api.post(apiEndpoints.deliveries.confirm(id))
  },

  async dispatch(id: string, status: 'ready' | 'in_transit', data?: { tracking_number?: string; courier_name?: string; driver_name?: string; vehicle_number?: string; notes?: string }): Promise<Delivery> {
    return api.post(apiEndpoints.deliveries.dispatch(id), { status, ...data })
  },

  async complete(id: string, notes?: string): Promise<Delivery> {
    return api.post(apiEndpoints.deliveries.complete(id), { notes })
  },

  async cancel(id: string, reason?: string): Promise<Delivery> {
    return api.post(apiEndpoints.deliveries.cancel(id), { reason })
  },

  async getPending(): Promise<Delivery[]> {
    const response = await api.get<any>(apiEndpoints.deliveries.pending)
    return Array.isArray(response) ? response : (response.results || [])
  },

  async getScheduledToday(): Promise<Delivery[]> {
    const response = await api.get<any>(apiEndpoints.deliveries.scheduledToday)
    return Array.isArray(response) ? response : (response.results || [])
  },
}

