"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { 
  ShoppingCart,
  Users,
  FileText,
  Truck,
} from "lucide-react"
import { OptionCard, type OptionCardProps } from "@/components/shared/option-card"

const retailOptions: Omit<OptionCardProps, "iconSize">[] = [
  {
    id: "wholesale",
    title: "Wholesale",
    href: "/dashboard/retail/wholesale",
    icon: ShoppingCart,
    description: "Manage wholesale pricing and quantities"
  },
  {
    id: "customer-groups",
    title: "Customer Groups",
    href: "/dashboard/retail/customer-groups",
    icon: Users,
    description: "Organize customers into groups for pricing"
  },
  {
    id: "price-lists",
    title: "Price Lists",
    href: "/dashboard/retail/price-lists",
    icon: FileText,
    description: "Create and manage custom price lists"
  },
  {
    id: "deliveries",
    title: "Deliveries",
    href: "/dashboard/retail/deliveries",
    icon: Truck,
    description: "Track and manage delivery orders"
  },
]

export default function RetailPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Wholesale & Retail Management</h1>
          <p className="text-muted-foreground mt-1">
            Select an option to manage your wholesale and retail operations
          </p>
        </div>

        {/* Option Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {retailOptions.map((option) => (
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
