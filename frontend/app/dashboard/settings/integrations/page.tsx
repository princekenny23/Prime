"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import Link from "next/link"
import { IntegrationsTab } from "@/components/settings/integrations-tab"

export default function IntegrationsSettingsPage() {
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
            <h1 className="text-3xl font-bold">Integrations</h1>
            <p className="text-muted-foreground mt-1">
              Manage third-party integrations
            </p>
          </div>
        </div>
        <IntegrationsTab />
      </div>
    </DashboardLayout>
  )
}

