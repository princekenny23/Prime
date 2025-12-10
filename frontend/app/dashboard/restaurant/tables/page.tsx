"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Grid, Users, Clock, ArrowLeftRight, Merge } from "lucide-react"
import { useState, useCallback } from "react"
import { AddEditTableModal } from "@/components/modals/add-edit-table-modal"
import { MergeSplitTablesModal } from "@/components/modals/merge-split-tables-modal"
import { TransferTableModal } from "@/components/modals/transfer-table-modal"
import { useBusinessStore } from "@/stores/businessStore"
import { tableService, Table } from "@/lib/services/tableService"
import { useToast } from "@/components/ui/use-toast"

export default function TablesPage() {
  const router = useRouter()
  const { currentBusiness, currentOutlet } = useBusinessStore()
  
  // Redirect if not restaurant business
  useEffect(() => {
    if (currentBusiness && currentBusiness.type !== "restaurant") {
      router.push("/dashboard")
    }
  }, [currentBusiness, router])
  
  // Show loading while checking business type
  if (!currentBusiness || currentBusiness.type !== "restaurant") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    )
  }
  const { toast } = useToast()
  const [showAddTable, setShowAddTable] = useState(false)
  const [showMergeSplit, setShowMergeSplit] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadTables = useCallback(async () => {
    if (!currentBusiness) {
      setTables([])
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    try {
      const filters: any = { is_active: true }
      if (currentOutlet?.id) {
        filters.outlet = currentOutlet.id.toString()
      }
      const response = await tableService.list(filters)
      setTables(response.results || [])
    } catch (error: any) {
      console.error("Failed to load tables:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load tables. Please try again.",
        variant: "destructive",
      })
      setTables([])
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness, currentOutlet, toast])

  useEffect(() => {
    loadTables()
  }, [loadTables])

  // Map backend status (lowercase) to display format
  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      'occupied': 'Occupied',
      'reserved': 'Reserved',
      'available': 'Available',
      'out_of_service': 'Out of Service'
    }
    return statusMap[status] || status
  }

  const occupiedCount = tables.filter(t => t.status === "occupied").length
  const availableCount = tables.filter(t => t.status === "available").length
  const reservedCount = tables.filter(t => t.status === "reserved").length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "occupied":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border-red-200 dark:border-red-800"
      case "reserved":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800"
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200 border-green-200 dark:border-green-800"
      case "out_of_service":
        return "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200 border-gray-200 dark:border-gray-800"
      default:
        return ""
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Table Management</h1>
            <p className="text-muted-foreground">Manage restaurant tables and seating</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
              <Grid className="mr-2 h-4 w-4" />
              {viewMode === "grid" ? "List View" : "Grid View"}
            </Button>
            <Button onClick={() => {
              setSelectedTable(null)
              setShowAddTable(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Table
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
              <Grid className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tables.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupied</CardTitle>
              <Users className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{occupiedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{availableCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reserved</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{reservedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Table Layout */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Table Layout</CardTitle>
                <CardDescription>Click on a table to manage it</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowMergeSplit(true)}>
                  <Merge className="mr-2 h-4 w-4" />
                  Merge/Split
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowTransfer(true)}>
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Transfer
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading tables...</p>
              </div>
            ) : tables.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No tables configured. Add your first table to get started.</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer hover:shadow-md transition-all text-center ${
                      getStatusColor(table.status)
                    }`}
                    onClick={() => {
                      setSelectedTable(table)
                      setShowAddTable(true)
                    }}
                  >
                    <div className="font-bold text-lg mb-1">Table {table.number}</div>
                    <div className="text-xs mb-2">
                      <Users className="h-3 w-3 inline mr-1" />
                      {table.capacity} seats
                    </div>
                    {table.location && (
                      <div className="text-xs text-muted-foreground mb-1">
                        {table.location}
                      </div>
                    )}
                    <Badge className={getStatusColor(table.status)}>
                      {getStatusDisplay(table.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                      table.status === "occupied" ? "border-red-200" :
                      table.status === "reserved" ? "border-yellow-200" :
                      table.status === "out_of_service" ? "border-gray-200" :
                      "border-green-200"
                    }`}
                    onClick={() => {
                      setSelectedTable(table)
                      setShowAddTable(true)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="font-bold text-lg">Table {table.number}</div>
                        <Badge className={getStatusColor(table.status)}>
                          {getStatusDisplay(table.status)}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          Capacity: {table.capacity}
                        </div>
                        {table.location && (
                          <div className="text-sm text-muted-foreground">
                            Location: {table.location}
                          </div>
                        )}
                        {typeof table.outlet === 'object' && table.outlet && (
                          <div className="text-sm text-muted-foreground">
                            Outlet: {table.outlet.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AddEditTableModal
        open={showAddTable}
        onOpenChange={(open) => {
          setShowAddTable(open)
          if (!open) {
            setSelectedTable(null)
          }
        }}
        table={selectedTable}
        onSuccess={loadTables}
      />
      <MergeSplitTablesModal
        open={showMergeSplit}
        onOpenChange={setShowMergeSplit}
      />
      <TransferTableModal
        open={showTransfer}
        onOpenChange={setShowTransfer}
      />
    </DashboardLayout>
  )
}

