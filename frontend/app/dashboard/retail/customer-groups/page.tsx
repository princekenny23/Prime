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
import { Users, Plus, Search, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useBusinessStore } from "@/stores/businessStore"
import { customerGroupService, type CustomerGroup } from "@/lib/services/customerGroupService"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function CustomerGroupsPage() {
  const { currentBusiness } = useBusinessStore()
  const { toast } = useToast()
  const router = useRouter()
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Redirect if not wholesale/retail business
    if (currentBusiness && currentBusiness.type !== "wholesale and retail") {
      router.push("/dashboard")
      return
    }

    const loadCustomerGroups = async () => {
      if (!currentBusiness) return
      
      setIsLoading(true)
      try {
        const response = await customerGroupService.list({ search: searchTerm })
        setCustomerGroups(response.results || [])
      } catch (error: any) {
        console.error("Failed to load customer groups:", error)
        // If API doesn't exist yet, show empty state gracefully
        if (error.status !== 404) {
          toast({
            title: "Error",
            description: "Failed to load customer groups. Please try again later.",
            variant: "destructive",
          })
        }
        setCustomerGroups([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadCustomerGroups()
  }, [currentBusiness, searchTerm, router, toast])

  const filteredGroups = customerGroups.filter((group) =>
    group.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customer Groups</h1>
            <p className="text-muted-foreground mt-1">
              Manage customer groups and pricing tiers
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customer groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer Groups Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Groups</CardTitle>
            <CardDescription>
              Groups for wholesale pricing and special offers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No customer groups found</p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Customer Group
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>{group.type || "Standard"}</TableCell>
                      <TableCell>{group.customer_count || 0}</TableCell>
                      <TableCell>{group.discount || "0"}%</TableCell>
                      <TableCell>
                        <Badge variant={group.is_active ? "default" : "secondary"}>
                          {group.is_active ? "Active" : "Inactive"}
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

