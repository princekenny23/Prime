"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { 
  UserCircle,
  BarChart3,
  UserCheck,
  Users,
  Clock,
  Receipt,
  FileText
} from "lucide-react"
import { OptionCard, type OptionCardProps } from "@/components/shared/option-card"

const officeOptions: Omit<OptionCardProps, "iconSize">[] = [
  {
    id: "accounts",
    title: "Accounts",
    href: "/dashboard/office/accounts",
    icon: UserCircle,
    description: "Manage user accounts and access"
  },
  {
    id: "reports",
    title: "Reports",
    href: "/dashboard/office/reports",
    icon: BarChart3,
    description: "View analytics and reports"
  },
  {
    id: "crm",
    title: "CRM",
    href: "/dashboard/office/crm",
    icon: UserCheck,
    description: "Customer relationship management"
  },
  {
    id: "staff",
    title: "Employee Management",
    href: "/dashboard/office/staff",
    icon: Users,
    description: "Manage employees and their roles"
  },
  {
    id: "shift-management",
    title: "Shift Management",
    href: "/dashboard/office/shift-management",
    icon: Clock,
    description: "Manage shifts and shift history"
  },
  {
    id: "expenses",
    title: "Expenses",
    href: "/dashboard/office/expenses",
    icon: Receipt,
    description: "Track and manage business expenses"
  },
  {
    id: "quotations",
    title: "Quotations",
    href: "/dashboard/office/quotations",
    icon: FileText,
    description: "Create and manage customer quotations"
  },
]

export default function OfficePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Office Management</h1>
          <p className="text-muted-foreground mt-1">
            Select an option to manage your office operations
          </p>
        </div>

        {/* Option Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {officeOptions.map((option) => (
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

