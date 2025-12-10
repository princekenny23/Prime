"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, CheckCheck, Trash2, Filter, Loader2, Settings } from "lucide-react"
import Link from "next/link"
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
import { notificationService, type Notification } from "@/lib/services/notificationService"
import { useBusinessStore } from "@/stores/businessStore"
import { PageRefreshButton } from "@/components/dashboard/page-refresh-button"
import { useWebSocketNotifications } from "@/hooks/useWebSocketNotifications"

export default function NotificationsPage() {
  const { currentBusiness } = useBusinessStore()
  const [showDetails, setShowDetails] = useState(false)
  const [showMarkAllRead, setShowMarkAllRead] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [filter, setFilter] = useState<string>("all")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<any>(null)
  
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
  }, [currentBusiness, filter])

  // Update notifications list when new notification arrives via WebSocket
  useEffect(() => {
    if (latestNotification) {
      // Add new notification to the top of the list
      setNotifications((prev) => {
        // Check if notification already exists (avoid duplicates)
        const exists = prev.some((n) => n.id === latestNotification.id)
        if (exists) {
          // Update existing notification
          return prev.map((n) => n.id === latestNotification.id ? latestNotification : n)
        }
        // Add new notification at the top
        return [latestNotification, ...prev]
      })
      // Reload summary to update counts (don't reload full list to avoid flicker)
      loadSummary()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestNotification])

  const loadNotifications = async () => {
    if (!currentBusiness) return

    try {
      setIsLoading(true)
      const filters: any = { page_size: 100 }
      if (filter === "unread") filters.read = false
      if (filter === "read") filters.read = true

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

  const filteredNotifications = notifications.filter(notif => {
    if (filter === "unread") return !notif.read
    if (filter === "read") return notif.read
    return true
  })

  // Use WebSocket unread count if available, otherwise calculate from notifications
  const unreadCount = wsUnreadCount !== undefined ? wsUnreadCount : notifications.filter(n => !n.read).length

  const handleMarkAsRead = async (id: string | number) => {
    try {
      await notificationService.markRead(id)
      // Update local state immediately
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, read: true } : n)
      )
      // Reload to ensure sync
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

  const handleDelete = async (id: string | number) => {
    // Note: Delete endpoint not implemented yet, would need to be added to backend
    console.log("Delete notification:", id)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "sale":
        return "💰"
      case "stock":
        return "⚠️"
      case "payment":
        return "💳"
      case "customer":
        return "👤"
      case "staff":
        return "👥"
      case "report":
        return "📊"
      case "system":
        return "🔔"
      case "shift":
        return "🕐"
      case "inventory":
        return "📦"
      case "delivery":
        return "🚚"
      default:
        return "📢"
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
              View and manage your notifications
              {!isConnected && (
                <span className="ml-2 text-xs text-yellow-600">(WebSocket disconnected - using polling)</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/settings/notifications">
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Notification Preferences
              </Button>
            </Link>
            <PageRefreshButton />
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

        {/* Notification Preferences Quick Link */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Manage Your Notification Preferences</h3>
                <p className="text-sm text-muted-foreground">
                  Customize which notifications you receive and how you receive them
                </p>
              </div>
              <Link href="/dashboard/settings/notifications">
                <Button>
                  <Settings className="mr-2 h-4 w-4" />
                  Open Preferences
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

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
      </div>

      {/* Modals */}
      <ViewNotificationDetailsModal
        open={showDetails}
        onOpenChange={setShowDetails}
        notification={selectedNotification}
      />

      {/* Mark All as Read Confirmation */}
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

