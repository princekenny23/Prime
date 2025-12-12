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
import { ArrowLeft, Plus, X } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils/currency"
import { Badge } from "@/components/ui/badge"

interface QuotationItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  price: number
  total: number
}

export default function NewQuotationPage() {
  const { currentBusiness } = useBusinessStore()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    valid_until: "",
    notes: "",
  })
  const [items, setItems] = useState<QuotationItem[]>([])
  const [showProductSelector, setShowProductSelector] = useState(false)

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const discount = 0 // TODO: Add discount field
  const tax = 0 // TODO: Calculate tax
  const total = subtotal - discount + tax

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddItem = () => {
    // TODO: Open product selector modal
    setShowProductSelector(true)
  }

  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity, total: item.price * quantity }
        : item
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customer_id && !formData.customer_name) {
      toast({
        title: "Validation Error",
        description: "Please select or enter a customer.",
        variant: "destructive",
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item to the quotation.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // TODO: Replace with actual API call
      // const quotationData = {
      //   ...formData,
      //   items,
      //   subtotal,
      //   discount,
      //   tax,
      //   total,
      // }
      // await quotationService.create(quotationData)

      toast({
        title: "Quotation Created",
        description: "Quotation has been created successfully.",
      })
      router.push("/dashboard/office/quotations")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create quotation.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Set default valid until date (30 days from now)
  const defaultValidUntil = new Date()
  defaultValidUntil.setDate(defaultValidUntil.getDate() + 30)
  const defaultValidUntilStr = defaultValidUntil.toISOString().split("T")[0]

  if (!formData.valid_until) {
    setFormData(prev => ({ ...prev, valid_until: defaultValidUntilStr }))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/office/quotations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Create Quotation</h1>
            <p className="text-muted-foreground">Create a new customer quotation</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Column - Form */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer *</Label>
                    <Input
                      id="customer"
                      placeholder="Search or enter customer name"
                      value={formData.customer_name}
                      onChange={(e) => handleInputChange("customer_name", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      TODO: Add customer search/select dropdown
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valid_until">Valid Until *</Label>
                    <Input
                      id="valid_until"
                      type="date"
                      value={formData.valid_until || defaultValidUntilStr}
                      onChange={(e) => handleInputChange("valid_until", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Items</CardTitle>
                    <Button type="button" variant="outline" onClick={handleAddItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No items added</p>
                      <Button type="button" variant="outline" className="mt-4" onClick={handleAddItem}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Item
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(item.price, currentBusiness)} each
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-20 text-center"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                          <div className="w-24 text-right">
                            <p className="font-semibold">
                              {formatCurrency(item.total, currentBusiness)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add any notes or terms..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {formatCurrency(subtotal, currentBusiness)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium">
                      {formatCurrency(discount, currentBusiness)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">
                      {formatCurrency(tax, currentBusiness)}
                    </span>
                  </div>
                  <div className="border-t pt-4 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(total, currentBusiness)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Link href="/dashboard/office/quotations" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={isSubmitting || items.length === 0}>
                  {isSubmitting ? "Creating..." : "Create Quotation"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

