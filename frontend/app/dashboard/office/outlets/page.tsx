"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// This page has been moved to /dashboard/settings/outlets
// Redirecting to the new location
export default function OutletsPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/dashboard/settings/outlets")
  }, [router])
  
  return null
}
