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
import { Plus, Search, FileText, Trash2, Eye, Filter, Download, Menu, ShoppingCart } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect, useCallback } from "react"
import { useBusinessStore } from "@/stores/businessStore"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils/currency"
import Link from "next/link"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { quotationService, type Quotation } from "@/lib/services/quotationService"
import { useTenant } from "@/contexts/tenant-context"

export default function QuotationsPage() {
  const { currentBusiness } = useBusinessStore()
  const { currentOutlet } = useTenant()
  const { toast } = useToast()
  const router = useRouter()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)

  const loadQuotations = useCallback(async () => {
    if (!currentBusiness) {
      setQuotations([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await quotationService.list({
        outlet: currentOutlet?.id,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchTerm || undefined,
      })
      setQuotations(response.results || [])
    } catch (error) {
      console.error("Failed to load quotations:", error)
      setQuotations([])
      toast({
        title: "Error",
        description: "Failed to load quotations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness, currentOutlet, statusFilter, searchTerm, toast])

  useEffect(() => {
    if (currentBusiness) {
      loadQuotations()
    }
  }, [currentBusiness, loadQuotations])

  // Reload when filters change
  useEffect(() => {
    if (currentBusiness) {
      loadQuotations()
    }
  }, [statusFilter, searchTerm])

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = 
      quotation.quotation_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = 
      statusFilter === "all" || quotation.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const totalValue = filteredQuotations.reduce((sum, q) => sum + q.total, 0)
  const pendingQuotations = filteredQuotations.filter(q => 
    q.status === "draft" || q.status === "sent"
  ).length
  const convertedQuotations = filteredQuotations.filter(q => 
    q.status === "converted"
  ).length

  const handleDelete = (quotationId: string) => {
    setQuotationToDelete(quotationId)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!quotationToDelete) return

    try {
      await quotationService.delete(quotationToDelete)
      
      toast({
        title: "Quotation Deleted",
        description: "Quotation has been deleted successfully.",
      })
      loadQuotations()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete quotation.",
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
      setQuotationToDelete(null)
    }
  }

  const handleView = async (quotationId: string) => {
    try {
      const quotation = await quotationService.get(quotationId)
      setSelectedQuotation(quotation)
      setShowViewDialog(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load quotation details.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadPDF = async (quotation: Quotation) => {
    try {
      // Dynamically import jsPDF and html2canvas
      const [{ default: jsPDF }, html2canvas] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ])

      // Show loading toast
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your quotation PDF...",
      })

      // Create a temporary container for PDF generation
      const tempDiv = document.createElement("div")
      tempDiv.style.position = "absolute"
      tempDiv.style.left = "-9999px"
      tempDiv.style.width = "800px"
      tempDiv.style.padding = "32px"
      tempDiv.style.backgroundColor = "#ffffff"
      tempDiv.className = "bg-white p-8"
      
      // Build HTML content
      tempDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 2px dashed #ccc;">
          <h2 style="font-size: 24px; font-weight: bold; margin: 0;">${currentBusiness?.name || "Business Name"}</h2>
          ${currentBusiness?.address ? `<p style="font-size: 12px; color: #666; margin-top: 8px;">${currentBusiness.address}</p>` : ""}
          <div style="display: flex; justify-content: center; gap: 16px; margin-top: 8px; font-size: 12px; color: #666;">
            ${currentBusiness?.phone ? `<span>Phone: ${currentBusiness.phone}</span>` : ""}
            ${currentBusiness?.email ? `<span>Email: ${currentBusiness.email}</span>` : ""}
          </div>
          ${currentOutlet ? `<p style="font-size: 12px; color: #666; margin-top: 8px;">Outlet: ${currentOutlet.name}</p>` : ""}
          <div style="margin-top: 16px;">
            <strong style="font-size: 16px;">QUOTATION</strong>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
          <div>
            <p style="font-size: 12px; color: #666; margin-bottom: 4px;">Quotation To:</p>
            <p style="font-weight: 600; font-size: 14px;">${quotation.customer_name || "Customer Name"}</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 12px; color: #666; margin-bottom: 4px;">Date:</p>
            <p style="font-weight: 600; font-size: 14px;">${format(new Date(quotation.created_at), "MMM dd, yyyy")}</p>
            <p style="font-size: 12px; color: #666; margin-top: 8px; margin-bottom: 4px;">Valid Until:</p>
            <p style="font-weight: 600; font-size: 14px;">${format(new Date(quotation.valid_until), "MMM dd, yyyy")}</p>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="border-bottom: 1px solid #ddd;">
              <th style="text-align: left; padding: 10px; font-weight: bold; font-size: 12px;">Item</th>
              <th style="text-align: right; padding: 10px; font-weight: bold; font-size: 12px;">Quantity</th>
              <th style="text-align: right; padding: 10px; font-weight: bold; font-size: 12px;">Unit Price</th>
              <th style="text-align: right; padding: 10px; font-weight: bold; font-size: 12px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${quotation.items?.map(item => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; font-size: 12px;">${item.product_name}</td>
                <td style="text-align: right; padding: 10px; font-size: 12px;">${item.quantity}</td>
                <td style="text-align: right; padding: 10px; font-size: 12px;">${formatCurrency(item.price, currentBusiness)}</td>
                <td style="text-align: right; padding: 10px; font-size: 12px; font-weight: 600;">${formatCurrency(item.total, currentBusiness)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div style="border-top: 2px solid #000; padding-top: 16px; margin-top: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
            <span style="color: #666;">Subtotal:</span>
            <span style="font-weight: 600;">${formatCurrency(quotation.subtotal, currentBusiness)}</span>
          </div>
          ${quotation.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
            <span style="color: #666;">Discount:</span>
            <span style="font-weight: 600; color: green;">-${formatCurrency(quotation.discount, currentBusiness)}</span>
          </div>
          ` : ""}
          ${quotation.tax > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
            <span style="color: #666;">Tax:</span>
            <span style="font-weight: 600;">${formatCurrency(quotation.tax, currentBusiness)}</span>
          </div>
          ` : ""}
          <div style="display: flex; justify-content: space-between; margin-top: 16px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 18px; font-weight: bold;">
            <span>Total:</span>
            <span>${formatCurrency(quotation.total, currentBusiness)}</span>
          </div>
        </div>
        ${quotation.notes ? `
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; font-weight: 600; margin-bottom: 8px;">Notes:</p>
          <p style="font-size: 12px; color: #666; white-space: pre-wrap;">${quotation.notes}</p>
        </div>
        ` : ""}
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px dashed #ccc; text-align: center; font-size: 11px; color: #666;">
          <p>This quotation is valid until ${format(new Date(quotation.valid_until), "MMMM dd, yyyy")}</p>
          <p style="margin-top: 4px;">Thank you for your business!</p>
        </div>
      `
      
      document.body.appendChild(tempDiv)

      // Wait a bit for rendering
      await new Promise(resolve => setTimeout(resolve, 100))

      // Capture as canvas
      const canvas = await html2canvas.default(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      // Remove temp element
      document.body.removeChild(tempDiv)

      // Calculate PDF dimensions
      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const pdf = new jsPDF("p", "mm", "a4")
      
      // Add image to PDF
      const imgData = canvas.toDataURL("image/png")
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)

      // Generate filename
      const filename = `Quotation-${quotation.quotation_number}-${format(new Date(quotation.created_at), "yyyy-MM-dd")}.pdf`

      // Save PDF
      pdf.save(filename)

      toast({
        title: "PDF Downloaded",
        description: "Quotation PDF has been downloaded successfully.",
      })
    } catch (error: any) {
      console.error("Failed to download quotation PDF:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>
      case "sent":
        return <Badge variant="default" className="bg-blue-500">Sent</Badge>
      case "accepted":
        return <Badge variant="default" className="bg-green-500">Accepted</Badge>
      case "converted":
        return <Badge variant="default" className="bg-purple-500">Converted</Badge>
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
  }

  return (
    <DashboardLayout>
      <PageLayout
        title="Quotations"
        description="Create and manage customer quotations"
        actions={
          <Link href="/dashboard/office/quotations/new">
            <Button className="bg-white border-white text-[#1e3a8a] hover:bg-blue-50 hover:border-blue-50">
              <Plus className="h-4 w-4 mr-2" />
              Create Quotation
            </Button>
          </Link>
        }
      >
        {/* Filters */}
        <div className="mb-6 pb-4 border-b border-gray-300">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by quotation number or customer..."
                  className="pl-10 bg-white border-gray-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white border-gray-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quotations Table */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">All Quotations</h3>
            <p className="text-sm text-gray-600">
              {filteredQuotations.length} {filteredQuotations.length === 1 ? "quotation" : "quotations"} found
            </p>
          </div>
          <div>
            {isLoading ? (
              <div className="text-center py-8 text-gray-600">Loading quotations...</div>
            ) : filteredQuotations.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No quotations found</p>
                <Link href="/dashboard/office/quotations/new">
                  <Button variant="outline" className="mt-4 border-gray-300">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Quotation
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-md border border-gray-300 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-gray-900 font-semibold">Quotation #</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Customer</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Date</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Valid Until</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Items</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Total</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                      <TableHead className="text-right text-gray-900 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuotations.map((quotation) => (
                      <TableRow key={quotation.id} className="border-gray-300">
                        <TableCell className="font-medium">{quotation.quotation_number}</TableCell>
                        <TableCell>{quotation.customer_name || "Walk-in"}</TableCell>
                        <TableCell>{format(new Date(quotation.created_at), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          <span className={isExpired(quotation.valid_until) ? "text-destructive" : ""}>
                            {format(new Date(quotation.valid_until), "MMM dd, yyyy")}
                          </span>
                        </TableCell>
                        <TableCell>{quotation.items?.length || quotation.items_count || 0} items</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(quotation.total, currentBusiness)}
                        </TableCell>
                        <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="border-gray-300">
                                <Menu className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleView(quotation.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPDF(quotation)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(quotation.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </PageLayout>

        {/* View Quotation Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quotation - {selectedQuotation?.quotation_number}
              </DialogTitle>
              <DialogDescription>
                Created on {selectedQuotation ? format(new Date(selectedQuotation.created_at), "MMM dd, yyyy") : ""}
              </DialogDescription>
            </DialogHeader>
            
            {selectedQuotation && (
              <div className="space-y-6 py-4">
                {/* Quotation Preview */}
                <div className="bg-white dark:bg-gray-900 p-8 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                  {/* Store/Business Header */}
                  <div className="text-center mb-6 pb-6 border-b border-dashed">
                    <h2 className="text-2xl font-bold">{currentBusiness?.name || "Business Name"}</h2>
                    {currentBusiness?.address && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {currentBusiness.address}
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
                      {currentBusiness?.phone && (
                        <p>Phone: {currentBusiness.phone}</p>
                      )}
                      {currentBusiness?.email && (
                        <p>Email: {currentBusiness.email}</p>
                      )}
                    </div>
                    {currentOutlet && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Outlet: {currentOutlet.name}
                      </p>
                    )}
                    <div className="mt-4">
                      <Badge variant="outline" className="text-lg px-4 py-1">
                        QUOTATION
                      </Badge>
                    </div>
                  </div>

                  {/* Quotation Details */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Quotation To:</p>
                      <p className="font-semibold mt-1">
                        {selectedQuotation.customer_name || "Customer Name"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Date:</p>
                      <p className="font-semibold mt-1">
                        {format(new Date(selectedQuotation.created_at), "MMM dd, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">Valid Until:</p>
                      <p className="font-semibold mt-1">
                        {format(new Date(selectedQuotation.valid_until), "MMM dd, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">Status:</p>
                      <p className="font-semibold mt-1">
                        {getStatusBadge(selectedQuotation.status)}
                      </p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="mb-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedQuotation.items?.map((item, index) => (
                          <TableRow key={item.id || index}>
                            <TableCell className="font-medium">{item.product_name}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.price, currentBusiness)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(item.total, currentBusiness)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">
                        {formatCurrency(selectedQuotation.subtotal, currentBusiness)}
                      </span>
                    </div>
                    {selectedQuotation.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="font-medium text-green-600">
                          -{formatCurrency(selectedQuotation.discount, currentBusiness)}
                        </span>
                      </div>
                    )}
                    {selectedQuotation.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-medium">
                          {formatCurrency(selectedQuotation.tax, currentBusiness)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>{formatCurrency(selectedQuotation.total, currentBusiness)}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedQuotation.notes && (
                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm font-semibold mb-2">Notes:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedQuotation.notes}
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
                    <p>This quotation is valid until {format(new Date(selectedQuotation.valid_until), "MMMM dd, yyyy")}</p>
                    <p className="mt-1">Thank you for your business!</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Quotation?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this quotation? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </DashboardLayout>
  )
}

