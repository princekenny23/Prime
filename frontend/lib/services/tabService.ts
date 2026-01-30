import { api, apiEndpoints } from "@/lib/api"

export interface Tab {
  id: string
  tab_number: string
  customer?: string
  customer_id?: string
  opened: string
  closed?: string
  items: number
  total: number
  status: "open" | "closed"
  bartender?: string
  user_id?: string
  tenant?: string
  outlet?: string
}

export interface TabFilters {
  tenant?: string
  outlet?: string
  status?: "open" | "closed"
  customer?: string
  start_date?: string
  end_date?: string
}

export const tabService = {
  async list(filters?: TabFilters): Promise<{ results: Tab[]; count: number }> {
    const params = new URLSearchParams()
    if (filters?.tenant) params.append("tenant", filters.tenant)
    if (filters?.outlet) params.append("outlet", filters.outlet)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.customer) params.append("customer", filters.customer)
    if (filters?.start_date) params.append("start_date", filters.start_date)
    if (filters?.end_date) params.append("end_date", filters.end_date)
    
    const query = params.toString()
    try {
      // Tabs are essentially sales with payment_method="tab"
      const response = await api.get<any>(`${apiEndpoints.sales.list}${query ? `?${query}&payment_method=tab` : "?payment_method=tab"}`)
      // Transform sales to tabs format
      const tabs = (response.results || []).map((sale: any) => ({
        id: sale.id,
        tab_number: sale.receipt_number || `TAB-${sale.id.slice(-6)}`,
        customer: sale.customer?.name,
        customer_id: sale.customer?.id,
        opened: sale.created_at,
        closed: sale.status === "completed" ? sale.updated_at : undefined,
        items: sale.items?.length || 0,
        total: sale.total,
        status: sale.status === "completed" ? "closed" : "open",
        bartender: sale.user?.name,
        user_id: sale.user?.id,
        tenant: sale.tenant,
        outlet: sale.outlet,
      }))
      return { results: tabs, count: response.count || tabs.length }
    } catch (error) {
      // Return empty if endpoint doesn't exist yet
      return { results: [], count: 0 }
    }
  },

  async get(id: string): Promise<Tab> {
    const sale = await api.get<any>(apiEndpoints.sales.get(id))
    return {
      id: sale.id,
      tab_number: sale.receipt_number || `TAB-${sale.id.slice(-6)}`,
      customer: sale.customer?.name,
      customer_id: sale.customer?.id,
      opened: sale.created_at,
      closed: sale.status === "completed" ? sale.updated_at : undefined,
      items: sale.items?.length || 0,
      total: sale.total,
      status: sale.status === "completed" ? "closed" : "open",
      bartender: sale.user?.name,
      user_id: sale.user?.id,
      tenant: sale.tenant,
      outlet: sale.outlet,
    }
  },

  async create(data: { customer_id?: string; items: any[]; tenant: string; outlet?: string }): Promise<Tab> {
    // Create a sale with payment_method="tab"
    const sale = await api.post<any>(apiEndpoints.sales.create, {
      ...data,
      payment_method: "tab",
      status: "pending",
    })
    return this.get(sale.id)
  },

  async close(id: string, paymentData: { payment_method: string; amount: number }): Promise<Tab> {
    // Update sale to completed status
    const sale = await api.put<any>(apiEndpoints.sales.update(id), {
      status: "completed",
      payment_method: paymentData.payment_method,
    })
    return this.get(id)
  },
}

