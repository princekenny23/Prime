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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Truck,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  MapPin,
  Calendar,
  Plus,
} from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { deliveryService, type Delivery, type DeliveryFilters } from "@/lib/services/deliveryService"
import { useBusinessStore } from "@/stores/businessStore"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function DeliveriesPage() {
  const { currentBusiness } = useBusinessStore()
  const { toast } = useToast()
  const router = useRouter()
  
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  useEffect(() => {
    // Redirect if not wholesale/retail business
    if (currentBusiness && currentBusiness.type !== "wholesale and retail") {
      router.push("/dashboard")
      return
    }
  }, [currentBusiness, router])

  const loadDeliveries = useCallback(async () => {
    if (!currentBusiness) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const filters: DeliveryFilters = {}
      if (statusFilter !== "all") {
        filters.status = statusFilter
      }
      if (searchTerm) {
        filters.search = searchTerm
      }

      const response = await deliveryService.list(filters)
      setDeliveries(response.results || [])
    } catch (error) {
      console.error("Failed to load deliveries:", error)
      toast({
        title: "Error",
        description: "Failed to load deliveries",
        variant: "destructive",
      })
      setDeliveries([])
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness, statusFilter, searchTerm, toast])

  useEffect(() => {
    loadDeliveries()
  }, [loadDeliveries])

  const formatCurrency = (amount: number) => {
    return `${currentBusiness?.currencySymbol || "MWK"} ${amount.toFixed(2)}`
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; icon: any }> = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
      confirmed: { bg: "bg-blue-100", text: "text-blue-900", icon: CheckCircle },
      preparing: { bg: "bg-purple-100", text: "text-purple-800", icon: Package },
      ready: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
      in_transit: { bg: "bg-indigo-100", text: "text-indigo-800", icon: Truck },
      delivered: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
      completed: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
      cancelled: { bg: "bg-gray-100", text: "text-gray-800", icon: XCircle },
      failed: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
    }
    
    const statusConfig = config[status] || config.pending
    const Icon = statusConfig.icon
    
    return (
      <Badge className={`${statusConfig.bg} ${statusConfig.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    )
  }

  const handleStatusUpdate = async (delivery: Delivery, action: 'confirm' | 'dispatch' | 'complete' | 'cancel', data?: any) => {
    try {
      let updated: Delivery
      switch (action) {
        case 'confirm':
          updated = await deliveryService.confirm(delivery.id)
          break
        case 'dispatch':
          updated = await deliveryService.dispatch(delivery.id, data.status || 'in_transit', data)
          break
        case 'complete':
          updated = await deliveryService.complete(delivery.id, data?.notes)
          break
        case 'cancel':
          updated = await deliveryService.cancel(delivery.id, data?.reason)
          break
      }
      toast({
        title: "Success",
        description: `Delivery ${action}ed successfully`,
      })
      loadDeliveries()
      if (selectedDelivery?.id === delivery.id) {
        setSelectedDelivery(updated)
      }
    } catch (error: any) {
      console.error(`Failed to ${action} delivery:`, error)
      toast({
        title: "Error",
        description: error.data?.detail || `Failed to ${action} delivery`,
        variant: "destructive",
      })
    }
  }

  const summaryStats = useMemo(() => {
    const total = deliveries.length
    const pending = deliveries.filter(d => d.status === 'pending').length
    const inTransit = deliveries.filter(d => d.status === 'in_transit').length
    const completed = deliveries.filter(d => d.status === 'completed').length
    return { total, pending, inTransit, completed }
  }, [deliveries])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Deliveries</h1>
                <p className="text-muted-foreground mt-1">
                  Manage wholesale deliveries and fulfillment
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Deliveries</p>
                  <p className="text-2xl font-bold mt-1">{summaryStats.total}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-900" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold mt-1">{summaryStats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Transit</p>
                  <p className="text-2xl font-bold mt-1">{summaryStats.inTransit}</p>
                </div>
                <Truck className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold mt-1">{summaryStats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by delivery number, address, tracking..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Deliveries Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Deliveries</CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `${deliveries.length} delivery${deliveries.length !== 1 ? "s" : ""} found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading deliveries...</p>
              </div>
            ) : deliveries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No deliveries found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Delivery #</TableHead>
                      <TableHead>Sale #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell className="font-medium">
                          {delivery.delivery_number}
                        </TableCell>
                        <TableCell>
                          {delivery.sale?.receipt_number || `Sale #${delivery.sale_id}`}
                        </TableCell>
                        <TableCell>
                          {delivery.customer_name || "N/A"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{delivery.delivery_address}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {delivery.scheduled_date ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {format(new Date(delivery.scheduled_date), "MMM dd, yyyy")}
                            </div>
                          ) : (
                            "Not scheduled"
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(delivery.status)}
                        </TableCell>
                        <TableCell className="capitalize">
                          {delivery.delivery_method.replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDelivery(delivery)
                              setShowDetailDialog(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delivery Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Delivery Details: {selectedDelivery?.delivery_number}</DialogTitle>
            <DialogDescription>
              View and manage delivery information
            </DialogDescription>
          </DialogHeader>

          {selectedDelivery && (
            <div className="space-y-6 mt-4">
              {/* Status and Actions */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedDelivery.status)}</div>
                </div>
                <div className="flex gap-2">
                  {selectedDelivery.status === 'pending' && (
                    <Button onClick={() => handleStatusUpdate(selectedDelivery, 'confirm')}>
                      Confirm
                    </Button>
                  )}
                  {selectedDelivery.status === 'confirmed' && (
                    <Button onClick={() => handleStatusUpdate(selectedDelivery, 'dispatch', { status: 'ready' })}>
                      Mark Ready
                    </Button>
                  )}
                  {selectedDelivery.status === 'ready' && (
                    <Button onClick={() => handleStatusUpdate(selectedDelivery, 'dispatch', { status: 'in_transit' })}>
                      Dispatch
                    </Button>
                  )}
                  {selectedDelivery.status === 'in_transit' && (
                    <Button onClick={() => handleStatusUpdate(selectedDelivery, 'complete')}>
                      Mark Delivered
                    </Button>
                  )}
                  {['pending', 'confirmed', 'preparing'].includes(selectedDelivery.status) && (
                    <Button variant="destructive" onClick={() => handleStatusUpdate(selectedDelivery, 'cancel')}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              {/* Delivery Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Sale Number</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDelivery.sale?.receipt_number || `Sale #${selectedDelivery.sale_id}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Customer</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDelivery.customer_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Delivery Method</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedDelivery.delivery_method.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Delivery Fee</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(selectedDelivery.delivery_fee)}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div>
                <p className="text-sm font-medium mb-2">Delivery Address</p>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{selectedDelivery.delivery_address}</p>
                  {(selectedDelivery.delivery_city || selectedDelivery.delivery_state) && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {[selectedDelivery.delivery_city, selectedDelivery.delivery_state, selectedDelivery.delivery_postal_code].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {selectedDelivery.delivery_contact_name && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Contact: {selectedDelivery.delivery_contact_name}
                      {selectedDelivery.delivery_contact_phone && ` - ${selectedDelivery.delivery_contact_phone}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Items */}
              {selectedDelivery.items && selectedDelivery.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Items ({selectedDelivery.items.length})</p>
                  <div className="space-y-2">
                    {selectedDelivery.items.map((item) => (
                      <div key={item.id} className="p-3 bg-muted rounded-lg flex justify-between">
                        <div>
                          <p className="text-sm font-medium">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        {item.is_delivered && (
                          <Badge className="bg-green-100 text-green-800">Delivered</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tracking Info */}
              {(selectedDelivery.tracking_number || selectedDelivery.courier_name || selectedDelivery.driver_name) && (
                <div>
                  <p className="text-sm font-medium mb-2">Tracking Information</p>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedDelivery.tracking_number && (
                      <div>
                        <p className="text-xs text-muted-foreground">Tracking Number</p>
                        <p className="text-sm">{selectedDelivery.tracking_number}</p>
                      </div>
                    )}
                    {selectedDelivery.courier_name && (
                      <div>
                        <p className="text-xs text-muted-foreground">Courier</p>
                        <p className="text-sm">{selectedDelivery.courier_name}</p>
                      </div>
                    )}
                    {selectedDelivery.driver_name && (
                      <div>
                        <p className="text-xs text-muted-foreground">Driver</p>
                        <p className="text-sm">{selectedDelivery.driver_name}</p>
                      </div>
                    )}
                    {selectedDelivery.vehicle_number && (
                      <div>
                        <p className="text-xs text-muted-foreground">Vehicle</p>
                        <p className="text-sm">{selectedDelivery.vehicle_number}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedDelivery.notes && (
                <div>
                  <p className="text-sm font-medium mb-2">Notes</p>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    {selectedDelivery.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

