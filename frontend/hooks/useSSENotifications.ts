"use client"

/**
 * Server-Sent Events (SSE) Implementation for Notifications
 * 
 * PROS:
 * - Simpler than WebSockets (one-way communication is enough for notifications)
 * - Built-in reconnection handling by browser
 * - Works through most firewalls/proxies
 * - Lower overhead than WebSockets
 * - No need for ping/pong or connection management
 * 
 * CONS:
 * - One-way only (server to client)
 * - Limited to text data (but JSON works fine)
 * - Max 6 connections per domain (usually not an issue)
 */

import { useEffect, useRef, useState, useCallback } from "react"
import { useAuthStore } from "@/stores/authStore"
import { notificationService, type Notification } from "@/lib/services/notificationService"

export function useSSENotifications() {
  const { user } = useAuthStore()
  const [isConnected, setIsConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    if (!user?.id || typeof window === "undefined") {
      return
    }

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const userId = typeof user.id === 'number' ? user.id : parseInt(user.id)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
    const sseUrl = `${apiUrl}/notifications/stream/${userId}/`

    try {
      const eventSource = new EventSource(sseUrl, {
        withCredentials: true, // Include auth cookies
      })
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log("SSE connected")
        setIsConnected(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === "notification" && data.notification) {
            setLatestNotification(data.notification)
            if (data.unread_count !== undefined) {
              setUnreadCount(data.unread_count)
            } else {
              // Fetch updated count
              notificationService.getUnreadCount().then((response) => {
                setUnreadCount(response.unread_count)
              })
            }
          } else if (data.type === "notification_count" && data.unread_count !== undefined) {
            setUnreadCount(data.unread_count)
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error)
        }
      }

      eventSource.onerror = (error) => {
        console.error("SSE error:", error)
        setIsConnected(false)
        // Browser will automatically attempt to reconnect
      }
    } catch (error) {
      console.error("Failed to create SSE connection:", error)
      setIsConnected(false)
    }
  }, [user?.id])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
  }, [])

  // Connect on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [user?.id, connect, disconnect])

  // Fetch initial unread count
  useEffect(() => {
    if (user?.id) {
      notificationService.getUnreadCount().then((response) => {
        setUnreadCount(response.unread_count)
      })
    }
  }, [user?.id])

  return {
    isConnected,
    unreadCount,
    latestNotification,
    reconnect: connect,
    disconnect,
  }
}

