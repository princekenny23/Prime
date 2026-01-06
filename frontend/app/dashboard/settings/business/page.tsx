"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
import { BusinessInfoTab } from "@/components/settings/business-info-tab"
import { useI18n } from "@/contexts/i18n-context"

export default function BusinessSettingsPage() {
  const { t } = useI18n()
  
  return (
    <DashboardLayout>
      <PageLayout
        title={t("settings.business.title")}
        description={t("settings.business.description")}
      >
        <BusinessInfoTab />
      </PageLayout>
    </DashboardLayout>
  )
}
