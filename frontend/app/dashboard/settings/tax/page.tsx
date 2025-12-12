"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { TaxPricingTab } from "@/components/settings/tax-pricing-tab"

export default function TaxSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tax Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage tax rates and pricing
          </p>
        </div>
        <TaxPricingTab />
      </div>
    </DashboardLayout>
  )
}

