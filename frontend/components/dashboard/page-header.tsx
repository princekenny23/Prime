"use client"

import Link from "next/link"
import { ReactNode } from "react"
import { PageRefreshButton } from "./page-refresh-button"

interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  actions?: ReactNode
  showRefresh?: boolean
}

export function PageHeader({ 
  title, 
  description, 
  backHref, 
  backLabel = "← Back",
  actions,
  showRefresh = true 
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {backHref && (
          <Link href={backHref}>
            <button className="text-muted-foreground hover:text-foreground">
              {backLabel}
            </button>
          </Link>
        )}
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {showRefresh && <PageRefreshButton />}
      </div>
    </div>
  )
}

