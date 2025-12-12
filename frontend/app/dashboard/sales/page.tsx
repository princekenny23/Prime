"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { 
  Receipt,
  RotateCcw,
  CreditCard,
  Tag,
} from "lucide-react"
import { OptionCard, type OptionCardProps } from "@/components/shared/option-card"

const salesOptions: Omit<OptionCardProps, "iconSize">[] = [
  {
    id: "transactions",
    title: "All Transactions",
    href: "/dashboard/sales/transactions",
    icon: Receipt,
    description: "View all sales transactions"
  },
  {
    id: "returns",
    title: "Returns",
    href: "/dashboard/sales/returns",
    icon: RotateCcw,
    description: "Manage product returns and refunds"
  },
  {
    id: "credits",
    title: "Credit Sales",
    href: "/dashboard/sales/credits",
    icon: CreditCard,
    description: "Track credit sales and payments"
  },
  {
    id: "discounts",
    title: "Discounts",
    href: "/dashboard/sales/discounts",
    icon: Tag,
    description: "View applied discounts and promotions"
  },
]

export default function SalesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Sales Management</h1>
          <p className="text-muted-foreground mt-1">
            Select an option to manage your sales operations
          </p>
        </div>

        {/* Option Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {salesOptions.map((option) => (
            <OptionCard
              key={option.id}
              {...option}
              iconSize="md"
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
