"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Calendar,
  Clock,
  DollarSign,
  Search,
  Filter,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { format } from "date-fns"
import { useState, useEffect } from "react"
import { useShift, Shift } from "@/contexts/shift-context"
import { useBusinessStore } from "@/stores/businessStore"
import { shiftService } from "@/lib/services/shiftService"
import { outletService } from "@/lib/services/outletService"

export default function ShiftHistoryPage() {
  const { currentBusiness, currentOutlet, outlets } = useBusinessStore()
  const { shiftHistory } = useShift()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOutlet, setSelectedOutlet] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  // Calculate statistics
  const totalShifts = shifts.length
  const closedShifts = shifts.filter(s => s.status === "CLOSED").length
  const totalSales = shifts
    .filter(s => s.status === "CLOSED" && s.closingCashBalance)
    .reduce((sum, s) => {
      const sales = (s.closingCashBalance || 0) - (s.openingCashBalance || 0) - (s.floatingCash || 0)
      return sum + Math.max(0, sales)
    }, 0)
  const averageShiftDuration = shifts
    .filter(s => s.status === "CLOSED" && s.startTime && s.endTime)
    .reduce((sum, s) => {
      const duration = (new Date(s.endTime!).getTime() - new Date(s.startTime).getTime()) / (1000 * 60)
      return sum + duration
    }, 0) / closedShifts || 0

  // Filter shifts
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

  const calculateDifference = (shift: Shift): number => {
    if (shift.status !== "CLOSED" || !shift.closingCashBalance) return 0
    return shift.closingCashBalance - (shift.openingCashBalance || 0)
  }

  const getOutletName = (outletId: string): string => {
    const outlet = outlets.find(o => o.id === outletId)
    return outlet?.name || "Unknown Outlet"
  }

  const getTillName = (tillId: string): string => {
    return `Till ${tillId.slice(-1)}`
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Shift History</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all day shift records
            </p>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalShifts}</div>
              <p className="text-xs text-muted-foreground">
                {closedShifts} closed, {totalShifts - closedShifts} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">MWK {totalSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From closed shifts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor(averageShiftDuration / 60)}h {Math.floor(averageShiftDuration % 60)}m
              </div>
              <p className="text-xs text-muted-foreground">
                Per shift
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                MWK {closedShifts > 0 ? (totalSales / closedShifts).toFixed(2) : "0.00"}
              </div>
              <p className="text-xs text-muted-foreground">
                Per closed shift
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter shifts by outlet, status, or date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search shifts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Outlet</label>
                <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Outlets" />
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
                <label className="text-sm font-medium">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <DatePicker
                  date={selectedDate}
                  onDateChange={setSelectedDate}
                  placeholder="Select date"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shifts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Shift Records</CardTitle>
            <CardDescription>
              {filteredShifts.length} shift{filteredShifts.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Outlet</TableHead>
                    <TableHead>Till</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Opening Cash</TableHead>
                    <TableHead>Closing Cash</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Difference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        Loading shifts...
                      </TableCell>
                    </TableRow>
                  ) : filteredShifts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No shifts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredShifts.map((shift) => {
                      const sales = calculateSales(shift)
                      const difference = calculateDifference(shift)
                      const duration = calculateDuration(shift)

                      return (
                        <TableRow key={shift.id}>
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
                            <Button variant="ghost" size="sm">
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


