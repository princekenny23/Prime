"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import Link from "next/link"
import { 
  Tag, 
  Sliders, 
  ClipboardCheck,
  ArrowRightLeft,
  Package,
  AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface InventoryOptionCard {
  id: string
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  bgColor: string
  iconColor: string
  textColor: string
  description?: string
}

const inventoryOptions: InventoryOptionCard[] = [
  {
    id: "stock-items",
    title: "Stock & Items",
    href: "/dashboard/products",
    icon: Tag,
    bgColor: "bg-gray-100",
    iconColor: "text-gray-700",
    textColor: "text-foreground",
    description: "View and manage all products"
  },
  {
    id: "low-stock",
    title: "Low Stock",
    href: "/dashboard/inventory/low-stock",
    icon: AlertTriangle,
    bgColor: "bg-blue-900",
    iconColor: "text-white",
    textColor: "text-white",
    description: "View and reorder low stock items"
  },
  {
    id: "stock-control",
    title: "Stock Control",
    href: "/dashboard/inventory/stock-adjustments",
    icon: Sliders,
    bgColor: "bg-gray-100",
    iconColor: "text-gray-700",
    textColor: "text-foreground",
    description: "Adjust and control inventory levels"
  },
  {
    id: "stock-taking",
    title: "Stock Taking",
    href: "/dashboard/inventory/stock-taking",
    icon: ClipboardCheck,
    bgColor: "bg-blue-900",
    iconColor: "text-white",
    textColor: "text-white",
    description: "Perform stock audits and counts"
  },
  {
    id: "transfers",
    title: "Transfers",
    href: "/dashboard/inventory/transfers",
    icon: ArrowRightLeft,
    bgColor: "bg-gray-100",
    iconColor: "text-gray-700",
    textColor: "text-foreground",
    description: "Transfer inventory between outlets"
  },
  {
    id: "receiving",
    title: "Receiving",
    href: "/dashboard/inventory/receiving",
    icon: Package,
    bgColor: "bg-gray-100",
    iconColor: "text-gray-700",
    textColor: "text-foreground",
    description: "Manage incoming inventory from suppliers"
  },
]

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Select an option to manage your inventory and stock
          </p>
        </div>

        {/* Option Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventoryOptions.map((option) => {
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
                    <Icon className={cn("h-20 w-20", option.iconColor)} />
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
