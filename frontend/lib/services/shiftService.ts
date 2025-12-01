import { api, apiEndpoints } from "@/lib/api"

export interface Shift {
  id: string
  outlet: string
  till: string
  user: string
  operating_date: string
  opening_cash_balance: number
  floating_cash: number
  closing_cash_balance?: number
  status: "OPEN" | "CLOSED"
  start_time: string
  end_time?: string
  notes?: string
}

export interface StartShiftData {
  outlet_id: string
  till_id: string
  operating_date: string
  opening_cash_balance: number
  floating_cash?: number
  notes?: string
}

export const shiftService = {
  async start(data: StartShiftData): Promise<Shift> {
    return api.post(apiEndpoints.shifts.start, data)
  },

  async close(id: string, closingCashBalance: number): Promise<Shift> {
    return api.post(apiEndpoints.shifts.close(id), {
      closing_cash_balance: closingCashBalance,
    })
  },

  async getActive(outletId: string): Promise<Shift | null> {
    try {
      return await api.get<Shift>(`${apiEndpoints.shifts.active}?outlet_id=${outletId}`)
    } catch (error: any) {
      if (error.message?.includes("404") || error.message?.includes("No active shift")) {
        return null
      }
      throw error
    }
  },

  async getHistory(filters?: { outlet?: string; start_date?: string; end_date?: string }): Promise<Shift[]> {
    const params = new URLSearchParams()
    if (filters?.outlet) params.append("outlet", filters.outlet)
    if (filters?.start_date) params.append("start_date", filters.start_date)
    if (filters?.end_date) params.append("end_date", filters.end_date)
    
    const query = params.toString()
    const response = await api.get<{ results: Shift[] }>(`${apiEndpoints.shifts.history}${query ? `?${query}` : ""}`)
    return response.results
  },

  async checkExists(outletId: string, tillId: string, date: string): Promise<boolean> {
    const response = await api.get<{ exists: boolean }>(
      `${apiEndpoints.shifts.check}?outlet_id=${outletId}&till_id=${tillId}&date=${date}`
    )
    return response.exists
  },
}

