"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { 
  Tag, 
  Sliders, 
  ClipboardCheck,
  ArrowRightLeft,
  Package,
  AlertTriangle,
  Truck,
  CalendarX,
  RotateCcw
} from "lucide-react"
import { OptionCard, type OptionCardProps } from "@/components/shared/option-card"

const inventoryOptions: Omit<OptionCardProps, "iconSize">[] = [
  {
    id: "stock-items",
    title: "Stock & Items",
    href: "/dashboard/inventory/products",
    icon: Tag,
    description: "View and manage all products"
  },
  {
    id: "low-stock",
    title: "Low Stock",
    href: "/dashboard/inventory/low-stock",
    icon: AlertTriangle,
    description: "View and reorder low stock items"
  },
  {
    id: "stock-control",
    title: "Stock Control",
    href: "/dashboard/inventory/stock-adjustments",
    icon: Sliders,
    description: "Adjust and control inventory levels"
  },
  {
    id: "stock-taking",
    title: "Stock Taking",
    href: "/dashboard/inventory/stock-taking",
    icon: ClipboardCheck,
    description: "Perform stock audits and counts"
  },
  {
    id: "transfers",
    title: "Transfers",
    href: "/dashboard/inventory/transfers",
    icon: ArrowRightLeft,
    description: "Transfer inventory between outlets"
  },
  {
    id: "receiving",
    title: "Stock Received",
    href: "/dashboard/inventory/receiving",
    icon: Package,
    description: "Manage incoming inventory from suppliers to outlets"
  },
  {
    id: "suppliers",
    title: "Suppliers",
    href: "/dashboard/inventory/suppliers",
    icon: Truck,
    description: "Manage suppliers and procurement"
  },
  {
    id: "expiry",
    title: "Expiry Management",
    href: "/dashboard/inventory/expiry",
    icon: CalendarX,
    description: "Track and manage product expiration dates"
  },
  {
    id: "returns",
    title: "Stock Returns",
    href: "/dashboard/inventory/returns",
    icon: RotateCcw,
    description: "Track product returns from customers and to suppliers"
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
          {inventoryOptions.map((option) => (
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
