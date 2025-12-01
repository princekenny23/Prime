"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Folder, Edit, Trash2, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { AddCategoryModal } from "@/components/modals/add-category-modal"
import { categoryService } from "@/lib/services/productService"
import { useBusinessStore } from "@/stores/businessStore"
import type { Category } from "@/lib/types/mock-data"

export default function CategoriesPage() {
  const { currentBusiness } = useBusinessStore()
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCategories = async () => {
      if (!currentBusiness) return
      
      setIsLoading(true)
      try {
        const cats = await categoryService.list()
        setCategories(cats)
      } catch (error) {
        console.error("Failed to load categories:", error)
        setCategories([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadCategories()
  }, [currentBusiness])

  const handleCategorySaved = () => {
    // Reload categories after save
    if (currentBusiness) {
      categoryService.list().then(cats => {
        setCategories(cats)
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/products">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Categories</h1>
              <p className="text-muted-foreground">Organize your products into categories</p>
            </div>
          </div>
          <Button onClick={() => {
            setSelectedCategory(null)
            setShowAddCategory(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `${categories.length} categor${categories.length !== 1 ? "ies" : "y"} defined`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Folder className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No categories found</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSelectedCategory(null)
                    setShowAddCategory(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Category
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-primary" />
                          <span className="font-medium">{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.description || "No description"}
                      </TableCell>
                      <TableCell>
                        {/* Product count will be available from backend */}
                        <span className="text-muted-foreground">-</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedCategory(category)
                              setShowAddCategory(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive"
                            onClick={() => {
                              // TODO: Implement delete functionality
                              alert("Delete functionality coming soon")
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AddCategoryModal
        open={showAddCategory}
        onOpenChange={(open) => {
          setShowAddCategory(open)
          if (!open) {
            setSelectedCategory(null)
            handleCategorySaved()
          }
        }}
        category={selectedCategory}
        onSuccess={handleCategorySaved}
      />
    </DashboardLayout>
  )
}

