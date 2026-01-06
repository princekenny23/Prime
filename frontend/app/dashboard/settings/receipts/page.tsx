"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
import { ReceiptTemplateTab } from "@/components/settings/receipt-template-tab"
import { useI18n } from "@/contexts/i18n-context"

export default function ReceiptsSettingsPage() {
  const { t } = useI18n()
  
  return (
    <DashboardLayout>
      <PageLayout
        title={t("settings.receipts.title")}
        description={t("settings.receipts.description")}
      >
        <ReceiptTemplateTab />
      </PageLayout>
    </DashboardLayout>
  )
}

