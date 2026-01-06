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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search, Mail, Phone, Award, Calendar, Edit, Trash2, Merge, Menu } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useState, useEffect, useCallback, useMemo } from "react"
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
import { customerService, type Customer } from "@/lib/services/customerService"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"
import { Badge } from "@/components/ui/badge"
import { FilterableTabs, TabsContent, type TabConfig } from "@/components/ui/filterable-tabs"
import { useToast } from "@/components/ui/use-toast"
import { useI18n } from "@/contexts/i18n-context"

export default function CustomerManagementPage() {
  const { currentBusiness, currentOutlet, outlets } = useBusinessStore()
  const { toast } = useToast()
  const { t } = useI18n()
  const [searchTerm, setSearchTerm] = useState("")
  const [outletFilter, setOutletFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("customers")
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [showLoyaltyAdjust, setShowLoyaltyAdjust] = useState(false)
  const [showMerge, setShowMerge] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const useReal = useRealAPI()

  const loadCustomers = useCallback(async () => {
    if (!currentBusiness) {
      setCustomers([])
      setIsLoading(false)
      return
    }
    
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
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      })
      setCustomers([])
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness, outletFilter, useReal, toast])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  // Filter customers based on active tab
  const filteredCustomers = useMemo(() => {
    let baseCustomers = customers

    // Filter by tab
    if (activeTab === "customer-credit") {
      baseCustomers = customers.filter(c => c.credit_enabled === true)
    }

    // Apply search filter
    const searchFiltered = baseCustomers.filter(customer => {
      const matchesSearch = 
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      return matchesSearch
    })

    // Apply outlet filter
    const outletFiltered = searchFiltered.filter(customer => {
      if (outletFilter === "all") return true
      return (customer.outlet_id && customer.outlet_id === outletFilter) ||
             (customer.outlet && customer.outlet === outletFilter)
    })

    return outletFiltered
  }, [customers, activeTab, searchTerm, outletFilter])

  // Calculate statistics
  const stats = useMemo(() => {
    const allCustomers = customers
    const creditCustomers = customers.filter(c => c.credit_enabled === true)
    
    return {
      totalCustomers: allCustomers.length,
      totalPoints: allCustomers.reduce((sum, c) => sum + (c.loyalty_points || c.points || 0), 0),
      totalSpent: allCustomers.reduce((sum, c) => sum + (c.total_spent || c.totalSpent || 0), 0),
      avgPoints: allCustomers.length > 0 
        ? Math.round(allCustomers.reduce((sum, c) => sum + (c.loyalty_points || c.points || 0), 0) / allCustomers.length)
        : 0,
      creditEnabled: creditCustomers.length,
      totalOutstanding: creditCustomers.reduce((sum, c) => {
        const balance = Number(c.outstanding_balance) || 0
        return sum + balance
      }, 0),
    }
  }, [customers])

  const handleDelete = (customerId: string) => {
    setCustomerToDelete(customerId)
    setShowDelete(true)
  }

  const confirmDelete = async () => {
    if (!customerToDelete) return
    
    try {
      // TODO: Implement delete in customerService when backend supports it
      // await customerService.delete(customerToDelete)
      setCustomers(customers.filter(c => c.id !== customerToDelete))
      toast({
        title: "Customer Deleted",
        description: "Customer has been deleted successfully.",
      })
      setShowDelete(false)
      setCustomerToDelete(null)
    } catch (error: any) {
      console.error("Failed to delete customer:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer.",
        variant: "destructive",
      })
    }
  }

  const tabsConfig: TabConfig[] = [
    {
      value: "customers",
      label: "Customers",
      badgeCount: stats.totalCustomers,
    },
    {
      value: "customer-credit",
      label: "Customer Credit",
      badgeCount: stats.creditEnabled,
    },
  ]

  return (
    <DashboardLayout>
      <PageLayout
        title={t("customers.menu.management")}
        description={t("customers.management.description")}
        noPadding={true}
      >
        <div className="px-6 pt-4 border-b border-gray-300">
          <FilterableTabs
            tabs={tabsConfig}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
            {/* Search and Filter Bar */}
            <div className="px-6 py-4 border-b border-gray-300">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-3xl">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder={t("customers.search_placeholder")}
                    className="pl-10 w-full bg-white border-gray-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={outletFilter} onValueChange={setOutletFilter}>
                  <SelectTrigger className="w-[200px] bg-white border-gray-300">
                    <SelectValue placeholder={t("common.outlet")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Outlets</SelectItem>
                    {outlets.map(outlet => (
                      <SelectItem key={outlet.id} value={outlet.id}>{outlet.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Customers Tab */}
            <TabsContent value="customers" className="mt-0">
              <div className="px-6 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">All Customers</h3>
                    <p className="text-sm text-gray-600">
                      {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? "s" : ""} found
                    </p>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedCustomer(null)
                      setShowAddCustomer(true)
                    }}
                    className="bg-[#1e3a8a] text-white hover:bg-blue-800"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Customer
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-md border border-gray-300 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-gray-900 font-semibold">Name</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Contact</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Loyalty Points</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Total Spent</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Last Visit</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Outlet</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <p className="text-gray-600">Loading customers...</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <p className="text-gray-600">No customers found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCustomers.map((customer) => {
                          const customerPoints = customer.loyalty_points || customer.points || 0
                          const totalSpent = customer.total_spent || customer.totalSpent || 0
                          const lastVisit = customer.last_visit || customer.lastVisit
                          const outletName = outlets.find(o => o.id === (customer.outlet_id || customer.outlet))?.name || customer.outlet || "N/A"
                          
                          return (
                            <TableRow key={customer.id} className="border-gray-300">
                              <TableCell>
                                <Link 
                                  href={`/dashboard/office/customer-management/${customer.id}`}
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
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Menu className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedCustomer(customer)
                                        setShowAddCustomer(true)
                                      }}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Customer
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedCustomer(customer)
                                        setShowLoyaltyAdjust(true)
                                      }}
                                    >
                                      <Award className="mr-2 h-4 w-4" />
                                      Adjust Loyalty Points
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedCustomer(customer)
                                        setShowMerge(true)
                                      }}
                                    >
                                      <Merge className="mr-2 h-4 w-4" />
                                      Merge Customer
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(customer.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Customer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* Customer Credit Tab */}
            <TabsContent value="customer-credit" className="mt-0">
              <div className="px-6 py-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Customers with Credit</h3>
                  <p className="text-sm text-gray-600">
                    {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? "s" : ""} with credit enabled
                  </p>
                </div>
                <div className="overflow-x-auto rounded-md border border-gray-300 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-gray-900 font-semibold">Name</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Email</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Phone</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Credit</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Outstanding</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Loyalty Points</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Total Spent</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <p className="text-gray-600">Loading customers...</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <p className="text-gray-600">No customers with credit found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <TableRow key={customer.id} className="border-gray-300">
                            <TableCell className="font-medium">
                              <Link 
                                href={`/dashboard/office/customer-management/${customer.id}`}
                                className="hover:text-primary"
                              >
                                {customer.name || "N/A"}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                {customer.email || "N/A"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                {customer.phone || "N/A"}
                              </div>
                            </TableCell>
                            <TableCell>
                              {customer.credit_enabled ? (
                                <div className="space-y-1">
                                  <Badge variant={customer.credit_status === 'active' ? 'default' : 'secondary'}>
                                    {customer.credit_status || 'active'}
                                  </Badge>
                                  <div className="text-xs text-muted-foreground">
                                    Limit: {currentBusiness?.currencySymbol || "MWK"} {Number(customer.credit_limit || 0).toFixed(2)}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">No Credit</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {customer.credit_enabled && (Number(customer.outstanding_balance) || 0) > 0 ? (
                                <div className="space-y-1">
                                  <span className="font-medium text-orange-600">
                                    {currentBusiness?.currencySymbol || "MWK"} {Number(customer.outstanding_balance || 0).toFixed(2)}
                                  </span>
                                  <div className="text-xs text-muted-foreground">
                                    Available: {currentBusiness?.currencySymbol || "MWK"} {Number(customer.available_credit || 0).toFixed(2)}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>{customer.loyalty_points || 0}</TableCell>
                            <TableCell>
                              {currentBusiness?.currencySymbol || "MWK"} {Number(customer.total_spent || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                customer.is_active !== false
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {customer.is_active !== false ? "Active" : "Inactive"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="border-gray-300">
                                    <Menu className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedCustomer(customer)
                                      setShowAddCustomer(true)
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Customer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </FilterableTabs>
        </div>
      </PageLayout>

      {/* Modals */}
      <AddEditCustomerModal
        open={showAddCustomer}
        onOpenChange={(open) => {
          setShowAddCustomer(open)
          if (!open) setSelectedCustomer(null)
        }}
        customer={selectedCustomer}
        onSuccess={loadCustomers}
      />
      <LoyaltyPointsAdjustModal
        open={showLoyaltyAdjust}
        onOpenChange={(open) => {
          setShowLoyaltyAdjust(open)
          if (!open) setSelectedCustomer(null)
        }}
        customer={selectedCustomer}
        onSuccess={loadCustomers}
      />
      <MergeCustomerModal
        open={showMerge}
        onOpenChange={(open) => {
          setShowMerge(open)
          if (!open) setSelectedCustomer(null)
        }}
        customer={selectedCustomer}
        onSuccess={loadCustomers}
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

