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
import { Tag, Plus, Search } from "lucide-react"
import { useState } from "react"
import { useBusinessStore } from "@/stores/businessStore"

export default function DiscountsPage() {
  const { currentBusiness } = useBusinessStore()
  const [discounts, setDiscounts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // TODO: Connect to backend discount API when available
  const filteredDiscounts = discounts.filter((disc) =>
    disc.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <PageLayout
        title="Discounts"
        description="Manage discounts and promotions for all business types"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Discount
          </Button>
        }
      >

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search discounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Discounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Active Discounts</CardTitle>
            <CardDescription>
              All active and scheduled discounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDiscounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No discounts found</p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Discount
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDiscounts.map((discount) => (
                    <TableRow key={discount.id}>
                      <TableCell className="font-medium">{discount.name}</TableCell>
                      <TableCell>{discount.type}</TableCell>
                      <TableCell>{discount.value}</TableCell>
                      <TableCell>
                        <Badge variant={discount.is_active ? "default" : "secondary"}>
                          {discount.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {discount.end_date ? new Date(discount.end_date).toLocaleDateString() : "No expiry"}
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
      </PageLayout>
    </DashboardLayout>
  )
}

