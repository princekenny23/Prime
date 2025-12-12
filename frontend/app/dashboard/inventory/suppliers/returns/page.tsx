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
import { Plus, Search, RotateCcw, CheckCircle, XCircle, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

import { purchaseReturnService } from "@/lib/services/purchaseReturnService"

export default function PurchaseReturnsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [returns, setReturns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    purchaseReturnService.list()
      .then((response) => setReturns(response.results))
      .catch((error) => {
        console.error("Failed to load returns:", error)
        toast({
          title: "Error",
          description: "Failed to load purchase returns",
          variant: "destructive",
        })
      })
      .finally(() => setLoading(false))
  }, [toast])

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      draft: { bg: "bg-gray-100", text: "text-gray-800", icon: Clock },
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
      approved: { bg: "bg-blue-100", text: "text-blue-800", icon: CheckCircle },
      returned: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
      cancelled: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
    }
    
    const config = statusConfig[status] || statusConfig.draft
    const Icon = config.icon
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Purchase Returns</h1>
            <p className="text-muted-foreground">Handle returns of purchased items to suppliers</p>
          </div>
          <Link href="/dashboard/inventory/suppliers/returns/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Return
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Purchase Returns</CardTitle>
            <CardDescription>
              {returns.length} return{returns.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search returns..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : returns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No returns found. Create your first purchase return to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Return Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Purchase Order</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map((returnItem) => (
                    <TableRow key={returnItem.id}>
                      <TableCell className="font-medium">{returnItem.return_number}</TableCell>
                      <TableCell>{returnItem.supplier?.name || "N/A"}</TableCell>
                      <TableCell>{new Date(returnItem.return_date).toLocaleDateString()}</TableCell>
                      <TableCell>{returnItem.purchase_order?.po_number || "N/A"}</TableCell>
                      <TableCell>${returnItem.total?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                      <TableCell>
                        <Link href={`/dashboard/inventory/suppliers/returns/${returnItem.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
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

