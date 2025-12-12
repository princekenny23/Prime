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
import { Plus, RotateCcw, Info, ArrowDown, ArrowUp } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { inventoryService } from "@/lib/services/inventoryService"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"
import { Badge } from "@/components/ui/badge"

export default function StockReturnsPage() {
  const { currentBusiness, currentOutlet, outlets } = useBusinessStore()
  const [returns, setReturns] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const useReal = useRealAPI()

  const loadReturns = useCallback(async () => {
    if (!currentBusiness) {
      setReturns([])
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    try {
      if (useReal) {
        // Load return movements
        const returnMovements = await inventoryService.getMovements({
          movement_type: "return",
        })
        
        console.log("Return movements response:", {
          results: returnMovements.results,
          count: returnMovements.count,
          resultsLength: returnMovements.results?.length || 0
        })
        
        const mappedReturns = (returnMovements.results || []).map((m: any) => {
          const productName = m.product_name || 
                             (typeof m.product === 'string' ? m.product : m.product?.name) || 
                             "N/A"
          
          const userName = m.user_name || 
                          (typeof m.user === 'string' ? m.user : m.user?.name) || 
                          (m.user?.email || "System")
          
          const outletName = m.outlet_name || 
                            (typeof m.outlet === 'object' 
                              ? (m.outlet?.name || "N/A")
                              : (typeof m.outlet === 'string' || typeof m.outlet === 'number')
                              ? String(m.outlet)
                              : "N/A")
          
          const dateValue = m.created_at || m.date || new Date().toISOString()
          
          // Determine return type based on reason or reference
          const reason = m.reason || ""
          const isCustomerReturn = reason.toLowerCase().includes('refund') || 
                                  reason.toLowerCase().includes('customer') ||
                                  reason.toLowerCase().includes('return')
          const isSupplierReturn = reason.toLowerCase().includes('supplier') ||
                                  reason.toLowerCase().includes('purchase return')
          
          return {
            id: String(m.id),
            date: dateValue,
            product: productName,
            outlet: outletName,
            reason: reason || "Return",
            quantity: Number(m.quantity) || 0,
            user: userName,
            returnType: isSupplierReturn ? "supplier" : isCustomerReturn ? "customer" : "other",
            referenceId: m.reference_id || "",
          }
        })
        
        // Sort by date (newest first)
        mappedReturns.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        
        setReturns(mappedReturns)
      } else {
        setReturns([])
      }
    } catch (error) {
      console.error("Failed to load returns:", error)
      setReturns([])
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness?.id, useReal])

  useEffect(() => {
    if (currentBusiness) {
      loadReturns()
      
      const handleOutletChange = () => {
        loadReturns()
      }
      window.addEventListener("outlet-changed", handleOutletChange)
      
      return () => {
        window.removeEventListener("outlet-changed", handleOutletChange)
      }
    }
  }, [currentBusiness?.id, loadReturns])

  const getReturnTypeBadge = (returnType: string) => {
    switch (returnType) {
      case "customer":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <ArrowUp className="h-3 w-3 mr-1" />
            Customer Return
          </Badge>
        )
      case "supplier":
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
            <ArrowDown className="h-3 w-3 mr-1" />
            Supplier Return
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            Return
          </Badge>
        )
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Stock Returns</h1>
            <p className="text-muted-foreground">Track product returns from customers and to suppliers</p>
          </div>
          <Button onClick={() => {
            // TODO: Open return modal
            console.log("Create return - to be implemented")
          }}>
            <Plus className="mr-2 h-4 w-4" />
            New Return
          </Button>
        </div>

        {/* Explanation Card */}
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <RotateCcw className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">What are Stock Returns?</h3>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Stock returns happen when products come back to your store. There are two main types:
                </p>
                <div className="mt-3 space-y-2 text-sm text-orange-800 dark:text-orange-200">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                    <p className="font-medium flex items-center gap-2">
                      <ArrowUp className="h-4 w-4" />
                      Customer Returns (Stock Increases)
                    </p>
                    <p className="text-xs mt-1 ml-6">
                      When customers bring back products they bought. Your stock goes up because you get the items back.
                    </p>
                  </div>
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded">
                    <p className="font-medium flex items-center gap-2">
                      <ArrowDown className="h-4 w-4" />
                      Supplier Returns (Stock Decreases)
                    </p>
                    <p className="text-xs mt-1 ml-6">
                      When you send products back to suppliers (damaged, wrong items, etc.). Your stock goes down.
                    </p>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-900/30 rounded text-xs text-orange-900 dark:text-orange-200">
                  <p className="font-medium">💡 Tip:</p>
                  <p>Always record returns to keep your inventory counts accurate. Customer returns add stock, supplier returns remove stock.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Returns History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Return History</CardTitle>
            <CardDescription>
              View all product returns - both from customers and to suppliers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">Loading returns...</p>
                    </TableCell>
                  </TableRow>
                ) : returns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">No returns found</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Returns will appear here when customers return products or you return items to suppliers
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  returns.map((returnItem) => (
                    <TableRow key={returnItem.id}>
                      <TableCell>
                        {returnItem.date 
                          ? new Date(returnItem.date).toLocaleDateString() 
                          : "N/A"}
                      </TableCell>
                      <TableCell className="font-medium">{returnItem.product || "N/A"}</TableCell>
                      <TableCell>{returnItem.outlet || "N/A"}</TableCell>
                      <TableCell>
                        {getReturnTypeBadge(returnItem.returnType)}
                      </TableCell>
                      <TableCell className={
                        returnItem.returnType === "customer" 
                          ? "text-green-600 font-semibold" 
                          : returnItem.returnType === "supplier"
                          ? "text-red-600 font-semibold"
                          : "font-semibold"
                      }>
                        {returnItem.returnType === "customer" ? "+" : ""}
                        {returnItem.quantity}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={returnItem.reason}>
                        {returnItem.reason || "Return"}
                      </TableCell>
                      <TableCell>{returnItem.user || "System"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

