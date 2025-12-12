"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { IntegrationsTab } from "@/components/settings/integrations-tab"

export default function IntegrationsSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Manage third-party integrations
          </p>
        </div>
        <IntegrationsTab />
      </div>
    </DashboardLayout>
  )
}

