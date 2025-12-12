"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { 
  Building2,
  ShoppingCart,
  FileText,
  RotateCcw
} from "lucide-react"
import { OptionCard, type OptionCardProps } from "@/components/shared/option-card"

const supplierOptions: Omit<OptionCardProps, "iconSize">[] = [
  {
    id: "suppliers",
    title: "Suppliers",
    href: "/dashboard/inventory/suppliers/list",
    icon: Building2,
    description: "Manage supplier relationships"
  },
  {
    id: "purchase-orders",
    title: "Purchase Orders",
    href: "/dashboard/inventory/suppliers/purchase-orders",
    icon: ShoppingCart,
    description: "Create and manage purchase orders"
  },
  {
    id: "supplier-invoices",
    title: "Supplier Invoices",
    href: "/dashboard/inventory/suppliers/invoices",
    icon: FileText,
    description: "Record and track supplier invoices"
  },
  {
    id: "purchase-returns",
    title: "Purchase Returns",
    href: "/dashboard/inventory/suppliers/returns",
    icon: RotateCcw,
    description: "Handle returns to suppliers"
  },
]

export default function SuppliersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Procurement & Suppliers</h1>
          <p className="text-muted-foreground mt-1">
            Select an option to manage your procurement operations
          </p>
        </div>

        {/* Option Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supplierOptions.map((option) => (
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

