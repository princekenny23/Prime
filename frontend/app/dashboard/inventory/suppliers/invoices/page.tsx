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
import { Plus, Search, FileText, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

import { supplierInvoiceService } from "@/lib/services/supplierInvoiceService"

export default function SupplierInvoicesPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supplierInvoiceService.list()
      .then((response) => setInvoices(response.results))
      .catch((error) => {
        console.error("Failed to load invoices:", error)
        toast({
          title: "Error",
          description: "Failed to load supplier invoices",
          variant: "destructive",
        })
      })
      .finally(() => setLoading(false))
  }, [toast])

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      draft: { bg: "bg-gray-100", text: "text-gray-800", icon: Clock },
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
      partial: { bg: "bg-orange-100", text: "text-orange-800", icon: AlertCircle },
      paid: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
      overdue: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
      cancelled: { bg: "bg-gray-100", text: "text-gray-800", icon: XCircle },
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
            <h1 className="text-3xl font-bold">Supplier Invoices</h1>
            <p className="text-muted-foreground">Record and track supplier invoices</p>
          </div>
          <Link href="/dashboard/inventory/suppliers/invoices/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Supplier Invoices</CardTitle>
            <CardDescription>
              {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No invoices found. Record your first supplier invoice to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.supplier?.name || "N/A"}</TableCell>
                      <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>${invoice.total?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>${invoice.balance?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <Link href={`/dashboard/inventory/suppliers/invoices/${invoice.id}`}>
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

