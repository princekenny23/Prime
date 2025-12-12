"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { 
  Calculator,
  Building2,
  Receipt,
  Plug,
  Bell,
  Percent,
  FileText,
} from "lucide-react"
import { OptionCard, type OptionCardProps } from "@/components/shared/option-card"

const settingsOptions: Omit<OptionCardProps, "iconSize">[] = [
  {
    id: "till-management",
    title: "Till Management",
    href: "/dashboard/settings/tills",
    icon: Calculator,
    description: "Manage tills and cash registers"
  },
  {
    id: "business-info",
    title: "Business Info",
    href: "/dashboard/settings/business",
    icon: Building2,
    description: "Manage business information and details"
  },
  {
    id: "receipts",
    title: "Receipts",
    href: "/dashboard/settings/receipts",
    icon: Receipt,
    description: "Configure receipt templates and settings"
  },
  {
    id: "integrations",
    title: "Integrations",
    href: "/dashboard/settings/integrations",
    icon: Plug,
    description: "Manage third-party integrations"
  },
  {
    id: "notifications",
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    description: "View notifications and manage preferences"
  },
  {
    id: "tax",
    title: "Tax",
    href: "/dashboard/settings/tax",
    icon: Percent,
    description: "Manage tax rates and pricing"
  },
  {
    id: "outlets",
    title: "Outlets",
    href: "/dashboard/settings/outlets",
    icon: Building2,
    description: "Manage outlet configurations"
  },
  {
    id: "activity-logs",
    title: "Activity Logs",
    href: "/dashboard/settings/activity-logs",
    icon: FileText,
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
          {settingsOptions.map((option) => (
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
