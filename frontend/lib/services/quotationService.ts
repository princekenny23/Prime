import { api, apiEndpoints } from "@/lib/api"

export interface QuotationItem {
  id?: string
  product_id: string
  product_name: string
  quantity: number
  price: number
  total: number
}

export interface Quotation {
  id: string
  quotation_number: string
  tenant?: string
  outlet?: string
  outlet_id?: string | number
  customer_id?: string
  customer?: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  customer_name?: string
  status: "draft" | "sent" | "accepted" | "converted" | "expired" | "cancelled"
  items: QuotationItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  valid_until: string
  notes?: string
  created_at: string
  updated_at?: string
  items_count?: number
}

export interface QuotationFilters {
  outlet?: string
  status?: string
  customer?: string
  search?: string
}

export interface CreateQuotationData {
  outlet: string | number
  customer_id?: string
  customer_name?: string
  items: Omit<QuotationItem, "id">[]
  subtotal: number
  discount?: number
  tax?: number
  total: number
  valid_until: string
  notes?: string
}

type UpdateQuotationData = Partial<CreateQuotationData> & {
  status?: Quotation["status"]
}

export const quotationService = {
  async list(filters?: QuotationFilters): Promise<{ results: Quotation[]; count?: number }> {
    const params = new URLSearchParams()
    if (filters?.outlet) params.append("outlet", filters.outlet)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.customer) params.append("customer", filters.customer)
    if (filters?.search) params.append("search", filters.search)
    
    const query = params.toString()
    const response = await api.get<any>(`${apiEndpoints.quotations.list}${query ? `?${query}` : ""}`)
    
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

  async get(id: string): Promise<Quotation> {
    return api.get<Quotation>(apiEndpoints.quotations.get(id))
  },

  async create(data: CreateQuotationData): Promise<Quotation> {
    // Transform data for backend
    const backendData: any = {
      outlet: typeof data.outlet === "string" ? parseInt(data.outlet) : data.outlet,
      items: data.items.map(item => ({
        product: typeof item.product_id === "string" ? parseInt(item.product_id) : item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price.toString(),
        total: item.total.toString(),
      })),
      subtotal: data.subtotal.toString(),
      discount: (data.discount || 0).toString(),
      tax: (data.tax || 0).toString(),
      total: data.total.toString(),
      valid_until: data.valid_until,
      notes: data.notes || "",
    }

    if (data.customer_id) {
      backendData.customer = typeof data.customer_id === "string" ? parseInt(data.customer_id) : data.customer_id
    }
    
    // Always include customer_name if provided (for walk-in customers)
    if (data.customer_name) {
      backendData.customer_name = data.customer_name
    }

    console.log("Sending quotation data to backend:", backendData)
    console.log("API endpoint:", apiEndpoints.quotations.create)
    
    try {
      const response = await api.post<Quotation>(apiEndpoints.quotations.create, backendData)
      return response
    } catch (error: any) {
      console.error("Quotation creation error:", error)
      // Provide more detailed error message
      if (error.response?.status === 404) {
        throw new Error(`API endpoint not found. Please ensure the backend quotation endpoint is configured at ${apiEndpoints.quotations.create}`)
      }
      throw error
    }
  },

  async update(id: string, data: UpdateQuotationData): Promise<Quotation> {
    const backendData: any = {}
    
    if (data.outlet) {
      backendData.outlet = typeof data.outlet === "string" ? parseInt(data.outlet) : data.outlet
    }
    if (data.customer_id) {
      backendData.customer = typeof data.customer_id === "string" ? parseInt(data.customer_id) : data.customer_id
    }
    if (data.customer_name) {
      backendData.customer_name = data.customer_name
    }
    if (data.items) {
      backendData.items = data.items.map(item => ({
        product: typeof item.product_id === "string" ? parseInt(item.product_id) : item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price.toString(),
        total: item.total.toString(),
      }))
    }
    if (data.subtotal !== undefined) backendData.subtotal = data.subtotal.toString()
    if (data.discount !== undefined) backendData.discount = data.discount.toString()
    if (data.tax !== undefined) backendData.tax = data.tax.toString()
    if (data.total !== undefined) backendData.total = data.total.toString()
    if (data.valid_until) backendData.valid_until = data.valid_until
    if (data.notes !== undefined) backendData.notes = data.notes
    if (data.status) backendData.status = data.status

    // Debug endpoint + payload
    try {
      console.log("Updating quotation:", { id, endpoint: apiEndpoints.quotations.update(id), payload: backendData })
    } catch {}

    // Use PATCH for partial updates
    return api.patch<Quotation>(apiEndpoints.quotations.update(id), backendData)
  },

  async updateStatus(id: string, status: Quotation["status"]): Promise<Quotation> {
    return api.patch<Quotation>(apiEndpoints.quotations.update(id), { status })
  },

  async delete(id: string): Promise<void> {
    await api.delete(apiEndpoints.quotations.delete(id))
  },

  async send(id: string): Promise<Quotation> {
    return api.post<Quotation>(apiEndpoints.quotations.send(id), {})
  },

  async convertToSale(id: string): Promise<{ sale_id: string }> {
    return api.post<{ sale_id: string }>(apiEndpoints.quotations.convertToSale(id), {})
  },
}

