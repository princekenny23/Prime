import { api, apiEndpoints } from "@/lib/api"
import type { Product, Category } from "@/lib/types/mock-data"

export interface ProductFilters {
  category?: string
  is_active?: boolean
  search?: string
  page?: number
}

// Transform backend product to frontend format
function transformProduct(backendProduct: any): Product {
  // Extract tenant ID - handle both object and ID formats
  let tenantId = ""
  if (backendProduct.tenant) {
    if (typeof backendProduct.tenant === 'object' && backendProduct.tenant.id) {
      tenantId = String(backendProduct.tenant.id)
    } else {
      tenantId = String(backendProduct.tenant)
    }
  } else if (backendProduct.tenant_id) {
    tenantId = String(backendProduct.tenant_id)
  }
  
  return {
    id: String(backendProduct.id),
    businessId: tenantId,
    name: backendProduct.name,
    description: backendProduct.description || "",
    sku: backendProduct.sku || "",
    barcode: backendProduct.barcode || "",
    price: parseFloat(backendProduct.price) || 0,
    cost: backendProduct.cost ? parseFloat(backendProduct.cost) : undefined,
    categoryId: backendProduct.category ? String(backendProduct.category.id || backendProduct.category_id) : undefined,
    stock: backendProduct.stock || 0,
    lowStockThreshold: backendProduct.low_stock_threshold || backendProduct.lowStockThreshold || 0,
    image: backendProduct.image || undefined,
    isActive: backendProduct.is_active !== undefined ? backendProduct.is_active : (backendProduct.isActive !== undefined ? backendProduct.isActive : true),
    createdAt: backendProduct.created_at || backendProduct.createdAt || new Date().toISOString(),
  }
}

// Transform frontend product to backend format
function transformProductToBackend(frontendProduct: Partial<Product>): any {
  // Ensure price is at least 0.01 (backend requirement)
  const price = frontendProduct.price ? Math.max(0.01, parseFloat(frontendProduct.price.toString())) : 0.01
  
  const data: any = {
    name: frontendProduct.name,
    description: frontendProduct.description || "",
    barcode: frontendProduct.barcode || "",
    price: price.toString(),
    stock: frontendProduct.stock || 0,
    low_stock_threshold: frontendProduct.lowStockThreshold || 0,
    unit: frontendProduct.unit || "pcs", // Use provided unit or default to "pcs"
    is_active: frontendProduct.isActive !== undefined ? frontendProduct.isActive : true,
  }
  
  // Only include SKU if provided (otherwise backend will auto-generate)
  if (frontendProduct.sku && frontendProduct.sku.trim() !== "") {
    data.sku = frontendProduct.sku.trim()
  }
  
  // Only include cost if provided
  if (frontendProduct.cost !== undefined && frontendProduct.cost !== null) {
    const cost = Math.max(0, parseFloat(frontendProduct.cost.toString()))
    data.cost = cost.toString()
  }
  
  // Only include category_id if provided and valid
  // Don't send category_id at all if it's empty/null/undefined
  if (frontendProduct.categoryId !== undefined && frontendProduct.categoryId !== null && frontendProduct.categoryId !== "") {
    const categoryIdStr = String(frontendProduct.categoryId).trim()
    if (categoryIdStr !== "" && categoryIdStr !== "undefined" && categoryIdStr !== "null") {
      const categoryId = parseInt(categoryIdStr)
      if (!isNaN(categoryId) && categoryId > 0) {
        data.category_id = categoryId
      }
    }
  }
  
  return data
}

export const productService = {
  async list(filters?: ProductFilters): Promise<{ results: Product[]; count: number; next?: string; previous?: string }> {
    const params = new URLSearchParams()
    if (filters?.category) params.append("category", filters.category)
    if (filters?.is_active !== undefined) params.append("is_active", String(filters.is_active))
    if (filters?.search) params.append("search", filters.search)
    if (filters?.page) params.append("page", String(filters.page))
    
    const query = params.toString()
    const response = await api.get<any>(`${apiEndpoints.products.list}${query ? `?${query}` : ""}`)
    
    // Handle paginated and non-paginated responses
    if (Array.isArray(response)) {
      return {
        results: response.map(transformProduct),
        count: response.length,
      }
    }
    
    return {
      results: (response.results || []).map(transformProduct),
      count: response.count || (response.results || []).length,
      next: response.next,
      previous: response.previous,
    }
  },

  async get(id: string): Promise<Product> {
    const response = await api.get<any>(apiEndpoints.products.get(id))
    return transformProduct(response)
  },

  async create(data: Partial<Product>): Promise<Product> {
    const backendData = transformProductToBackend(data)
    console.log("Creating product with data:", backendData)
    try {
      const response = await api.post<any>(apiEndpoints.products.create, backendData)
      return transformProduct(response)
    } catch (error: any) {
      console.error("Product creation error:", error)
      console.error("Backend data sent:", backendData)
      throw error
    }
  },

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const backendData = transformProductToBackend(data)
    const response = await api.put<any>(apiEndpoints.products.update(id), backendData)
    return transformProduct(response)
  },

  async delete(id: string): Promise<void> {
    await api.delete(apiEndpoints.products.delete(id))
  },

  async bulkDelete(productIds: string[]): Promise<{
    success: boolean
    deleted_count: number
    deleted_products: string[]
    not_found?: number[]
    warning?: string
  }> {
    return api.post(`${apiEndpoints.products.list}bulk-delete/`, {
      product_ids: productIds,
    })
  },

  async getLowStock(): Promise<Product[]> {
    const response = await api.get<any>(`${apiEndpoints.products.list}low_stock/`)
    const products = Array.isArray(response) ? response : (response.results || [])
    return products.map(transformProduct)
  },

      async generateSkuPreview(): Promise<string> {
        const response = await api.get<{ sku: string }>(`${apiEndpoints.products.list}generate-sku/`)
        return response.sku
      },

      async bulkImport(file: File): Promise<{
        success: boolean
        total_rows: number
        imported: number
        failed: number
        categories_created: number
        categories_existing: number
        errors: Array<{ row: number; product_name: string; error: string }>
        warnings: Array<{ row: number; product_name: string; warning: string }>
      }> {
        const formData = new FormData()
        formData.append('file', file)
        
        // For file uploads, we need to NOT set Content-Type header
        // Let the browser set it with the boundary
        const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
        const headers: HeadersInit = {}
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        
        // Don't set Content-Type - browser will set it with boundary for multipart/form-data
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
        const response = await fetch(`${API_BASE_URL}${apiEndpoints.products.list}bulk-import/`, {
          method: 'POST',
          headers: headers,
          body: formData,
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }
        
        return response.json()
      },
    }

// Transform backend category to frontend format
function transformCategory(backendCategory: any): Category {
  return {
    id: String(backendCategory.id),
    businessId: String(backendCategory.tenant || backendCategory.tenant_id || ""),
    name: backendCategory.name,
    description: backendCategory.description || "",
    createdAt: backendCategory.created_at || backendCategory.createdAt || new Date().toISOString(),
  }
}

export const categoryService = {
  async list(): Promise<Category[]> {
    const response = await api.get<any>(apiEndpoints.categories.list)
    const categories = Array.isArray(response) ? response : (response.results || [])
    return categories.map(transformCategory)
  },

  async get(id: string): Promise<Category> {
    const response = await api.get<any>(apiEndpoints.categories.get(id))
    return transformCategory(response)
  },

  async create(data: Partial<Category>): Promise<Category> {
    const backendData = {
      name: data.name,
      description: data.description || "",
    }
    const response = await api.post<any>(apiEndpoints.categories.create, backendData)
    return transformCategory(response)
  },

  async update(id: string, data: Partial<Category>): Promise<Category> {
    const backendData = {
      name: data.name,
      description: data.description || "",
    }
    const response = await api.put<any>(apiEndpoints.categories.update(id), backendData)
    return transformCategory(response)
  },

  async delete(id: string): Promise<void> {
    await api.delete(apiEndpoints.categories.delete(id))
  },
}

