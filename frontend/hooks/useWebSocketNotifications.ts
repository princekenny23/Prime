"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useAuthStore } from "@/stores/authStore"
import { notificationService, type Notification } from "@/lib/services/notificationService"

interface WebSocketMessage {
  type: "notification" | "notification_count" | "pong"
  notification?: Notification
  unread_count?: number
  timestamp?: string
}

export function useWebSocketNotifications() {
  const { user } = useAuthStore()
  const [isConnected, setIsConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (!user?.id) {
      return
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close()
    }

    // Get WebSocket URL from environment or default
    if (typeof window === "undefined") {
      return // Don't connect during SSR
    }

    const wsHost = process.env.NEXT_PUBLIC_WS_URL || window.location.host
    const userId = typeof user.id === 'number' ? user.id : parseInt(user.id)
    
    // Check if wsHost already includes protocol
    let wsUrl: string
    if (wsHost.startsWith("ws://") || wsHost.startsWith("wss://")) {
      // Already includes protocol
      wsUrl = `${wsHost}/ws/notifications/${userId}/`
    } else {
      // Determine protocol based on current page protocol
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"
      wsUrl = `${wsProtocol}//${wsHost}/ws/notifications/${userId}/`
    }

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("WebSocket connected")
        setIsConnected(true)

        // Clear any pending reconnection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }

        // Start ping interval (send ping every 30 seconds)
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }))
          }
        }, 30000)
      }

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data)

          switch (data.type) {
            case "notification":
              if (data.notification) {
                setLatestNotification(data.notification)
                // Update unread count if provided
                if (data.unread_count !== undefined) {
                  setUnreadCount(data.unread_count)
                } else {
                  // Fetch updated count
                  notificationService.getUnreadCount().then((response) => {
                    setUnreadCount(response.unread_count)
                  })
                }
              }
              break

            case "notification_count":
              if (data.unread_count !== undefined) {
                setUnreadCount(data.unread_count)
                // Trigger a refresh of notifications when count updates
                // This ensures the list stays in sync
              }
              break

            case "pong":
              // Server responded to ping, connection is alive
              break

            default:
              console.warn("Unknown WebSocket message type:", data.type)
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error)
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        setIsConnected(false)
      }

      ws.onclose = () => {
        console.log("WebSocket disconnected")
        setIsConnected(false)

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
          pingIntervalRef.current = null
        }

        // Attempt to reconnect after 3 seconds (unless component is unmounting)
        if (user?.id) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, 3000)
        }
      }
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error)
      setIsConnected(false)
    }
  }, [user?.id])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
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

    // Cleanup on unmount
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

