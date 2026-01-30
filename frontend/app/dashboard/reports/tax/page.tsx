"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"

export default function TaxReportPage() {
  return (
    <DashboardLayout>
      <PageLayout
        title="Tax Report"
        description="Tax calculations and compliance"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Tax reports coming soon. Check back later.
            </p>
          </div>
        </div>
      </PageLayout>
    </DashboardLayout>
  )
}
