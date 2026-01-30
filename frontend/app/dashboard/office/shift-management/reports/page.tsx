"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function ShiftReportsPage() {
  return (
    <DashboardLayout>
      <PageLayout
        title="Shift Reports"
        description="Generate shift reports and analytics"
      >
        <div className="rounded-md border border-gray-300 bg-white p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Shift Reports</h3>
            <p className="text-sm text-gray-600">Generate and download shift reports</p>
          </div>
          <div className="space-y-4">
            <p className="text-gray-600">Shift reporting features coming soon...</p>
            <Button disabled className="border-gray-300">
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>
      </PageLayout>
    </DashboardLayout>
  )
}

