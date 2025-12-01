"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Root page - redirects to login
 */
export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    router.push("/auth/login")
  }, [router])
  
  return null
}
