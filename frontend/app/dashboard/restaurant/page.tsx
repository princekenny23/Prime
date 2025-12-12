"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { 
  Square,
  ChefHat,
  ShoppingCart,
  BookOpen,
  Calendar,
  UtensilsCrossed,
} from "lucide-react"
import { OptionCard, type OptionCardProps } from "@/components/shared/option-card"

const restaurantOptions: Omit<OptionCardProps, "iconSize">[] = [
  {
    id: "tables",
    title: "Tables",
    href: "/dashboard/restaurant/tables",
    icon: Square,
    description: "Manage restaurant tables and seating"
  },
  {
    id: "kitchen",
    title: "Kitchen",
    href: "/dashboard/restaurant/kitchen",
    icon: ChefHat,
    description: "Kitchen display system and order tickets"
  },
  {
    id: "orders",
    title: "Orders",
    href: "/dashboard/restaurant/orders",
    icon: ShoppingCart,
    description: "View and manage restaurant orders"
  },
  {
    id: "menu",
    title: "Menu Builder",
    href: "/dashboard/restaurant/menu",
    icon: BookOpen,
    description: "Build and manage your restaurant menu"
  },
  {
    id: "recipes",
    title: "Recipes",
    href: "/dashboard/restaurant/recipes",
    icon: UtensilsCrossed,
    description: "Manage recipes and ingredients"
  },
  {
    id: "reservations",
    title: "Reservations",
    href: "/dashboard/restaurant/reservations",
    icon: Calendar,
    description: "Manage table reservations and bookings"
  },
]

export default function RestaurantPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Restaurant Management</h1>
          <p className="text-muted-foreground mt-1">
            Select an option to manage your restaurant operations
          </p>
        </div>

        {/* Option Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurantOptions.map((option) => (
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
