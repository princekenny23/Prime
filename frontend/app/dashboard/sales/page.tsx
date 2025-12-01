
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
import { Plus, Search, Receipt } from "lucide-react"
import { useState, useEffect } from "react"
import { saleService } from "@/lib/services/saleService"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import Link from "next/link"
import type { Sale } from "@/lib/types/mock-data"

export default function SalesPage() {
  const { currentBusiness } = useBusinessStore()
  const { currentOutlet } = useTenant()
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const loadSales = async () => {
      if (!currentBusiness) return
      
      setIsLoading(true)
      try {
        const response = await saleService.list({
          outlet: currentOutlet?.id,
        })
        setSales(response.results || [])
      } catch (error) {
        console.error("Failed to load sales:", error)
        setSales([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSales()
  }, [currentBusiness, currentOutlet])

  const filteredSales = sales.filter(sale => {
    const searchLower = searchTerm.toLowerCase()
    return (
      sale.id.toLowerCase().includes(searchLower) ||
      sale.items.some(item => item.productName.toLowerCase().includes(searchLower))
    )
  })

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sales</h1>
            <p className="text-muted-foreground">Manage and track all your sales transactions</p>
          </div>
          <Link href="/dashboard/pos">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Sale
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sales Transactions</CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `${filteredSales.length} transaction${filteredSales.length !== 1 ? "s" : ""} found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search sales..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading sales...</p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No sales found</p>
                <Link href="/dashboard/pos">
                  <Button variant="outline" className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Sale
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">#{sale.id}</TableCell>
                      <TableCell>{formatDate(sale.createdAt)}</TableCell>
                      <TableCell>{sale.items.length} item{sale.items.length !== 1 ? "s" : ""}</TableCell>
                      <TableCell>MWK {sale.subtotal.toFixed(2)}</TableCell>
                      <TableCell>MWK {sale.tax.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">MWK {sale.total.toFixed(2)}</TableCell>
                      <TableCell className="capitalize">{sale.paymentMethod}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          sale.status === "completed" 
                            ? "bg-green-100 text-green-800"
                            : sale.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {sale.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/sales/${sale.id}`}>
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

