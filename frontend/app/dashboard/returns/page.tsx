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
import { RotateCcw, Plus, Search } from "lucide-react"
import { useState, useEffect } from "react"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import { saleService } from "@/lib/services/saleService"

export default function ReturnsPage() {
  const { currentBusiness } = useBusinessStore()
  const { currentOutlet } = useTenant()
  const [returns, setReturns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const loadReturns = async () => {
      if (!currentBusiness) return
      
      setIsLoading(true)
      try {
        // Load refunded sales as returns
        const response = await saleService.list({
          outlet: currentOutlet?.id,
          status: "refunded",
        })
        setReturns(response.results || [])
      } catch (error) {
        console.error("Failed to load returns:", error)
        setReturns([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadReturns()
  }, [currentBusiness, currentOutlet])

  const filteredReturns = returns.filter((ret) =>
    ret.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ret.id.toString().includes(searchTerm)
  )

  return (
    <DashboardLayout>
      <PageLayout
        title="Returns & Refunds"
        description="Manage returns and refunds for all sales"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Process Return
          </Button>
        }
      >

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by receipt number or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Returns Table */}
        <Card>
          <CardHeader>
            <CardTitle>Returns History</CardTitle>
            <CardDescription>
              All processed returns and refunds
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading returns...</p>
              </div>
            ) : filteredReturns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RotateCcw className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No returns found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.map((ret) => (
                    <TableRow key={ret.id}>
                      <TableCell className="font-medium">
                        {ret.receipt_number || `#${ret.id.slice(-6)}`}
                      </TableCell>
                      <TableCell>
                        {new Date(ret.createdAt || ret.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {currentBusiness?.currencySymbol || "MWK"} {ret.total.toFixed(2)}
                      </TableCell>
                      <TableCell>{ret.items?.length || 0} items</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Refunded</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View Details
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

