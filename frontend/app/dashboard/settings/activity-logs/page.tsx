"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Download, Calendar } from "lucide-react"
import { useState, useEffect } from "react"
import { activityLogService, ActivityLog, ActivityLogFilters } from "@/lib/services/activityLogService"
import { format } from "date-fns"
import { PageRefreshButton } from "@/components/dashboard/page-refresh-button"

const ACTION_COLORS: Record<string, string> = {
  'Login': 'bg-green-100 text-green-800',
  'Logout': 'bg-gray-100 text-gray-800',
  'Create': 'bg-blue-100 text-blue-800',
  'Update': 'bg-yellow-100 text-yellow-800',
  'Delete': 'bg-red-100 text-red-800',
  'Refund': 'bg-orange-100 text-orange-800',
  'Discount': 'bg-purple-100 text-purple-800',
  'Cash Movement': 'bg-cyan-100 text-cyan-800',
  'Inventory Adjustment': 'bg-indigo-100 text-indigo-800',
  'Shift Open': 'bg-emerald-100 text-emerald-800',
  'Shift Close': 'bg-rose-100 text-rose-800',
  'Settings Change': 'bg-pink-100 text-pink-800',
  'Security Event': 'bg-red-200 text-red-900',
}

const MODULE_COLORS: Record<string, string> = {
  'Sales': 'bg-blue-50 text-blue-700',
  'Inventory': 'bg-green-50 text-green-700',
  'Products': 'bg-purple-50 text-purple-700',
  'Customers': 'bg-yellow-50 text-yellow-700',
  'Payments': 'bg-cyan-50 text-cyan-700',
  'Shifts': 'bg-orange-50 text-orange-700',
  'Cash Management': 'bg-indigo-50 text-indigo-700',
  'Settings': 'bg-gray-50 text-gray-700',
  'Users': 'bg-pink-50 text-pink-700',
  'Authentication': 'bg-red-50 text-red-700',
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<ActivityLogFilters>({
    page: 1,
    page_size: 50,
  })
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  useEffect(() => {
    loadLogs()
  }, [filters])

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const response = await activityLogService.list({
        ...filters,
        search: searchTerm || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      setLogs(response.results || [])
      setTotalCount(response.count || 0)
    } catch (error: any) {
      console.error("Failed to load activity logs:", error)
      setLogs([])
      setTotalCount(0)
      // Show error message to user
      if (error?.message) {
        console.error("Error details:", error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (key: keyof ActivityLogFilters, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 })
  }

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm || undefined, page: 1 })
    loadLogs()
  }

  const handleDateFilter = () => {
    setFilters({ ...filters, date_from: dateFrom || undefined, date_to: dateTo || undefined, page: 1 })
    loadLogs()
  }

  const getActionLabel = (action: string) => {
    const actionMap: Record<string, string> = {
      'login': 'Login',
      'logout': 'Logout',
      'create': 'Create',
      'update': 'Update',
      'delete': 'Delete',
      'refund': 'Refund',
      'discount': 'Discount',
      'cash_movement': 'Cash Movement',
      'inventory_adjustment': 'Inventory Adjustment',
      'shift_open': 'Shift Open',
      'shift_close': 'Shift Close',
      'settings_change': 'Settings Change',
      'security': 'Security Event',
    }
    return actionMap[action] || action
  }

  const getModuleLabel = (module: string) => {
    const moduleMap: Record<string, string> = {
      'sales': 'Sales',
      'inventory': 'Inventory',
      'products': 'Products',
      'customers': 'Customers',
      'payments': 'Payments',
      'shifts': 'Shifts',
      'cash': 'Cash Management',
      'settings': 'Settings',
      'users': 'Users',
      'auth': 'Authentication',
    }
    return moduleMap[module] || module
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/settings">
              <button className="text-muted-foreground hover:text-foreground">
                ← Back
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Activity Logs</h1>
              <p className="text-muted-foreground mt-1">
                View system activity and audit logs
              </p>
            </div>
          </div>
          <PageRefreshButton />
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter activity logs by various criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Action</Label>
                <Select
                  value={filters.action || "all"}
                  onValueChange={(value) => handleFilterChange('action', value === "all" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="cash_movement">Cash Movement</SelectItem>
                    <SelectItem value="inventory_adjustment">Inventory Adjustment</SelectItem>
                    <SelectItem value="shift_open">Shift Open</SelectItem>
                    <SelectItem value="shift_close">Shift Close</SelectItem>
                    <SelectItem value="settings_change">Settings Change</SelectItem>
                    <SelectItem value="security">Security Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Module</Label>
                <Select
                  value={filters.module || "all"}
                  onValueChange={(value) => handleFilterChange('module', value === "all" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Modules" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="payments">Payments</SelectItem>
                    <SelectItem value="shifts">Shifts</SelectItem>
                    <SelectItem value="cash">Cash Management</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="auth">Authentication</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  onBlur={handleDateFilter}
                />
              </div>

              <div className="space-y-2">
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  onBlur={handleDateFilter}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Activity Logs</CardTitle>
                <CardDescription>
                  {totalCount} total log entries
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading activity logs...</p>
            ) : logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No activity logs found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          {log.user_details ? (
                            <div>
                              <div className="font-medium">{log.user_details.name}</div>
                              <div className="text-xs text-muted-foreground">{log.user_details.email}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={ACTION_COLORS[getActionLabel(log.action)] || 'bg-gray-100 text-gray-800'}>
                            {getActionLabel(log.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={MODULE_COLORS[getModuleLabel(log.module)] || 'bg-gray-100 text-gray-800'}>
                            {getModuleLabel(log.module)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.resource_type && log.resource_id ? (
                            <div>
                              <div className="font-medium">{log.resource_type}</div>
                              <div className="text-xs text-muted-foreground">ID: {log.resource_id}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="truncate" title={log.description}>
                            {log.description}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.ip_address || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalCount > (filters.page_size || 50) && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((filters.page || 1) - 1) * (filters.page_size || 50) + 1} to{' '}
                  {Math.min((filters.page || 1) * (filters.page_size || 50), totalCount)} of {totalCount} entries
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                    disabled={(filters.page || 1) <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                    disabled={(filters.page || 1) * (filters.page_size || 50) >= totalCount}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

