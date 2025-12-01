"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"
import type { Business } from "@/lib/types/mock-data"

interface TopSellingItem {
  id: string
  name: string
  sku: string
  quantity: number
  revenue: number
  change: number
}

interface TopSellingItemsProps {
  items: TopSellingItem[]
  business?: Business | null
}

export function TopSellingItems({ items, business }: TopSellingItemsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Items</CardTitle>
        <CardDescription>Best performing products this period</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {index + 1}
                    </span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(item.revenue, business, { showSymbol: true, decimals: 2 })}
                </TableCell>
                <TableCell className="text-right">
                  <div className={`flex items-center justify-end gap-1 ${
                    item.change >= 0 ? "text-green-500" : "text-red-500"
                  }`}>
                    <TrendingUp className={`h-3 w-3 ${item.change < 0 ? "rotate-180" : ""}`} />
                    <span className="text-sm">{Math.abs(item.change)}%</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

