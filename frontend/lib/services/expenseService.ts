import { api, apiEndpoints } from "@/lib/api"

export interface Expense {
  id: string
  category: string
  description: string
  amount: number
  date: string
  vendor?: string
  receipt?: string
  tenant?: string
  outlet?: string
  created_at?: string
}

export interface ExpenseFilters {
  tenant?: string
  outlet?: string
  category?: string
  start_date?: string
  end_date?: string
  search?: string
}

export const expenseService = {
  async list(filters?: ExpenseFilters): Promise<{ results: Expense[]; count: number }> {
    const params = new URLSearchParams()
    if (filters?.tenant) params.append("tenant", filters.tenant)
    if (filters?.outlet) params.append("outlet", filters.outlet)
    if (filters?.category) params.append("category", filters.category)
    if (filters?.start_date) params.append("start_date", filters.start_date)
    if (filters?.end_date) params.append("end_date", filters.end_date)
    if (filters?.search) params.append("search", filters.search)
    
    const query = params.toString()
    try {
      return await api.get(`${apiEndpoints.reports?.expenses || "/expenses/"}${query ? `?${query}` : ""}`)
    } catch (error) {
      // Return empty if endpoint doesn't exist yet
      return { results: [], count: 0 }
    }
  },

  async get(id: string): Promise<Expense> {
    return api.get(`/expenses/${id}/`)
  },

  async create(data: Partial<Expense>): Promise<Expense> {
    return api.post("/expenses/", data)
  },

  async update(id: string, data: Partial<Expense>): Promise<Expense> {
    return api.put(`/expenses/${id}/`, data)
  },

  async delete(id: string): Promise<void> {
    return api.delete(`/expenses/${id}/`)
  },
}

