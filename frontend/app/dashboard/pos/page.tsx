"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { useBusinessStore } from "@/stores/businessStore"

export default function POSPage() {
  const router = useRouter()
  const { currentBusiness } = useBusinessStore()

  // Redirect to industry-specific POS
  useEffect(() => {
    if (currentBusiness) {
      router.push(`/pos/${currentBusiness.type}`)
    } else {
      router.push("/admin")
    }
  }, [currentBusiness, router])

  // Show loading while redirecting
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Redirecting to POS...</p>
      </div>
    </DashboardLayout>
  )
}

