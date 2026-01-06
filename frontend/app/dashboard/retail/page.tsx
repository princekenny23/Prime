"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { 
  ShoppingCart,
  Users,
  FileText,
  Truck,
} from "lucide-react"
import { OptionCard, type OptionCardProps } from "@/components/shared/option-card"

const retailOptions: (Omit<OptionCardProps, "iconSize">)[] = [
  {
    id: "wholesale",
    title: "Wholesale",
    titleKey: "sales.menu.wholesale",
    href: "/dashboard/retail/wholesale",
    icon: ShoppingCart,
  },
  {
    id: "customer-groups",
    title: "Customer Groups",
    titleKey: "customers.menu.customer_groups",
    href: "/dashboard/retail/customer-groups",
    icon: Users,
  },
  {
    id: "price-lists",
    title: "Price Lists",
    titleKey: "sales.menu.price_lists",
    href: "/dashboard/retail/price-lists",
    icon: FileText,
  },
  {
    id: "deliveries",
    title: "Deliveries",
    titleKey: "sales.menu.deliveries",
    href: "/dashboard/retail/deliveries",
    icon: Truck,
  },
]

export default function RetailPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
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
