"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
import { FilterableTabs, TabsContent } from "@/components/ui/filterable-tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  ShoppingCart, 
  Package, 
  CreditCard, 
  Users, 
  FileText, 
  Settings,
  Clock,
  Truck
} from "lucide-react"
import { notificationService, type Notification } from "@/lib/services/notificationService"
import { NotificationsTab } from "@/components/settings/notifications-tab"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import { useWebSocketNotifications } from "@/hooks/useWebSocketNotifications"
import { useToast } from "@/components/ui/use-toast"
import { useI18n } from "@/contexts/i18n-context"

export default function NotificationsPage() {
  const { currentBusiness } = useBusinessStore()
  const { currentOutlet } = useTenant()
  const { toast } = useToast()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState("all")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterRead, setFilterRead] = useState<string>("all")
  
  // Use WebSocket hook for real-time notifications
  const { isConnected, unreadCount, latestNotification } = useWebSocketNotifications()

  useEffect(() => {
    if (!currentBusiness) return

    loadNotifications()

    // Auto-refresh every 30 seconds (as fallback if WebSocket fails)
    const interval = setInterval(() => {
      loadNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [currentBusiness, currentOutlet, filterType, filterRead, searchQuery])

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
      const timeoutId = setTimeout(() => {
        loadNotifications()
      }, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [latestNotification])

  const loadNotifications = async () => {
    if (!currentBusiness) return

    try {
      setIsLoading(true)
      const filters: any = { page_size: 50 }
      
      if (currentOutlet?.id) {
        filters.outlet_id = currentOutlet.id
      }
      
      if (filterType !== "all") {
        filters.type = filterType
      }
      
      if (filterRead !== "all") {
        filters.read = filterRead === "read"
      }
      
      if (searchQuery) {
        filters.search = searchQuery
      }
      
      const response = await notificationService.list(filters)
      setNotifications(response.results || [])
    } catch (error) {
      console.error("Failed to load notifications:", error)
      setNotifications([])
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string | number) => {
    try {
      await notificationService.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      toast({
        title: "Success",
        description: "Notification marked as read",
      })
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "sale":
        return <ShoppingCart className="h-5 w-5" />
      case "stock":
        return <Package className="h-5 w-5" />
      case "payment":
        return <CreditCard className="h-5 w-5" />
      case "customer":
        return <Users className="h-5 w-5" />
      case "staff":
        return <Users className="h-5 w-5" />
      case "report":
        return <FileText className="h-5 w-5" />
      case "system":
        return <Bell className="h-5 w-5" />
      case "shift":
        return <Clock className="h-5 w-5" />
      case "inventory":
        return <Package className="h-5 w-5" />
      case "delivery":
        return <Truck className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200"
      case "normal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      case "low":
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-350"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-350"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "sale":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
      case "stock":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
      case "payment":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
      case "customer":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200"
      case "staff":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200"
      case "report":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200"
      case "system":
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-350"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-350"
    }
  }

  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)

  const tabs = [
    {
      value: "all",
      label: t("settings.notifications.all_notifications"),
      badgeCount: unreadCount > 0 ? unreadCount : undefined,
      badgeVariant: "destructive" as const,
    },
    {
      value: "preferences",
      label: t("settings.notifications.preferences"),
    },
  ]

  return (
    <DashboardLayout>
      <PageLayout
        title={t("settings.notifications.title")}
        description={t("settings.notifications.description")}
        noPadding={true}
      >
        <div className="px-6 pt-4 border-b border-gray-300">
          <FilterableTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            searchValue={activeTab === "all" ? searchQuery : undefined}
            onSearchChange={activeTab === "all" ? setSearchQuery : undefined}
            searchPlaceholder={t("settings.notifications.search_placeholder")}
          actionButton={
            activeTab === "all" && unreadNotifications.length > 0 ? (
              <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
                {t("settings.notifications.mark_all_read")}
              </Button>
            ) : undefined
          }
        >
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t("settings.notifications.all_notifications")}</CardTitle>
                    <CardDescription>
                      {isConnected ? (
                        <span className="text-green-600 dark:text-green-400">
                          {t("settings.notifications.connected")}
                        </span>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400">
                          {t("settings.notifications.disconnected")}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value="all">{t("settings.notifications.all_types")}</option>
                      <option value="sale">{t("settings.notifications.type_sales")}</option>
                      <option value="stock">{t("settings.notifications.type_stock")}</option>
                      <option value="payment">{t("settings.notifications.type_payments")}</option>
                      <option value="customer">{t("settings.notifications.type_customers")}</option>
                      <option value="staff">{t("settings.notifications.type_staff")}</option>
                      <option value="report">{t("settings.notifications.type_reports")}</option>
                      <option value="system">{t("settings.notifications.type_system")}</option>
                      <option value="inventory">{t("settings.notifications.type_inventory")}</option>
                    </select>
                    <select
                      value={filterRead}
                      onChange={(e) => setFilterRead(e.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value="all">{t("common.all")}</option>
                      <option value="unread">{t("settings.notifications.unread")}</option>
                      <option value="read">{t("settings.notifications.read")}</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {t("common.loading")}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t("settings.notifications.no_notifications")}</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border transition-colors ${
                            !notification.read
                              ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                              : "bg-card border-border hover:bg-accent"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-sm">
                                      {notification.title}
                                    </h3>
                                    {!notification.read && (
                                      <span className="h-2 w-2 bg-primary rounded-full flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {notification.message}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="flex-shrink-0"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(
                                    new Date(notification.created_at),
                                    { addSuffix: true }
                                  )}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getTypeColor(notification.type)}`}
                                >
                                  {notification.type}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getPriorityColor(notification.priority)}`}
                                >
                                  {notification.priority}
                                </Badge>
                                {notification.link && (
                                  <Link
                                    href={notification.link}
                                    className="text-xs text-primary hover:underline"
                                  >
                                    {t("common.view_details")}
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="mt-0">
            <div className="px-6 py-4">
              <NotificationsTab />
            </div>
          </TabsContent>
        </FilterableTabs>
        </div>
      </PageLayout>
    </DashboardLayout>
  )
}

