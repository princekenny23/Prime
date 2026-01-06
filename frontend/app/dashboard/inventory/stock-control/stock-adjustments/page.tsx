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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { AlertCircle, Info, Plus, ArrowUpDown, Upload } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { inventoryService } from "@/lib/services/inventoryService"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"
import { useToast } from "@/components/ui/use-toast"
import { StockAdjustmentModal } from "@/components/modals/stock-adjustment-modal"

export default function StockAdjustmentsPage() {
  const { toast } = useToast()
  const { currentBusiness, currentOutlet } = useBusinessStore()
  const [showImportModal, setShowImportModal] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
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
        const filterParams: any = {
          movement_type: "adjustment",
        }
        
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
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness?.id, currentOutlet?.id, useReal])

  useEffect(() => {
    if (currentBusiness) {
      console.log("useEffect triggered - loading adjustments", {
        currentBusinessId: currentBusiness.id,
        adjustmentsCount: adjustments.length
      })
      loadAdjustments()
      
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
  
  useEffect(() => {
    console.log("Adjustments state changed:", {
      count: adjustments.length,
      isLoading,
      adjustments: adjustments
    })
  }, [adjustments, isLoading])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const fileName = selectedFile.name.toLowerCase()
      
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel (.xlsx, .xls) or CSV (.csv) file.",
          variant: "destructive",
        })
        return
      }
      
      setImportFile(selectedFile)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to import.",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    try {
      // TODO: Implement stock adjustment import API call
      toast({
        title: "Import Feature",
        description: "Stock adjustment import functionality will be implemented soon.",
      })
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setShowImportModal(false)
      setImportFile(null)
    } catch (error: any) {
      console.error("Failed to import adjustments:", error)
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import adjustments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <DashboardLayout>
      <PageLayout
        title="Stock Adjustments"
        description="Adjust inventory levels manually"
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowImportModal(true)}
              className="bg-white border-white text-[#1e3a8a] hover:bg-blue-50 hover:border-blue-50"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Adjustments
            </Button>
            <Button 
              onClick={() => setShowAdjustmentModal(true)}
              className="bg-white border-white text-[#1e3a8a] hover:bg-blue-50 hover:border-blue-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Adjustment
            </Button>
          </div>
        }
      >
        {/* Explanation Card */}
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-900 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900">What is Stock Adjustment?</h3>
              <p className="text-sm text-blue-800">
                Stock adjustment lets you fix inventory counts when they don't match reality. 
                For example, if you count 50 items but the system shows 45, you can add 5 items. 
                Or if you find damaged items, you can remove them from stock.
              </p>
              <div className="mt-3 space-y-1 text-sm text-blue-800">
                <p className="font-medium">Common reasons for adjustments:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Found items that were not recorded</li>
                  <li>Items damaged, lost, or stolen</li>
                  <li>Counting errors that need correction</li>
                  <li>Items returned by customers</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Adjustment History Table */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Adjustment History</h3>
            <p className="text-sm text-gray-600">
              Track all manual stock adjustments made to your inventory
            </p>
          </div>
          <div className="rounded-md border border-gray-300 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-gray-900 font-semibold">Date</TableHead>
                  <TableHead className="text-gray-900 font-semibold">Product</TableHead>
                  <TableHead className="text-gray-900 font-semibold">Outlet</TableHead>
                  <TableHead className="text-gray-900 font-semibold">Reason</TableHead>
                  <TableHead className="text-gray-900 font-semibold">Quantity</TableHead>
                  <TableHead className="text-gray-900 font-semibold">User</TableHead>
                  <TableHead className="text-gray-900 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-gray-600">Loading adjustments...</p>
                    </TableCell>
                  </TableRow>
                ) : adjustments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-gray-600">No adjustments found</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Create your first adjustment to get started
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  adjustments.map((adjustment) => {
                    console.log("Rendering adjustment:", adjustment)
                    return (
                      <TableRow key={adjustment.id} className="border-gray-300">
                        <TableCell>
                          {adjustment.date 
                            ? new Date(adjustment.date).toLocaleDateString() 
                            : "N/A"}
                        </TableCell>
                        <TableCell className="font-medium">{adjustment.product || "N/A"}</TableCell>
                        <TableCell>{adjustment.outlet || "N/A"}</TableCell>
                        <TableCell>{adjustment.reason || "Adjustment"}</TableCell>
                        <TableCell className={adjustment.quantity > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
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
          </div>
        </div>
      </PageLayout>

      {/* Import Adjustments Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Stock Adjustments</DialogTitle>
            <DialogDescription>
              Upload an Excel or CSV file to import multiple stock adjustments at once.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>File (Excel or CSV)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  {importFile ? importFile.name : "No file selected"}
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="adjustment-file-upload"
                />
                <Label htmlFor="adjustment-file-upload">
                  <Button variant="outline" asChild>
                    <span>Choose File</span>
                  </Button>
                </Label>
              </div>
            </div>

            <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-3 text-sm text-blue-900 dark:text-blue-200">
              <p className="font-medium mb-1">File Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Product SKU or Barcode</li>
                <li>Adjustment Quantity (positive to add, negative to remove)</li>
                <li>Reason for adjustment</li>
                <li>Outlet (optional)</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportModal(false)
                setImportFile(null)
              }}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importFile || isImporting}>
              {isImporting ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        open={showAdjustmentModal}
        onOpenChange={setShowAdjustmentModal}
        onSuccess={() => {
          loadAdjustments()
        }}
      />
    </DashboardLayout>
  )
}
