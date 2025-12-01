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

export const reportService = {
  async getSalesReport(filters?: ReportFilters): Promise<SalesReportData[]> {
    const params = new URLSearchParams()
    if (filters?.tenant) params.append("tenant", filters.tenant)
    if (filters?.outlet) params.append("outlet", filters.outlet)
    if (filters?.start_date) params.append("start_date", filters.start_date)
    if (filters?.end_date) params.append("end_date", filters.end_date)
    
    const query = params.toString()
    try {
      const response = await api.get(`${apiEndpoints.reports.sales}${query ? `?${query}` : ""}`)
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
      const response = await api.get(`${apiEndpoints.reports.products}${query ? `?${query}` : ""}`)
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
      const response = await api.get(`${apiEndpoints.reports.customers}${query ? `?${query}` : ""}`)
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
      return await api.get(`${apiEndpoints.reports.profitLoss}${query ? `?${query}` : ""}`)
    } catch (error) {
      console.error("Failed to fetch profit & loss:", error)
      return null
    }
  },
}

