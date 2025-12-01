import { api, apiEndpoints } from "@/lib/api"
import type { Sale } from "@/lib/types/mock-data"

export interface SaleFilters {
  outlet?: string
  status?: string
  payment_method?: string
  start_date?: string
  end_date?: string
  page?: number
}

export interface CreateSaleData {
  outlet: string
  shift?: string
  customer?: string
  items_data: Array<{
    product_id: string
    quantity: number
    price: number
  }>
  subtotal: number
  tax?: number
  discount?: number
  payment_method: "cash" | "card" | "mobile" | "tab"
  notes?: string
}

// Transform backend sale to frontend format
function transformSale(backendSale: any): Sale {
  return {
    id: String(backendSale.id),
    businessId: String(backendSale.tenant || backendSale.tenant_id || ""),
    outletId: String(backendSale.outlet || backendSale.outlet_id || ""),
    userId: backendSale.user ? String(backendSale.user.id || backendSale.user_id) : "",
    items: (backendSale.items || []).map((item: any) => ({
      productId: item.product ? String(item.product.id || item.product_id) : "",
      productName: item.product_name || item.product?.name || "",
      quantity: item.quantity || 0,
      price: parseFloat(item.price) || 0,
      total: parseFloat(item.total) || 0,
    })),
    subtotal: parseFloat(backendSale.subtotal) || 0,
    tax: parseFloat(backendSale.tax) || 0,
    total: parseFloat(backendSale.total) || 0,
    paymentMethod: backendSale.payment_method || backendSale.paymentMethod || "cash",
    status: backendSale.status || "completed",
    createdAt: backendSale.created_at || backendSale.createdAt || new Date().toISOString(),
  }
}

export const saleService = {
  async list(filters?: SaleFilters): Promise<{ results: Sale[]; count: number }> {
    const params = new URLSearchParams()
    if (filters?.outlet) params.append("outlet", filters.outlet)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.payment_method) params.append("payment_method", filters.payment_method)
    if (filters?.start_date) params.append("start_date", filters.start_date)
    if (filters?.end_date) params.append("end_date", filters.end_date)
    if (filters?.page) params.append("page", String(filters.page))
    
    const query = params.toString()
    const response = await api.get<any>(`${apiEndpoints.sales.list}${query ? `?${query}` : ""}`)
    
    // Handle paginated and non-paginated responses
    if (Array.isArray(response)) {
      return {
        results: response.map(transformSale),
        count: response.length,
      }
    }
    
    return {
      results: (response.results || []).map(transformSale),
      count: response.count || (response.results || []).length,
    }
  },

  async get(id: string): Promise<Sale> {
    const response = await api.get<any>(apiEndpoints.sales.get(id))
    return transformSale(response)
  },

  async create(data: CreateSaleData): Promise<Sale> {
    // Transform frontend data to backend format
    const backendData = {
      outlet: data.outlet,
      shift: data.shift,
      customer: data.customer,
      items_data: data.items_data.map(item => ({
        product_id: parseInt(item.product_id),
        quantity: item.quantity,
        price: item.price.toString(),
      })),
      subtotal: data.subtotal.toString(),
      tax: data.tax ? data.tax.toString() : "0",
      discount: data.discount ? data.discount.toString() : "0",
      payment_method: data.payment_method,
      notes: data.notes || "",
    }
    
    const response = await api.post<any>(apiEndpoints.sales.create, backendData)
    return transformSale(response)
  },

  async refund(id: string, reason?: string): Promise<Sale> {
    const response = await api.post<any>(`${apiEndpoints.sales.get(id)}refund/`, { reason })
    return transformSale(response)
  },

  async getStats(filters?: { start_date?: string; end_date?: string }): Promise<{
    total_sales: number
    total_revenue: number
    today_sales: number
    today_revenue: number
  }> {
    const params = new URLSearchParams()
    if (filters?.start_date) params.append("start_date", filters.start_date)
    if (filters?.end_date) params.append("end_date", filters.end_date)
    
    const query = params.toString()
    return api.get(`${apiEndpoints.sales.list}stats/${query ? `?${query}` : ""}`)
  },
}

