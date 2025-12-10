"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Price Lists</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage custom price lists for different customer groups
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Price List
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search price lists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Price Lists Table */}
        <Card>
          <CardHeader>
            <CardTitle>Price Lists</CardTitle>
            <CardDescription>
              Custom pricing for different customer segments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No price lists found</p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Price List
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer Group</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLists.map((list) => (
                    <TableRow key={list.id}>
                      <TableCell className="font-medium">{list.name}</TableCell>
                      <TableCell>{list.type || "Standard"}</TableCell>
                      <TableCell>{list.customer_group?.name || "All Customers"}</TableCell>
                      <TableCell>{list.product_count || 0}</TableCell>
                      <TableCell>
                        <Badge variant={list.is_active ? "default" : "secondary"}>
                          {list.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

