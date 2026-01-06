"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SectionHeaderItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

interface SectionHeaderProps {
  items: SectionHeaderItem[]
  className?: string
}

export function SectionHeader({ items, className }: SectionHeaderProps) {
  const pathname = usePathname()

  return (
    <div className={cn("w-full bg-[#1e3a8a] h-11 flex items-center px-6", className)}>
      <nav className="flex items-center gap-1 h-full">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 h-full text-sm font-medium transition-colors",
                isActive
                  ? "text-white border-b-2 border-white"
                  : "text-blue-200 hover:text-white"
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

