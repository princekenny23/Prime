"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import Link from "next/link"
import { 
  Square,
  ChefHat,
  ShoppingCart,
  BookOpen,
  Calendar,
  UtensilsCrossed,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface RestaurantOptionCard {
  id: string
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  bgColor: string
  iconColor: string
  textColor: string
  description?: string
}

const restaurantOptions: RestaurantOptionCard[] = [
  {
    id: "tables",
    title: "Tables",
    href: "/dashboard/restaurant/tables",
    icon: Square,
    bgColor: "bg-blue-900",
    iconColor: "text-white",
    textColor: "text-white",
    description: "Manage restaurant tables and seating"
  },
  {
    id: "kitchen",
    title: "Kitchen",
    href: "/dashboard/restaurant/kitchen",
    icon: ChefHat,
    bgColor: "bg-gray-100",
    iconColor: "text-gray-700",
    textColor: "text-foreground",
    description: "Kitchen display system and order tickets"
  },
  {
    id: "orders",
    title: "Orders",
    href: "/dashboard/restaurant/orders",
    icon: ShoppingCart,
    bgColor: "bg-blue-900",
    iconColor: "text-white",
    textColor: "text-white",
    description: "View and manage restaurant orders"
  },
  {
    id: "menu",
    title: "Menu Builder",
    href: "/dashboard/restaurant/menu",
    icon: BookOpen,
    bgColor: "bg-gray-100",
    iconColor: "text-gray-700",
    textColor: "text-foreground",
    description: "Build and manage your restaurant menu"
  },
  {
    id: "recipes",
    title: "Recipes",
    href: "/dashboard/restaurant/recipes",
    icon: UtensilsCrossed,
    bgColor: "bg-blue-900",
    iconColor: "text-white",
    textColor: "text-white",
    description: "Manage recipes and ingredients"
  },
  {
    id: "reservations",
    title: "Reservations",
    href: "/dashboard/restaurant/reservations",
    icon: Calendar,
    bgColor: "bg-gray-100",
    iconColor: "text-gray-700",
    textColor: "text-foreground",
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
          {restaurantOptions.map((option) => {
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
