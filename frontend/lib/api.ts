/**
 * API Configuration and Helper Functions
 * 
 * This file provides utilities for making API calls.
 * Update NEXT_PUBLIC_API_URL in your .env file to point to your backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export const apiConfig = {
  baseURL: API_BASE_URL,
  base: API_BASE,
  timeout: 30000, // 30 seconds
}

/**
 * API Client for making HTTP requests
 * Ready for backend integration
 */
export class ApiClient {
  private baseURL: string
  private timeout: number

  constructor(baseURL: string = apiConfig.baseURL, timeout: number = apiConfig.timeout) {
    this.baseURL = baseURL
    this.timeout = timeout
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }
    
    // Log request (without sensitive data)
    if (endpoint.includes('login')) {
      console.log("API Request:", { url, method: options.method || 'GET' })
    }

    // Add authentication token if available
    const token = typeof window !== "undefined" 
      ? localStorage.getItem("authToken") 
      : null
    
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && retry && typeof window !== "undefined") {
        const refreshToken = localStorage.getItem("refreshToken")
        if (refreshToken) {
          try {
            const refreshResponse = await fetch(`${this.baseURL}/auth/refresh/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refresh: refreshToken }),
            })
            
            if (refreshResponse.ok) {
              const { access } = await refreshResponse.json()
              localStorage.setItem("authToken", access)
              
              // Retry original request with new token
              config.headers = {
                ...config.headers,
                Authorization: `Bearer ${access}`,
              }
              return this.request<T>(endpoint, { ...options, headers: config.headers }, false)
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            localStorage.removeItem("authToken")
            localStorage.removeItem("refreshToken")
            if (typeof window !== "undefined") {
              window.location.href = "/auth/login"
            }
            throw new Error("Session expired. Please login again.")
          }
        }
      }

      if (!response.ok) {
        let errorData: any = {}
        try {
          const text = await response.text()
          if (text) {
            errorData = JSON.parse(text)
          }
        } catch (e) {
          // If response is not JSON, use empty object
          errorData = {}
        }
        
        const errorMessage = errorData.detail || errorData.message || errorData.error || 
                           (typeof errorData === 'string' ? errorData : null) ||
                           `API Error: ${response.status} ${response.statusText}`
        
        // Log full error details for debugging
        console.error("API Error:", {
          status: response.status,
          statusText: response.statusText,
          endpoint: url,
          method: options.method || 'GET',
          error: errorMessage,
          errorData: errorData,
          // Don't log request body (may contain credentials)
        })
        
        const apiError = new Error(errorMessage) as any
        apiError.status = response.status
        apiError.data = errorData
        throw apiError
      }

      // Handle 204 No Content (common for DELETE requests)
      if (response.status === 204) {
        return null as T
      }

      // Check if response has content before parsing JSON
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        return await response.json()
      }
      
      // Return empty object for responses without JSON content
      return {} as T
    } catch (error) {
      if (error instanceof Error) {
        // Don't expose full error details for security
        const isLoginEndpoint = endpoint.includes('login')
        const errorMsg = isLoginEndpoint 
          ? "Login failed. Please check your credentials."
          : `API Request failed: ${error.message}`
        console.error("Request error:", {
          endpoint: url,
          message: error.message,
          // Don't log full error stack or request data
        })
        throw new Error(errorMsg)
      }
      throw error
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" })
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }
}

// Export a default API client instance
export const api = new ApiClient()

// Example API endpoints (update when backend is ready)
export const apiEndpoints = {
  // Authentication
  auth: {
    login: "/auth/login/",
    register: "/auth/register/",
    logout: "/auth/logout/",
    refresh: "/auth/refresh/",
    me: "/auth/me/",
    createUser: "/auth/users/create/",
    updateUser: (id: string) => `/auth/users/${id}/`,
    deleteUser: (id: string) => `/auth/users/${id}/delete/`,
  },
  // Tenants
  tenants: {
    list: "/tenants/",
    get: (id: string) => `/tenants/${id}/`,
    create: "/tenants/",
    update: (id: string) => `/tenants/${id}/`,
  },
  // Outlets
  outlets: {
    list: "/outlets/",
    get: (id: string) => `/outlets/${id}/`,
    create: "/outlets/",
    update: (id: string) => `/outlets/${id}/`,
  },
  // Products
  products: {
    list: "/products/",
    get: (id: string) => `/products/${id}/`,
    create: "/products/",
    update: (id: string) => `/products/${id}/`,
    delete: (id: string) => `/products/${id}/`,
  },
  // Categories
  categories: {
    list: "/categories/",
    get: (id: string) => `/categories/${id}/`,
    create: "/categories/",
    update: (id: string) => `/categories/${id}/`,
    delete: (id: string) => `/categories/${id}/`,
  },
  // Sales
  sales: {
    list: "/sales/",
    get: (id: string) => `/sales/${id}/`,
    create: "/sales/",
    update: (id: string) => `/sales/${id}/`,
  },
  // Customers
  customers: {
    list: "/customers/",
    get: (id: string) => `/customers/${id}/`,
    create: "/customers/",
    update: (id: string) => `/customers/${id}/`,
    adjustPoints: (id: string) => `/customers/${id}/adjust_points/`,
    creditSummary: (id: string) => `/customers/${id}/credit_summary/`,
    adjustCredit: (id: string) => `/customers/${id}/adjust_credit/`,
  },
  // Credit Payments
  creditPayments: {
    list: "/credit-payments/",
    get: (id: string) => `/credit-payments/${id}/`,
    create: "/credit-payments/",
  },
  // Staff
  staff: {
    list: "/staff/",
    get: (id: string) => `/staff/${id}/`,
    create: "/staff/",
    update: (id: string) => `/staff/${id}/`,
    delete: (id: string) => `/staff/${id}/`,
  },
  // Roles
  roles: {
    list: "/roles/",
    get: (id: string) => `/roles/${id}/`,
    create: "/roles/",
    update: (id: string) => `/roles/${id}/`,
    delete: (id: string) => `/roles/${id}/`,
  },
  // Suppliers
  suppliers: {
    list: "/suppliers/",
    get: (id: string) => `/suppliers/${id}/`,
    create: "/suppliers/",
    update: (id: string) => `/suppliers/${id}/`,
    delete: (id: string) => `/suppliers/${id}/`,
  },
  // Inventory
  inventory: {
    movements: "/inventory/movements/",
    adjust: "/inventory/adjust/",
    transfer: "/inventory/transfer/",
    receive: "/inventory/receive/",
    stockTakes: "/inventory/stock-take/",
    stockTakeItems: (id: string) => `/inventory/stock-take/${id}/items/`,
    stockTakeComplete: (id: string) => `/inventory/stock-take/${id}/complete/`,
  },
  // Shifts
  shifts: {
    list: "/shifts/",
    start: "/shifts/start/",
    active: "/shifts/active/",
    history: "/shifts/history/",
    check: "/shifts/check/",
    close: (id: string) => `/shifts/${id}/close/`,
  },
  // Customers
  customers: {
    list: "/customers",
    get: (id: string) => `/customers/${id}`,
    create: "/customers",
    update: (id: string) => `/customers/${id}`,
    adjustPoints: (id: string) => `/customers/${id}/adjust_points/`,
  },
  // Staff
  staff: {
    list: "/staff/",
    get: (id: string) => `/staff/${id}/`,
    create: "/staff/",
    update: (id: string) => `/staff/${id}/`,
    delete: (id: string) => `/staff/${id}/`,
  },
  // Roles
  roles: {
    list: "/roles/",
    get: (id: string) => `/roles/${id}/`,
    create: "/roles/",
    update: (id: string) => `/roles/${id}/`,
    delete: (id: string) => `/roles/${id}/`,
  },
  // Suppliers
  suppliers: {
    list: "/suppliers/",
    get: (id: string) => `/suppliers/${id}/`,
    create: "/suppliers/",
    update: (id: string) => `/suppliers/${id}/`,
    delete: (id: string) => `/suppliers/${id}/`,
  },
  // Reports
  reports: {
    sales: "/reports/sales/",
    products: "/reports/products/",
    customers: "/reports/customers/",
    profitLoss: "/reports/profit-loss/",
    stockMovement: "/reports/stock-movement/",
    expenses: "/reports/expenses/",
  },
  // Admin
  admin: {
    tenants: "/admin/tenants/",
    analytics: "/admin/analytics/",
  },
}

