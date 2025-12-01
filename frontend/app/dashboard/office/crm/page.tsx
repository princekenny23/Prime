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
import { Plus, Search, Users, Mail, Phone, CreditCard, AlertCircle, DollarSign } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { customerService, type Customer } from "@/lib/services/customerService"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"
import { Badge } from "@/components/ui/badge"
import { AddEditCustomerModal } from "@/components/modals/add-edit-customer-modal"
import Link from "next/link"

export default function CRMPage() {
  const { currentBusiness } = useBusinessStore()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const useReal = useRealAPI()

  const loadCustomers = useCallback(async () => {
    if (!currentBusiness) {
      setCustomers([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      if (useReal) {
        const data = await customerService.list({ is_active: true })
        setCustomers(data || [])
      } else {
        setCustomers([])
      }
    } catch (error) {
      console.error("Failed to load customers:", error)
      setCustomers([])
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness?.id, useReal])

  useEffect(() => {
    if (currentBusiness) {
      loadCustomers()
    }
  }, [currentBusiness?.id, loadCustomers])

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  )

  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.is_active !== false).length
  const newThisMonth = customers.filter(c => {
    if (!c.created_at) return false
    const created = new Date(c.created_at)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  }).length
  
  // Credit statistics
  const creditEnabledCustomers = customers.filter(c => c.credit_enabled).length
  const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0)
  const overdueCustomers = customers.filter(c => {
    // This would ideally come from credit summary, but for now we'll check if they have outstanding balance
    return c.credit_enabled && (c.outstanding_balance || 0) > 0
  }).length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">CRM</h1>
            <p className="text-muted-foreground">Manage your customer relationships</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/office/crm/credits">
              <Button variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                Credit Management
              </Button>
            </Link>
            <Link href="/dashboard/office/crm/payments">
              <Button variant="outline">
                <DollarSign className="mr-2 h-4 w-4" />
                Payment Collection
              </Button>
            </Link>
            <Button onClick={() => {
              setSelectedCustomer(null)
              setShowAddCustomer(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credit Enabled</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{creditEnabledCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentBusiness?.currencySymbol || "MWK"} {totalOutstanding.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Month</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{newThisMonth}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
            <CardDescription>Manage your customer database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Credit</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Loyalty Points</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-muted-foreground">Loading customers...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-muted-foreground">No customers found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name || "N/A"}</TableCell>
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
                              Limit: {currentBusiness?.currencySymbol || "MWK"} {(customer.credit_limit || 0).toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No Credit</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.credit_enabled && (customer.outstanding_balance || 0) > 0 ? (
                          <div className="space-y-1">
                            <span className="font-medium text-orange-600">
                              {currentBusiness?.currencySymbol || "MWK"} {(customer.outstanding_balance || 0).toFixed(2)}
                            </span>
                            <div className="text-xs text-muted-foreground">
                              Available: {currentBusiness?.currencySymbol || "MWK"} {(customer.available_credit || 0).toFixed(2)}
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
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(customer)
                              setShowAddCustomer(true)
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AddEditCustomerModal
        open={showAddCustomer}
        onOpenChange={(open) => {
          setShowAddCustomer(open)
          if (!open) setSelectedCustomer(null)
        }}
        customer={selectedCustomer}
        onSuccess={loadCustomers}
      />
    </DashboardLayout>
  )
}
