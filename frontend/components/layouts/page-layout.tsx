"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { PageCard } from "./page-card"
import { PageHeader } from "./page-header"

interface PageLayoutProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
  noPadding?: boolean
}

/**
 * Enterprise POS Page Layout Component
 * 
 * Provides a consistent layout structure with:
 * - PageCard wrapper (white background, gray border)
 * - PageHeader (blue900 background, white text)
 * - Content area with proper spacing
 * 
 * Pages can add their own tabs (FilterableTabs or standard Tabs) inside the children
 */
export function PageLayout({
  title,
  description,
  actions,
  children,
  className,
  headerClassName,
  contentClassName,
  noPadding = false,
}: PageLayoutProps) {
  return (
    <PageCard className={cn("mt-6", className)}>
      {/* Page Header */}
      <PageHeader
        title={title}
        description={description}
        actions={actions}
        className={headerClassName}
      />

      {/* Content Area */}
      {!noPadding && (
        <div className={cn("px-6 py-4", contentClassName)}>
          {children}
        </div>
      )}
      {noPadding && (
        <div className={contentClassName}>
          {children}
        </div>
      )}
    </PageCard>
  )
}

