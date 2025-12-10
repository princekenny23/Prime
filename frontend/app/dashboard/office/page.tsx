"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import Link from "next/link"
import { 
  UserCircle,
  Truck,
  BarChart3,
  UserCheck,
  Users,
  CreditCard,
  DollarSign,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

interface OfficeOptionCard {
  id: string
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  bgColor: string
  iconColor: string
  textColor: string
  description?: string
}

const officeOptions: OfficeOptionCard[] = [
  {
    id: "accounts",
    title: "Accounts",
    href: "/dashboard/office/accounts",
    icon: UserCircle,
    bgColor: "bg-blue-900",
    iconColor: "text-white",
    textColor: "text-white",
    description: "Manage user accounts and access"
  },
  {
    id: "suppliers",
    title: "Suppliers",
    href: "/dashboard/office/suppliers",
    icon: Truck,
    bgColor: "bg-gray-100",
    iconColor: "text-gray-700",
    textColor: "text-foreground",
    description: "Manage supplier relationships"
  },
  {
    id: "reports",
    title: "Reports",
    href: "/dashboard/office/reports",
    icon: BarChart3,
    bgColor: "bg-blue-900",
    iconColor: "text-white",
    textColor: "text-white",
    description: "View analytics and reports"
  },
  {
    id: "crm",
    title: "CRM",
    href: "/dashboard/office/crm",
    icon: UserCheck,
    bgColor: "bg-gray-100",
    iconColor: "text-gray-700",
    textColor: "text-foreground",
    description: "Customer relationship management"
  },
  {
    id: "staff",
    title: "Staff",
    href: "/dashboard/office/staff",
    icon: Users,
    bgColor: "bg-gray-100",
    iconColor: "text-gray-700",
    textColor: "text-foreground",
    description: "Manage staff members and roles"
  },
  {
    id: "shift-management",
    title: "Shift Management",
    href: "/dashboard/office/shift-management",
    icon: Clock,
    bgColor: "bg-blue-900",
    iconColor: "text-white",
    textColor: "text-white",
    description: "Manage shifts and shift history"
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
          {officeOptions.map((option) => {
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

