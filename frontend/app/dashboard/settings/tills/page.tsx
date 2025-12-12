"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import { tillService, type Till } from "@/lib/services/tillService"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AddEditTillModal } from "@/components/modals/add-edit-till-modal"
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
import { useToast } from "@/components/ui/use-toast"

export default function TillManagementPage() {
  const { toast } = useToast()
  const { currentBusiness } = useBusinessStore()
  const { currentOutlet } = useTenant()
  const [tills, setTills] = useState<Till[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTill, setEditingTill] = useState<Till | null>(null)
  const [deletingTill, setDeletingTill] = useState<Till | null>(null)

  const loadTills = async () => {
    if (!currentBusiness) return
    
    setIsLoading(true)
    try {
      const response = await tillService.list()
      const tillsData = Array.isArray(response) ? response : (response.results || [])
      setTills(tillsData)
    } catch (error) {
      console.error("Failed to load tills:", error)
      setTills([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTills()
  }, [currentBusiness])

  const handleAddTill = () => {
    setEditingTill(null)
    setShowAddModal(true)
  }

  const handleEditTill = (till: Till) => {
    setEditingTill(till)
    setShowAddModal(true)
  }

  const handleDeleteTill = async () => {
    if (!deletingTill) return

    try {
      await tillService.delete(deletingTill.id)
      toast({
        title: "Till Deleted",
        description: "Till has been deleted successfully.",
      })
      setDeletingTill(null)
      loadTills()
    } catch (error: any) {
      console.error("Failed to delete till:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete till.",
        variant: "destructive",
      })
    }
  }

  const handleModalSuccess = () => {
    setShowAddModal(false)
    setEditingTill(null)
    loadTills()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Till Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage tills and cash registers
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tills</CardTitle>
                <CardDescription>Manage your cash registers and tills</CardDescription>
              </div>
              <Button onClick={handleAddTill}>
                <Plus className="mr-2 h-4 w-4" />
                Add Till
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading tills...</p>
            ) : tills.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No tills found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Outlet</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>In Use</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tills.map((till) => (
                    <TableRow key={till.id}>
                      <TableCell className="font-medium">{till.name}</TableCell>
                      <TableCell>
                        {typeof till.outlet === 'object' 
                          ? till.outlet.name 
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={till.is_active ? "default" : "secondary"}>
                          {till.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={till.is_in_use ? "default" : "outline"}>
                          {till.is_in_use ? "In Use" : "Available"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTill(till)}
                            disabled={till.is_in_use}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingTill(till)}
                            disabled={till.is_in_use}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Till Modal */}
      <AddEditTillModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        till={editingTill}
        onSuccess={handleModalSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTill} onOpenChange={(open) => !open && setDeletingTill(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Till</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTill?.name}"? This action cannot be undone.
              {deletingTill?.is_in_use && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This till is currently in use. Please close any active shifts first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTill}
              disabled={deletingTill?.is_in_use}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}

