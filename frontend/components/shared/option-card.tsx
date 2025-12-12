"use client"

import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface OptionCardProps {
  id: string
  title: string
  href: string
  icon: LucideIcon
  iconSize?: "sm" | "md" | "lg"
  description?: string
}

export function OptionCard({ 
  id, 
  title, 
  href, 
  icon: Icon, 
  iconSize = "md",
  description 
}: OptionCardProps) {
  const iconSizes = {
    sm: "h-12 w-12",
    md: "h-20 w-20",
    lg: "h-24 w-24"
  }

  return (
    <Link
      href={href}
      className="group block"
    >
      <div
        className={cn(
          "relative h-52 rounded-xl shadow-md transition-all duration-200 hover:shadow-xl hover:scale-[1.02] cursor-pointer overflow-hidden",
          "bg-blue-900"
        )}
      >
        {/* Icon Section - Centered */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 opacity-100">
          <Icon className={cn(iconSizes[iconSize], "text-white")} />
        </div>

        {/* Title Section */}
        <div className="absolute bottom-0 left-0 right-0 p-5 rounded-b-xl bg-gray-200">
          <h3 className="font-semibold text-lg text-center text-black">
            {title}
          </h3>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
      </div>
    </Link>
  )
}

