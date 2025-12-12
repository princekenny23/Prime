"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Check, CheckCheck, Loader2, Settings, Save, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { ViewNotificationDetailsModal } from "@/components/modals/view-notification-details-modal"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { notificationService, type Notification, type NotificationPreference } from "@/lib/services/notificationService"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import { PageRefreshButton } from "@/components/dashboard/page-refresh-button"
import { useWebSocketNotifications } from "@/hooks/useWebSocketNotifications"
import { useToast } from "@/components/ui/use-toast"

export default function NotificationsPage() {
  const { currentBusiness } = useBusinessStore()
  const { currentOutlet } = useTenant()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("notifications")
  const [showDetails, setShowDetails] = useState(false)
  const [showMarkAllRead, setShowMarkAllRead] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [filter, setFilter] = useState<string>("all")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<any>(null)
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null)
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Use WebSocket hook for real-time notifications
  const { isConnected, unreadCount: wsUnreadCount, latestNotification } = useWebSocketNotifications()

  useEffect(() => {
    if (!currentBusiness) return

    loadNotifications()
    loadSummary()

    // Auto-refresh every 30 seconds (as fallback if WebSocket fails)
    const interval = setInterval(() => {
      loadNotifications()
      loadSummary()
    }, 30000)

    return () => clearInterval(interval)
  }, [currentBusiness, currentOutlet, filter])

  useEffect(() => {
    loadPreferences()
  }, [])

  // Update notifications list when new notification arrives via WebSocket
  useEffect(() => {
    if (latestNotification) {
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === latestNotification.id)
        if (exists) {
          return prev.map((n) => n.id === latestNotification.id ? latestNotification : n)
        }
        return [latestNotification, ...prev]
      })
      loadSummary()
    }
  }, [latestNotification])

  const loadNotifications = async () => {
    if (!currentBusiness) return

    try {
      setIsLoading(true)
      const filters: any = { page_size: 100 }
      if (filter === "unread") filters.read = false
      if (filter === "read") filters.read = true
      if (currentOutlet?.id) {
        filters.outlet_id = currentOutlet.id
      }

      const response = await notificationService.list(filters)
      setNotifications(response.results || [])
    } catch (error) {
      console.error("Failed to load notifications:", error)
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadSummary = async () => {
    if (!currentBusiness) return

    try {
      const data = await notificationService.getSummary()
      setSummary(data)
    } catch (error) {
      console.error("Failed to load summary:", error)
    }
  }

  const loadPreferences = async () => {
    try {
      setIsLoadingPreferences(true)
      const data = await notificationService.getMyPreferences()
      setPreferences(data)
    } catch (error: any) {
      console.error("Failed to load notification preferences:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load notification preferences",
        variant: "destructive",
      })
    } finally {
      setIsLoadingPreferences(false)
    }
  }

  const handleToggle = (field: keyof NotificationPreference) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      [field]: !preferences[field],
    })
  }

  const handleSavePreferences = async () => {
    if (!preferences) return

    try {
      setIsSaving(true)
      await notificationService.updatePreference(preferences.id, preferences)
      toast({
        title: "Success",
        description: "Notification preferences saved successfully",
      })
    } catch (error: any) {
      console.error("Failed to save notification preferences:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save notification preferences",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === "unread") return !notif.read
    if (filter === "read") return notif.read
    return true
  })

  const unreadCount = wsUnreadCount !== undefined ? wsUnreadCount : notifications.filter(n => !n.read).length

  const handleMarkAsRead = async (id: string | number) => {
    try {
      await notificationService.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, read: true } : n)
      )
      loadNotifications()
      loadSummary()
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllRead()
      setShowMarkAllRead(false)
      loadNotifications()
      loadSummary()
    } catch (error) {
      console.error("Failed to mark all as read:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "sale": return "💰"
      case "stock": return "⚠️"
      case "payment": return "💳"
      case "customer": return "👤"
      case "staff": return "👥"
      case "report": return "📊"
      case "system": return "🔔"
      case "shift": return "🕐"
      case "inventory": return "📦"
      case "delivery": return "🚚"
      default: return "📢"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "normal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      case "low":
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200"
      default:
        return ""
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              View and manage your notifications and preferences
              {!isConnected && (
                <span className="ml-2 text-xs text-yellow-600">(WebSocket disconnected - using polling)</span>
              )}
            </p>
          </div>
          <PageRefreshButton />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="flex items-center justify-end gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowMarkAllRead(true)}
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Mark All as Read
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.total || notifications.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unread</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{summary?.unread || unreadCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Read</CardTitle>
                  <Check className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {summary?.read || (notifications.length - unreadCount)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Notifications</SelectItem>
                      <SelectItem value="unread">Unread Only</SelectItem>
                      <SelectItem value="read">Read Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notifications List */}
            <Card>
              <CardHeader>
                <CardTitle>All Notifications</CardTitle>
                <CardDescription>
                  {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        No notifications found
                      </div>
                    ) : (
                      filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                            !notification.read ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800" : ""
                          }`}
                          onClick={() => {
                            setSelectedNotification(notification)
                            setShowDetails(true)
                            if (!notification.read) {
                              handleMarkAsRead(notification.id)
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{notification.title}</h4>
                                  {!notification.read && (
                                    <Badge variant="default" className="h-4 px-1.5 text-xs">
                                      New
                                    </Badge>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className={`h-4 px-1.5 text-xs ${getPriorityColor(notification.priority)}`}
                                  >
                                    {notification.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(notification.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMarkAsRead(notification.id)
                                  }}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            {isLoadingPreferences ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ) : !preferences ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    Failed to load notification preferences
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Notification Types */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Types
                    </CardTitle>
                    <CardDescription>
                      Choose which types of notifications you want to receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sale-notifications">Sale Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when sales are completed
                        </p>
                      </div>
                      <Switch
                        id="sale-notifications"
                        checked={preferences.enable_sale_notifications}
                        onCheckedChange={() => handleToggle("enable_sale_notifications")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="stock-notifications">Stock Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about low stock alerts
                        </p>
                      </div>
                      <Switch
                        id="stock-notifications"
                        checked={preferences.enable_stock_notifications}
                        onCheckedChange={() => handleToggle("enable_stock_notifications")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="staff-notifications">Staff Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when staff members are added or updated
                        </p>
                      </div>
                      <Switch
                        id="staff-notifications"
                        checked={preferences.enable_staff_notifications}
                        onCheckedChange={() => handleToggle("enable_staff_notifications")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="system-notifications">System Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about system events (shifts, deliveries, etc.)
                        </p>
                      </div>
                      <Switch
                        id="system-notifications"
                        checked={preferences.enable_system_notifications}
                        onCheckedChange={() => handleToggle("enable_system_notifications")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="payment-notifications">Payment Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when payments are received
                        </p>
                      </div>
                      <Switch
                        id="payment-notifications"
                        checked={preferences.enable_payment_notifications}
                        onCheckedChange={() => handleToggle("enable_payment_notifications")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="customer-notifications">Customer Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when new customers are added
                        </p>
                      </div>
                      <Switch
                        id="customer-notifications"
                        checked={preferences.enable_customer_notifications}
                        onCheckedChange={() => handleToggle("enable_customer_notifications")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="report-notifications">Report Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about report generation and updates
                        </p>
                      </div>
                      <Switch
                        id="report-notifications"
                        checked={preferences.enable_report_notifications}
                        onCheckedChange={() => handleToggle("enable_report_notifications")}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Priority Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle>Priority Filters</CardTitle>
                    <CardDescription>
                      Choose which priority levels you want to receive notifications for
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="low-priority">Low Priority</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive low priority notifications
                        </p>
                      </div>
                      <Switch
                        id="low-priority"
                        checked={preferences.enable_low_priority}
                        onCheckedChange={() => handleToggle("enable_low_priority")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="normal-priority">Normal Priority</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive normal priority notifications
                        </p>
                      </div>
                      <Switch
                        id="normal-priority"
                        checked={preferences.enable_normal_priority}
                        onCheckedChange={() => handleToggle("enable_normal_priority")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="high-priority">High Priority</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive high priority notifications
                        </p>
                      </div>
                      <Switch
                        id="high-priority"
                        checked={preferences.enable_high_priority}
                        onCheckedChange={() => handleToggle("enable_high_priority")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="urgent-priority">Urgent Priority</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive urgent priority notifications
                        </p>
                      </div>
                      <Switch
                        id="urgent-priority"
                        checked={preferences.enable_urgent_priority}
                        onCheckedChange={() => handleToggle("enable_urgent_priority")}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Methods */}
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Methods</CardTitle>
                    <CardDescription>
                      Choose how you want to receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="push-enabled">In-App Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications in the application
                        </p>
                      </div>
                      <Switch
                        id="push-enabled"
                        checked={preferences.push_enabled}
                        onCheckedChange={() => handleToggle("push_enabled")}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-enabled">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email (coming soon)
                        </p>
                      </div>
                      <Switch
                        id="email-enabled"
                        checked={preferences.email_enabled}
                        onCheckedChange={() => handleToggle("email_enabled")}
                        disabled
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="sms-enabled">SMS Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via SMS (coming soon)
                        </p>
                      </div>
                      <Switch
                        id="sms-enabled"
                        checked={preferences.sms_enabled}
                        onCheckedChange={() => handleToggle("sms_enabled")}
                        disabled
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button onClick={handleSavePreferences} disabled={isSaving} size="lg">
                    {isSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <ViewNotificationDetailsModal
        open={showDetails}
        onOpenChange={setShowDetails}
        notification={selectedNotification}
      />

      <AlertDialog open={showMarkAllRead} onOpenChange={setShowMarkAllRead}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark All as Read?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark all {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""} as read? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkAllAsRead}>
              Mark All as Read
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}

