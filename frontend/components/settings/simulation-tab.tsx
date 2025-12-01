"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Download, RotateCcw, Upload, AlertTriangle } from "lucide-react"
import { resetSimulation, exportMockData, importMockData } from "@/lib/utils/simulation"
import { useState, useRef } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SimulationTab() {
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleReset = async () => {
    setIsResetting(true)
    try {
      resetSimulation()
    } catch (error) {
      console.error("Failed to reset simulation:", error)
      setIsResetting(false)
    }
  }

  const handleExport = () => {
    setIsExporting(true)
    try {
      exportMockData()
    } catch (error) {
      console.error("Failed to export data:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        importMockData(content)
      } catch (error) {
        console.error("Failed to import data:", error)
        alert("Failed to import data. Please check the file format.")
      }
    }
    reader.readAsText(file)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Simulation Mode Active</AlertTitle>
        <AlertDescription>
          All data is stored locally in your browser. No backend connection is required.
          This allows you to test the full system before backend integration.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Export Data */}
        <Card>
          <CardHeader>
            <CardTitle>Export Simulation Data</CardTitle>
            <CardDescription>
              Download all your simulation data as a JSON file for backup or sharing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Exporting..." : "Export Data"}
            </Button>
          </CardContent>
        </Card>

        {/* Import Data */}
        <Card>
          <CardHeader>
            <CardTitle>Import Simulation Data</CardTitle>
            <CardDescription>
              Restore simulation data from a previously exported JSON file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="import-file">Select JSON File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleImport}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose File
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Reset Simulation */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Reset Simulation</CardTitle>
          <CardDescription>
            Clear all simulation data and start fresh. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setShowResetDialog(true)}
            disabled={isResetting}
            className="w-full"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {isResetting ? "Resetting..." : "Reset All Data"}
          </Button>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Simulation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all simulation data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All businesses and outlets</li>
                <li>All products and inventory</li>
                <li>All sales and transactions</li>
                <li>All users and staff</li>
                <li>All settings and preferences</li>
              </ul>
              <strong className="block mt-4">This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

