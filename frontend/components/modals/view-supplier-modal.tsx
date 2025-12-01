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
import { Badge } from "@/components/ui/badge"
import { Building2, Mail, Phone, MapPin, FileText, Calendar } from "lucide-react"
import type { Supplier } from "@/lib/services/supplierService"

interface ViewSupplierModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: Supplier | null
}

export function ViewSupplierModal({ open, onOpenChange, supplier }: ViewSupplierModalProps) {
  if (!supplier) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Supplier Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this supplier
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Supplier Name
              </p>
              <p className="font-medium">{supplier.name}</p>
            </div>

            {supplier.contact_name && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Contact Person</p>
                <p className="font-medium">{supplier.contact_name}</p>
              </div>
            )}

            {supplier.email && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </p>
                <p className="font-medium">{supplier.email}</p>
              </div>
            )}

            {supplier.phone && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </p>
                <p className="font-medium">{supplier.phone}</p>
              </div>
            )}

            {supplier.payment_terms && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Payment Terms</p>
                <p className="font-medium">{supplier.payment_terms}</p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge 
                variant={supplier.is_active ? "default" : "secondary"}
                className={
                  supplier.is_active 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-800"
                }
              >
                {supplier.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          {/* Address Information */}
          {(supplier.address || supplier.city || supplier.state || supplier.zip_code || supplier.country) && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </p>
              <div className="space-y-1">
                {supplier.address && <p className="font-medium">{supplier.address}</p>}
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {supplier.city && <span>{supplier.city}</span>}
                  {supplier.state && <span>{supplier.state}</span>}
                  {supplier.zip_code && <span>{supplier.zip_code}</span>}
                  {supplier.country && <span>{supplier.country}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Additional Information */}
          {(supplier.tax_id || supplier.notes) && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Additional Information
              </p>
              <div className="space-y-2">
                {supplier.tax_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tax ID</p>
                    <p className="font-medium">{supplier.tax_id}</p>
                  </div>
                )}
                {supplier.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm">{supplier.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Metadata
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Created: </span>
                <span className="font-medium">
                  {supplier.created_at 
                    ? new Date(supplier.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Last Updated: </span>
                <span className="font-medium">
                  {supplier.updated_at 
                    ? new Date(supplier.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

