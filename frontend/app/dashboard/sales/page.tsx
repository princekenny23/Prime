"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageCard } from "@/components/layouts/page-card"
import { PageHeader } from "@/components/layouts/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TransactionsPage from "./transactions/page"
import ReturnsPage from "./returns/page"
import CreditsPage from "./credits/page"
import DiscountsPage from "./discounts/page"
import ReceiptsPage from "./receipts/page"
import { useI18n } from "@/contexts/i18n-context"

export default function SalesDashboardPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState("sales")

  return (
    <DashboardLayout>
      <PageCard className="mt-6">
        <PageHeader title="Sales Management" />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-4 border-b border-gray-300">
            <TabsList className="grid w-full grid-cols-5 h-auto bg-gray-100">
              <TabsTrigger 
                value="sales" 
                className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] py-3"
              >
                {t("sales.title")}
              </TabsTrigger>
              <TabsTrigger 
                value="returns"
                className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] py-3"
              >
                {t("sales.menu.returns")}
              </TabsTrigger>
              <TabsTrigger 
                value="credits"
                className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] py-3"
              >
                {t("sales.credit.title")}
              </TabsTrigger>
              <TabsTrigger 
                value="discounts"
                className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] py-3"
              >
                {t("sales.menu.discounts")}
              </TabsTrigger>
              <TabsTrigger 
                value="receipts"
                className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] py-3"
              >
                {t("sales.menu.receipts")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="sales" className="m-0">
            <TransactionsPage />
          </TabsContent>

          <TabsContent value="returns" className="m-0">
            <ReturnsPage />
          </TabsContent>

          <TabsContent value="credits" className="m-0">
            <CreditsPage />
          </TabsContent>

          <TabsContent value="discounts" className="m-0">
            <DiscountsPage />
          </TabsContent>

          <TabsContent value="receipts" className="m-0">
            <ReceiptsPage />
          </TabsContent>
        </Tabs>
      </PageCard>
    </DashboardLayout>
  )
}
