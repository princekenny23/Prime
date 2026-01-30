"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"

export default function RolesPage() {
  return (
    <DashboardLayout>
      <PageLayout
        title="Roles & Permissions"
        description="Manage user roles"
      >
        <div className="space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800">
              Role management coming soon.
            </p>
          </div>
        </div>
      </PageLayout>
    </DashboardLayout>
  )
}
