"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBusiness])

  const handleCloseSuccess = () => {
    loadActiveShifts()
  }

  return (
    <DashboardLayout>
      <PageLayout
        title="Active Shifts"
        description="View currently active shifts"
        actions={<PageRefreshButton />}
      >
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading active shifts...</p>
          </div>
        ) : activeShifts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No active shifts</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeShifts.map((shift) => (
              <Card key={shift.id} className="border-gray-300">
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
      </PageLayout>

      <CloseShiftModal
        open={!!shiftToClose}
        onOpenChange={(open) => !open && setShiftToClose(null)}
        shift={shiftToClose}
        onSuccess={handleCloseSuccess}
      />
    </DashboardLayout>
  )
}

