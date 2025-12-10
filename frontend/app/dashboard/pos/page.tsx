"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { useBusinessStore } from "@/stores/businessStore"
import { useShift } from "@/contexts/shift-context"
import { UnifiedPOS } from "@/components/pos/unified-pos"
import { RegisterClosedScreen } from "@/components/pos/register-closed-screen"

export default function POSPage() {
  const router = useRouter()
  const { currentBusiness } = useBusinessStore()
  const { activeShift, isLoading } = useShift()

  useEffect(() => {
    if (!currentBusiness) {
      router.push("/admin")
      return
    }

    // For retail businesses, use unified POS (retail + wholesale)
    // For other business types, redirect to their specific POS
    if (currentBusiness.type !== "retail") {
      router.push(`/pos/${currentBusiness.type}`)
      return
    }
  }, [currentBusiness, router])

  if (!currentBusiness || currentBusiness.type !== "retail") {
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
      <UnifiedPOS />
    </DashboardLayout>
  )
}

