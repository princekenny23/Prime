import { api, apiEndpoints } from "@/lib/api"

export interface Table {
  id: string
  number: string
  capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'out_of_service'
  location?: string
  notes?: string
  is_active: boolean
  tenant?: string
  outlet?: {
    id: string
    name: string
  } | string | null
  outlet_id?: number
  created_at?: string
  updated_at?: string
}

export interface TableFilters {
  outlet?: string
  status?: string
  is_active?: boolean
  search?: string
}

export const tableService = {
  async list(filters?: TableFilters): Promise<{ results: Table[]; count?: number }> {
    const params = new URLSearchParams()
    if (filters?.outlet) params.append("outlet", filters.outlet)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.is_active !== undefined) params.append("is_active", String(filters.is_active))
    if (filters?.search) params.append("search", filters.search)
    
    const query = params.toString()
    const response = await api.get<any>(`${apiEndpoints.tables.list}${query ? `?${query}` : ""}`)
    
    // Handle both paginated and non-paginated responses
    if (Array.isArray(response)) {
      return { results: response, count: response.length }
    }
    return {
      results: response.results || [],
      count: response.count || (response.results?.length || 0),
    }
  },

  async get(id: string): Promise<Table> {
    return api.get(apiEndpoints.tables.get(id))
  },

  async create(data: Partial<Table>): Promise<Table> {
    const backendData: any = {
      number: data.number,
      capacity: data.capacity || 2,
      status: data.status || 'available',
      location: data.location || '',
      notes: data.notes || '',
      is_active: data.is_active !== undefined ? data.is_active : true,
    }
    // Outlet is optional for restaurant tables
    if (data.outlet_id) {
      backendData.outlet_id = data.outlet_id
    } else if (data.outlet) {
      backendData.outlet_id = typeof data.outlet === 'object' 
        ? parseInt(data.outlet.id) 
        : parseInt(data.outlet as string)
    }
    return api.post(apiEndpoints.tables.create, backendData)
  },

  async update(id: string, data: Partial<Table>): Promise<Table> {
    const backendData: any = {
      number: data.number,
      capacity: data.capacity,
      status: data.status,
      location: data.location,
      notes: data.notes,
      is_active: data.is_active,
    }
    
    // Only include outlet_id if provided (for changing outlet)
    if (data.outlet_id !== undefined) {
      backendData.outlet_id = data.outlet_id
    } else if (data.outlet) {
      backendData.outlet_id = typeof data.outlet === 'object' 
        ? parseInt(data.outlet.id) 
        : parseInt(data.outlet as string)
    }
    
    return api.put(apiEndpoints.tables.update(id), backendData)
  },

  async delete(id: string): Promise<void> {
    return api.delete(apiEndpoints.tables.delete(id))
  },

  async getByOutlet(outletId: string): Promise<Table[]> {
    const response = await this.list({ outlet: outletId })
    return response.results
  },
}













