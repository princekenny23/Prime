"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { notificationService, type Notification } from "@/lib/services/notificationService"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import { useWebSocketNotifications } from "@/hooks/useWebSocketNotifications"

export function NotificationBell() {
  const { currentBusiness } = useBusinessStore()
  const { currentOutlet } = useTenant()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
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
  }, [currentBusiness, currentOutlet])

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
        return [latestNotification, ...prev].slice(0, 10) // Keep only latest 10
      })
      // Optionally refresh the list after a short delay to ensure sync
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
      const filters: any = { page_size: 10 }
      // Filter by current outlet if available
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

  const handleMarkAsRead = async (id: string | number) => {
    try {
      await notificationService.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      // Unread count will be updated via WebSocket
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
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
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-350"
      default:
        return ""
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <div className="relative flex items-center justify-center">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <>
                {/* Blinking blue ring - outer pulsing ring */}
                <span className="absolute inset-0 rounded-full border-2 border-blue-900 animate-ping opacity-75" />
                {/* Blinking blue ring - solid ring */}
                <span className="absolute inset-0 rounded-full border-2 border-blue-900 animate-blink" />
              </>
            )}
          </div>
          {!isConnected && (
            <span className="absolute -bottom-1 -right-1 h-2 w-2 bg-yellow-500 rounded-full border border-white" title="WebSocket disconnected" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {isLoading ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (!notification.read) {
                        handleMarkAsRead(notification.id)
                      }
                    }}
                    className="block"
                  >
                    <Link
                      href={notification.link || "/dashboard/settings/notifications"}
                      className="block"
                    >
                      <div
                        className={`p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer ${
                          !notification.read ? "bg-blue-50 dark:bg-blue-950/20" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium truncate">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="h-2 w-2 bg-primary rounded-full flex-shrink-0 ml-2" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getPriorityColor(notification.priority)}`}
                              >
                                {notification.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <div className="border-t pt-2 mt-2">
            <Link href="/dashboard/settings/notifications">
              <Button variant="ghost" className="w-full text-sm">
                View All Notifications
              </Button>
            </Link>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
