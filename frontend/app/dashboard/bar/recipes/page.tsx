"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FlaskConical } from "lucide-react"

export default function BarRecipesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/bar">
            <button className="text-muted-foreground hover:text-foreground">
              ← Back
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Mix Recipes</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage cocktail recipes
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mix Recipes</CardTitle>
            <CardDescription>Create and manage cocktail recipes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FlaskConical className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Mix Recipes Coming Soon</h3>
              <p className="text-muted-foreground max-w-md">
                The mix recipes feature is currently under development. 
                You'll be able to create cocktail recipes, track ingredients, 
                and manage drink combinations here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

