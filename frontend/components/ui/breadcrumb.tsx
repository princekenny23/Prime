"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  // Determine home link based on first breadcrumb item
  const isAdminRoute = items.length > 0 && items[0]?.label === "Admin"
  const homeHref = isAdminRoute ? "/admin" : "/dashboard"
  
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-1 text-sm", className)}
    >
      <Link
        href={homeHref}
        className="flex items-center text-gray-600 hover:text-blue-900 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <React.Fragment key={index}>
            <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
            {isLast ? (
              <span className="font-semibold text-blue-900">{item.label}</span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="text-gray-600 hover:text-blue-900 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-600">{item.label}</span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

