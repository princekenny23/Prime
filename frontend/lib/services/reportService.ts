import { api, apiEndpoints } from "@/lib/api"

export interface SalesReportData {
  date: string
  sales: number
  transactions: number
  revenue: number
}

export interface ProductReportData {
  name: string
  sales: number
  quantity: number
  revenue: number
}

export interface ReportFilters {
  tenant?: string
  outlet?: string
  start_date?: string
  end_date?: string
  category?: string
}

export interface InventoryValuationItem {
  id: number
  code: string
  name: string
  retail_price: number
  cost_price: number
  category: string
  category_id: number | null
  open_qty: number
  open_value: number
  received_qty: number
  received_value: number
  transferred_qty: number
  transferred_value: number
  adjusted_qty: number
  adjusted_value: number
  sold_qty: number
  sold_value: number
  stock_qty: number
  stock_value: number
  counted_qty: number
  counted_value: number
  discrepancy: number
  surplus_qty: number
  surplus_value: number
  shortage_qty: number
  shortage_value: number
}

export interface InventoryValuationReport {
  items: InventoryValuationItem[]
  totals: {
    open_qty: number
    open_value: number
    received_qty: number
    received_value: number
    transferred_qty: number
    transferred_value: number
    adjusted_qty: number
    adjusted_value: number
    sold_qty: number
    sold_value: number
    stock_qty: number
    stock_value: number
    counted_qty: number
    counted_value: number
    discrepancy: number
    surplus_qty: number
    surplus_value: number
    shortage_qty: number
    shortage_value: number
  }
  period: {
    start_date: string
    end_date: string
  }
  categories: { id: number; name: string }[]
  has_stock_take: boolean
  stock_take_date: string | null
  item_count: number
}

export const reportService = {
  async getSalesReport(filters?: ReportFilters): Promise<SalesReportData[]> {
    const params = new URLSearchParams()
    if (filters?.tenant) params.append("tenant", filters.tenant)
    if (filters?.outlet) params.append("outlet", filters.outlet)
    if (filters?.start_date) params.append("start_date", filters.start_date)
    if (filters?.end_date) params.append("end_date", filters.end_date)
    
    const query = params.toString()
    try {
      const response = await api.get<any>(`${apiEndpoints.reports.sales}${query ? `?${query}` : ""}`)
      return Array.isArray(response) ? response : response.results || []
    } catch (error) {
      console.error("Failed to fetch sales report:", error)
      return []
    }
  },

  async getProductReport(filters?: ReportFilters): Promise<ProductReportData[]> {
    const params = new URLSearchParams()
    if (filters?.tenant) params.append("tenant", filters.tenant)
    if (filters?.outlet) params.append("outlet", filters.outlet)
    if (filters?.start_date) params.append("start_date", filters.start_date)
    if (filters?.end_date) params.append("end_date", filters.end_date)
    if (filters?.category) params.append("category", filters.category)
    
    const query = params.toString()
    try {
      const response = await api.get<any>(`${apiEndpoints.reports.products}${query ? `?${query}` : ""}`)
      return Array.isArray(response) ? response : response.results || []
    } catch (error) {
      console.error("Failed to fetch product report:", error)
      return []
    }
  },

  async getCustomerReport(filters?: ReportFilters): Promise<any[]> {
    const params = new URLSearchParams()
    if (filters?.tenant) params.append("tenant", filters.tenant)
    if (filters?.outlet) params.append("outlet", filters.outlet)
    if (filters?.start_date) params.append("start_date", filters.start_date)
    if (filters?.end_date) params.append("end_date", filters.end_date)
    
    const query = params.toString()
    try {
      const response = await api.get<any>(`${apiEndpoints.reports.customers}${query ? `?${query}` : ""}`)
      return Array.isArray(response) ? response : response.results || []
    } catch (error) {
      console.error("Failed to fetch customer report:", error)
      return []
    }
  },

  async getProfitLoss(filters?: ReportFilters): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.tenant) params.append("tenant", filters.tenant)
    if (filters?.outlet) params.append("outlet", filters.outlet)
    if (filters?.start_date) params.append("start_date", filters.start_date)
    if (filters?.end_date) params.append("end_date", filters.end_date)
    
    const query = params.toString()
    try {
      return await api.get<any>(`${apiEndpoints.reports.profitLoss}${query ? `?${query}` : ""}`)
    } catch (error) {
      console.error("Failed to fetch profit & loss:", error)
      return null
    }
  },

  async getInventoryValuation(filters?: ReportFilters): Promise<InventoryValuationReport | null> {
    const params = new URLSearchParams()
    if (filters?.outlet) params.append("outlet", filters.outlet)
    if (filters?.start_date) params.append("start_date", filters.start_date)
    if (filters?.end_date) params.append("end_date", filters.end_date)
    if (filters?.category) params.append("category", filters.category)
    
    const query = params.toString()
    try {
      return await api.get<any>(`${apiEndpoints.reports.inventoryValuation}${query ? `?${query}` : ""}`)
    } catch (error) {
      console.error("Failed to fetch inventory valuation report:", error)
      return null
    }
  },

  async getDailySales(date?: string): Promise<any> {
    const params = new URLSearchParams()
    if (date) params.append("date", date)
    
    const query = params.toString()
    try {
      return await api.get<any>(`${apiEndpoints.reports.dailySales}${query ? `?${query}` : ""}`)
    } catch (error) {
      console.error("Failed to fetch daily sales report:", error)
      return null
    }
  },

  async getTopProducts(filters?: ReportFilters, limit = 10): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.start_date) params.append("start_date", filters.start_date)
    if (filters?.end_date) params.append("end_date", filters.end_date)
    params.append("limit", limit.toString())
    
    const query = params.toString()
    try {
      return await api.get<any>(`${apiEndpoints.reports.topProducts}${query ? `?${query}` : ""}`)
    } catch (error) {
      console.error("Failed to fetch top products report:", error)
      return null
    }
  },

  async getCashSummary(date?: string): Promise<any> {
    const params = new URLSearchParams()
    if (date) params.append("date", date)
    
    const query = params.toString()
    try {
      return await api.get<any>(`${apiEndpoints.reports.cashSummary}${query ? `?${query}` : ""}`)
    } catch (error) {
      console.error("Failed to fetch cash summary report:", error)
      return null
    }
  },

  async getShiftSummary(filters?: ReportFilters): Promise<any> {
    const params = new URLSearchParams()
    if (filters?.start_date) params.append("start_date", filters.start_date)
    if (filters?.end_date) params.append("end_date", filters.end_date)
    
    const query = params.toString()
    try {
      return await api.get<any>(`${apiEndpoints.reports.shiftSummary}${query ? `?${query}` : ""}`)
    } catch (error) {
      console.error("Failed to fetch shift summary report:", error)
      return null
    }
  },
}

