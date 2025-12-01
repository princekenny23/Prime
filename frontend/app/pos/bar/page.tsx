"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useBusinessStore } from "@/stores/businessStore"
import { useShift } from "@/contexts/shift-context"
import { BarPOS } from "@/components/pos/bar-pos"
import { RegisterClosedScreen } from "@/components/pos/register-closed-screen"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"

export default function BarPOSPage() {
  const router = useRouter()
  const { currentBusiness } = useBusinessStore()
  const { activeShift, isLoading } = useShift()

  useEffect(() => {
    if (!currentBusiness) {
      router.push("/admin")
      return
    }

    if (currentBusiness.type !== "bar") {
      router.push(`/pos/${currentBusiness.type}`)
      return
    }
  }, [currentBusiness, router])

  if (!currentBusiness || currentBusiness.type !== "bar") {
    return null
  }

  // Show loading while checking shift
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  // If no active shift, show Register Closed screen
  if (!activeShift) {
    return (
      <DashboardLayout>
        <RegisterClosedScreen />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <BarPOS />
    </DashboardLayout>
  )
}
