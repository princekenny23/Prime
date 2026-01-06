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
import { Plus, Search, User, Mail, Phone, Shield, Building2, Edit, Trash2, Eye, Lock } from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { userService } from "@/lib/services/userService"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { AddEditUserModal } from "@/components/modals/add-edit-user-modal"
import { ViewUserModal } from "@/components/modals/view-user-modal"
import { FilterableTabs, TabsContent, type TabConfig } from "@/components/ui/filterable-tabs"
import { roleService, type Role } from "@/lib/services/staffService"
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
import type { User } from "@/lib/types"

export default function AccountsPage() {
  const { currentBusiness } = useBusinessStore()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("users")
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

  const loadRoles = useCallback(async () => {
    if (!currentBusiness) {
      setRoles([])
      return
    }

    try {
      if (useReal) {
        const response = await roleService.list({ tenant: currentBusiness.id, is_active: true })
        setRoles(response.results || [])
      } else {
        setRoles([])
      }
    } catch (error) {
      console.error("Failed to load roles:", error)
      setRoles([])
    }
  }, [currentBusiness?.id, useReal])

  useEffect(() => {
    if (currentBusiness) {
      loadUsers()
      loadRoles()
    }
  }, [currentBusiness?.id, loadUsers, loadRoles])

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const name = user.name || ""
      const email = user.email || ""
      const searchLower = searchTerm.toLowerCase()
      return name.toLowerCase().includes(searchLower) || email.toLowerCase().includes(searchLower)
    })
  }, [users, searchTerm])

  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      return role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [roles, searchTerm])

  const tabsConfig: TabConfig[] = [
    {
      value: "users",
      label: "Users",
      icon: User,
      badgeCount: users.length,
      badgeVariant: "secondary",
    },
    {
      value: "roles",
      label: "Roles",
      icon: Shield,
      badgeCount: roles.length,
      badgeVariant: "secondary",
    },
    {
      value: "permissions",
      label: "Permissions",
      icon: Lock,
      badgeCount: roles.length,
      badgeVariant: "secondary",
    },
  ]

  return (
    <DashboardLayout>
      <PageLayout
        title="Accounts"
        description="Manage user accounts, roles, and permissions"
        noPadding={true}
      >
        <div className="px-6 pt-4 border-b border-gray-300">
          <FilterableTabs
            tabs={tabsConfig}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
            <TabsContent value="users" className="mt-0">
              <div className="px-6 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Users</h3>
                    <p className="text-sm text-gray-600">
                      {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} found
                    </p>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedUser(null)
                      setShowAddUser(true)
                    }}
                    className="bg-[#1e3a8a] text-white hover:bg-blue-800"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </div>
                <div className="mb-4 pb-4 border-b border-gray-300">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search users..."
                      className="pl-10 bg-white border-gray-300"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="overflow-x-auto rounded-md border border-gray-300 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-gray-900 font-semibold">Name</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Email</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Role</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Business</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <p className="text-gray-600">Loading users...</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <p className="text-gray-600">No users found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => {
                          const userName = user.name || user.email?.split("@")[0] || "N/A"
                          const userEmail = user.email || "N/A"
                          const userRole = user.role || "staff"
                          const isAdmin = user.is_saas_admin || userRole === "admin"
                          
                          return (
                            <TableRow key={user.id} className="border-gray-300">
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
                </div>
              </div>
            </TabsContent>

            <TabsContent value="roles" className="mt-0">
              <div className="px-6 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Roles</h3>
                    <p className="text-sm text-gray-600">
                      {filteredRoles.length} role{filteredRoles.length !== 1 ? "s" : ""} found
                    </p>
                  </div>
                  <Button 
                    onClick={() => {
                      window.location.href = "/dashboard/office/staff"
                    }}
                    className="bg-[#1e3a8a] text-white hover:bg-blue-800"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Role
                  </Button>
                </div>
                <div className="mb-4 pb-4 border-b border-gray-300">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search roles..."
                      className="pl-10 bg-white border-gray-300"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="overflow-x-auto rounded-md border border-gray-300 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-gray-900 font-semibold">Name</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Description</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Permissions</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRoles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            <p className="text-gray-600">No roles found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRoles.map((role) => {
                          const permissionCount = [
                            role.can_sales,
                            role.can_inventory,
                            role.can_products,
                            role.can_customers,
                            role.can_reports,
                            role.can_staff,
                            role.can_settings,
                            role.can_dashboard,
                          ].filter(Boolean).length

                          return (
                            <TableRow key={role.id} className="border-gray-300">
                              <TableCell className="font-medium">{role.name}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {role.description || "No description"}
                              </TableCell>
                              <TableCell>
                                <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                  {permissionCount} permission{permissionCount !== 1 ? "s" : ""}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  role.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}>
                                  {role.is_active ? "Active" : "Inactive"}
                                </span>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="mt-0">
              <div className="px-6 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Permissions</h3>
                    <p className="text-sm text-gray-600">
                      View permissions for each role
                    </p>
                  </div>
                  <Button 
                    onClick={() => {
                      window.location.href = "/dashboard/office/staff"
                    }}
                    className="bg-[#1e3a8a] text-white hover:bg-blue-800"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Role
                  </Button>
                </div>
                <div className="mb-6 pb-4 border-b border-gray-300">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search roles..."
                      className="pl-10 bg-white border-gray-300"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="overflow-x-auto rounded-md border border-gray-300 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-gray-900 font-semibold">Role</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Sales</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Inventory</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Products</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Customers</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Reports</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Staff</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Settings</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Dashboard</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRoles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <p className="text-gray-600">No roles found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRoles.map((role) => (
                          <TableRow key={role.id} className="border-gray-300">
                            <TableCell className="font-medium">{role.name}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                role.can_sales
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {role.can_sales ? "Yes" : "No"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                role.can_inventory
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {role.can_inventory ? "Yes" : "No"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                role.can_products
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {role.can_products ? "Yes" : "No"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                role.can_customers
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {role.can_customers ? "Yes" : "No"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                role.can_reports
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {role.can_reports ? "Yes" : "No"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                role.can_staff
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {role.can_staff ? "Yes" : "No"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                role.can_settings
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {role.can_settings ? "Yes" : "No"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                role.can_dashboard
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {role.can_dashboard ? "Yes" : "No"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </FilterableTabs>
        </div>
      </PageLayout>

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

