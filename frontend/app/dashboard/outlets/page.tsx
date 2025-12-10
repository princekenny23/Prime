"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// This file has been moved to /dashboard/office/outlets
// Redirecting to the new location
export default function OutletsRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/dashboard/office/outlets")
  }, [router])
  
  return null
}
