"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useBusinessStore } from "@/stores/businessStore"
import { useShift } from "@/contexts/shift-context"
import { RetailPOS } from "@/components/pos/retail-pos"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"

export default function RetailPOSPage() {
  const router = useRouter()
  const { currentBusiness } = useBusinessStore()
  const { activeShift, isLoading } = useShift()

  useEffect(() => {
    if (!currentBusiness) {
      router.push("/admin")
      return
    }

    // Redirect non-retail/wholesale businesses to their specific POS
    if (currentBusiness.type !== "wholesale and retail") {
      router.push(`/pos/${currentBusiness.type}`)
      return
    }

    // If no active shift, redirect to POS landing page
    if (!isLoading && !activeShift) {
      router.push("/dashboard/pos")
      return
    }
  }, [currentBusiness, router, activeShift, isLoading])

  // Only allow "wholesale and retail" type to use this POS
  if (!currentBusiness || currentBusiness.type !== "wholesale and retail") {
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

  // If no active shift, redirect to landing page (handled in useEffect, but show loading while redirecting)
  if (!activeShift) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <RetailPOS />
    </DashboardLayout>
  )
}
