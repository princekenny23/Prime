"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
import { IntegrationsTab } from "@/components/settings/integrations-tab"
import { useI18n } from "@/contexts/i18n-context"
import { QZProvider } from "@/contexts/qz-context"

export default function IntegrationsSettingsPage() {
  const { t } = useI18n()
  
  return (
    <DashboardLayout>
      <QZProvider>
        <PageLayout
          title={t("settings.integrations.title")}
          description={t("settings.integrations.description")}
        >
          <IntegrationsTab />
        </PageLayout>
      </QZProvider>
    </DashboardLayout>
  )
}

