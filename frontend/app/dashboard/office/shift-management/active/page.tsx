"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, DollarSign, X } from "lucide-react"
import { useState, useEffect } from "react"
import { shiftService, type Shift } from "@/lib/services/shiftService"
import { useBusinessStore } from "@/stores/businessStore"
import { format } from "date-fns"
import { CloseShiftModal } from "@/components/modals/close-shift-modal"
import { PageRefreshButton } from "@/components/dashboard/page-refresh-button"

export default function ActiveShiftsPage() {
  const { currentBusiness } = useBusinessStore()
  const [activeShifts, setActiveShifts] = useState<Shift[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [shiftToClose, setShiftToClose] = useState<Shift | null>(null)

  const loadActiveShifts = async () => {
    if (!currentBusiness) return
    
    setIsLoading(true)
    try {
      const shifts = await shiftService.listOpen()
      setActiveShifts(shifts)
    } catch (error) {
      console.error("Failed to load active shifts:", error)
      setActiveShifts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadActiveShifts()
  }, [currentBusiness])

  const handleCloseSuccess = () => {
    loadActiveShifts()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/office/shift-management">
              <button className="text-muted-foreground hover:text-foreground">
                ← Back
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Active Shifts</h1>
              <p className="text-muted-foreground mt-1">
                View currently active shifts
              </p>
            </div>
          </div>
          <PageRefreshButton />
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading active shifts...</p>
            </CardContent>
          </Card>
        ) : activeShifts.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">No active shifts</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeShifts.map((shift) => (
              <Card key={shift.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Shift #{shift.id.slice(-6)}</CardTitle>
                    <Badge variant="default">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Started: {shift.startTime ? format(new Date(shift.startTime), "MMM dd, yyyy HH:mm") : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Opening Cash: {currentBusiness?.currencySymbol || "MWK"} {(shift.openingCashBalance || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Outlet: {shift.outletId} | Till: {shift.tillId}
                    </div>
                    <div className="pt-2 mt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShiftToClose(shift)}
                        className="w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Close Shift
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CloseShiftModal
        open={!!shiftToClose}
        onOpenChange={(open) => !open && setShiftToClose(null)}
        shift={shiftToClose}
        onSuccess={handleCloseSuccess}
      />
    </DashboardLayout>
  )
}

