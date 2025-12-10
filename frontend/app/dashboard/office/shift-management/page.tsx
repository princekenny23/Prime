"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import Link from "next/link"
import { 
  PlayCircle,
  History,
  Clock,
  DollarSign,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageRefreshButton } from "@/components/dashboard/page-refresh-button"

interface ShiftManagementOptionCard {
  id: string
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  bgColor: string
  iconColor: string
  textColor: string
  description?: string
}

const shiftManagementOptions: ShiftManagementOptionCard[] = [
  {
    id: "start-shift",
    title: "Start Shift",
    href: "/dashboard/office/shift-management/start-shift",
    icon: PlayCircle,
    bgColor: "bg-blue-900",
    iconColor: "text-white",
    textColor: "text-white",
    description: "Start a new shift for cashier operations"
  },
  {
    id: "shift-history",
    title: "Shift History",
    href: "/dashboard/office/shift-management/history",
    icon: History,
    bgColor: "bg-gray-100",
    iconColor: "text-gray-700",
    textColor: "text-foreground",
    description: "View and manage all shift records"
  },
  {
    id: "active-shifts",
    title: "Active Shifts",
    href: "/dashboard/office/shift-management/active",
    icon: Clock,
    bgColor: "bg-blue-900",
    iconColor: "text-white",
    textColor: "text-white",
    description: "View currently active shifts"
  },
  {
    id: "shift-reports",
    title: "Shift Reports",
    href: "/dashboard/office/shift-management/reports",
    icon: DollarSign,
    bgColor: "bg-gray-100",
    iconColor: "text-gray-700",
    textColor: "text-foreground",
    description: "Generate shift reports and analytics"
  },
]

export default function ShiftManagementPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/office">
              <button className="text-muted-foreground hover:text-foreground">
                ← Back
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Shift Management</h1>
              <p className="text-muted-foreground mt-1">
                Select an option to manage your shifts
              </p>
            </div>
          </div>
          <PageRefreshButton />
        </div>

        {/* Option Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shiftManagementOptions.map((option) => {
            const Icon = option.icon
            const isFullColor = option.bgColor.includes("900")
            
            return (
              <Link
                key={option.id}
                href={option.href}
                className="group block"
              >
                <div
                  className={cn(
                    "relative h-52 rounded-xl shadow-md transition-all duration-200 hover:shadow-xl hover:scale-[1.02] cursor-pointer overflow-hidden",
                    option.bgColor
                  )}
                >
                  {/* Icon Section - Centered */}
                  <div className={cn(
                    "absolute top-8 left-1/2 transform -translate-x-1/2",
                    isFullColor ? "opacity-100" : "opacity-90"
                  )}>
                    <Icon className={cn("h-12 w-12", option.iconColor)} />
                  </div>

                  {/* Title Section */}
                  <div className={cn(
                    "absolute bottom-0 left-0 right-0 p-5 rounded-b-xl",
                    isFullColor 
                      ? option.bgColor 
                      : "bg-white"
                  )}>
                    <h3 className={cn(
                      "font-semibold text-lg text-center",
                      isFullColor ? option.textColor : "text-foreground"
                    )}>
                      {option.title}
                    </h3>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}

