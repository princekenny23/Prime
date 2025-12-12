"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { 
  PlayCircle,
  History,
  Clock,
  DollarSign,
} from "lucide-react"
import { PageRefreshButton } from "@/components/dashboard/page-refresh-button"
import { OptionCard, type OptionCardProps } from "@/components/shared/option-card"

const shiftManagementOptions: Omit<OptionCardProps, "iconSize">[] = [
  {
    id: "start-shift",
    title: "Start Shift",
    href: "/dashboard/office/shift-management/start-shift",
    icon: PlayCircle,
    description: "Start a new shift for cashier operations"
  },
  {
    id: "shift-history",
    title: "Shift History",
    href: "/dashboard/office/shift-management/history",
    icon: History,
    description: "View and manage all shift records"
  },
  {
    id: "active-shifts",
    title: "Active Shifts",
    href: "/dashboard/office/shift-management/active",
    icon: Clock,
    description: "View currently active shifts"
  },
  {
    id: "shift-reports",
    title: "Shift Reports",
    href: "/dashboard/office/shift-management/reports",
    icon: DollarSign,
    description: "Generate shift reports and analytics"
  },
]

export default function ShiftManagementPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Shift Management</h1>
            <p className="text-muted-foreground mt-1">
              Select an option to manage your shifts
            </p>
          </div>
          <PageRefreshButton />
        </div>

        {/* Option Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shiftManagementOptions.map((option) => (
            <OptionCard
              key={option.id}
              {...option}
              iconSize="sm"
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

