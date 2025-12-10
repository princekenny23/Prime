"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, CreditCard, Building2, Edit, Trash2, Filter } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { AddEditTillModal } from "@/components/modals/add-edit-till-modal"
import { tillService, type Till } from "@/lib/services/tillService"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function TillsPage() {
  const { currentBusiness } = useBusinessStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [outletFilter, setOutletFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showAddTill, setShowAddTill] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [selectedTill, setSelectedTill] = useState<Till | null>(null)
  const [tillToDelete, setTillToDelete] = useState<string | null>(null)
  const [tills, setTills] = useState<Till[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const useReal = useRealAPI()

  const loadTills = useCallback(async () => {
    if (!currentBusiness) {
      setTills([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      if (useReal) {
        const response = await tillService.list()
        setTills(response.results || [])
      } else {
        setTills([])
      }
    } catch (error) {
      console.error("Failed to load tills:", error)
      toast({
        title: "Error",
        description: "Failed to load tills.",
        variant: "destructive",
      })
      setTills([])
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness?.id, useReal, toast])

  useEffect(() => {
    if (currentBusiness) {
      loadTills()
    }
  }, [currentBusiness?.id, loadTills])

  const filteredTills = tills.filter(till => {
    const outletName = typeof till.outlet === 'object' ? till.outlet.name : ""
    const matchesSearch = 
      till.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      outletName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesOutlet = outletFilter === "all" || 
      (typeof till.outlet === 'object' ? String(till.outlet.id) : String(till.outlet)) === outletFilter
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "Active" && till.is_active) ||
      (statusFilter === "Inactive" && !till.is_active)

    return matchesSearch && matchesOutlet && matchesStatus
  })

  const activeCount = tills.filter(t => t.is_active).length
  const inUseCount = tills.filter(t => t.is_in_use).length
  const availableCount = tills.filter(t => t.is_active && !t.is_in_use).length

  // Get unique outlets for filter
  const outlets = Array.from(
    new Map(
      tills
        .map(t => typeof t.outlet === 'object' ? t.outlet : null)
        .filter(Boolean)
        .map((o: any) => [o.id, o])
    ).values()
  )

  const handleDelete = (tillId: string) => {
    setTillToDelete(tillId)
    setShowDelete(true)
  }

  const confirmDelete = async () => {
    if (!tillToDelete) return

    try {
      await tillService.delete(tillToDelete)
      toast({
        title: "Till Deleted",
        description: "Till has been deleted successfully.",
      })
      loadTills()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete till.",
        variant: "destructive",
      })
    } finally {
      setShowDelete(false)
      setTillToDelete(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Till Management</h1>
            <p className="text-muted-foreground">Manage cash register tills for your outlets</p>
          </div>
          <Button onClick={() => {
            setSelectedTill(null)
            setShowAddTill(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Till
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tills</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tills.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tills</CardTitle>
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Use</CardTitle>
              <CreditCard className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inUseCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by till name or outlet..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={outletFilter} onValueChange={setOutletFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Outlet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outlets</SelectItem>
                  {outlets.map((outlet: any) => (
                    <SelectItem key={outlet.id} value={String(outlet.id)}>
                      {outlet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tills Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Tills</CardTitle>
            <CardDescription>
              {filteredTills.length} till{filteredTills.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">Loading tills...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredTills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">No tills found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTills.map((till) => (
                    <TableRow key={till.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          {till.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {typeof till.outlet === 'object' ? till.outlet.name : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={till.is_active ? "default" : "secondary"}>
                          {till.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={till.is_in_use ? "destructive" : "outline"}>
                          {till.is_in_use ? "In Use" : "Available"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTill(till)
                              setShowAddTill(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDelete(till.id)}
                            disabled={till.is_in_use}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AddEditTillModal
        open={showAddTill}
        onOpenChange={(open) => {
          setShowAddTill(open)
          if (!open) setSelectedTill(null)
        }}
        till={selectedTill}
        onSuccess={loadTills}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Till?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this till? This action cannot be undone. 
              Tills that are currently in use cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete Till
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}

