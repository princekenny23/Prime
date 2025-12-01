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
import { Plus, Search, User, Mail, Phone, Shield, Building2, Edit, Trash2, Eye } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { userService } from "@/lib/services/userService"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { AddEditUserModal } from "@/components/modals/add-edit-user-modal"
import { ViewUserModal } from "@/components/modals/view-user-modal"
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
import type { User } from "@/lib/types/mock-data"

export default function AccountsPage() {
  const { currentBusiness } = useBusinessStore()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddUser, setShowAddUser] = useState(false)
  const [showViewUser, setShowViewUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const useReal = useRealAPI()

  const loadUsers = useCallback(async () => {
    if (!currentBusiness) {
      setUsers([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      if (useReal) {
        // Get users from tenant endpoint (tenant includes users)
        const tenantResponse = await api.get<any>(`/tenants/${currentBusiness.id}/`)
        
        // Transform backend user data to frontend User format
        const backendUsers = tenantResponse.users || []
        const transformedUsers: User[] = backendUsers.map((backendUser: any) => ({
          id: String(backendUser.id),
          email: backendUser.email || "",
          name: backendUser.name || backendUser.username || backendUser.email?.split("@")[0] || "",
          role: backendUser.role || "staff",
          businessId: String(currentBusiness.id),
          outletIds: [],
          createdAt: backendUser.date_joined || new Date().toISOString(),
          is_saas_admin: backendUser.is_saas_admin || false,
          tenant: currentBusiness,
        }))
        
        setUsers(transformedUsers)
      } else {
        setUsers([])
      }
    } catch (error: any) {
      console.error("Failed to load users:", error)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness?.id, useReal])

  useEffect(() => {
    if (currentBusiness) {
      loadUsers()
    }
  }, [currentBusiness?.id, loadUsers])

  const filteredUsers = users.filter(user => {
    const name = user.name || ""
    const email = user.email || ""
    const searchLower = searchTerm.toLowerCase()
    return name.toLowerCase().includes(searchLower) || email.toLowerCase().includes(searchLower)
  })

  const totalUsers = users.length
  const adminUsers = users.filter(u => u.role === "admin" || u.is_saas_admin).length
  const staffUsers = users.filter(u => {
    const role = u.role || ""
    return role === "staff" || role === "cashier" || role === "manager"
  }).length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Accounts</h1>
            <p className="text-muted-foreground">Manage user accounts and access</p>
          </div>
          <Button onClick={() => {
            setSelectedUser(null)
            setShowAddUser(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staffUsers}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage user accounts for this business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">Loading users...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No users found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const userName = user.name || user.email?.split("@")[0] || "N/A"
                    const userEmail = user.email || "N/A"
                    const userRole = user.role || "staff"
                    const isAdmin = user.is_saas_admin || userRole === "admin"
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{userName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {userEmail}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {userRole}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{user.businessId ? "Assigned" : "Unassigned"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            isAdmin
                              ? "bg-purple-100 text-purple-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                            {user.is_saas_admin ? "SaaS Admin" : "Active"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user)
                                setShowViewUser(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user)
                                setShowAddUser(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => {
                                setUserToDelete(user.id)
                                setShowDeleteDialog(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AddEditUserModal
        open={showAddUser}
        onOpenChange={setShowAddUser}
        user={selectedUser}
        onSuccess={loadUsers}
      />

      <ViewUserModal
        open={showViewUser}
        onOpenChange={setShowViewUser}
        user={selectedUser}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone. The user will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!userToDelete) return

                try {
                  await userService.delete(userToDelete)
                  toast({
                    title: "User Deleted",
                    description: "User has been deleted successfully.",
                  })
                  loadUsers()
                  setShowDeleteDialog(false)
                  setUserToDelete(null)
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message || "Failed to delete user.",
                    variant: "destructive",
                  })
                }
              }}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}

