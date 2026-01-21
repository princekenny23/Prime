"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Plus, Search } from "lucide-react"
import { useState, useEffect } from "react"
import { useBusinessStore } from "@/stores/businessStore"
import { productService } from "@/lib/services/productService"
import { useRouter } from "next/navigation"
import { useI18n } from "@/contexts/i18n-context"

export default function WholesalePricingPage() {
  const { currentBusiness } = useBusinessStore()
  const router = useRouter()
  const { t } = useI18n()
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    // Redirect if not wholesale/retail business
    if (currentBusiness && currentBusiness.type !== "wholesale and retail") {
      router.push("/dashboard")
      return
    }
  }, [currentBusiness, router])

  useEffect(() => {
    const loadProducts = async () => {
      if (!currentBusiness || currentBusiness.type !== "wholesale and retail") return
      
      setIsLoading(true)
      try {
        const response = await productService.list({ is_active: true })
        const productsList = Array.isArray(response) ? response : (response.results || [])
        // Filter products with wholesale enabled
        setProducts(productsList.filter((p: any) => p.wholesale_enabled))
      } catch (error) {
        console.error("Failed to load products:", error)
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProducts()
  }, [currentBusiness])

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <PageLayout
        title={t("sales.menu.wholesale")}
        description={t("sales.wholesale.description")}
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Enable Wholesale
          </Button>
        }
      >

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.search_products_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Wholesale Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Wholesale Products</CardTitle>
            <CardDescription>
              Products with wholesale pricing enabled
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No wholesale products found</p>
                <Button>
                  "use client"

                  import { useEffect } from "react"
                  import { useRouter } from "next/navigation"

                  export default function WholesalePricingPage() {
                    const router = useRouter()

                    useEffect(() => {
                      router.replace("/dashboard")
                    }, [router])

                    return null
                  }
                    <TableHead>Actions</TableHead>

                  </TableRow>
