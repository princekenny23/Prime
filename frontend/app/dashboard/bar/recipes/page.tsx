"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { PageLayout } from "@/components/layouts/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FlaskConical } from "lucide-react"

export default function BarRecipesPage() {
  return (
    <DashboardLayout>
      <PageLayout
        title="Mix Recipes"
        description="Create and manage cocktail recipes"
      >

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
      </PageLayout>
    </DashboardLayout>
  )
}

