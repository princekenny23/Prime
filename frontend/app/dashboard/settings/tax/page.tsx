"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
import { TaxPricingTab } from "@/components/settings/tax-pricing-tab"
import { useI18n } from "@/contexts/i18n-context"

export default function TaxSettingsPage() {
  const { t } = useI18n()
  
  return (
    <DashboardLayout>
      <PageLayout
        title={t("settings.tax.title")}
        description={t("settings.tax.description")}
      >
        <TaxPricingTab />
      </PageLayout>
    </DashboardLayout>
  )
}

