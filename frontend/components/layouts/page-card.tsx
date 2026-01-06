"use client"

import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface PageCardProps {
  children: ReactNode
  className?: string
}

export function PageCard({ children, className }: PageCardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-gray-300 rounded-lg",
        className
      )}
    >
      {children}
    </div>
  )
}

