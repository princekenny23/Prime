"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
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
import { FilterableTabs, TabsContent, type TabConfig } from "@/components/ui/filterable-tabs"
import { NewReturnModal } from "@/components/modals/new-return-modal"
import { Plus, RotateCcw, ArrowDown, ArrowUp, Building2, Users, Truck } from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { returnService, type Return, type ReturnType } from "@/lib/services/returnService"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

export default function StockReturnsPage() {
  const { currentBusiness, currentOutlet } = useBusinessStore()
  const { outlets } = useTenant()
  const { toast } = useToast()
  const [returns, setReturns] = useState<Return[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ReturnType>("customer")
  const [showNewReturnModal, setShowNewReturnModal] = useState(false)

  const loadReturns = useCallback(async () => {
    if (!currentBusiness || !currentOutlet) {
      setReturns([])
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    try {
      const response = await returnService.list({
        return_type: activeTab,
        outlet: String(currentOutlet.id),
      })
      setReturns(response.results || [])
    } catch (error) {
      console.error("Failed to load returns:", error)
      toast({
        title: "Error",
        description: "Failed to load returns. Please try again.",
        variant: "destructive",
      })
      setReturns([])
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness, currentOutlet, activeTab, toast])

  useEffect(() => {
    if (currentBusiness && currentOutlet) {
      loadReturns()
      
      const handleOutletChange = () => {
        loadReturns()
      }
      window.addEventListener("outlet-changed", handleOutletChange)
      
      return () => {
        window.removeEventListener("outlet-changed", handleOutletChange)
      }
    }
  }, [currentBusiness, currentOutlet, loadReturns])

  // Calculate stats for tabs
  const stats = useMemo(() => {
    const customerCount = returns.filter(r => r.return_type === "customer").length
    const supplierCount = returns.filter(r => r.return_type === "supplier").length
    const outletCount = returns.filter(r => r.return_type === "outlet").length
    
    return { customerCount, supplierCount, outletCount }
  }, [returns])

  // Tab configuration
  const tabsConfig: TabConfig[] = useMemo(() => [
    {
      value: "customer",
      label: "Customer Returns",
      icon: Users,
      badgeCount: stats.customerCount > 0 ? stats.customerCount : undefined,
      badgeVariant: "secondary",
    },
    {
      value: "outlet",
      label: "Outlet Returns",
      icon: Building2,
      badgeCount: stats.outletCount > 0 ? stats.outletCount : undefined,
      badgeVariant: "secondary",
    },
    {
      value: "supplier",
      label: "Supplier Returns",
      icon: Truck,
      badgeCount: stats.supplierCount > 0 ? stats.supplierCount : undefined,
      badgeVariant: "destructive",
    },
  ], [stats])

  // Filter returns by active tab
  const filteredReturns = useMemo(() => {
    return returns.filter(r => r.return_type === activeTab)
  }, [returns, activeTab])

  const getReturnTypeBadge = (returnType: ReturnType) => {
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
      case "outlet":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            <Building2 className="h-3 w-3 mr-1" />
            Outlet Return
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

  const formatCurrency = (amount: string | number | undefined) => {
    if (!amount) return "0.00"
    const num = typeof amount === "string" ? parseFloat(amount) : amount
    return `${currentBusiness?.currencySymbol || "MWK"} ${num.toFixed(2)}`
  }

  return (
    <DashboardLayout>
      <PageLayout
        title="Stock Returns"
        description="Track product returns from customers, outlets, and to suppliers"
        actions={
          <Button 
            onClick={() => setShowNewReturnModal(true)}
            className="bg-white border-white text-[#1e3a8a] hover:bg-blue-50 hover:border-blue-50"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Return
          </Button>
        }
        noPadding={true}
      >
        {/* Explanation Card */}
        <div className="px-6 py-4 mb-6 rounded-lg border border-orange-200 bg-orange-50">
          <div className="flex items-start gap-3">
            <RotateCcw className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-orange-900">What are Stock Returns?</h3>
              <p className="text-sm text-orange-800">
                Stock returns happen when products come back to your store. There are three main types:
              </p>
              <div className="mt-3 space-y-2 text-sm text-orange-800">
                <div className="p-2 bg-green-100 rounded">
                  <p className="font-medium flex items-center gap-2">
                    <ArrowUp className="h-4 w-4" />
                    Customer Returns (Stock Increases)
                  </p>
                  <p className="text-xs mt-1 ml-6">
                    When customers bring back products they bought. Your stock goes up because you get the items back.
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded">
                  <p className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Outlet Returns (Stock Transfers)
                  </p>
                  <p className="text-xs mt-1 ml-6">
                    When products are returned between outlets. Stock moves from one outlet to another.
                  </p>
                </div>
                <div className="p-2 bg-orange-100 rounded">
                  <p className="font-medium flex items-center gap-2">
                    <ArrowDown className="h-4 w-4" />
                    Supplier Returns (Stock Decreases)
                  </p>
                  <p className="text-xs mt-1 ml-6">
                    When you send products back to suppliers (damaged, wrong items, etc.). Your stock goes down.
                  </p>
                </div>
              </div>
              <div className="mt-3 p-2 bg-orange-100 rounded text-xs text-orange-900">
                <p className="font-medium">💡 Tip:</p>
                <p>Always record returns to keep your inventory counts accurate. Customer returns add stock, supplier returns remove stock, and outlet returns transfer stock between locations.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="px-6 pt-4 border-b border-gray-300">
          <FilterableTabs
            tabs={tabsConfig}
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as ReturnType)}
          >
            {/* Customer Returns Tab */}
            <TabsContent value="customer" className="mt-0">
              <div className="px-6 py-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Customer Returns</h3>
                  <p className="text-sm text-gray-600">
                    {filteredReturns.length} customer return{filteredReturns.length !== 1 ? "s" : ""} found
                  </p>
                </div>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-gray-600">Loading returns...</p>
                  </div>
                ) : filteredReturns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <RotateCcw className="h-12 w-12 text-gray-500 mb-4" />
                    <p className="text-gray-600">No customer returns found</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Customer returns will appear here when products are returned by customers
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-md border border-gray-300 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-gray-900 font-semibold">Return #</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Date</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Sale</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Items</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Quantity</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Reason</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReturns.map((returnItem) => (
                          <TableRow key={returnItem.id} className="border-gray-300">
                            <TableCell className="font-medium">
                              {returnItem.return_number || `RET-${returnItem.id}`}
                            </TableCell>
                            <TableCell>
                              {returnItem.date 
                                ? format(new Date(returnItem.date), "MMM dd, yyyy")
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {returnItem.sale_id ? (
                                <span className="text-sm">Sale #{returnItem.sale_id}</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {returnItem.items?.slice(0, 2).map((item, idx) => (
                                  <div key={idx} className="text-sm">
                                    {item.product_name || "Product"} x{item.quantity}
                                  </div>
                                ))}
                                {returnItem.items && returnItem.items.length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{returnItem.items.length - 2} more
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-green-600 font-semibold">
                              +{returnItem.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                            </TableCell>
                            <TableCell className="max-w-xs truncate" title={returnItem.reason}>
                              {returnItem.reason || "Return"}
                            </TableCell>
                            <TableCell>
                              {getReturnTypeBadge(returnItem.return_type)}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="border-gray-300">View</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Outlet Returns Tab */}
            <TabsContent value="outlet" className="mt-0">
              <div className="px-6 py-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Outlet Returns</h3>
                  <p className="text-sm text-gray-600">
                    {filteredReturns.length} outlet return{filteredReturns.length !== 1 ? "s" : ""} found
                  </p>
                </div>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-gray-600">Loading returns...</p>
                  </div>
                ) : filteredReturns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Building2 className="h-12 w-12 text-gray-500 mb-4" />
                    <p className="text-gray-600">No outlet returns found</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Outlet returns will appear here when products are returned between outlets
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-md border border-gray-300 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-gray-900 font-semibold">Return #</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Date</TableHead>
                          <TableHead className="text-gray-900 font-semibold">From Outlet</TableHead>
                          <TableHead className="text-gray-900 font-semibold">To Outlet</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Items</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Quantity</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Reason</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReturns.map((returnItem) => (
                          <TableRow key={returnItem.id} className="border-gray-300">
                            <TableCell className="font-medium">
                              {returnItem.return_number || `RET-${returnItem.id}`}
                            </TableCell>
                            <TableCell>
                              {returnItem.date 
                                ? format(new Date(returnItem.date), "MMM dd, yyyy")
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {returnItem.from_outlet?.name || returnItem.from_outlet_id || "N/A"}
                            </TableCell>
                            <TableCell>
                              {returnItem.to_outlet?.name || returnItem.to_outlet_id || "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {returnItem.items?.slice(0, 2).map((item, idx) => (
                                  <div key={idx} className="text-sm">
                                    {item.product_name || "Product"} x{item.quantity}
                                  </div>
                                ))}
                                {returnItem.items && returnItem.items.length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{returnItem.items.length - 2} more
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {returnItem.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                            </TableCell>
                            <TableCell className="max-w-xs truncate" title={returnItem.reason}>
                              {returnItem.reason || "Return"}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="border-gray-300">View</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Supplier Returns Tab */}
            <TabsContent value="supplier" className="mt-0">
              <div className="px-6 py-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Supplier Returns</h3>
                  <p className="text-sm text-gray-600">
                    {filteredReturns.length} supplier return{filteredReturns.length !== 1 ? "s" : ""} found
                  </p>
                </div>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-gray-600">Loading returns...</p>
                  </div>
                ) : filteredReturns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Truck className="h-12 w-12 text-gray-500 mb-4" />
                    <p className="text-gray-600">No supplier returns found</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Supplier returns will appear here when products are returned to suppliers
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-md border border-gray-300 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-gray-900 font-semibold">Return #</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Date</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Supplier</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Items</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Quantity</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Total</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                          <TableHead className="text-gray-900 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReturns.map((returnItem) => (
                          <TableRow key={returnItem.id} className="border-gray-300">
                            <TableCell className="font-medium">
                              {returnItem.return_number || `RET-${returnItem.id}`}
                            </TableCell>
                            <TableCell>
                              {returnItem.date 
                                ? format(new Date(returnItem.date), "MMM dd, yyyy")
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {returnItem.supplier?.name || "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {returnItem.items?.slice(0, 2).map((item, idx) => (
                                  <div key={idx} className="text-sm">
                                    {item.product_name || "Product"} x{item.quantity}
                                  </div>
                                ))}
                                {returnItem.items && returnItem.items.length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{returnItem.items.length - 2} more
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-red-600 font-semibold">
                              -{returnItem.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(returnItem.total)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={returnItem.status === "returned" ? "default" : "secondary"}>
                                {returnItem.status || "Draft"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="border-gray-300">View</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
          </FilterableTabs>
        </div>
      </PageLayout>

      {/* New Return Modal */}
      <NewReturnModal
        open={showNewReturnModal}
        onOpenChange={setShowNewReturnModal}
        onReturnCreated={() => {
          loadReturns()
          setShowNewReturnModal(false)
        }}
      />
    </DashboardLayout>
  )
}
