"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { 
  Wine,
  CreditCard,
  FlaskConical,
} from "lucide-react"
import { OptionCard, type OptionCardProps } from "@/components/shared/option-card"

const barOptions: (Omit<OptionCardProps, "iconSize">)[] = [
  {
    id: "drinks",
    title: "Drinks Menu",
    titleKey: "pos.bar.drinks",
    href: "/dashboard/bar/drinks",
    icon: Wine,
  },
  {
    id: "tabs",
    title: "Bar Tabs",
    titleKey: "pos.bar.tabs",
    href: "/dashboard/bar/tabs",
    icon: CreditCard,
  },
  {
    id: "recipes",
    title: "Mix Recipes",
    titleKey: "pos.bar.recipes",
    href: "/dashboard/bar/recipes",
    icon: FlaskConical,
  },
]

export default function BarPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
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
