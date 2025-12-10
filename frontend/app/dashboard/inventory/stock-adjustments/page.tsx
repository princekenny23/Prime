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
import { Plus, ArrowUpDown } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { StockAdjustmentModal } from "@/components/modals/stock-adjustment-modal"
import { inventoryService } from "@/lib/services/inventoryService"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"

export default function StockAdjustmentsPage() {
  const { currentBusiness, currentOutlet } = useBusinessStore()
  const [showAdjustment, setShowAdjustment] = useState(false)
  const [adjustments, setAdjustments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const useReal = useRealAPI()

  const loadAdjustments = useCallback(async () => {
    if (!currentBusiness) {
      console.log("No current business, skipping loadAdjustments")
      setAdjustments([])
      setIsLoading(false)
      return
    }
    
    console.log("Loading adjustments:", {
      currentBusiness: currentBusiness.id,
      currentOutlet: currentOutlet?.id,
      useReal
    })
    
    setIsLoading(true)
    try {
      if (useReal) {
        // Load all adjustments for the tenant (don't filter by outlet)
        // Backend automatically filters by tenant via TenantFilterMixin
        // We show all adjustments regardless of outlet so users can see full history
        const filterParams: any = {
          movement_type: "adjustment",
        }
        
        // Don't filter by outlet - show all adjustments for the tenant
        // If you want to filter by outlet, uncomment below:
        // if (currentOutlet?.id) {
        //   filterParams.outlet = currentOutlet.id
        // }
        
        console.log("Calling getMovements with filters:", filterParams)
        const movements = await inventoryService.getMovements(filterParams)
        
        console.log("Movements API response:", {
          filters: filterParams,
          rawResponse: movements,
          resultsCount: movements.results?.length || 0,
          results: movements.results
        })
        
        if (!movements.results || movements.results.length === 0) {
          console.warn("No movements returned from API")
          setAdjustments([])
          setIsLoading(false)
          return
        }
        
        const mappedAdjustments = (movements.results || []).map((m: any) => {
          // Handle both direct product object and nested product
          const productName = m.product_name || 
                             (typeof m.product === 'string' ? m.product : m.product?.name) || 
                             "N/A"
          
          // Handle both direct user object and nested user
          const userName = m.user_name || 
                          (typeof m.user === 'string' ? m.user : m.user?.name) || 
                          (m.user?.email || "System")
          
          // Handle outlet - can be object, ID, or use outlet_name from backend
          const outletName = m.outlet_name || 
                            (typeof m.outlet === 'object' 
                              ? (m.outlet?.name || "N/A")
                              : (typeof m.outlet === 'string' || typeof m.outlet === 'number')
                              ? String(m.outlet) // If it's just an ID, fallback to ID
                              : "N/A")
          
          // Ensure date is a valid string
          const dateValue = m.created_at || m.date || new Date().toISOString()
          
          const mapped = {
            id: String(m.id),
            date: dateValue,
            product: productName,
            outlet: outletName,
            reason: m.reason || m.notes || "Adjustment",
            quantity: Number(m.quantity) || 0,
            user: userName,
          }
          
          console.log("Mapped item:", mapped)
          return mapped
        })
        
        console.log("Mapped adjustments (final):", {
          count: mappedAdjustments.length,
          adjustments: mappedAdjustments
        })
        
        console.log("Setting adjustments state with:", mappedAdjustments.length, "items")
        setAdjustments(mappedAdjustments)
        console.log("Adjustments state set, should render now")
      } else {
        setAdjustments([])
      }
    } catch (error) {
      console.error("Failed to load adjustments:", error)
      // Don't clear adjustments on error, keep existing data
      // setAdjustments([])
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness?.id, currentOutlet?.id, useReal])

  useEffect(() => {
    // Only load if we have a business
    if (currentBusiness) {
      console.log("useEffect triggered - loading adjustments", {
        currentBusinessId: currentBusiness.id,
        adjustmentsCount: adjustments.length
      })
      loadAdjustments()
      
      // Listen for outlet changes
      const handleOutletChange = () => {
        loadAdjustments()
      }
      window.addEventListener("outlet-changed", handleOutletChange)
      
      return () => {
        window.removeEventListener("outlet-changed", handleOutletChange)
      }
    } else {
      console.log("useEffect - no currentBusiness, skipping load")
    }
  }, [currentBusiness?.id, loadAdjustments])
  
  // Debug: Log adjustments state changes
  useEffect(() => {
    console.log("Adjustments state changed:", {
      count: adjustments.length,
      isLoading,
      adjustments: adjustments
    })
  }, [adjustments, isLoading])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stock Adjustments</h1>
            <p className="text-muted-foreground">Adjust inventory levels manually</p>
          </div>
          <Button onClick={() => setShowAdjustment(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Adjustment
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Adjustment History</CardTitle>
            <CardDescription>
              Track all manual stock adjustments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">Loading adjustments...</p>
                    </TableCell>
                  </TableRow>
                ) : adjustments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No adjustments found</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        (Check console for API response)
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  adjustments.map((adjustment) => {
                    console.log("Rendering adjustment:", adjustment)
                    return (
                      <TableRow key={adjustment.id}>
                        <TableCell>
                          {adjustment.date 
                            ? new Date(adjustment.date).toLocaleDateString() 
                            : "N/A"}
                        </TableCell>
                        <TableCell className="font-medium">{adjustment.product || "N/A"}</TableCell>
                        <TableCell>{adjustment.outlet || "N/A"}</TableCell>
                        <TableCell>{adjustment.reason || "Adjustment"}</TableCell>
                        <TableCell className={adjustment.quantity > 0 ? "text-green-600" : "text-red-600"}>
                          {adjustment.quantity > 0 ? "+" : ""}{adjustment.quantity}
                        </TableCell>
                        <TableCell>{adjustment.user || "System"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <StockAdjustmentModal
        open={showAdjustment}
        onOpenChange={setShowAdjustment}
        onSuccess={loadAdjustments}
      />
    </DashboardLayout>
  )
}

