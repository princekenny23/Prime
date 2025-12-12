"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { ReceiptTemplateTab } from "@/components/settings/receipt-template-tab"

export default function ReceiptsSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Receipt Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure receipt templates and settings
          </p>
        </div>
        <ReceiptTemplateTab />
      </div>
    </DashboardLayout>
  )
}

