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
import { Upload, FileText, Download, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { productService } from "@/lib/services/productService"

interface ImportProductsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ImportProductsModal({ open, onOpenChange, onSuccess }: ImportProductsModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const fileName = selectedFile.name.toLowerCase()
      
      // Validate file type
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel (.xlsx, .xls) or CSV (.csv) file.",
          variant: "destructive",
        })
        return
      }
      
      setFile(selectedFile)
      setImportResult(null) // Clear previous results
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a file to import.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setImportResult(null)

    try {
      const result = await productService.bulkImport(file)
      setImportResult(result)
      
      if (result.success) {
        const message = result.imported > 0
          ? `${result.imported} product${result.imported !== 1 ? 's' : ''} imported successfully${result.failed > 0 ? `, ${result.failed} failed` : ''}`
          : "Import completed with errors"
        
        toast({
          title: result.imported > 0 ? "Import Successful" : "Import Completed",
          description: message,
          variant: result.imported > 0 ? "default" : "destructive",
        })
        
        if (result.imported > 0 && onSuccess) {
          onSuccess()
        }
      } else {
        toast({
          title: "Import Failed",
          description: "Failed to import products. Please check the errors.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Import error:", error)
      toast({
        title: "Import Error",
        description: error.message || "Failed to import products. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Products</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to import multiple products at once. Categories will be created automatically if they don't exist.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>File (Excel or CSV)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                {file ? file.name : "No file selected"}
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>Choose File</span>
                </Button>
              </Label>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="text-sm space-y-1">
                <p className="font-medium">File Format Requirements:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><strong>Required columns:</strong> Name, Price</li>
                  <li><strong>Optional columns:</strong> Stock, Unit, SKU, Category, Barcode, Cost, Description, Low Stock Threshold, Is Active</li>
                  <li>First row should contain headers</li>
                  <li>Categories will be auto-created if they don't exist</li>
                  <li>SKU will be auto-generated if not provided</li>
                  <li>Maximum 1000 products per import</li>
                </ul>
              </div>
            </div>
          </div>

          {importResult && (
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                {importResult.imported > 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <p className="font-medium">
                  Import Results
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Rows:</span>
                  <span className="ml-2 font-medium">{importResult.total_rows}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Imported:</span>
                  <span className="ml-2 font-medium text-green-600">{importResult.imported}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Failed:</span>
                  <span className="ml-2 font-medium text-red-600">{importResult.failed}</span>
                </div>
                {importResult.categories_created > 0 && (
                  <div>
                    <span className="text-muted-foreground">Categories Created:</span>
                    <span className="ml-2 font-medium text-blue-600">{importResult.categories_created}</span>
                  </div>
                )}
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-red-600 mb-2">Errors:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResult.errors.slice(0, 5).map((error: any, idx: number) => (
                      <div key={idx} className="text-xs text-muted-foreground">
                        Row {error.row}: {error.product_name} - {error.error}
                      </div>
                    ))}
                    {importResult.errors.length > 5 && (
                      <div className="text-xs text-muted-foreground">
                        ... and {importResult.errors.length - 5} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}

              {importResult.warnings && importResult.warnings.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-yellow-600 mb-2">Warnings:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResult.warnings.slice(0, 5).map((warning: any, idx: number) => (
                      <div key={idx} className="text-xs text-muted-foreground">
                        Row {warning.row}: {warning.warning}
                      </div>
                    ))}
                    {importResult.warnings.length > 5 && (
                      <div className="text-xs text-muted-foreground">
                        ... and {importResult.warnings.length - 5} more warnings
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button variant="outline" className="w-full" disabled>
            <Download className="mr-2 h-4 w-4" />
            Download Sample Template (Coming Soon)
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            onOpenChange(false)
            setFile(null)
            setImportResult(null)
          }}>
            {importResult ? "Close" : "Cancel"}
          </Button>
          <Button onClick={handleImport} disabled={!file || isLoading}>
            {isLoading ? "Importing..." : "Import Products"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

