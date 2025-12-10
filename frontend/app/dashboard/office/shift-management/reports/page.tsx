"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function ShiftReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/office/shift-management">
            <button className="text-muted-foreground hover:text-foreground">
              ← Back
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Shift Reports</h1>
            <p className="text-muted-foreground mt-1">
              Generate shift reports and analytics
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Shift Reports</CardTitle>
            <CardDescription>Generate and download shift reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">Shift reporting features coming soon...</p>
              <Button disabled>
                <Download className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

