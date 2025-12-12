"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { 
  Wine,
  CreditCard,
  FlaskConical,
} from "lucide-react"
import { OptionCard, type OptionCardProps } from "@/components/shared/option-card"

const barOptions: Omit<OptionCardProps, "iconSize">[] = [
  {
    id: "drinks",
    title: "Drinks Menu",
    href: "/dashboard/bar/drinks",
    icon: Wine,
    description: "Manage your bar drinks and beverages"
  },
  {
    id: "tabs",
    title: "Bar Tabs",
    href: "/dashboard/bar/tabs",
    icon: CreditCard,
    description: "Manage customer bar tabs and tabs"
  },
  {
    id: "recipes",
    title: "Mix Recipes",
    href: "/dashboard/bar/recipes",
    icon: FlaskConical,
    description: "Create and manage cocktail recipes"
  },
]

export default function BarPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Bar Management</h1>
          <p className="text-muted-foreground mt-1">
            Select an option to manage your bar operations
          </p>
        </div>

        {/* Option Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barOptions.map((option) => (
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
