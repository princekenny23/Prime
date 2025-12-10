"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import Link from "next/link"
import { OutletList } from "@/components/outlets/outlet-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import { AddEditOutletModal } from "@/components/modals/add-edit-outlet-modal"
import { useBusinessStore } from "@/stores/businessStore"

export default function OutletsSettingsPage() {
  const { currentBusiness, loadOutlets } = useBusinessStore()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOutletCreated = async () => {
    // Reload outlets after creation/update
    if (loadOutlets && currentBusiness?.id) {
      await loadOutlets(currentBusiness.id)
    }
    setIsModalOpen(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/settings">
              <button className="text-muted-foreground hover:text-foreground">
                ← Back
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Outlet Settings</h1>
              <p className="text-muted-foreground mt-1">
                Manage your business outlets and branches
              </p>
            </div>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Outlet
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Outlet Management</CardTitle>
            <CardDescription>
              View and manage all your business outlets. Use the main Outlets page for advanced features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OutletList />
          </CardContent>
        </Card>

        <AddEditOutletModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onOutletCreated={handleOutletCreated}
        />
      </div>
    </DashboardLayout>
  )
}

