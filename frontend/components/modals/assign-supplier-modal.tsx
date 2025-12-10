"use client"

import { useState, useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supplierService } from "@/lib/services/supplierService"
import { purchaseOrderService, type PurchaseOrderItem } from "@/lib/services/purchaseOrderService"
import type { Supplier } from "@/lib/services/supplierService"

interface AssignSupplierModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: PurchaseOrderItem | null
  poId: string
  onSupplierAssigned?: () => void
}

export function AssignSupplierModal({
  open,
  onOpenChange,
  item,
  poId,
  onSupplierAssigned,
}: AssignSupplierModalProps) {
  const { toast } = useToast()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    if (open && !showCreateForm) {
      loadSuppliers()
    }
  }, [open, showCreateForm])

  const loadSuppliers = async () => {
    setIsLoadingSuppliers(true)
    try {
      const response = await supplierService.list()
      setSuppliers(Array.isArray(response) ? response : (response.results || []))
    } catch (error) {
      console.error("Failed to load suppliers:", error)
      toast({
        title: "Error",
        description: "Failed to load suppliers",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSuppliers(false)
    }
  }

  const handleCreateSupplier = async () => {
    if (!newSupplier.name.trim()) {
      toast({
        title: "Error",
        description: "Supplier name is required",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const created = await supplierService.create(newSupplier)
      await loadSuppliers()
      setSelectedSupplierId(String(created.id))
      setShowCreateForm(false)
      setNewSupplier({ name: "", contact_name: "", email: "", phone: "", address: "" })
      toast({
        title: "Success",
        description: "Supplier created successfully",
      })
    } catch (error: any) {
      console.error("Failed to create supplier:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create supplier",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedSupplierId) {
      toast({
        title: "Error",
        description: "Please select a supplier",
        variant: "destructive",
      })
      return
    }

    if (!item) {
      toast({
        title: "Error",
        description: "No item selected",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await purchaseOrderService.assignSupplierToItem(
        poId,
        Number(item.id),
        Number(selectedSupplierId)
      )
      toast({
        title: "Success",
        description: "Supplier assigned successfully",
      })
      onOpenChange(false)
      if (onSupplierAssigned) {
        onSupplierAssigned()
      }
    } catch (error: any) {
      console.error("Failed to assign supplier:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to assign supplier",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const productName = item?.product?.name || item?.variation?.product?.name || "Unknown Product"
  const variationName = item?.variation?.name

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Supplier</DialogTitle>
          <DialogDescription>
            Assign a supplier to {productName}
            {variationName && ` - ${variationName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!showCreateForm ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="supplier">Select Supplier</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedSupplierId}
                    onValueChange={setSelectedSupplierId}
                    disabled={isLoadingSuppliers}
                  >
                    <SelectTrigger id="supplier">
                      <SelectValue placeholder="Choose a supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={String(supplier.id)}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(true)}
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Create New Supplier</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewSupplier({ name: "", contact_name: "", email: "", phone: "", address: "" })
                  }}
                >
                  Cancel
                </Button>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Supplier Name *</Label>
                  <Input
                    id="name"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    placeholder="Enter supplier name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={newSupplier.contact_name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contact_name: e.target.value })}
                    placeholder="Contact person name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newSupplier.email}
                      onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                    placeholder="Supplier address"
                    rows={2}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleCreateSupplier}
                  disabled={isLoading || !newSupplier.name.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Supplier
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          {!showCreateForm && (
            <Button onClick={handleAssign} disabled={isLoading || !selectedSupplierId}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Supplier"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

