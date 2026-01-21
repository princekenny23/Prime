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
import { FileText, Plus, Search, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useBusinessStore } from "@/stores/businessStore"
import { priceListService, type PriceList } from "@/lib/services/priceListService"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function PriceListsPage() {
  const { currentBusiness } = useBusinessStore()
  const { toast } = useToast()
  const router = useRouter()
  const [priceLists, setPriceLists] = useState<PriceList[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Redirect if not wholesale/retail business
    if (currentBusiness && currentBusiness.type !== "wholesale and retail") {
      router.push("/dashboard")
      return
    }

    const loadPriceLists = async () => {
      if (!currentBusiness) return
      
      setIsLoading(true)
      try {
        const response = await priceListService.list({ search: searchTerm })
        setPriceLists(response.results || [])
      } catch (error: any) {
        console.error("Failed to load price lists:", error)
        // If API doesn't exist yet, show empty state gracefully
        if (error.status !== 404) {
          toast({
            title: "Error",
            description: "Failed to load price lists. Please try again later.",
            variant: "destructive",
          })
        }
        setPriceLists([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadPriceLists()
  }, [currentBusiness, searchTerm, router, toast])

  const filteredLists = priceLists.filter((list) =>
    list.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <PageLayout
        title="Price Lists"
        description="Create and manage custom price lists for different customer groups"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Price List
          </Button>
        }
      >

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              "use client"

              import { useEffect } from "react"
              import { useRouter } from "next/navigation"

              export default function PriceListsPage() {
                const router = useRouter()

                useEffect(() => {
                  router.replace("/dashboard")
                }, [router])

                return null
              }
            <CardDescription>

              Custom pricing for different customer segments
