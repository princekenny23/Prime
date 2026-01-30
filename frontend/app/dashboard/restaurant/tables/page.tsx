"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"

export default function TablesPage() {
  return (
    <DashboardLayout>
      <PageLayout
        title="Table Management"
        description="Manage restaurant tables"
      >
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              Table management coming soon.
            </p>
          </div>
        </div>
      </PageLayout>
    </DashboardLayout>
  )
}

