"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
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
import { Search } from "lucide-react"
import { useState, useEffect } from "react"
import { activityLogService, ActivityLog, ActivityLogFilters } from "@/lib/services/activityLogService"
import { format } from "date-fns"
import { PageRefreshButton } from "@/components/dashboard/page-refresh-button"
import { useI18n } from "@/contexts/i18n-context"

const ACTION_COLORS: Record<string, string> = {
  'Login': 'bg-green-100 text-green-800',
  'Logout': 'bg-gray-100 text-gray-800',
  'Create': 'bg-blue-100 text-blue-900',
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
  'Sales': 'bg-blue-50 text-blue-900',
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
  const { t } = useI18n()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      'login': t("settings.activity_logs.action_login"),
      'logout': t("settings.activity_logs.action_logout"),
      'create': t("settings.activity_logs.action_create"),
      'update': t("settings.activity_logs.action_update"),
      'delete': t("settings.activity_logs.action_delete"),
      'refund': t("settings.activity_logs.action_refund"),
      'discount': t("settings.activity_logs.action_discount"),
      'cash_movement': t("settings.activity_logs.action_cash_movement"),
      'inventory_adjustment': t("settings.activity_logs.action_inventory_adjustment"),
      'shift_open': t("settings.activity_logs.action_shift_open"),
      'shift_close': t("settings.activity_logs.action_shift_close"),
      'settings_change': t("settings.activity_logs.action_settings_change"),
      'security': t("settings.activity_logs.action_security"),
    }
    return actionMap[action] || action
  }

  const getModuleLabel = (module: string) => {
    const moduleMap: Record<string, string> = {
      'sales': t("settings.activity_logs.module_sales"),
      'inventory': t("settings.activity_logs.module_inventory"),
      'products': t("settings.activity_logs.module_products"),
      'customers': t("settings.activity_logs.module_customers"),
      'payments': t("settings.activity_logs.module_payments"),
      'shifts': t("settings.activity_logs.module_shifts"),
      'cash': t("settings.activity_logs.module_cash"),
      'settings': t("settings.activity_logs.module_settings"),
      'users': t("settings.activity_logs.module_users"),
      'auth': t("settings.activity_logs.module_auth"),
    }
    return moduleMap[module] || module
  }

  return (
    <DashboardLayout>
      <PageLayout
        title={t("settings.activity_logs.title")}
        description={t("settings.activity_logs.description")}
        actions={<PageRefreshButton />}
      >
        {/* Filters */}
        <div className="mb-6 pb-4 border-b border-gray-300">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">{t("common.filters")}</h3>
            <p className="text-sm text-gray-600">{t("settings.activity_logs.filter_description")}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label className="text-gray-900">{t("common.search")}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={t("settings.activity_logs.search_placeholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-white border-gray-300"
                />
                <Button onClick={handleSearch} size="icon" className="border-gray-300">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900">{t("settings.activity_logs.action")}</Label>
              <Select
                value={filters.action || "all"}
                onValueChange={(value) => handleFilterChange('action', value === "all" ? undefined : value)}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder={t("settings.activity_logs.all_actions")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("settings.activity_logs.all_actions")}</SelectItem>
                  <SelectItem value="login">{t("settings.activity_logs.action_login")}</SelectItem>
                  <SelectItem value="logout">{t("settings.activity_logs.action_logout")}</SelectItem>
                  <SelectItem value="create">{t("settings.activity_logs.action_create")}</SelectItem>
                  <SelectItem value="update">{t("settings.activity_logs.action_update")}</SelectItem>
                  <SelectItem value="delete">{t("settings.activity_logs.action_delete")}</SelectItem>
                  <SelectItem value="refund">{t("settings.activity_logs.action_refund")}</SelectItem>
                  <SelectItem value="discount">{t("settings.activity_logs.action_discount")}</SelectItem>
                  <SelectItem value="cash_movement">{t("settings.activity_logs.action_cash_movement")}</SelectItem>
                  <SelectItem value="inventory_adjustment">{t("settings.activity_logs.action_inventory_adjustment")}</SelectItem>
                  <SelectItem value="shift_open">{t("settings.activity_logs.action_shift_open")}</SelectItem>
                  <SelectItem value="shift_close">{t("settings.activity_logs.action_shift_close")}</SelectItem>
                  <SelectItem value="settings_change">{t("settings.activity_logs.action_settings_change")}</SelectItem>
                  <SelectItem value="security">{t("settings.activity_logs.action_security")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900">{t("settings.activity_logs.module")}</Label>
              <Select
                value={filters.module || "all"}
                onValueChange={(value) => handleFilterChange('module', value === "all" ? undefined : value)}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder={t("settings.activity_logs.all_modules")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("settings.activity_logs.all_modules")}</SelectItem>
                  <SelectItem value="sales">{t("settings.activity_logs.module_sales")}</SelectItem>
                  <SelectItem value="inventory">{t("settings.activity_logs.module_inventory")}</SelectItem>
                  <SelectItem value="products">{t("settings.activity_logs.module_products")}</SelectItem>
                  <SelectItem value="customers">{t("settings.activity_logs.module_customers")}</SelectItem>
                  <SelectItem value="payments">{t("settings.activity_logs.module_payments")}</SelectItem>
                  <SelectItem value="shifts">{t("settings.activity_logs.module_shifts")}</SelectItem>
                  <SelectItem value="cash">{t("settings.activity_logs.module_cash")}</SelectItem>
                  <SelectItem value="settings">{t("settings.activity_logs.module_settings")}</SelectItem>
                  <SelectItem value="users">{t("settings.activity_logs.module_users")}</SelectItem>
                  <SelectItem value="auth">{t("settings.activity_logs.module_auth")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("settings.activity_logs.date_from")}</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                onBlur={handleDateFilter}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("settings.activity_logs.date_to")}</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                onBlur={handleDateFilter}
              />
            </div>
          </div>
        </div>

        {/* Activity Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("settings.activity_logs.title")}</CardTitle>
                <CardDescription>
                  {totalCount} {t("settings.activity_logs.total_entries")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">{t("common.loading")}</p>
            ) : logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">{t("settings.activity_logs.no_logs")}</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("settings.activity_logs.timestamp")}</TableHead>
                      <TableHead>{t("settings.activity_logs.user")}</TableHead>
                      <TableHead>{t("settings.activity_logs.action")}</TableHead>
                      <TableHead>{t("settings.activity_logs.module")}</TableHead>
                      <TableHead>{t("settings.activity_logs.resource")}</TableHead>
                      <TableHead>{t("settings.activity_logs.description_col")}</TableHead>
                      <TableHead>{t("settings.activity_logs.ip_address")}</TableHead>
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
                            <span className="text-muted-foreground">{t("common.system")}</span>
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
                  {t("common.showing")} {((filters.page || 1) - 1) * (filters.page_size || 50) + 1} {t("common.to")}{' '}
                  {Math.min((filters.page || 1) * (filters.page_size || 50), totalCount)} {t("common.of")} {totalCount} {t("common.entries")}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                    disabled={(filters.page || 1) <= 1}
                  >
                    {t("common.previous")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                    disabled={(filters.page || 1) * (filters.page_size || 50) >= totalCount}
                  >
                    {t("common.next")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PageLayout>
    </DashboardLayout>
  )
}
