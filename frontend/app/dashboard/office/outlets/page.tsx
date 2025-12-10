"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Plus, Store, BarChart3, Package, Users, ShoppingBag, Settings, Eye, ArrowRight, RefreshCw, ChevronDown } from "lucide-react"
import { OutletList } from "@/components/outlets/outlet-list"
import { AddEditOutletModal } from "@/components/modals/add-edit-outlet-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTenant } from "@/contexts/tenant-context"
import Link from "next/link"
import { useBusinessStore } from "@/stores/businessStore"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function OutletsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSwitching, setIsSwitching] = useState<string | null>(null)
  const { outlets, currentOutlet, setOutlets, switchOutlet } = useTenant()
  const { currentBusiness, loadOutlets } = useBusinessStore()
  const { toast } = useToast()
  const router = useRouter()

  // Load outlets on mount and when business changes
  useEffect(() => {
    const loadData = async () => {
      if (loadOutlets && currentBusiness?.id) {
        try {
          await loadOutlets(currentBusiness.id)
          setRefreshKey(prev => prev + 1)
        } catch (error) {
          console.error("Failed to load outlets:", error)
        }
      }
    }
    loadData()
  }, [currentBusiness?.id, loadOutlets])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Refresh outlets from business store
      if (loadOutlets && currentBusiness?.id) {
        await loadOutlets(currentBusiness.id)
      }
      
      // Force refresh of outlet list by changing key
      setRefreshKey(prev => prev + 1)
      
      // Also refresh the page data
      router.refresh()
      
      toast({
        title: "Refreshed",
        description: "Outlets list has been refreshed",
      })
    } catch (error: any) {
      console.error("Failed to refresh outlets:", error)
      toast({
        title: "Error",
        description: "Failed to refresh outlets. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleOutletCreated = async () => {
    // Refresh outlets from business store
    if (loadOutlets && currentBusiness?.id) {
      await loadOutlets(currentBusiness.id)
    }
    // Force refresh of outlet list by changing key
    setRefreshKey(prev => prev + 1)
  }

  const handleSwitchOutlet = async (outletId: string) => {
    setIsSwitching(outletId)
    try {
      await switchOutlet(outletId)
      toast({
        title: "Success",
        description: `Switched to ${outlets.find(o => String(o.id) === outletId)?.name || 'outlet'}`,
      })
      // Refresh outlets to update current outlet badge
      if (loadOutlets && currentBusiness?.id) {
        await loadOutlets(currentBusiness.id)
      }
      setRefreshKey(prev => prev + 1)
      router.refresh()
    } catch (error: any) {
      console.error("Failed to switch outlet:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to switch outlet",
        variant: "destructive",
      })
    } finally {
      setIsSwitching(null)
    }
  }

  const activeOutlets = outlets.filter(o => o.isActive).length
  const totalOutlets = outlets.length
  const availableOutlets = outlets.filter(o => o.isActive && currentOutlet?.id !== o.id)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Outlets</h1>
            <p className="text-muted-foreground">Manage your business locations and outlets</p>
          </div>
          <div className="flex gap-2">
            {/* Switch Outlet Dropdown */}
            {outlets.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={isSwitching !== null}>
                    <Store className="mr-2 h-4 w-4" />
                    {currentOutlet ? `Current: ${currentOutlet.name}` : "Switch Outlet"}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Switch Outlet</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {currentOutlet && (
                    <>
                      <DropdownMenuItem disabled className="opacity-100">
                        <div className="flex items-center gap-2 w-full">
                          <Store className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <div className="font-medium">{currentOutlet.name}</div>
                            <div className="text-xs text-muted-foreground">Current</div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {availableOutlets.length === 0 ? (
                    <DropdownMenuItem disabled>
                      No other outlets available
                    </DropdownMenuItem>
                  ) : (
                    availableOutlets.map((outlet) => (
                      <DropdownMenuItem
                        key={outlet.id}
                        onClick={() => handleSwitchOutlet(String(outlet.id))}
                        disabled={isSwitching === String(outlet.id)}
                      >
                        {isSwitching === String(outlet.id) ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Store className="mr-2 h-4 w-4" />
                        )}
                        {outlet.name}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Outlet
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outlets</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOutlets}</div>
              <p className="text-xs text-muted-foreground">
                {activeOutlets} active, {totalOutlets - activeOutlets} inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Outlets</CardTitle>
              <Store className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeOutlets}</div>
              <p className="text-xs text-muted-foreground">
                Currently operational
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Outlets</CardTitle>
              <Store className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-400">{totalOutlets - activeOutlets}</div>
              <p className="text-xs text-muted-foreground">
                Currently disabled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Current Outlet Quick Actions - Square POS Style */}
        {currentOutlet && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    Current Outlet: {currentOutlet.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Quick actions for {currentOutlet.name}
                  </CardDescription>
                </div>
                <Link href={`/dashboard/office/outlets/${currentOutlet.id}/settings`}>
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Link href={`/dashboard/office/outlets/${currentOutlet.id}/analytics`}>
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Analytics</div>
                        <div className="text-xs text-muted-foreground">View performance</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Button>
                </Link>

                <Link href={`/dashboard/sales?outlet=${currentOutlet.id}`}>
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <ShoppingBag className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Sales</div>
                        <div className="text-xs text-muted-foreground">View transactions</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Button>
                </Link>

                <Link href={`/dashboard/inventory?outlet=${currentOutlet.id}`}>
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Inventory</div>
                        <div className="text-xs text-muted-foreground">Stock levels</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Button>
                </Link>

                <Link href={`/dashboard/staff?outlet=${currentOutlet.id}`}>
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <div className="flex items-center gap-3 w-full">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">Staff</div>
                        <div className="text-xs text-muted-foreground">Manage team</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Outlets List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">All Outlets</h2>
            <p className="text-sm text-muted-foreground">
              {totalOutlets} {totalOutlets === 1 ? 'outlet' : 'outlets'} total
            </p>
          </div>
          <OutletList key={refreshKey} onOutletUpdated={handleOutletCreated} />
        </div>

        <AddEditOutletModal 
          open={isModalOpen} 
          onOpenChange={setIsModalOpen}
          onOutletCreated={handleOutletCreated}
        />
      </div>
    </DashboardLayout>
  )
}
