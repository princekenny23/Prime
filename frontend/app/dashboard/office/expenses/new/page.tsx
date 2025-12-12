"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBusinessStore } from "@/stores/businessStore"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useTenant } from "@/contexts/tenant-context"
import { expenseService } from "@/lib/services/expenseService"

const expenseCategories = [
  "Supplies",
  "Utilities",
  "Rent",
  "Marketing",
  "Travel",
  "Equipment",
  "Maintenance",
  "Other"
]

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "check", label: "Check" },
  { value: "other", label: "Other" }
]

export default function NewExpensePage() {
  const { currentBusiness } = useBusinessStore()
  const { outlets } = useTenant()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    vendor: "",
    description: "",
    amount: "",
    payment_method: "",
    payment_reference: "",
    expense_date: new Date().toISOString().split("T")[0],
    outlet_id: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.category || !formData.amount || !formData.payment_method || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Title, Category, Amount, Payment Method, and Description).",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await expenseService.create({
        title: formData.title.trim(),
        category: formData.category,
        vendor: formData.vendor.trim() || undefined,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        payment_reference: formData.payment_reference.trim() || undefined,
        expense_date: formData.expense_date,
        outlet_id: formData.outlet_id ? parseInt(formData.outlet_id) : undefined,
      })

      toast({
        title: "Expense Created",
        description: "Expense has been created successfully.",
      })
      router.push("/dashboard/office/expenses")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create expense.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/office/expenses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Add New Expense</h1>
            <p className="text-muted-foreground">Record a new business expense</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Details</CardTitle>
                  <CardDescription>Enter the expense information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Expense Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Rent, Utilities, Office Supplies"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange("category", value)}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor/Supplier</Label>
                    <Input
                      id="vendor"
                      placeholder="Enter vendor name"
                      value={formData.vendor}
                      onChange={(e) => handleInputChange("vendor", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter expense description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => handleInputChange("amount", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expense_date">Date *</Label>
                      <Input
                        id="expense_date"
                        type="date"
                        value={formData.expense_date}
                        onChange={(e) => handleInputChange("expense_date", e.target.value)}
                      />
                    </div>
                  </div>

                  {outlets.length > 1 && (
                    <div className="space-y-2">
                      <Label htmlFor="outlet">Outlet</Label>
                      <Select
                        value={formData.outlet_id}
                        onValueChange={(value) => handleInputChange("outlet_id", value)}
                      >
                        <SelectTrigger id="outlet">
                          <SelectValue placeholder="Select outlet" />
                        </SelectTrigger>
                        <SelectContent>
                          {outlets.map(outlet => (
                            <SelectItem key={outlet.id} value={outlet.id}>
                              {outlet.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

         

              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method *</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => handleInputChange("payment_method", value)}
                    >
                      <SelectTrigger id="payment_method">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map(method => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_reference">Payment Reference</Label>
                    <Input
                      id="payment_reference"
                      placeholder="Check number, transaction ID, etc."
                      value={formData.payment_reference}
                      onChange={(e) => handleInputChange("payment_reference", e.target.value)}
                    />
                  </div>
                       {/* Right Column */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <Link href="/dashboard/office/expenses" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Expense"}
                </Button>
              </div>
            </div>
                </CardContent>
              </Card>

            
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

