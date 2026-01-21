"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Search, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useBusinessStore } from "@/stores/businessStore"
import { customerGroupService, type CustomerGroup } from "@/lib/services/customerGroupService"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function CustomerGroupsPage() {
  const { currentBusiness } = useBusinessStore()
  const { toast } = useToast()
  const router = useRouter()
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Redirect if not wholesale/retail business
    if (currentBusiness && currentBusiness.type !== "wholesale and retail") {
      router.push("/dashboard")
      return
    }
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CustomerGroupsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/dashboard")
  }, [router])

  return null
}
            description: "Failed to load customer groups. Please try again later.",

            variant: "destructive",
