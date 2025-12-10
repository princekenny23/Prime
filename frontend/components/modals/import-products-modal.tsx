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
import { Upload, FileText, Download, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { productService } from "@/lib/services/productService"
import { useBusinessStore } from "@/stores/businessStore"
import {
  getFieldsForBusinessType,
  getRequiredFields,
  getOptionalFields,
  getBusinessSpecificFields,
  type BusinessType,
} from "@/lib/utils/excel-import-fields"
import { Badge } from "@/components/ui/badge"
// Accordion component - using collapsible divs instead

interface ImportProductsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ImportProductsModal({ open, onOpenChange, onSuccess }: ImportProductsModalProps) {
  const { toast } = useToast()
  const { currentBusiness } = useBusinessStore()
  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<any>(null)
  
  const businessType = currentBusiness?.type as BusinessType
  const allFields = getFieldsForBusinessType(businessType)
  const requiredFields = getRequiredFields(businessType)
  const optionalFields = getOptionalFields(businessType)
  const businessSpecificFields = getBusinessSpecificFields(businessType)

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

  const handleDownloadTemplate = () => {
    if (!businessType) {
      toast({
        title: "No Business Type",
        description: "Please ensure you have a business selected.",
        variant: "destructive",
      })
      return
    }

    // Create CSV template with headers
    const headers = allFields.map(f => f.name)
    const csvContent = headers.join(",") + "\n"
    
    // Add sample row based on business type
    const sampleRow: string[] = []
    allFields.forEach(field => {
      if (field.required) {
        sampleRow.push(field.example || "")
      } else {
        sampleRow.push("")
      }
    })
    const csvWithSample = csvContent + sampleRow.join(",") + "\n"
    
    // Create blob and download
    const blob = new Blob([csvWithSample], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `product-import-template-${businessType?.replace(/\s+/g, "-") || "all"}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Template Downloaded",
      description: "Sample template CSV file has been downloaded.",
    })
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

          <div className="space-y-4">
            {/* Business Type Info */}
            {businessType && (
              <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">
                    Importing for: <Badge variant="outline">{businessType}</Badge>
                  </p>
                </div>
              </div>
            )}

            {/* Field Requirements */}
            <div className="border rounded-lg">
              <details className="group">
                <summary className="flex items-center justify-between p-3 cursor-pointer text-sm font-medium hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    View Required & Optional Fields
                  </div>
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="p-4 pt-0 border-t">
                  <div className="space-y-4 pt-2">
                    {/* Required Fields */}
                    <div>
                      <p className="text-sm font-semibold mb-2 text-green-700 dark:text-green-400">
                        ✅ Required Columns:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {requiredFields.map((field) => (
                          <div key={field.name} className="text-xs bg-green-50 dark:bg-green-950/20 p-2 rounded">
                            <span className="font-medium">{field.label}</span>
                            <span className="text-muted-foreground ml-1">({field.name})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Universal Optional Fields */}
                    <div>
                      <p className="text-sm font-semibold mb-2">⚠️ Universal Optional Columns:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {optionalFields
                          .filter(f => !businessSpecificFields.some(bsf => bsf.name === f.name))
                          .map((field) => (
                            <div key={field.name} className="text-xs bg-muted p-2 rounded">
                              <div className="font-medium">{field.label}</div>
                              <div className="text-muted-foreground text-[10px] mt-0.5">
                                {field.name} - {field.description}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Business-Specific Fields */}
                    {businessSpecificFields.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2 text-blue-700 dark:text-blue-400">
                          🎯 {businessType} Specific Columns:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {businessSpecificFields.map((field) => (
                            <div key={field.name} className="text-xs bg-blue-50 dark:bg-blue-950/20 p-2 rounded border border-blue-200 dark:border-blue-800">
                              <div className="font-medium">{field.label}</div>
                              <div className="text-muted-foreground text-[10px] mt-0.5">
                                {field.name} - {field.description}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-1">
                                Example: {field.example}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            </div>

            {/* Quick Info */}
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p>• First row should contain headers</p>
                  <p>• Categories will be auto-created if they don't exist</p>
                  <p>• SKU will be auto-generated if not provided</p>
                  <p>• Empty variation_name creates a "Default" variation</p>
                  <p>• Maximum 1000 products per import</p>
                </div>
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

          <Button
            variant="outline"
            className="w-full"
            onClick={handleDownloadTemplate}
            disabled={!businessType}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Sample Template
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

