"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

export default function ReservationsPage() {
  return (
    <DashboardLayout>
      <PageLayout
        title="Reservations"
        description="Manage table reservations and bookings"
      >

        <Card>
          <CardHeader>
            <CardTitle>Reservations</CardTitle>
            <CardDescription>Manage table reservations and bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Reservations Coming Soon</h3>
              <p className="text-muted-foreground max-w-md">
                The reservations feature is currently under development. 
                You'll be able to manage table bookings, view reservation calendar, 
                and track customer reservations here.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    </DashboardLayout>
  )
}

