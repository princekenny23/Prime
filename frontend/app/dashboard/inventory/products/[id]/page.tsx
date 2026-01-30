"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"

export default function ProductDetailPage() {
  return (
    <DashboardLayout>
      <PageLayout
        title="Product Details"
        description="View and manage product information"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Product Details Coming Soon</h3>
            <p className="text-blue-700">
              This page will display product information, variations, stock history, sales history, and supplier information.
            </p>
          </div>
        </div>
      </PageLayout>
    </DashboardLayout>
  )
}
