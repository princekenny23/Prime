"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ClipboardCheck, Plus, Clock, CheckCircle2, Users } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { StartStockTakeModal } from "@/components/modals/start-stock-take-modal"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { inventoryService } from "@/lib/services/inventoryService"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"
import { useEffect } from "react"

interface StockTake {
  id: string
  outletId: string
  outletName: string
  date: string
  time: string
  description?: string
  status: "RUNNING" | "FINISHED"
  progress: number
  totalItems: number
  countedItems: number
  startedBy: string
  participants?: number
  completedAt?: string
}

export default function StockTakingHistoryPage() {
  const router = useRouter()
  const { currentBusiness, currentOutlet, outlets } = useBusinessStore()
  const [showStartModal, setShowStartModal] = useState(false)
  const [runningStockTakes, setRunningStockTakes] = useState<StockTake[]>([])
  const [finishedStockTakes, setFinishedStockTakes] = useState<StockTake[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const useReal = useRealAPI()

  useEffect(() => {
    const loadStockTakes = async () => {
      if (!currentBusiness) return
      
      setIsLoading(true)
      try {
        if (useReal) {
          const response = await inventoryService.getStockTakes()
          const stockTakes = response.results || []
          
          // Transform and separate running and finished
          const running = stockTakes
            .filter((st: any) => st.status === 'running')
            .map((st: any) => ({
              id: String(st.id),
              outletId: String(st.outlet?.id || st.outlet || ""),
              outletName: st.outlet?.name || outlets.find(o => o.id === String(st.outlet))?.name || "Unknown",
              date: st.operating_date || st.created_at,
              time: new Date(st.created_at).toLocaleTimeString(),
              description: st.description || "",
              status: "RUNNING" as const,
              progress: st.items ? Math.round((st.items.filter((i: any) => i.counted_quantity > 0).length / st.items.length) * 100) : 0,
              totalItems: st.items?.length || 0,
              countedItems: st.items?.filter((i: any) => i.counted_quantity > 0).length || 0,
              startedBy: st.user?.name || st.user?.email || "System",
              participants: 1,
            }))
          
          const finished = stockTakes
            .filter((st: any) => st.status === 'completed')
            .map((st: any) => ({
              id: String(st.id),
              outletId: String(st.outlet?.id || st.outlet || ""),
              outletName: st.outlet?.name || outlets.find(o => o.id === String(st.outlet))?.name || "Unknown",
              date: st.operating_date || st.created_at,
              time: new Date(st.created_at).toLocaleTimeString(),
              description: st.description || "",
              status: "FINISHED" as const,
              progress: 100,
              totalItems: st.items?.length || 0,
              countedItems: st.items?.length || 0,
              startedBy: st.user?.name || st.user?.email || "System",
              completedAt: st.completed_at,
            }))
          
          setRunningStockTakes(running)
          setFinishedStockTakes(finished)
        } else {
          setRunningStockTakes([])
          setFinishedStockTakes([])
        }
      } catch (error) {
        console.error("Failed to load stock takes:", error)
        setRunningStockTakes([])
        setFinishedStockTakes([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadStockTakes()
  }, [currentBusiness, useReal, outlets])

  const handleJoinStockTake = (id: string) => {
    router.push(`/dashboard/inventory/stock-taking/${id}`)
  }

  const handleViewStockTake = (id: string) => {
    router.push(`/dashboard/inventory/stock-taking/${id}`)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stock Taking</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track inventory stock taking sessions
            </p>
          </div>
          <Button onClick={() => setShowStartModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Start New Stock Take
          </Button>
        </div>

        {/* Running Stock Takes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Running Stock Takes
            </CardTitle>
            <CardDescription>
              Active stock taking sessions that are currently in progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Loading stock takes...</p>
              </div>
            ) : runningStockTakes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No running stock takes</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Outlet</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Started By</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runningStockTakes.map((stockTake) => (
                    <TableRow key={stockTake.id}>
                      <TableCell className="font-medium">{stockTake.outletName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{format(new Date(stockTake.date), "MMM dd, yyyy")}</span>
                          <span className="text-xs text-muted-foreground">{stockTake.time}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {stockTake.description || "No description"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted rounded-full h-2 max-w-[100px]">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${stockTake.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{stockTake.progress}%</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {stockTake.countedItems} / {stockTake.totalItems} items
                        </div>
                      </TableCell>
                      <TableCell>{stockTake.startedBy}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{stockTake.participants || 1}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleJoinStockTake(stockTake.id)}
                        >
                          Join Stock Take
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Finished Stock Takes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Finished Stock Takes
            </CardTitle>
            <CardDescription>
              Completed stock taking sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Loading stock takes...</p>
              </div>
            ) : finishedStockTakes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No finished stock takes</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Outlet</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Items Counted</TableHead>
                    <TableHead>Started By</TableHead>
                    <TableHead>Completed At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finishedStockTakes.map((stockTake) => (
                    <TableRow key={stockTake.id}>
                      <TableCell className="font-medium">{stockTake.outletName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{format(new Date(stockTake.date), "MMM dd, yyyy")}</span>
                          <span className="text-xs text-muted-foreground">{stockTake.time}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {stockTake.description || "No description"}
                      </TableCell>
                      <TableCell>{stockTake.totalItems}</TableCell>
                      <TableCell>{stockTake.startedBy}</TableCell>
                      <TableCell>
                        {stockTake.completedAt
                          ? format(new Date(stockTake.completedAt), "MMM dd, yyyy HH:mm")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-600">Completed</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewStockTake(stockTake.id)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Start New Stock Take Modal */}
      <StartStockTakeModal
        open={showStartModal}
        onOpenChange={setShowStartModal}
      />
    </DashboardLayout>
  )
}
