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
import { Plus, Search, FileText, Edit, Trash2, Eye, Filter, Mail, Download, ShoppingCart } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils/currency"
import Link from "next/link"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

interface Quotation {
  id: string
  quotation_number: string
  customer_id?: string
  customer_name?: string
  status: "draft" | "sent" | "accepted" | "converted" | "expired" | "cancelled"
  subtotal: number
  discount: number
  tax: number
  total: number
  valid_until: string
  created_at: string
  items_count: number
}

export default function QuotationsPage() {
  const { currentBusiness } = useBusinessStore()
  const { toast } = useToast()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const loadQuotations = useCallback(async () => {
    if (!currentBusiness) {
      setQuotations([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await quotationService.list()
      // setQuotations(response.results || [])
      
      // Mock data for now
      setQuotations([])
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
  }, [currentBusiness, toast])

  useEffect(() => {
    if (currentBusiness) {
      loadQuotations()
    }
  }, [currentBusiness, loadQuotations])

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
      // TODO: Replace with actual API call
      // await quotationService.delete(quotationToDelete)
      
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

  const handleConvertToSale = (quotationId: string) => {
    // TODO: Implement conversion to sale
    // This should redirect to POS with items pre-loaded
    router.push(`/pos/retail?quote=${quotationId}`)
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quotations</h1>
            <p className="text-muted-foreground">Create and manage customer quotations</p>
          </div>
          <Link href="/dashboard/office/quotations/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Quotation
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalValue, currentBusiness)}
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredQuotations.length} {filteredQuotations.length === 1 ? "quotation" : "quotations"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingQuotations}</div>
              <p className="text-xs text-muted-foreground">Draft or sent</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Converted</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{convertedQuotations}</div>
              <p className="text-xs text-muted-foreground">Converted to sales</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by quotation number or customer..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
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
          </CardContent>
        </Card>

        {/* Quotations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Quotations</CardTitle>
            <CardDescription>
              {filteredQuotations.length} {filteredQuotations.length === 1 ? "quotation" : "quotations"} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading quotations...</div>
            ) : filteredQuotations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No quotations found</p>
                <Link href="/dashboard/office/quotations/new">
                  <Button variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Quotation
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quotation #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuotations.map((quotation) => (
                      <TableRow key={quotation.id}>
                        <TableCell className="font-medium">{quotation.quotation_number}</TableCell>
                        <TableCell>{quotation.customer_name || "Walk-in"}</TableCell>
                        <TableCell>{format(new Date(quotation.created_at), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          <span className={isExpired(quotation.valid_until) ? "text-destructive" : ""}>
                            {format(new Date(quotation.valid_until), "MMM dd, yyyy")}
                          </span>
                        </TableCell>
                        <TableCell>{quotation.items_count} items</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(quotation.total, currentBusiness)}
                        </TableCell>
                        <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {quotation.status === "draft" && (
                              <>
                                <Button variant="ghost" size="icon" title="Send">
                                  <Mail className="h-4 w-4" />
                                </Button>
                                <Link href={`/dashboard/office/quotations/${quotation.id}/edit`}>
                                  <Button variant="ghost" size="icon" title="Edit">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </>
                            )}
                            {(quotation.status === "sent" || quotation.status === "accepted") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Convert to Sale"
                                onClick={() => handleConvertToSale(quotation.id)}
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                            )}
                            {quotation.status === "draft" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(quotation.id)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

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
      </div>
    </DashboardLayout>
  )
}

