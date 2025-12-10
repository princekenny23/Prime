"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import Link from "next/link"
import { TaxPricingTab } from "@/components/settings/tax-pricing-tab"

export default function TaxSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/settings">
            <button className="text-muted-foreground hover:text-foreground">
              ← Back
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Tax Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage tax rates and pricing
            </p>
          </div>
        </div>
        <TaxPricingTab />
      </div>
    </DashboardLayout>
  )
}

