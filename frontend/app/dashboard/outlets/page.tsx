"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { OutletList } from "@/components/outlets/outlet-list"
import { AddEditOutletModal } from "@/components/modals/add-edit-outlet-modal"

export default function OutletsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleOutletCreated = () => {
    // Force refresh of outlet list by changing key
    setRefreshKey(prev => prev + 1)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Outlets</h1>
            <p className="text-muted-foreground">Manage your business locations and outlets</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Outlet
          </Button>
        </div>

        <OutletList key={refreshKey} />

        <AddEditOutletModal 
          open={isModalOpen} 
          onOpenChange={setIsModalOpen}
          onOutletCreated={handleOutletCreated}
        />
      </div>
    </DashboardLayout>
  )
}
