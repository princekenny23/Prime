"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"

export default function StartShiftPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to shift-management start-shift page
    router.replace("/dashboard/office/shift-management/start-shift")
  }, [router])

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </DashboardLayout>
  )
}


