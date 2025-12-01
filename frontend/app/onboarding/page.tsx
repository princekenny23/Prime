"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/authStore"

/**
 * Onboarding redirect page
 * Redirects to the multi-page onboarding flow
 */
export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  
  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    
    // Redirect to multi-page onboarding flow
    router.push("/onboarding/setup-business")
  }, [user, router])
  
  return null
}

