"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Store,
  Menu,
  X,
  Search,
  User,
  LogOut,
  Clock,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTenant } from "@/contexts/tenant-context"
import { useRole } from "@/contexts/role-context"
import { NotificationBell } from "@/components/dashboard/notification-bell"
import { PageBreadcrumb } from "@/components/dashboard/page-breadcrumb"
import { useShift } from "@/contexts/shift-context"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { useBusinessStore } from "@/stores/businessStore"
import { useAuthStore } from "@/stores/authStore"
import { useRouter } from "next/navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
}

// Import sidebar configuration utilities
import { getIndustrySidebarConfig, fullNavigation, type NavigationItem } from "@/lib/utils/sidebar"

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { currentTenant, currentOutlet, isLoading } = useTenant()
  const { hasPermission, role } = useRole()
  const { activeShift } = useShift()
  const { user } = useAuthStore()
  const { currentBusiness } = useBusinessStore()

  // Check if user is SaaS admin (no businessId)
  const isSaaSAdmin = user && !user.businessId
  const isAdminRoute = pathname?.startsWith("/admin")

  // For SaaS admin routes, use only base navigation (no industry-specific items)
  // For business routes, use industry-specific navigation
  let allNavigation: NavigationItem[]
  if (isAdminRoute || isSaaSAdmin) {
    // SaaS admin always gets base navigation only, regardless of selected business
    allNavigation = fullNavigation
  } else {
    // Regular business users get industry-specific navigation
    const industry = (currentBusiness?.type || currentTenant?.businessType) as "retail" | "restaurant" | "bar" | null | undefined
    allNavigation = getIndustrySidebarConfig(industry)
  }
  
  // Filter navigation based on user role
  const navigation = allNavigation.filter((item) => hasPermission(item.permission))
  
  // For admin routes, don't require business selection
  // For regular dashboard routes, redirect if no business (unless SaaS admin)
  useEffect(() => {
    if (isAdminRoute) {
      // Admin routes don't need business - allow access
      return
    }
    
    // Check if we're on a tenant-specific dashboard route
    const isTenantDashboardRoute = pathname?.match(/^\/dashboard\/(retail|restaurant|bar)/)
    
    if (!isSaaSAdmin && !currentBusiness && pathname?.startsWith("/dashboard")) {
      // If we're on a tenant dashboard route, try to restore business from user's tenant
      if (isTenantDashboardRoute && user?.tenant) {
        const tenantId = typeof user.tenant === 'object' 
          ? String(user.tenant.id || user.tenant) 
          : String(user.tenant)
        console.log("Restoring business from user tenant on refresh:", tenantId)
        // Restore the business from the user's tenant
        const { setCurrentBusiness } = useBusinessStore.getState()
        setCurrentBusiness(tenantId).catch((error: any) => {
          console.error("Failed to restore business from tenant:", error)
          // If restoration fails, redirect to admin
          router.push("/admin")
        })
        return // Don't redirect yet, wait for business to be restored
      }
      
      // Regular user without business - redirect to admin dashboard
      router.push("/admin")
    }
  }, [isAdminRoute, isSaaSAdmin, currentBusiness, pathname, router, user])

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-20 bg-card border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground text-lg font-bold">
                P
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-lg text-xs font-medium transition-colors min-h-[72px]",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={item.name}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-[10px] leading-tight text-center">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="p-2 border-t">
            <div className="flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-lg hover:bg-accent transition-colors">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-full truncate" title={user?.name || user?.email || "User"}>
                {user?.name || user?.email?.split("@")[0] || "User"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-20">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-background border-b">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Tenant and Outlet Info - Display only, no switching */}
            {!isAdminRoute && !isLoading && currentTenant && (
              <div className="flex items-center gap-4 mr-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Tenant:</span>
                  <span className="font-medium">{currentTenant.name}</span>
                </div>
                {currentOutlet ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{currentOutlet.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Store className="h-4 w-4" />
                    <span>No outlet selected</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 max-w-xl mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Shift Status Indicator */}
              {activeShift && (
                <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-xs">
                    Shift: {format(new Date(activeShift.startTime), "HH:mm")}
                  </span>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  window.location.reload()
                }}
                title="Refresh page"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
              <NotificationBell />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={async () => {
                  const { logout } = useAuthStore.getState()
                  await logout()
                  router.push("/auth/login")
                }}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <PageBreadcrumb />
          <div className="space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

