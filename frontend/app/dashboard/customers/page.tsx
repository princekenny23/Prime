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
import { Plus, Search, Users, Mail, Phone, Award, Calendar, Edit, Trash2, Merge } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { AddEditCustomerModal } from "@/components/modals/add-edit-customer-modal"
import { LoyaltyPointsAdjustModal } from "@/components/modals/loyalty-points-adjust-modal"
import { MergeCustomerModal } from "@/components/modals/merge-customer-modal"
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
import { customerService } from "@/lib/services/customerService"
import { useBusinessStore } from "@/stores/businessStore"

export default function CustomersPage() {
  const { currentBusiness, currentOutlet, outlets } = useBusinessStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [pointsFilter, setPointsFilter] = useState<string>("all")
  const [outletFilter, setOutletFilter] = useState<string>("all")
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [showLoyaltyAdjust, setShowLoyaltyAdjust] = useState(false)
  const [showMerge, setShowMerge] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCustomers = async () => {
      if (!currentBusiness) return
      
      setIsLoading(true)
      try {
        const response = await customerService.list({
          tenant: currentBusiness.id,
          outlet: outletFilter !== "all" ? outletFilter : undefined,
          is_active: true,
        })
        setCustomers(Array.isArray(response) ? response : response.results || [])
      } catch (error) {
        console.error("Failed to load customers:", error)
        setCustomers([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadCustomers()
  }, [currentBusiness, outletFilter, useReal])

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.phone && customer.phone.includes(searchTerm))
    
    const customerPoints = customer.loyalty_points || customer.points || 0
    const matchesPoints = pointsFilter === "all" || 
      (pointsFilter === "high" && customerPoints >= 1000) ||
      (pointsFilter === "medium" && customerPoints >= 500 && customerPoints < 1000) ||
      (pointsFilter === "low" && customerPoints < 500)
    
    const matchesOutlet = outletFilter === "all" || 
      (customer.outlet_id && customer.outlet_id === outletFilter) ||
      (customer.outlet && customer.outlet === outletFilter)

    return matchesSearch && matchesPoints && matchesOutlet
  })

  const handleDelete = (customerId: string) => {
    setCustomerToDelete(customerId)
    setShowDelete(true)
  }

  const confirmDelete = async () => {
    if (!customerToDelete) return
    
    try {
      if (useReal) {
        // TODO: Implement delete in customerService
        // await customerService.delete(customerToDelete)
      }
      setCustomers(customers.filter(c => c.id !== customerToDelete))
      setShowDelete(false)
      setCustomerToDelete(null)
    } catch (error) {
      console.error("Failed to delete customer:", error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground">Manage your customer relationships and loyalty programs</p>
          </div>
          <Button onClick={() => {
            setSelectedCustomer(null)
            setShowAddCustomer(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.reduce((sum, c) => sum + (c.loyalty_points || c.points || 0), 0).toLocaleString('en-US')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentBusiness?.currencySymbol || "MWK"} {customers.reduce((sum, c) => sum + (c.total_spent || c.totalSpent || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Points</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + (c.loyalty_points || c.points || 0), 0) / customers.length) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={pointsFilter} onValueChange={setPointsFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Loyalty Points" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Points</SelectItem>
                  <SelectItem value="high">High (1000+)</SelectItem>
                  <SelectItem value="medium">Medium (500-999)</SelectItem>
                  <SelectItem value="low">Low (&lt;500)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={outletFilter} onValueChange={setOutletFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Outlet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outlets</SelectItem>
                  {outlets.map(outlet => (
                    <SelectItem key={outlet.id} value={outlet.id}>{outlet.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Customers</CardTitle>
            <CardDescription>
              {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Loyalty Points</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">Loading customers...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No customers found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => {
                    const customerPoints = customer.loyalty_points || customer.points || 0
                    const totalSpent = customer.total_spent || customer.totalSpent || 0
                    const lastVisit = customer.last_visit || customer.lastVisit
                    const outletName = outlets.find(o => o.id === (customer.outlet_id || customer.outlet))?.name || customer.outlet || "N/A"
                    
                    return (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <Link 
                            href={`/dashboard/customers/${customer.id}`}
                            className="font-medium hover:text-primary"
                          >
                            {customer.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {customer.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{customer.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold">{customerPoints.toLocaleString('en-US')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {currentBusiness?.currencySymbol || "MWK"} {totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {lastVisit ? new Date(lastVisit).toLocaleDateString() : "Never"}
                          </div>
                        </TableCell>
                        <TableCell>{outletName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setShowAddCustomer(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setShowLoyaltyAdjust(true)
                          }}
                        >
                          <Award className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setShowMerge(true)
                          }}
                        >
                          <Merge className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(customer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AddEditCustomerModal
        open={showAddCustomer}
        onOpenChange={setShowAddCustomer}
        customer={selectedCustomer}
      />
      <LoyaltyPointsAdjustModal
        open={showLoyaltyAdjust}
        onOpenChange={setShowLoyaltyAdjust}
        customer={selectedCustomer}
      />
      <MergeCustomerModal
        open={showMerge}
        onOpenChange={setShowMerge}
        customer={selectedCustomer}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}

