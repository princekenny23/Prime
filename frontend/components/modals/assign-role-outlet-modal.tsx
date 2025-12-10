"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Shield, MapPin } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { staffService, roleService, type Staff, type Role } from "@/lib/services/staffService"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"

interface AssignRoleOutletModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff?: Staff | null
  onSuccess?: () => void
}

export function AssignRoleOutletModal({ open, onOpenChange, staff, onSuccess }: AssignRoleOutletModalProps) {
  const { toast } = useToast()
  const { currentBusiness } = useBusinessStore()
  const { outlets } = useTenant()
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")
  const [selectedOutletIds, setSelectedOutletIds] = useState<string[]>([])

  useEffect(() => {
    if (open && staff) {
      loadRoles()
      setSelectedRoleId(staff.role?.id ? String(staff.role.id) : "")
      // Extract outlet IDs from outlets array
      const outletIds = staff.outlets?.map((o: any) => {
        // Handle both object format {id, name} and string format
        return typeof o === 'object' ? String(o.id) : String(o)
      }) || []
      setSelectedOutletIds(outletIds)
    }
  }, [open, staff, currentBusiness])

  const loadRoles = async () => {
    if (!currentBusiness) return
    try {
      const response = await roleService.list({ tenant: currentBusiness.id, is_active: true })
      setRoles(response.results || [])
    } catch (error) {
      console.error("Failed to load roles:", error)
    }
  }

  if (!staff) return null

  const handleOutletToggle = (outletId: string) => {
    setSelectedOutletIds(prev =>
      prev.includes(outletId)
        ? prev.filter(id => id !== outletId)
        : [...prev, outletId]
    )
  }

  const handleAssign = async () => {
    setIsLoading(true)

    try {
      const updateData: any = {
        outlet_ids: selectedOutletIds.map(id => parseInt(id)),
      }
      if (selectedRoleId) {
        updateData.role = parseInt(selectedRoleId)
      } else {
        updateData.role = null
      }

      await staffService.update(staff.id, updateData)
      toast({
        title: "Assignment Updated",
        description: "Role and outlets have been assigned successfully.",
      })
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error("Failed to update assignment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update role and outlet assignment.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Assign Role & Outlets
          </DialogTitle>
          <DialogDescription>
            Assign role and outlets for {staff.user?.name || "this staff member"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Current Assignment</p>
            <p className="font-medium">{staff.user?.name || "N/A"}</p>
            <p className="text-sm text-muted-foreground">
              Role: {staff.role?.name || "No role"} • Outlets: {staff.outlets?.length || 0}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              value={selectedRoleId || "none"} 
              onValueChange={(value) => setSelectedRoleId(value === "none" ? "" : value)}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select role (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No role assigned</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Outlets (Optional)</Label>
            <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
              {outlets.filter(o => o.isActive).length === 0 ? (
                <p className="text-sm text-muted-foreground">No active outlets available</p>
              ) : (
                <div className="space-y-2">
                  {outlets.filter(o => o.isActive).map(outlet => (
                    <div key={outlet.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`outlet-${outlet.id}`}
                        checked={selectedOutletIds.includes(String(outlet.id))}
                        onChange={() => handleOutletToggle(String(outlet.id))}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label
                        htmlFor={`outlet-${outlet.id}`}
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{outlet.name}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedOutletIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedOutletIds.length} outlet{selectedOutletIds.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Changing the role will update the staff member's permissions. Changing the outlets will limit their access to those specific locations.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
