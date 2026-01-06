"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift, Plus } from "lucide-react"
import { useBusinessStore } from "@/stores/businessStore"

export default function LoyaltyPage() {
  const { currentBusiness } = useBusinessStore()

  return (
    <DashboardLayout>
      <PageLayout
        title="Loyalty Programs"
        description="Manage customer loyalty and rewards programs for all business types"
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Program
          </Button>
        }
      >

        {/* Coming Soon */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <Gift className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Loyalty Programs</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Create and manage customer loyalty programs, reward points, and special offers.
                This feature is coming soon.
              </p>
              <Button disabled>
                <Plus className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    </DashboardLayout>
  )
}

