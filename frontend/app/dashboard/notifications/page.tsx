"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// This page has been moved to /dashboard/settings/notifications
// Redirecting to the new location
export default function NotificationsPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/dashboard/settings/notifications")
  }, [router])
  
  return null
}
