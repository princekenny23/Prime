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
import { Plus, Search, User, Mail, Phone, Shield, MapPin, Edit, Key, UserX, Settings } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { AddEditStaffModal } from "@/components/modals/add-edit-staff-modal"
import { AssignRoleOutletModal } from "@/components/modals/assign-role-outlet-modal"
import { ResetPasswordModal } from "@/components/modals/reset-password-modal"
import { AddEditRoleModal } from "@/components/modals/add-edit-role-modal"
import { staffService, roleService, type Staff, type Role } from "@/lib/services/staffService"
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

export default function StaffPage() {
  const { currentBusiness } = useBusinessStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [showAssignRole, setShowAssignRole] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showDeactivate, setShowDeactivate] = useState(false)
  const [showAddRole, setShowAddRole] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [staffToDeactivate, setStaffToDeactivate] = useState<string | null>(null)
  const [staff, setStaff] = useState<Staff[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const useReal = useRealAPI()

  const loadStaff = useCallback(async () => {
    if (!currentBusiness) {
      setStaff([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      if (useReal) {
        const response = await staffService.list({ tenant: currentBusiness.id })
        setStaff(response.results || [])
      } else {
        setStaff([])
      }
    } catch (error) {
      console.error("Failed to load staff:", error)
      setStaff([])
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
      loadStaff()
      loadRoles()
    }
  }, [currentBusiness?.id, loadStaff, loadRoles])

  const filteredStaff = staff.filter(member => {
    const userName = member.user?.name || ""
    const userEmail = member.user?.email || ""
    const userPhone = member.user?.phone || ""
    
    const matchesSearch = 
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userPhone.includes(searchTerm)
    
    const memberRole = member.role?.name || member.user?.role || ""
    const matchesRole = roleFilter === "all" || memberRole === roleFilter
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "Active" && member.is_active) ||
      (statusFilter === "Inactive" && !member.is_active)

    return matchesSearch && matchesRole && matchesStatus
  })
 
  const activeCount = staff.filter(s => s.is_active).length
  const roleNames = roles.map(r => r.name)

  const handleDeactivate = (staffId: string) => {
    setStaffToDeactivate(staffId)
    setShowDeactivate(true)
  }

  const confirmDeactivate = async () => {
    if (!staffToDeactivate) return

    try {
      await staffService.update(staffToDeactivate, { is_active: false })
      toast({
        title: "Employee Deactivated",
        description: "Employee has been deactivated successfully.",
      })
      loadStaff()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate employee.",
        variant: "destructive",
      })
    } finally {
      setShowDeactivate(false)
      setStaffToDeactivate(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Employee Management</h1>
            <p className="text-muted-foreground">Manage your employees and their roles</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                setSelectedRole(null)
                setShowAddRole(true)
              }}
            >
              <Shield className="mr-2 h-4 w-4" />
              Create Role
            </Button>
            <Button onClick={() => {
              setSelectedStaff(null)
              setShowAddStaff(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staff.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Roles</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roles.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staff.length - activeCount}</div>
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
                  placeholder="Search by name, email, or phone..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roleNames.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
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

        {/* Staff Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Employees</CardTitle>
            <CardDescription>
              {filteredStaff.length} employee{filteredStaff.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Outlets</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">Loading employees...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No employees found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.user?.name || "N/A"}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{member.user?.email || "N/A"}</span>
                          </div>
                          {member.user?.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{member.user.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Shield className="h-3 w-3 mr-1" />
                          {member.role?.name || member.user?.role || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {member.outlets && member.outlets.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm">{member.outlets.length} outlet{(member.outlets.length !== 1 ? "s" : "")}</span>
                              <span className="text-xs text-muted-foreground">
                                {Array.isArray(member.outlets) 
                                  ? member.outlets.map((o: any) => typeof o === 'object' ? o.name : o).join(", ")
                                  : "N/A"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No outlets</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.is_active ? "default" : "secondary"}>
                          {member.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStaff(member)
                              setShowAddStaff(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStaff(member)
                              setShowAssignRole(true)
                            }}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStaff(member)
                              setShowResetPassword(true)
                            }}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDeactivate(member.id)}
                          >
                            <UserX className="h-4 w-4" />
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
      <AddEditStaffModal
        open={showAddStaff}
        onOpenChange={setShowAddStaff}
        staff={selectedStaff}
        onSuccess={loadStaff}
      />
      <AssignRoleOutletModal
        open={showAssignRole}
        onOpenChange={setShowAssignRole}
        staff={selectedStaff}
        onSuccess={loadStaff}
      />
      <ResetPasswordModal
        open={showResetPassword}
        onOpenChange={setShowResetPassword}
        staff={selectedStaff}
      />
      <AddEditRoleModal
        open={showAddRole}
        onOpenChange={(open) => {
          setShowAddRole(open)
          if (!open) setSelectedRole(null)
        }}
        role={selectedRole}
        onSuccess={() => {
          loadRoles()
          loadStaff() // Reload staff to refresh role names
        }}
      />

      {/* Deactivate Confirmation */}
      <AlertDialog open={showDeactivate} onOpenChange={setShowDeactivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Employee?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate this employee? They will no longer be able to access the system. This action can be reversed later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeactivate}
              className="bg-destructive text-destructive-foreground"
            >
              Deactivate Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
