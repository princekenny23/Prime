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
  outlet?: string
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
    if (filters?.outlet) params.append("outlet", filters.outlet)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.delivery_method) params.append("delivery_method", filters.delivery_method)
    if (filters?.scheduled_date) params.append("scheduled_date", filters.scheduled_date)
    if (filters?.search) params.append("search", filters.search)
    
    const query = params.toString()
    const response = await api.get<any>(`${apiEndpoints.deliveries.list}${query ? `?${query}` : ""}`)
    const deliveries = Array.isArray(response) ? response : (response.results || [])
    
      // Transform backend response to frontend format
      const transformedDeliveries = deliveries.map((delivery: any) => this.transformDelivery(delivery))
    
    return {
      results: transformedDeliveries,
      count: response.count || transformedDeliveries.length,
    }
  },

  async get(id: string): Promise<Delivery> {
    const delivery = await api.get<any>(apiEndpoints.deliveries.get(id))
    return this.transformDelivery(delivery)
  },

  async create(data: Partial<Delivery>): Promise<Delivery> {
    // Transform frontend data to backend format
    // Ensure IDs are integers and numeric fields are properly formatted
    const backendData: any = {
      sale_id: typeof data.sale_id === 'string' ? parseInt(String(data.sale_id), 10) : data.sale_id,
      outlet: typeof data.outlet === 'string' ? parseInt(String(data.outlet), 10) : data.outlet,
      customer: data.customer ? (typeof data.customer === 'string' ? parseInt(String(data.customer), 10) : data.customer) : undefined,
      delivery_address: data.delivery_address || "",
      delivery_city: data.delivery_city || "",
      delivery_state: data.delivery_state || "",
      delivery_postal_code: data.delivery_postal_code || "",
      delivery_country: data.delivery_country || "",
      delivery_contact_name: data.delivery_contact_name || "",
      delivery_contact_phone: data.delivery_contact_phone || "",
      delivery_method: data.delivery_method || "own_vehicle",
      delivery_fee: data.delivery_fee ? String(data.delivery_fee) : "0",
      shipping_cost: data.shipping_cost ? String(data.shipping_cost) : "0",
      delivery_instructions: data.delivery_instructions || "",
      notes: data.notes || "",
      status: data.status || "pending",
    }
    
    // Remove undefined fields
    if (!backendData.customer) delete backendData.customer
    
    const delivery = await api.post<any>(apiEndpoints.deliveries.create, backendData)
    return this.transformDelivery(delivery)
  },

  // Helper function to transform delivery response
  private transformDelivery(delivery: any): Delivery {
    return {
      ...delivery,
      id: String(delivery.id),
      sale_id: String(delivery.sale?.id || delivery.sale_id || ""),
      outlet: String(delivery.outlet || ""),
      customer_id: delivery.customer ? String(delivery.customer) : undefined,
      // Transform delivery_items to items
      items: (delivery.delivery_items || []).map((item: any) => ({
        id: String(item.id),
        sale_item_id: String(item.sale_item?.id || item.sale_item_id || ""),
        product_name: item.sale_item?.product_name || item.sale_item?.product?.name || "Unknown Product",
        quantity: item.quantity || 0,
        is_delivered: item.is_delivered || false,
        delivered_quantity: item.delivered_quantity || 0,
      })),
      // Ensure numeric fields are numbers
      delivery_fee: typeof delivery.delivery_fee === 'string' ? parseFloat(delivery.delivery_fee) : (delivery.delivery_fee || 0),
      shipping_cost: typeof delivery.shipping_cost === 'string' ? parseFloat(delivery.shipping_cost) : (delivery.shipping_cost || 0),
    }
  },

  async update(id: string, data: Partial<Delivery>): Promise<Delivery> {
    const delivery = await api.put<any>(apiEndpoints.deliveries.update(id), data)
    return this.transformDelivery(delivery)
  },

  async delete(id: string): Promise<void> {
    return api.delete(apiEndpoints.deliveries.delete(id))
  },

  async confirm(id: string): Promise<Delivery> {
    const delivery = await api.post<any>(apiEndpoints.deliveries.confirm(id))
    return this.transformDelivery(delivery)
  },

  async dispatch(id: string, status: 'ready' | 'in_transit', data?: { tracking_number?: string; courier_name?: string; driver_name?: string; vehicle_number?: string; notes?: string }): Promise<Delivery> {
    const delivery = await api.post<any>(apiEndpoints.deliveries.dispatch(id), { status, ...data })
    return this.transformDelivery(delivery)
  },

  async complete(id: string, notes?: string): Promise<Delivery> {
    const delivery = await api.post<any>(apiEndpoints.deliveries.complete(id), { notes })
    return this.transformDelivery(delivery)
  },

  async cancel(id: string, reason?: string): Promise<Delivery> {
    const delivery = await api.post<any>(apiEndpoints.deliveries.cancel(id), { reason })
    return this.transformDelivery(delivery)
  },

  async getPending(): Promise<Delivery[]> {
    const response = await api.get<any>(apiEndpoints.deliveries.pending)
    const deliveries = Array.isArray(response) ? response : (response.results || [])
    return deliveries.map((delivery: any) => this.transformDelivery(delivery))
  },

  async getScheduledToday(): Promise<Delivery[]> {
    const response = await api.get<any>(apiEndpoints.deliveries.scheduledToday)
    const deliveries = Array.isArray(response) ? response : (response.results || [])
    return deliveries.map((delivery: any) => this.transformDelivery(delivery))
  },
}

