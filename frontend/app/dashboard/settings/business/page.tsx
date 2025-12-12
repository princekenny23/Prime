"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { BusinessInfoTab } from "@/components/settings/business-info-tab"

export default function BusinessSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Business Information</h1>
          <p className="text-muted-foreground mt-1">
            Manage your business information and details
          </p>
        </div>
        <BusinessInfoTab />
      </div>
    </DashboardLayout>
  )
}

