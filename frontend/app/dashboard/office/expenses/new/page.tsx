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
import { ArrowLeft, Upload, X } from "lucide-react"
import Link from "next/link"
import { useTenant } from "@/contexts/tenant-context"

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
    category: "",
    vendor: "",
    description: "",
    amount: "",
    payment_method: "",
    payment_reference: "",
    expense_date: new Date().toISOString().split("T")[0],
    outlet_id: "",
    notes: "",
  })
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setReceiptFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeReceipt = () => {
    setReceiptFile(null)
    setReceiptPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.category || !formData.amount || !formData.payment_method) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // TODO: Replace with actual API call
      // const formDataToSend = new FormData()
      // Object.entries(formData).forEach(([key, value]) => {
      //   if (value) formDataToSend.append(key, value)
      // })
      // if (receiptFile) {
      //   formDataToSend.append("receipt", receiptFile)
      // }
      // await expenseService.create(formDataToSend)

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
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Receipt</CardTitle>
                  <CardDescription>Upload a receipt image (optional)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {receiptPreview ? (
                    <div className="relative">
                      <img
                        src={receiptPreview}
                        alt="Receipt preview"
                        className="w-full h-auto rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeReceipt}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <Label htmlFor="receipt" className="cursor-pointer">
                        <span className="text-sm font-medium text-primary hover:underline">
                          Click to upload receipt
                        </span>
                        <input
                          id="receipt"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </Label>
                      <p className="text-xs text-muted-foreground mt-2">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add any additional notes..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>

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
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

