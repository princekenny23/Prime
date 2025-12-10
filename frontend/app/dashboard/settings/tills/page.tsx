"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { useBusinessStore } from "@/stores/businessStore"
import { useTenant } from "@/contexts/tenant-context"
import { tillService } from "@/lib/services/tillService"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function TillManagementPage() {
  const { currentBusiness } = useBusinessStore()
  const { currentOutlet } = useTenant()
  const [tills, setTills] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTills = async () => {
      if (!currentBusiness) return
      
      setIsLoading(true)
      try {
        const response = await tillService.list()
        const tillsData = Array.isArray(response) ? response : (response.results || [])
        setTills(tillsData)
      } catch (error) {
        console.error("Failed to load tills:", error)
        setTills([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTills()
  }, [currentBusiness])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/settings">
            <button className="text-muted-foreground hover:text-foreground">
              ← Back
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Till Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage tills and cash registers
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tills</CardTitle>
                <CardDescription>Manage your cash registers and tills</CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Till
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading tills...</p>
            ) : tills.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No tills found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Outlet</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>In Use</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tills.map((till) => (
                    <TableRow key={till.id}>
                      <TableCell className="font-medium">{till.name}</TableCell>
                      <TableCell>{till.outlet?.name || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={till.is_active ? "default" : "secondary"}>
                          {till.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={till.is_in_use ? "default" : "outline"}>
                          {till.is_in_use ? "In Use" : "Available"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

