"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Search,
  Menu,
  CalendarIcon,
  Download,
  Eye,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import { receiptService } from "@/lib/services/receiptService"
import { useToast } from "@/components/ui/use-toast"
import { format, subDays } from "date-fns"
import { useRouter } from "next/navigation"

interface ReceiptDetail {
  id: string
  number?: string
  sale_id?: string
  format?: "pdf" | "escpos" | "json" | string
  created_at?: string
  createdAt?: string
  sent_at?: string
  access_count?: number
  _raw?: any
}

export default function ReceiptsPage() {
  const router = useRouter()
  const { currentBusiness } = useBusinessStore()
  const { currentOutlet } = useTenant()
  const { toast } = useToast()

  const [receipts, setReceipts] = useState<ReceiptDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [isDownloading, setIsDownloading] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewIsPdf, setPreviewIsPdf] = useState<boolean>(true)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptDetail | null>(null)

  // Load receipts
  const loadReceipts = useCallback(async () => {
    if (!currentBusiness || !currentOutlet) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const filters: any = {
        outlet: currentOutlet.id,
      }
      
      if (dateRange.from) {
        filters.date_from = format(dateRange.from, "yyyy-MM-dd")
      }
      if (dateRange.to) {
        filters.date_to = format(dateRange.to, "yyyy-MM-dd")
      }

      const response = await receiptService.list(filters)
      const receiptsData = response.results || []

      const enrichedReceipts = receiptsData.map((receipt: any) => {
        const receiptDetail: ReceiptDetail = { ...receipt, _raw: receipt._raw || receipt }
        return receiptDetail
      })

      setReceipts(enrichedReceipts)
    } catch (error: any) {
      console.error("Failed to load receipts:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load receipts",
        variant: "destructive",
      })
      setReceipts([])
    } finally {
      setIsLoading(false)
    }
  }, [currentBusiness, currentOutlet, dateRange, toast])

  useEffect(() => {
    loadReceipts()
  }, [loadReceipts])

  const filteredReceipts = useMemo(() => {
    let filtered = receipts
    if (searchTerm) {
      filtered = filtered.filter((receipt) => {
        const receiptNum = receipt._raw?.receipt_number || receipt.number || receipt.id
        const saleId = receipt._raw?.sale_id || receipt.sale_id || ""
        return (
          receiptNum.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          saleId.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }
    return filtered
  }, [receipts, searchTerm])

  const handleDownloadReceipt = async (receipt: ReceiptDetail) => {
    setIsDownloading(true)
    try {
      const { data, contentType } = await receiptService.download(receipt.id)

      const isPdf = contentType?.includes("pdf") || (receipt._raw?.format || receipt.format) === "pdf"
      const mimeType = isPdf ? "application/pdf" : "text/plain"
      const extension = isPdf ? "pdf" : "txt"

      const blob = new Blob([data], { type: mimeType })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Receipt-${receipt._raw?.receipt_number || receipt.number || receipt.id}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Receipt downloaded successfully",
      })
    } catch (error: any) {
      console.error("Failed to download receipt:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to download receipt",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleViewReceipt = async (receipt: ReceiptDetail) => {
    setIsPreviewLoading(true)
    setSelectedReceipt(receipt)
    try {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl)
      }
      const { data, contentType } = await receiptService.download(receipt.id)
      const isPdf = contentType?.includes("pdf") || (receipt._raw?.format || receipt.format) === "pdf"
      const blob = new Blob([data], { type: isPdf ? "application/pdf" : "text/plain" })
      const url = window.URL.createObjectURL(blob)
      setPreviewUrl(url)
      setPreviewIsPdf(isPdf)
      setIsPreviewOpen(true)
    } catch (error: any) {
      console.error("Failed to view receipt:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to view receipt",
        variant: "destructive",
      })
    } finally {
      setIsPreviewLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="px-6 pt-4 pb-2">
        <h2 className="text-xl font-semibold text-gray-900">Receipts</h2>
      </div>

        <div className="px-6 py-4 border-b border-gray-300">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by receipt number or sale ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white border-white text-[#1e3a8a] hover:bg-blue-50">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to
                    ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                    : "Select date range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to,
                  }}
                  onSelect={(range) => {
                    setDateRange({
                      from: range?.from,
                      to: range?.to,
                    })
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="px-6 py-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-600">Loading receipts...</div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No receipts found</div>
          ) : (
            <div className="rounded-md border border-gray-300 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-gray-900 font-semibold">Receipt #</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Sale ID</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Format</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Generated</TableHead>
                    <TableHead className="text-gray-900 font-semibold">Sent</TableHead>
                    <TableHead className="text-center text-gray-900 font-semibold">Access Count</TableHead>
                    <TableHead className="text-right text-gray-900 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.map((receipt) => (
                    <TableRow key={receipt.id} className="border-gray-300">
                      <TableCell className="font-medium">
                        {receipt._raw?.receipt_number || receipt.number || receipt.id.slice(-6)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {receipt._raw?.sale_id || receipt.sale_id || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {(receipt._raw?.format || receipt.format || "PDF").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {((receipt as any).created_at || receipt.createdAt) 
                          ? format(new Date((receipt as any).created_at || receipt.createdAt), "MMM dd, yyyy HH:mm")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {((receipt as any).sent_at || receipt.sent_at) ? (
                          <Badge variant="default">
                            {format(new Date((receipt as any).sent_at || receipt.sent_at), "MMM dd, yyyy")}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Not Sent</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {receipt._raw?.access_count || receipt.access_count || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="border-gray-300">
                              <Menu className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleViewReceipt(receipt)}
                              disabled={isDownloading}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDownloadReceipt(receipt)}
                              disabled={isDownloading}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

      <Dialog open={isPreviewOpen} onOpenChange={(open) => {
        setIsPreviewOpen(open)
        if (!open && previewUrl) {
          window.URL.revokeObjectURL(previewUrl)
          setPreviewUrl(null)
          setSelectedReceipt(null)
        }
      }}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Receipt Preview {selectedReceipt ? `- ${selectedReceipt._raw?.receipt_number || selectedReceipt.number || selectedReceipt.id}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 h-full">
            {isPreviewLoading && (
              <div className="flex-1 flex items-center justify-center text-gray-600">Loading receipt...</div>
            )}
            {!isPreviewLoading && previewUrl && (
              previewIsPdf ? (
                <iframe src={previewUrl} className="flex-1 w-full border rounded" title="Receipt PDF Preview" />
              ) : (
                <div className="flex-1 overflow-auto border rounded bg-gray-50 p-3 text-sm text-gray-800 whitespace-pre-wrap">
                  <iframe src={previewUrl} className="w-full h-full" title="Receipt Text Preview" />
                </div>
              )
            )}
            <div className="flex justify-end gap-2">
              {selectedReceipt && (
                <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt(selectedReceipt)} disabled={isDownloading}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
