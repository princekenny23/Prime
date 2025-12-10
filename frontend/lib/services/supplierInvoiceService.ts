import { api, apiEndpoints } from "@/lib/api"

export interface SupplierInvoice {
  id: string
  tenant: string
  supplier: any
  supplier_id: number
  purchase_order?: any
  purchase_order_id?: number
  outlet: any
  outlet_id: number
  invoice_number: string
  supplier_invoice_number?: string
  invoice_date: string
  due_date: string
  status: 'draft' | 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled'
  subtotal: string
  tax: string
  discount: string
  total: string
  amount_paid: string
  balance: string
  notes?: string
  payment_terms?: string
  created_at: string
  updated_at: string
  paid_at?: string
}

export interface SupplierInvoiceFilters {
  supplier?: string
  outlet?: string
  status?: string
  search?: string
}

export const supplierInvoiceService = {
  async list(filters?: SupplierInvoiceFilters): Promise<{ results: SupplierInvoice[]; count?: number }> {
    const params = new URLSearchParams()
    if (filters?.supplier) params.append("supplier", filters.supplier)
    if (filters?.outlet) params.append("outlet", filters.outlet)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.search) params.append("search", filters.search)
    
    const query = params.toString()
    const response = await api.get<any>(`${apiEndpoints.supplierInvoices.list}${query ? `?${query}` : ""}`)
    return {
      results: Array.isArray(response) ? response : (response.results || []),
      count: response.count || (Array.isArray(response) ? response.length : 0),
    }
  },

  async get(id: string): Promise<SupplierInvoice> {
    return api.get(apiEndpoints.supplierInvoices.get(id))
  },

  async create(data: Partial<SupplierInvoice>): Promise<SupplierInvoice> {
    return api.post(apiEndpoints.supplierInvoices.create, data)
  },

  async update(id: string, data: Partial<SupplierInvoice>): Promise<SupplierInvoice> {
    return api.put(apiEndpoints.supplierInvoices.update(id), data)
  },

  async delete(id: string): Promise<void> {
    return api.delete(apiEndpoints.supplierInvoices.delete(id))
  },

  async recordPayment(id: string, amount: string): Promise<SupplierInvoice> {
    return api.post(apiEndpoints.supplierInvoices.recordPayment(id), { amount })
  },
}

