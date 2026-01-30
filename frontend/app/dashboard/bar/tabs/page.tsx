"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, CreditCard, Clock, DollarSign } from "lucide-react"
import { useState, useEffect } from "react"
import { OpenTabModal } from "@/components/modals/open-tab-modal"
import { CloseTabModal } from "@/components/modals/close-tab-modal"
import { tabService } from "@/lib/services/tabService"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"
import type { Tab } from "@/lib/services/tabService"

export default function TabsPage() {
  const { currentBusiness, currentOutlet } = useBusinessStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [showOpenTab, setShowOpenTab] = useState(false)
  const [showCloseTab, setShowCloseTab] = useState(false)
  const [selectedTab, setSelectedTab] = useState<Tab | null>(null)
  const [tabs, setTabs] = useState<Tab[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const useReal = useRealAPI()

  useEffect(() => {
    const loadTabs = async () => {
      if (!currentBusiness) return
      
      setIsLoading(true)
      try {
        if (useReal) {
          const response = await tabService.list({
            tenant: currentBusiness.id,
            outlet: currentOutlet?.id,
          })
          setTabs(response.results || [])
        } else {
          // Simulation mode - empty for now
          setTabs([])
        }
      } catch (error) {
        console.error("Failed to load tabs:", error)
        setTabs([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTabs()
  }, [currentBusiness, currentOutlet, useReal])

  const filteredTabs = tabs.filter(tab =>
    tab.tab_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tab.customer && tab.customer.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const openTabs = tabs.filter(t => t.status === "open")
  const totalOpen = openTabs.reduce((sum, t) => sum + t.total, 0)
  
  const avgTabTime = openTabs.length > 0
    ? openTabs.reduce((sum, tab) => {
        const openedDate = new Date(tab.opened)
        const now = new Date()
        const diff = now.getTime() - openedDate.getTime()
        return sum + diff
      }, 0) / openTabs.length / (1000 * 60 * 60) // Convert to hours
    : 0

  const getTimeOpen = (opened: string) => {
    const openedDate = new Date(opened)
    const now = new Date()
    const diff = now.getTime() - openedDate.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <DashboardLayout>
      <PageLayout
        title="Bar Tabs"
        description="Manage customer tabs and payments"
        actions={
          <Button onClick={() => setShowOpenTab(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Open Tab
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tabs</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openTabs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Open Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">MWK {totalOpen.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tabs</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tabs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Tab Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor(avgTabTime)}h {Math.floor((avgTabTime % 1) * 60)}m
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by tab number or customer..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Tabs</CardTitle>
            <CardDescription>
              {filteredTabs.length} tab{filteredTabs.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tab Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Time Open</TableHead>
                  <TableHead>Bartender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-muted-foreground">Loading tabs...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredTabs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <p className="text-muted-foreground">No tabs found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTabs.map((tab) => (
                    <TableRow key={tab.id}>
                      <TableCell className="font-medium">{tab.tab_number}</TableCell>
                      <TableCell>{tab.customer || "Walk-in"}</TableCell>
                      <TableCell>
                        {new Date(tab.opened).toLocaleString()}
                      </TableCell>
                      <TableCell>{tab.items}</TableCell>
                      <TableCell className="font-semibold">
                        {currentBusiness?.currencySymbol || "MWK"} {tab.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {tab.status === "open" ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {getTimeOpen(tab.opened)}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {tab.closed && new Date(tab.closed).toLocaleTimeString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{tab.bartender || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={tab.status === "open" ? "default" : "secondary"}>
                          {tab.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tab.status === "open" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTab(tab)
                              setShowCloseTab(true)
                            }}
                          >
                            Close Tab
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm">View</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modals */}
        <OpenTabModal
          open={showOpenTab}
          onOpenChange={setShowOpenTab}
        />
        <CloseTabModal
          open={showCloseTab}
          onOpenChange={setShowCloseTab}
          tab={selectedTab}
        />
      </div>
      </PageLayout>
    </DashboardLayout>
  )
}
