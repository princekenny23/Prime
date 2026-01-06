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
      <PageLayout
        title="Supplier Invoices"
        description="Record and track supplier invoices"
        actions={
          <Link href="/dashboard/inventory/suppliers/invoices/new">
            <Button className="bg-white border-white text-[#1e3a8a] hover:bg-blue-50 hover:border-blue-50">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </Link>
        }
      >
        {/* Filters */}
        <div className="mb-6 pb-4 border-b border-gray-300">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search invoices..."
                className="pl-10 bg-white border-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">All Supplier Invoices</h3>
            <p className="text-sm text-gray-600">
              {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} found
            </p>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No invoices found. Record your first supplier invoice to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border border-gray-300 bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-gray-900 font-semibold">Invoice Number</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Supplier</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Invoice Date</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Due Date</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Total</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Balance</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="border-gray-300">
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.supplier?.name || "N/A"}</TableCell>
                      <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>${invoice.total?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>${invoice.balance?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <Link href={`/dashboard/inventory/suppliers/invoices/${invoice.id}`}>
                          <Button variant="ghost" size="sm" className="border-gray-300">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </PageLayout>
    </DashboardLayout>
  )
}

