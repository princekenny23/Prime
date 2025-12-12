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
import { Store, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"

interface Outlet {
  id: number | string
  name: string
}

interface OutletSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  outlets: Outlet[]
  message?: string
  onConfirm: (outletId: string) => void
  isLoading?: boolean
}

export function OutletSelectionModal({
  open,
  onOpenChange,
  outlets,
  message = "Please select an outlet for this import",
  onConfirm,
  isLoading = false,
}: OutletSelectionModalProps) {
  const [selectedOutletId, setSelectedOutletId] = useState<string>("")
  const [error, setError] = useState<string>("")

  // Remember last selected outlet for convenience
  useEffect(() => {
    if (open && outlets.length > 0) {
      const lastOutletId = typeof window !== "undefined" 
        ? localStorage.getItem("lastSelectedOutletId")
        : null
      
      if (lastOutletId && outlets.some(o => String(o.id) === lastOutletId)) {
        setSelectedOutletId(lastOutletId)
      } else if (outlets.length > 0) {
        // Default to first outlet if no last selection
        setSelectedOutletId(String(outlets[0].id))
      }
    }
  }, [open, outlets])

  const handleConfirm = () => {
    if (!selectedOutletId) {
      setError("Please select an outlet to continue")
      return
    }
    setError("")
    // Remember selection for next time
    if (typeof window !== "undefined") {
      localStorage.setItem("lastSelectedOutletId", selectedOutletId)
    }
    onConfirm(selectedOutletId)
  }

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing without selection
    if (!newOpen && !selectedOutletId && !isLoading) {
      return
    }
    if (newOpen) {
      // Reset state when opening
      setSelectedOutletId("")
      setError("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Select Outlet for Import
          </DialogTitle>
          <DialogDescription>
            {message}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="outlet-select">Outlet *</Label>
            <Select
              value={selectedOutletId}
              onValueChange={(value) => {
                setSelectedOutletId(value)
                setError("")
              }}
              disabled={isLoading}
            >
              <SelectTrigger id="outlet-select" className={error ? "border-red-500" : ""}>
                <SelectValue placeholder="Select an outlet" />
              </SelectTrigger>
              <SelectContent>
                {outlets.map((outlet) => (
                  <SelectItem key={String(outlet.id)} value={String(outlet.id)}>
                    {outlet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {outlets.length === 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium">No outlets available</p>
                  <p className="text-xs mt-1">Please create an outlet before importing products.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedOutletId || isLoading || outlets.length === 0}
          >
            {isLoading ? "Importing..." : "Confirm & Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

