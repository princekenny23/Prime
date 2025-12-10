import { api, apiEndpoints } from "@/lib/api"

export interface AutoPOSettings {
  id: string
  tenant: string
  auto_po_enabled: boolean
  default_reorder_quantity: number
  auto_approve_po: boolean
  notify_on_auto_po: boolean
  notification_emails?: string
  minimum_order_value: number
  group_by_supplier: boolean
  created_at?: string
  updated_at?: string
}

export interface CheckLowStockResponse {
  success: boolean
  purchase_orders_created: number
  items_ordered: number
  purchase_orders: Array<{
    id: string
    po_number: string
    supplier: string
    status: string
    total: string
  }>
}

export const autoPOService = {
  async getSettings(): Promise<AutoPOSettings> {
    const response = await api.get<any>(apiEndpoints.autoPOSettings.list)
    // If it returns an array, get the first item
    if (Array.isArray(response) && response.length > 0) {
      return response[0]
    }
    // If it returns an object with results
    if (response.results && response.results.length > 0) {
      return response.results[0]
    }
    // Otherwise return the response directly
    return response
  },

  async updateSettings(data: Partial<AutoPOSettings>): Promise<AutoPOSettings> {
    // Get current settings first to get the ID
    const current = await this.getSettings()
    return api.put<AutoPOSettings>(apiEndpoints.autoPOSettings.update(current.id), data)
  },

  async checkLowStock(outletId?: string): Promise<CheckLowStockResponse> {
    return api.post<CheckLowStockResponse>(apiEndpoints.autoPOSettings.checkLowStock, {
      outlet_id: outletId,
    })
  },
}

