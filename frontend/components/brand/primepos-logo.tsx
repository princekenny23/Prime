"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface PrimePOSLogoProps {
  variant?: "full" | "icon"
  size?: "sm" | "md" | "lg"
  className?: string
  version?: 1 | 2 | 3
}

const sizeMap = {
  sm: { full: "w-32 h-7", icon: "w-6 h-6" },
  md: { full: "w-40 h-9", icon: "w-8 h-8" },
  lg: { full: "w-48 h-11", icon: "w-10 h-10" },
}

export function PrimePOSLogo({ 
  variant = "full", 
  size = "md",
  className,
  version = 1 
}: PrimePOSLogoProps) {
  const sizeClasses = sizeMap[size][variant]
  
  if (variant === "icon") {
    return (
      <div className={cn(sizeClasses, className)}>
        {version === 1 && (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="4" y="6" width="24" height="20" rx="2" fill="#0f172a"/>
            <rect x="7" y="9" width="18" height="12" rx="1" fill="#ffffff"/>
            <line x1="9" y1="12" x2="22" y2="12" stroke="#0f172a" strokeWidth="0.8"/>
            <line x1="9" y1="15" x2="20" y2="15" stroke="#0f172a" strokeWidth="0.8"/>
            <line x1="9" y1="18" x2="18" y2="18" stroke="#0f172a" strokeWidth="0.8"/>
            <rect x="22" y="24" width="6" height="6" rx="0.5" fill="#ffffff"/>
            <line x1="24" y1="26" x2="26" y2="26" stroke="#0f172a" strokeWidth="0.6"/>
            <line x1="24" y1="28" x2="26" y2="28" stroke="#0f172a" strokeWidth="0.6"/>
          </svg>
        )}
        {version === 2 && (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="2" y="2" width="28" height="28" rx="4" fill="#f4f4f5"/>
            <line x1="8" y1="8" x2="8" y2="30" stroke="#e5e7eb" strokeWidth="1"/>
            <line x1="14" y1="8" x2="14" y2="30" stroke="#e5e7eb" strokeWidth="1"/>
            <line x1="20" y1="8" x2="20" y2="30" stroke="#e5e7eb" strokeWidth="1"/>
            <line x1="26" y1="8" x2="26" y2="30" stroke="#e5e7eb" strokeWidth="1"/>
            <line x1="2" y1="14" x2="30" y2="14" stroke="#e5e7eb" strokeWidth="1"/>
            <line x1="2" y1="20" x2="30" y2="20" stroke="#e5e7eb" strokeWidth="1"/>
            <line x1="2" y1="26" x2="30" y2="26" stroke="#e5e7eb" strokeWidth="1"/>
            <path d="M8 6 L8 30 L18 30 C24 30 26 26 26 20 C26 14 24 10 18 10 L8 10 Z" fill="#0f172a"/>
            <rect x="8" y="6" width="10" height="8" fill="#0f172a"/>
          </svg>
        )}
        {version === 3 && (
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="4" y="4" width="24" height="24" rx="3" fill="#0f172a"/>
            <rect x="7" y="8" width="2.5" height="18" fill="#ffffff"/>
            <rect x="11" y="8" width="2" height="18" fill="#ffffff"/>
            <rect x="15" y="8" width="3" height="18" fill="#ffffff"/>
            <rect x="20" y="8" width="1.5" height="18" fill="#ffffff"/>
            <rect x="23" y="8" width="2.5" height="18" fill="#ffffff"/>
            <line x1="7" y1="18" x2="25" y2="18" stroke="#ffffff" strokeWidth="2" opacity="0.7"/>
            <circle cx="20" cy="24" r="5" fill="#ffffff"/>
            <path d="M17.5 24 L19.5 26 L22.5 22.5" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        )}
      </div>
    )
  }
  
  return (
    <div className={cn("flex items-center gap-2", sizeClasses, className)}>
      {version === 1 && (
        <>
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full aspect-square">
            <rect x="4" y="6" width="24" height="20" rx="2" fill="#0f172a"/>
            <rect x="7" y="9" width="18" height="12" rx="1" fill="#ffffff"/>
            <line x1="9" y1="12" x2="22" y2="12" stroke="#0f172a" strokeWidth="0.8"/>
            <line x1="9" y1="15" x2="20" y2="15" stroke="#0f172a" strokeWidth="0.8"/>
            <line x1="9" y1="18" x2="18" y2="18" stroke="#0f172a" strokeWidth="0.8"/>
            <rect x="22" y="24" width="6" height="6" rx="0.5" fill="#ffffff"/>
            <line x1="24" y1="26" x2="26" y2="26" stroke="#0f172a" strokeWidth="0.6"/>
            <line x1="24" y1="28" x2="26" y2="28" stroke="#0f172a" strokeWidth="0.6"/>
          </svg>
          <span className="font-bold text-blue-900" style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.02em" }}>
            PrimePOS
          </span>
        </>
      )}
      {version === 2 && (
        <>
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full aspect-square">
            <rect x="2" y="2" width="28" height="28" rx="4" fill="#f4f4f5"/>
            <line x1="8" y1="8" x2="8" y2="30" stroke="#e5e7eb" strokeWidth="1"/>
            <line x1="14" y1="8" x2="14" y2="30" stroke="#e5e7eb" strokeWidth="1"/>
            <line x1="20" y1="8" x2="20" y2="30" stroke="#e5e7eb" strokeWidth="1"/>
            <line x1="26" y1="8" x2="26" y2="30" stroke="#e5e7eb" strokeWidth="1"/>
            <line x1="2" y1="14" x2="30" y2="14" stroke="#e5e7eb" strokeWidth="1"/>
            <line x1="2" y1="20" x2="30" y2="20" stroke="#e5e7eb" strokeWidth="1"/>
            <line x1="2" y1="26" x2="30" y2="26" stroke="#e5e7eb" strokeWidth="1"/>
            <path d="M8 6 L8 30 L18 30 C24 30 26 26 26 20 C26 14 24 10 18 10 L8 10 Z" fill="#0f172a"/>
            <rect x="8" y="6" width="10" height="8" fill="#0f172a"/>
          </svg>
          <span className="font-bold text-blue-900" style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.02em" }}>
            PrimePOS
          </span>
        </>
      )}
      {version === 3 && (
        <>
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full aspect-square">
            <rect x="4" y="4" width="24" height="24" rx="3" fill="#0f172a"/>
            <rect x="7" y="8" width="2.5" height="18" fill="#ffffff"/>
            <rect x="11" y="8" width="2" height="18" fill="#ffffff"/>
            <rect x="15" y="8" width="3" height="18" fill="#ffffff"/>
            <rect x="20" y="8" width="1.5" height="18" fill="#ffffff"/>
            <rect x="23" y="8" width="2.5" height="18" fill="#ffffff"/>
            <line x1="7" y1="18" x2="25" y2="18" stroke="#ffffff" strokeWidth="2" opacity="0.7"/>
            <circle cx="20" cy="24" r="5" fill="#ffffff"/>
            <path d="M17.5 24 L19.5 26 L22.5 22.5" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span className="font-bold text-blue-900" style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "-0.02em" }}>
            PrimePOS
          </span>
        </>
      )}
    </div>
  )
}

