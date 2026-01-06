"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
import { 
  Building2,
  ShoppingCart,
  FileText,
} from "lucide-react"
import { OptionCard, type OptionCardProps } from "@/components/shared/option-card"
import { useI18n } from "@/contexts/i18n-context"

const supplierOptions: (Omit<OptionCardProps, "iconSize">)[] = [
  {
    id: "suppliers",
    title: "Suppliers",
    titleKey: "inventory.suppliers.list",
    href: "/dashboard/inventory/suppliers/list",
    icon: Building2,
  },
  {
    id: "purchases",
    title: "Purchases",
    titleKey: "inventory.purchase_orders.title",
    href: "/dashboard/inventory/suppliers/purchases",
    icon: ShoppingCart,
  },
  {
    id: "supplier-invoices",
    title: "Supplier Invoices",
    titleKey: "inventory.suppliers.invoices",
    href: "/dashboard/inventory/suppliers/invoices",
    icon: FileText,
  },
]

export default function SuppliersPage() {
  const { t } = useI18n()
  
  return (
    <DashboardLayout>
      <PageLayout
        title={t("inventory.suppliers.title")}
        description={t("inventory.suppliers.description")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supplierOptions.map((option) => (
            <OptionCard
              key={option.id}
              {...option}
              iconSize="md"
            />
          ))}
        </div>
      </PageLayout>
    </DashboardLayout>
  )
}
