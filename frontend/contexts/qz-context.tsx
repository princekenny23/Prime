"use client"

import { useEffect } from "react"
import { useQZStore } from "@/stores/qzStore"

export function QZProvider({ children }: { children: React.ReactNode }) {
  const bootstrap = useQZStore((s) => s.bootstrap)
  useEffect(() => {
    bootstrap()
  }, [bootstrap])
  return children as any
}
