"use client"

import { useState } from "react"
import { AuthLayout } from "@/components/layouts/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/authStore"
import { useBusinessStore } from "@/stores/businessStore"
import { getBusinesses } from "@/lib/mockApi"
import { tenantService } from "@/lib/services/tenantService"
import { useRealAPI } from "@/lib/utils/api-config"

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const setCurrentBusiness = useBusinessStore((state) => state.setCurrentBusiness)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    
    if (!email || !password) {
      setError("Please enter both email and password")
      setIsLoading(false)
      return
    }
    
    console.log("Starting login process...")
    const result = await login(email, password)
    console.log("Login result:", { success: result.success, hasUser: !!result.user, error: result.error })
    
    if (result.success && result.user) {
      console.log("Login successful, checking user type...")
      // Check if user is SaaS admin from backend response
      const isSaaSAdmin = result.user.is_saas_admin || result.user.role === 'saas_admin'
      console.log("Is SaaS Admin:", isSaaSAdmin)
      
      if (isSaaSAdmin || !result.user.tenant) {
        // SaaS admin - go to admin dashboard
        console.log("Redirecting to admin dashboard...")
        router.push("/admin")
        return
      }
      
      // Regular user with tenant - set their tenant as current business and redirect to dashboard
      if (result.user.tenant) {
        const tenant = result.user.tenant
        console.log("User has tenant, setting as current business:", {
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantType: tenant.type
        })
        
        // Set the tenant as current business in the store
        // This will trigger tenant context initialization and load outlets
        try {
          await setCurrentBusiness(String(tenant.id))
          
          // Get the business type from tenant data to determine dashboard route
          const businessType = tenant.type as "retail" | "restaurant" | "bar"
          
          // Redirect to the appropriate dashboard based on business type
          const dashboardRoute = `/dashboard/${businessType}`
          console.log("Redirecting to dashboard:", dashboardRoute)
          router.push(dashboardRoute)
          return
        } catch (error) {
          console.error("Failed to set current business:", error)
          setError("Failed to load your business. Please try again.")
          setIsLoading(false)
          return
        }
      }
      
      // Fallback: Check if any businesses exist (shouldn't reach here for regular users)
      let businesses: any[] = []
      try {
        if (useRealAPI()) {
          businesses = await tenantService.list()
        } else {
          businesses = getBusinesses()
        }
      } catch (error) {
        console.error("Failed to load businesses:", error)
        businesses = getBusinesses() // Fallback
      }
      
      if (businesses.length === 0) {
        // No businesses exist, go to onboarding
        router.push("/onboarding/setup-business")
      } else {
        // Businesses exist, go to admin dashboard to select
        router.push("/admin")
      }
    } else {
      setError(result.error || "Login failed. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>
            Sign in to your PrimePOS account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="Enter your email" required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" name="password" type="password" placeholder="Enter password" required disabled={isLoading} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  )
}

