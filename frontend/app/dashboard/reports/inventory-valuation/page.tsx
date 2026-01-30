"use client"

import { useState, useEffect, useRef } from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { 
  Download, 
  FileSpreadsheet, 
  Printer,
  RefreshCw,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Search
} from "lucide-react"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import { useI18n } from "@/contexts/i18n-context"
import { reportService, InventoryValuationReport, InventoryValuationItem } from "@/lib/services/reportService"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

export default function InventoryValuationReportPage() {
  const { currentBusiness } = useBusinessStore()
  const { currentOutlet } = useTenant()
  const { t } = useI18n()
  const { toast } = useToast()
  
  const [reportData, setReportData] = useState<InventoryValuationReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const now = new Date()
    return format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd')
  })
  const [endDate, setEndDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  
  const tableRef = useRef<HTMLDivElement>(null)

  const loadReport = async () => {
    if (!currentBusiness || !currentOutlet) return
    
    setIsLoading(true)
    try {
      const data = await reportService.getInventoryValuation({
        outlet: String(currentOutlet.id),
        start_date: startDate,
        end_date: endDate,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
      })
      setReportData(data)
    } catch (error) {
      console.error("Failed to load inventory valuation report:", error)
      toast({
        title: t("common.messages.error"),
        description: "Failed to load inventory valuation report",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBusiness, currentOutlet])

  const handleApplyFilters = () => {
    loadReport()
  }

  const filteredItems = reportData?.items.filter(item => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      item.name.toLowerCase().includes(search) ||
      item.code.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search)
    )
  }) || []

  const formatCurrency = (value: number) => {
    return `${currentBusiness?.currencySymbol || "MK"} ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatNumber = (value: number) => {
    return value.toLocaleString('en-US')
  }

  const handleExportCSV = () => {
    if (!reportData) return

    const headers = [
      "Code", "Item", "Retail Price", "Category",
      "Open", "Open V.", "Received", "Received V.",
      "Transferred", "Transferred V.", "Adjusted", "Adjusted V.",
      "Sold", "Sold V.", "Stock", "Stock V.",
      "Counted", "Counted V.", "Discrepancy",
      "Surplus", "Surplus V.", "Shortage", "Shortage V."
    ]

    const rows = filteredItems.map(item => [
      item.code,
      item.name,
      item.retail_price,
      item.category,
      item.open_qty,
      item.open_value,
      item.received_qty,
      item.received_value,
      item.transferred_qty,
      item.transferred_value,
      item.adjusted_qty,
      item.adjusted_value,
      item.sold_qty,
      item.sold_value,
      item.stock_qty,
      item.stock_value,
      item.counted_qty,
      item.counted_value,
      item.discrepancy,
      item.surplus_qty,
      item.surplus_value,
      item.shortage_qty,
      item.shortage_value
    ])

    // Add totals row
    if (reportData.totals) {
      rows.push([
        "TOTALS", "", "", "",
        reportData.totals.open_qty,
        reportData.totals.open_value,
        reportData.totals.received_qty,
        reportData.totals.received_value,
        reportData.totals.transferred_qty,
        reportData.totals.transferred_value,
        reportData.totals.adjusted_qty,
        reportData.totals.adjusted_value,
        reportData.totals.sold_qty,
        reportData.totals.sold_value,
        reportData.totals.stock_qty,
        reportData.totals.stock_value,
        reportData.totals.counted_qty,
        reportData.totals.counted_value,
        reportData.totals.discrepancy,
        reportData.totals.surplus_qty,
        reportData.totals.surplus_value,
        reportData.totals.shortage_qty,
        reportData.totals.shortage_value
      ])
    }

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `inventory-valuation-${startDate}-to-${endDate}.csv`
    link.click()

    toast({
      title: "Export Complete",
      description: "Report exported to CSV successfully",
    })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <DashboardLayout>
      <PageLayout
        title={t("reports.menu.inventory")}
        description="Comprehensive stock valuation with movements, discrepancies, and values"
      >
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t("common.filters")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>{t("time.from")}</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("time.to")}</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.category")}</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("common.all_categories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all_categories")}</SelectItem>
                    {reportData?.categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("common.search")}</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2 flex items-end gap-2">
                <Button onClick={handleApplyFilters} disabled={isLoading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  {t("common.actions.apply")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        {reportData && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Items</span>
                </div>
                <div className="text-2xl font-bold mt-1">{reportData.item_count}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Stock Value</span>
                </div>
                <div className="text-2xl font-bold mt-1 text-green-600">
                  {formatCurrency(reportData.totals.stock_value)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Sold Value</span>
                </div>
                <div className="text-2xl font-bold mt-1 text-blue-600">
                  {formatCurrency(reportData.totals.sold_value)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Received</span>
                </div>
                <div className="text-2xl font-bold mt-1 text-purple-600">
                  {formatCurrency(reportData.totals.received_value)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">Surplus</span>
                </div>
                <div className="text-2xl font-bold mt-1 text-emerald-600">
                  {formatCurrency(reportData.totals.surplus_value)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Shortage</span>
                </div>
                <div className="text-2xl font-bold mt-1 text-red-600">
                  {formatCurrency(reportData.totals.shortage_value)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-muted-foreground">
            {reportData && `Showing ${filteredItems.length} of ${reportData.item_count} items`}
            {reportData?.has_stock_take && reportData.stock_take_date && (
              <Badge variant="outline" className="ml-2">
                Last Stock Take: {reportData.stock_take_date}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!reportData}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} disabled={!reportData}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Report Table */}
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="w-full whitespace-nowrap" ref={tableRef}>
              <div className="min-w-[2000px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="sticky left-0 bg-muted/50 z-10 min-w-[100px]">Code</TableHead>
                      <TableHead className="sticky left-[100px] bg-muted/50 z-10 min-w-[180px]">Item</TableHead>
                      <TableHead className="text-right min-w-[100px]">Retail Price</TableHead>
                      <TableHead className="min-w-[120px]">Category</TableHead>
                      <TableHead className="text-right min-w-[70px] bg-blue-50 dark:bg-blue-950">Open</TableHead>
                      <TableHead className="text-right min-w-[100px] bg-blue-50 dark:bg-blue-950">Open V.</TableHead>
                      <TableHead className="text-right min-w-[70px] bg-green-50 dark:bg-green-950">Received</TableHead>
                      <TableHead className="text-right min-w-[100px] bg-green-50 dark:bg-green-950">Received V.</TableHead>
                      <TableHead className="text-right min-w-[80px] bg-purple-50 dark:bg-purple-950">Transferred</TableHead>
                      <TableHead className="text-right min-w-[100px] bg-purple-50 dark:bg-purple-950">Transferred V.</TableHead>
                      <TableHead className="text-right min-w-[70px] bg-yellow-50 dark:bg-yellow-950">Adjusted</TableHead>
                      <TableHead className="text-right min-w-[100px] bg-yellow-50 dark:bg-yellow-950">Adjusted V.</TableHead>
                      <TableHead className="text-right min-w-[70px] bg-red-50 dark:bg-red-950">Sold</TableHead>
                      <TableHead className="text-right min-w-[100px] bg-red-50 dark:bg-red-950">Sold V.</TableHead>
                      <TableHead className="text-right min-w-[70px] bg-slate-100 dark:bg-slate-900 font-bold">Stock</TableHead>
                      <TableHead className="text-right min-w-[100px] bg-slate-100 dark:bg-slate-900 font-bold">Stock V.</TableHead>
                      <TableHead className="text-right min-w-[70px] bg-cyan-50 dark:bg-cyan-950">Counted</TableHead>
                      <TableHead className="text-right min-w-[100px] bg-cyan-50 dark:bg-cyan-950">Counted V.</TableHead>
                      <TableHead className="text-right min-w-[90px]">Discrepancy</TableHead>
                      <TableHead className="text-right min-w-[70px] bg-emerald-50 dark:bg-emerald-950">Surplus</TableHead>
                      <TableHead className="text-right min-w-[100px] bg-emerald-50 dark:bg-emerald-950">Surplus V.</TableHead>
                      <TableHead className="text-right min-w-[70px] bg-rose-50 dark:bg-rose-950">Shortage</TableHead>
                      <TableHead className="text-right min-w-[100px] bg-rose-50 dark:bg-rose-950">Shortage V.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={23} className="text-center py-12">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                          <p className="text-muted-foreground">Loading report data...</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={23} className="text-center py-12">
                          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">No inventory data found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {filteredItems.map((item) => (
                          <TableRow key={item.id} className="hover:bg-muted/30">
                            <TableCell className="sticky left-0 bg-background z-10 font-mono text-sm">
                              {item.code}
                            </TableCell>
                            <TableCell className="sticky left-[100px] bg-background z-10 font-medium">
                              {item.name}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.retail_price)}
                            </TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell className="text-right bg-blue-50/50 dark:bg-blue-950/50">
                              {formatNumber(item.open_qty)}
                            </TableCell>
                            <TableCell className="text-right bg-blue-50/50 dark:bg-blue-950/50">
                              {formatCurrency(item.open_value)}
                            </TableCell>
                            <TableCell className="text-right bg-green-50/50 dark:bg-green-950/50">
                              {formatNumber(item.received_qty)}
                            </TableCell>
                            <TableCell className="text-right bg-green-50/50 dark:bg-green-950/50">
                              {formatCurrency(item.received_value)}
                            </TableCell>
                            <TableCell className="text-right bg-purple-50/50 dark:bg-purple-950/50">
                              {formatNumber(item.transferred_qty)}
                            </TableCell>
                            <TableCell className="text-right bg-purple-50/50 dark:bg-purple-950/50">
                              {formatCurrency(item.transferred_value)}
                            </TableCell>
                            <TableCell className="text-right bg-yellow-50/50 dark:bg-yellow-950/50">
                              {formatNumber(item.adjusted_qty)}
                            </TableCell>
                            <TableCell className="text-right bg-yellow-50/50 dark:bg-yellow-950/50">
                              {formatCurrency(item.adjusted_value)}
                            </TableCell>
                            <TableCell className="text-right bg-red-50/50 dark:bg-red-950/50">
                              {formatNumber(item.sold_qty)}
                            </TableCell>
                            <TableCell className="text-right bg-red-50/50 dark:bg-red-950/50">
                              {formatCurrency(item.sold_value)}
                            </TableCell>
                            <TableCell className="text-right bg-slate-100/50 dark:bg-slate-900/50 font-semibold">
                              {formatNumber(item.stock_qty)}
                            </TableCell>
                            <TableCell className="text-right bg-slate-100/50 dark:bg-slate-900/50 font-semibold">
                              {formatCurrency(item.stock_value)}
                            </TableCell>
                            <TableCell className="text-right bg-cyan-50/50 dark:bg-cyan-950/50">
                              {formatNumber(item.counted_qty)}
                            </TableCell>
                            <TableCell className="text-right bg-cyan-50/50 dark:bg-cyan-950/50">
                              {formatCurrency(item.counted_value)}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${
                              item.discrepancy > 0 ? "text-emerald-600" : 
                              item.discrepancy < 0 ? "text-red-600" : ""
                            }`}>
                              {item.discrepancy !== 0 && (item.discrepancy > 0 ? "+" : "")}{formatNumber(item.discrepancy)}
                            </TableCell>
                            <TableCell className="text-right bg-emerald-50/50 dark:bg-emerald-950/50 text-emerald-600">
                              {item.surplus_qty > 0 ? formatNumber(item.surplus_qty) : "-"}
                            </TableCell>
                            <TableCell className="text-right bg-emerald-50/50 dark:bg-emerald-950/50 text-emerald-600">
                              {item.surplus_value > 0 ? formatCurrency(item.surplus_value) : "-"}
                            </TableCell>
                            <TableCell className="text-right bg-rose-50/50 dark:bg-rose-950/50 text-red-600">
                              {item.shortage_qty > 0 ? formatNumber(item.shortage_qty) : "-"}
                            </TableCell>
                            <TableCell className="text-right bg-rose-50/50 dark:bg-rose-950/50 text-red-600">
                              {item.shortage_value > 0 ? formatCurrency(item.shortage_value) : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {/* Totals Row */}
                        {reportData?.totals && (
                          <TableRow className="bg-muted font-bold border-t-2">
                            <TableCell className="sticky left-0 bg-muted z-10">TOTALS</TableCell>
                            <TableCell className="sticky left-[100px] bg-muted z-10"></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right">{formatNumber(reportData.totals.open_qty)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(reportData.totals.open_value)}</TableCell>
                            <TableCell className="text-right">{formatNumber(reportData.totals.received_qty)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(reportData.totals.received_value)}</TableCell>
                            <TableCell className="text-right">{formatNumber(reportData.totals.transferred_qty)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(reportData.totals.transferred_value)}</TableCell>
                            <TableCell className="text-right">{formatNumber(reportData.totals.adjusted_qty)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(reportData.totals.adjusted_value)}</TableCell>
                            <TableCell className="text-right">{formatNumber(reportData.totals.sold_qty)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(reportData.totals.sold_value)}</TableCell>
                            <TableCell className="text-right">{formatNumber(reportData.totals.stock_qty)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(reportData.totals.stock_value)}</TableCell>
                            <TableCell className="text-right">{formatNumber(reportData.totals.counted_qty)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(reportData.totals.counted_value)}</TableCell>
                            <TableCell className="text-right">{formatNumber(reportData.totals.discrepancy)}</TableCell>
                            <TableCell className="text-right text-emerald-600">{formatNumber(reportData.totals.surplus_qty)}</TableCell>
                            <TableCell className="text-right text-emerald-600">{formatCurrency(reportData.totals.surplus_value)}</TableCell>
                            <TableCell className="text-right text-red-600">{formatNumber(reportData.totals.shortage_qty)}</TableCell>
                            <TableCell className="text-right text-red-600">{formatCurrency(reportData.totals.shortage_value)}</TableCell>
                          </TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
            }
          }
        `}</style>
      </PageLayout>
    </DashboardLayout>
  )
}

