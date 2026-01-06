"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Users, Package, ArrowUpRight, ArrowDownRight, ShoppingCart, Receipt, AlertTriangle, CreditCard, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/currency"
import type { Business } from "@/lib/types"

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  trend?: "up" | "down"
  business?: Business | null
}

function KPICard({ title, value, change, changeLabel, icon, trend, business }: KPICardProps) {
  const isPositive = trend === "up" || (change !== undefined && change >= 0)
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={cn(
            "text-xs flex items-center gap-1 mt-1",
            isPositive ? "text-green-500" : "text-red-500"
          )}>
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>{Math.abs(change)}%</span>
            {changeLabel && <span className="text-muted-foreground"> {changeLabel}</span>}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface KPICardsProps {
  data: {
    sales: { value: number; change: number }
    customers: { value: number; change: number }
    products: { value: number; change: number }
    expenses: { value: number; change: number }
    profit: { value: number; change: number }
    transactions: { value: number; change: number }
    avgOrderValue: { value: number; change: number }
    lowStockItems: { value: number; change: number }
    outstandingCredit: { value: number; change: number }
    returns: { value: number; change: number }
  }
  business?: Business | null
}

export function KPICards({ data, business }: KPICardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <KPICard
        title="Today's Sales"
        value={formatCurrency(data.sales.value, business)}
        change={data.sales.change}
        changeLabel="from yesterday"
        icon={<DollarSign className="h-4 w-4" />}
        trend={data.sales.change >= 0 ? "up" : "down"}
        business={business}
      />
      <KPICard
        title="Transactions"
        value={data.transactions.value.toLocaleString('en-US')}
        change={data.transactions.change}
        changeLabel="from yesterday"
        icon={<ShoppingCart className="h-4 w-4" />}
        trend={data.transactions.change >= 0 ? "up" : "down"}
        business={business}
      />
      <KPICard
        title="Avg Order Value"
        value={formatCurrency(data.avgOrderValue.value, business)}
        change={data.avgOrderValue.change}
        changeLabel="from yesterday"
        icon={<Receipt className="h-4 w-4" />}
        trend={data.avgOrderValue.change >= 0 ? "up" : "down"}
        business={business}
      />
      <KPICard
        title="Customers"
        value={data.customers.value.toLocaleString('en-US')}
        change={data.customers.change}
        changeLabel="total"
        icon={<Users className="h-4 w-4" />}
        trend={data.customers.change >= 0 ? "up" : "down"}
        business={business}
      />
      <KPICard
        title="Products in Stock"
        value={data.products.value.toLocaleString('en-US')}
        change={data.products.change}
        changeLabel="total items"
        icon={<Package className="h-4 w-4" />}
        business={business}
      />
      <KPICard
        title="Low Stock Items"
        value={data.lowStockItems.value.toLocaleString('en-US')}
        change={data.lowStockItems.change}
        changeLabel="needs attention"
        icon={<AlertTriangle className="h-4 w-4" />}
        trend={data.lowStockItems.value > 0 ? "down" : "up"}
        business={business}
      />
      <KPICard
        title="Outstanding Credit"
        value={formatCurrency(data.outstandingCredit.value, business)}
        change={data.outstandingCredit.change}
        changeLabel="receivables"
        icon={<CreditCard className="h-4 w-4" />}
        business={business}
      />
      <KPICard
        title="Returns Today"
        value={data.returns.value.toLocaleString('en-US')}
        change={data.returns.change}
        changeLabel="from yesterday"
        icon={<RotateCcw className="h-4 w-4" />}
        trend={data.returns.change >= 0 ? "down" : "up"}
        business={business}
      />
      <KPICard
        title="Expenses"
        value={formatCurrency(data.expenses.value, business)}
        change={data.expenses.change}
        changeLabel="this month"
        icon={<ArrowDownRight className="h-4 w-4" />}
        trend={data.expenses.change >= 0 ? "down" : "up"}
        business={business}
      />
      <KPICard
        title="Profit"
        value={formatCurrency(data.profit.value, business)}
        change={data.profit.change}
        changeLabel="today"
        icon={<ArrowUpRight className="h-4 w-4" />}
        trend={data.profit.change >= 0 ? "up" : "down"}
        business={business}
      />
    </div>
  )
}

