"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
import { FilterableTabs, TabsContent, type TabConfig } from "@/components/ui/filterable-tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { DatePicker } from "@/components/ui/date-picker"
import {
  History,
  Clock,
  PlayCircle,
  Search,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
} from "lucide-react"
import { format } from "date-fns"
import { useShift, Shift } from "@/contexts/shift-context"
import { useBusinessStore } from "@/stores/businessStore"
import { shiftService } from "@/lib/services/shiftService"
import { CloseShiftModal } from "@/components/modals/close-shift-modal"
import { PageRefreshButton } from "@/components/dashboard/page-refresh-button"
import { useI18n } from "@/contexts/i18n-context"

export default function ShiftManagementPage() {
  const router = useRouter()
  const { currentBusiness, currentOutlet, outlets } = useBusinessStore()
  const { shiftHistory } = useShift()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<string>("history")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOutlet, setSelectedOutlet] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [activeShifts, setActiveShifts] = useState<Shift[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingActive, setIsLoadingActive] = useState(true)
  const [shiftToClose, setShiftToClose] = useState<Shift | null>(null)

  // Load shift history
  useEffect(() => {
    const loadShifts = async () => {
      if (!currentBusiness) return
      
      setIsLoading(true)
      try {
        const filters: any = {}
        if (selectedOutlet !== "all") {
          filters.outlet = selectedOutlet
        }
        if (selectedStatus !== "all") {
          filters.status = selectedStatus
        }
        if (selectedDate) {
          filters.operating_date = format(selectedDate, "yyyy-MM-dd")
        }
        
        const history = await shiftService.getHistory(filters)
        setShifts(history)
      } catch (error) {
        console.error("Failed to load shift history:", error)
        setShifts([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadShifts()
  }, [selectedOutlet, selectedStatus, selectedDate, currentBusiness])

  // Load active shifts
  useEffect(() => {
    const loadActiveShifts = async () => {
      if (!currentBusiness) return
      
      setIsLoadingActive(true)
      try {
        const shifts = await shiftService.listOpen()
        setActiveShifts(shifts)
      } catch (error) {
        console.error("Failed to load active shifts:", error)
        setActiveShifts([])
      } finally {
        setIsLoadingActive(false)
      }
    }
    
    loadActiveShifts()
  }, [currentBusiness])

  const handleCloseSuccess = () => {
    // Reload both active shifts and history
    const loadActiveShifts = async () => {
      if (!currentBusiness) return
      try {
        const shifts = await shiftService.listOpen()
        setActiveShifts(shifts)
      } catch (error) {
        console.error("Failed to load active shifts:", error)
      }
    }
    
    const loadShifts = async () => {
      if (!currentBusiness) return
      try {
        const filters: any = {}
        if (selectedOutlet !== "all") {
          filters.outlet = selectedOutlet
        }
        if (selectedStatus !== "all") {
          filters.status = selectedStatus
        }
        if (selectedDate) {
          filters.operating_date = format(selectedDate, "yyyy-MM-dd")
        }
        const history = await shiftService.getHistory(filters)
        setShifts(history)
      } catch (error) {
        console.error("Failed to load shift history:", error)
      }
    }
    
    loadActiveShifts()
    loadShifts()
  }

  // Filter shifts for history tab
  const filteredShifts = shifts.filter(shift => {
    if (selectedOutlet !== "all" && shift.outletId !== selectedOutlet) return false
    if (selectedStatus !== "all" && shift.status !== selectedStatus) return false
    if (selectedDate && shift.operatingDate !== format(selectedDate, "yyyy-MM-dd")) return false
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        shift.id.toLowerCase().includes(searchLower) ||
        shift.operatingDate.includes(searchTerm) ||
        (shift.notes && shift.notes.toLowerCase().includes(searchLower))
      )
    }
    return true
  })

  const calculateSales = (shift: Shift): number => {
    if (shift.status !== "CLOSED" || !shift.closingCashBalance) return 0
    return Math.max(0, shift.closingCashBalance - (shift.openingCashBalance || 0) - (shift.floatingCash || 0))
  }

  const calculateDuration = (shift: Shift): string => {
    if (!shift.startTime || !shift.endTime) return "N/A"
    try {
      const startDate = new Date(shift.startTime)
      const endDate = new Date(shift.endTime)
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "N/A"
      const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60)
      const hours = Math.floor(duration / 60)
      const minutes = Math.floor(duration % 60)
      return `${hours}h ${minutes}m`
    } catch {
      return "N/A"
    }
  }

  const calculateActiveDuration = (shift: Shift): string => {
    if (!shift.startTime) return "N/A"
    try {
      const startDate = new Date(shift.startTime)
      if (isNaN(startDate.getTime())) return "N/A"
      const duration = (new Date().getTime() - startDate.getTime()) / (1000 * 60)
      const hours = Math.floor(duration / 60)
      const minutes = Math.floor(duration % 60)
      return `${hours}h ${minutes}m`
    } catch {
      return "N/A"
    }
  }

  const calculateDifference = (shift: Shift): number => {
    if (shift.status !== "CLOSED" || !shift.closingCashBalance) return 0
    return shift.closingCashBalance - (shift.openingCashBalance || 0)
  }

  const getOutletName = (outletId: string): string => {
    const outlet = outlets.find(o => o.id === outletId)
    return outlet?.name || "Unknown Outlet"
  }

  const tabs: TabConfig[] = [
    {
      value: "history",
      label: t("shifts.history.title"),
      icon: History,
    },
    {
      value: "active",
      label: t("shifts.current.title"),
      icon: Clock,
      badgeCount: activeShifts.length,
    },
  ]

  return (
    <DashboardLayout>
      <PageLayout
        title={t("shifts.menu.management")}
        description={t("shifts.description")}
        actions={<PageRefreshButton />}
      >
        <FilterableTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchValue={activeTab === "history" ? searchTerm : undefined}
          onSearchChange={activeTab === "history" ? setSearchTerm : undefined}
          searchPlaceholder="Search shifts..."
        >
          {/* Shift History Tab */}
          <TabsContent value="history" className="space-y-6">
            {/* Start Shift Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => router.push("/dashboard/office/shift-management/start-shift")}
                className="bg-blue-900 hover:bg-blue-800 text-white"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Start Shift
              </Button>
            </div>

            {/* Filters */}
            <div className="mb-6 pb-4 border-b border-gray-300">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Filters</h3>
                <p className="text-sm text-gray-600">Filter shifts by outlet, status, or date</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Outlet</label>
                  <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue placeholder={t("common.all_outlets")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Outlets</SelectItem>
                      {outlets.map((outlet) => (
                        <SelectItem key={outlet.id} value={outlet.id}>
                          {outlet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue placeholder={t("common.all_status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">Date</label>
                  <DatePicker
                    date={selectedDate}
                    onDateChange={setSelectedDate}
                    placeholder={t("common.select_date")}
                  />
                </div>
              </div>
            </div>

            {/* Shifts Table */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Shift Records</h3>
                  <p className="text-sm text-gray-600">
                    {filteredShifts.length} shift{filteredShifts.length !== 1 ? "s" : ""} found
                  </p>
                </div>
                <Button className="bg-white border-white text-[#1e3a8a] hover:bg-blue-50 hover:border-blue-50">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
              <div className="rounded-md border border-gray-300 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-gray-900 font-semibold">Date</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Outlet</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Till</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Duration</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Opening Cash</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Closing Cash</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Sales</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Difference</TableHead>
                      <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                      <TableHead className="text-right text-gray-900 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-gray-600">
                          Loading shifts...
                        </TableCell>
                      </TableRow>
                    ) : filteredShifts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-gray-600">
                          No shifts found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredShifts.map((shift) => {
                        const sales = calculateSales(shift)
                        const difference = calculateDifference(shift)
                        const duration = calculateDuration(shift)

                        return (
                          <TableRow key={shift.id} className="border-gray-300">
                            <TableCell className="font-medium">
                              {(() => {
                                if (!shift.operatingDate) return "N/A"
                                try {
                                  const date = new Date(shift.operatingDate)
                                  if (isNaN(date.getTime())) return "N/A"
                                  return format(date, "MMM dd, yyyy")
                                } catch {
                                  return "N/A"
                                }
                              })()}
                            </TableCell>
                            <TableCell>{getOutletName(shift.outletId)}</TableCell>
                            <TableCell>{shift.tillId}</TableCell>
                            <TableCell>{duration}</TableCell>
                            <TableCell>MWK {(shift.openingCashBalance || 0).toFixed(2)}</TableCell>
                            <TableCell>
                              {shift.closingCashBalance ? `MWK ${shift.closingCashBalance.toFixed(2)}` : "N/A"}
                            </TableCell>
                            <TableCell>
                              {shift.status === "CLOSED" ? (
                                <span className="font-medium">MWK {sales.toFixed(2)}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {shift.status === "CLOSED" && shift.closingCashBalance ? (
                                <div className="flex items-center gap-1">
                                  {difference > 0 ? (
                                    <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                                  ) : difference < 0 ? (
                                    <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                                  ) : (
                                    <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  <span
                                    className={
                                      difference > 0
                                        ? "text-green-600"
                                        : difference < 0
                                        ? "text-destructive"
                                        : "text-muted-foreground"
                                    }
                                  >
                                    MWK {Math.abs(difference).toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={shift.status === "OPEN" ? "default" : "secondary"}
                              >
                                {shift.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="border-gray-300">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
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

          {/* Active Shift Tab */}
          <TabsContent value="active" className="space-y-6">
            {isLoadingActive ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading active shifts...</p>
              </div>
            ) : activeShifts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No active shifts</p>
                <Button
                  onClick={() => router.push("/dashboard/office/shift-management/start-shift")}
                  className="bg-blue-900 hover:bg-blue-800 text-white"
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start Shift
                </Button>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Active Shifts</h3>
                  <p className="text-sm text-gray-600">
                    {activeShifts.length} active shift{activeShifts.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="rounded-md border border-gray-300 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-gray-900 font-semibold">Shift ID</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Outlet</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Till</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Started</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Duration</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Opening Cash</TableHead>
                        <TableHead className="text-right text-gray-900 font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeShifts.map((shift) => {
                        const duration = calculateActiveDuration(shift)
                        return (
                          <TableRow key={shift.id} className="border-gray-300">
                            <TableCell className="font-medium">#{shift.id.slice(-6)}</TableCell>
                            <TableCell>{getOutletName(shift.outletId)}</TableCell>
                            <TableCell>{shift.tillId}</TableCell>
                            <TableCell>
                              {shift.startTime
                                ? format(new Date(shift.startTime), "MMM dd, yyyy HH:mm")
                                : "N/A"}
                            </TableCell>
                            <TableCell>{duration}</TableCell>
                            <TableCell>
                              {currentBusiness?.currencySymbol || "MWK"}{" "}
                              {(shift.openingCashBalance || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShiftToClose(shift)}
                                className="border-gray-300"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Close Shift
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>
        </FilterableTabs>
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
