"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, Lock } from "lucide-react"
import { useBusinessStore } from "@/stores/businessStore"

export function RegisterClosedScreen() {
  const router = useRouter()
  const { currentBusiness } = useBusinessStore()

  const handleStartDay = () => {
    router.push("/dashboard/pos/start-shift")
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] py-8">
      <Card className="w-full max-w-md">
        <CardContent className="pt-12 pb-12">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-12 w-12 text-muted-foreground" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">REGISTER CLOSED</h1>
              <p className="text-muted-foreground">
                The register is currently closed. Please start your day shift to begin processing sales.
              </p>
            </div>

            {/* Start Day Button */}
            <Button
              onClick={handleStartDay}
              size="lg"
              className="w-full max-w-xs h-12 text-base font-semibold"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              START DAY
            </Button>

            {/* Info */}
            <p className="text-xs text-muted-foreground pt-4">
              You'll need to set up your till, opening cash balance, and other shift details before you can start selling.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


