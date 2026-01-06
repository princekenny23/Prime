"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, User, UserPlus } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { customerService } from "@/lib/services/customerService"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Customer } from "@/lib/services/customerService"

interface SelectCustomerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (customer: Customer | null) => void
  outletId?: string
  allowNew?: boolean
}

export function SelectCustomerModal({
  open,
  onOpenChange,
  onSelect,
  outletId,
  allowNew = true,
}: SelectCustomerModalProps) {
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (open) {
      loadCustomers()
    } else {
      setSearchTerm("")
    }
  }, [open, outletId])

  const loadCustomers = async () => {
    setIsLoading(true)
    try {
      const customersList = await customerService.list({
        outlet: outletId,
        is_active: true,
        search: searchTerm || undefined,
      })
      setCustomers(customersList)
    } catch (error) {
      console.error("Failed to load customers:", error)
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open && searchTerm) {
      const debounceTimer = setTimeout(() => {
        loadCustomers()
      }, 300)
      return () => clearTimeout(debounceTimer)
    }
  }, [searchTerm, open])

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers
    
    const term = searchTerm.toLowerCase()
    return customers.filter(customer =>
      customer.name?.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term) ||
      customer.phone?.toLowerCase().includes(term)
    )
  }, [customers, searchTerm])

  const handleSelectCustomer = (customer: Customer) => {
    onSelect(customer)
    onOpenChange(false)
    setSearchTerm("")
  }

  const handleNewCustomer = () => {
    onSelect(null) // null means new customer
    onOpenChange(false)
    setSearchTerm("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Customer</DialogTitle>
          <DialogDescription>
            Search and select a customer or create a new one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* New Customer Button */}
          {allowNew && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleNewCustomer}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              New Customer
            </Button>
          )}

          {/* Customers List */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading customers...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No customers found</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="w-full text-left p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{customer.name}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          {customer.email && (
                            <span>{customer.email}</span>
                          )}
                          {customer.phone && (
                            <span>{customer.phone}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

