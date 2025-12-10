"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import Link from "next/link"
import { 
  Calculator,
  Building2,
  Receipt,
  Plug,
  Bell,
  Percent,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SettingsOptionCard {
  id: string
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  bgColor: string
  iconColor: string
  textColor: string
  description?: string
}

const settingsOptions: SettingsOptionCard[] = [
  {
    id: "till-management",
    title: "Till Management",
    href: "/dashboard/settings/tills",
    icon: Calculator,
    bgColor: "bg-blue-900",
    iconColor: "text-white",
    textColor: "text-white",
    description: "Manage tills and cash registers"
  },
  {
    id: "business-info",
    title: "Business Info",
    href: "/dashboard/settings/business",
    icon: Building2,
    bgColor: "bg-gray-100",
    iconColor: "text-gray-700",
    textColor: "text-foreground",
    description: "Manage business information and details"
  },
  {
    id: "receipts",
    title: "Receipts",
    href: "/dashboard/settings/receipts",
    icon: Receipt,
    bgColor: "bg-blue-900",
    iconColor: "text-white",
    textColor: "text-white",
    description: "Configure receipt templates and settings"
  },
  {
    id: "integrations",
    title: "Integrations",
    href: "/dashboard/settings/integrations",
    icon: Plug,
    bgColor: "bg-gray-100",
    iconColor: "text-gray-700",
    textColor: "text-foreground",
    description: "Manage third-party integrations"
  },
  {
    id: "notifications",
    title: "Notifications",
    href: "/dashboard/settings/notifications",
    icon: Bell,
    bgColor: "bg-blue-900",
    iconColor: "text-white",
    textColor: "text-white",
    description: "Configure notification preferences"
  },
  {
    id: "tax",
    title: "Tax",
    href: "/dashboard/settings/tax",
    icon: Percent,
    bgColor: "bg-gray-100",
    iconColor: "text-gray-700",
    textColor: "text-foreground",
    description: "Manage tax rates and pricing"
  },
  {
    id: "outlets",
    title: "Outlets",
    href: "/dashboard/settings/outlets",
    icon: Building2,
    bgColor: "bg-blue-900",
    iconColor: "text-white",
    textColor: "text-white",
    description: "Manage outlet configurations"
  },
  {
    id: "activity-logs",
    title: "Activity Logs",
    href: "/dashboard/settings/activity-logs",
    icon: FileText,
    bgColor: "bg-gray-100",
    iconColor: "text-gray-700",
    textColor: "text-foreground",
    description: "View system activity and audit logs"
  },
]

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Select an option to manage your system settings
          </p>
        </div>

        {/* Option Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsOptions.map((option) => {
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
