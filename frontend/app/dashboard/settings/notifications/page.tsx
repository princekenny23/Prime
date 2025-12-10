"use client"

import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Bell, Save, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { notificationService, type NotificationPreference } from "@/lib/services/notificationService"
import { useToast } from "@/components/ui/use-toast"
import { PageRefreshButton } from "@/components/dashboard/page-refresh-button"

export default function NotificationSettingsPage() {
  const { toast } = useToast()
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadPreferences = async () => {
    try {
      setIsLoading(true)
      const data = await notificationService.getMyPreferences()
      setPreferences(data)
    } catch (error: any) {
      console.error("Failed to load notification preferences:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load notification preferences",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPreferences()
  }, [])

  const handleToggle = (field: keyof NotificationPreference) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      [field]: !preferences[field],
    })
  }

  const handleSave = async () => {
    if (!preferences) return

    try {
      setIsSaving(true)
      await notificationService.updatePreference(preferences.id, preferences)
      toast({
        title: "Success",
        description: "Notification preferences saved successfully",
      })
    } catch (error: any) {
      console.error("Failed to save notification preferences:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save notification preferences",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  if (!preferences) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Failed to load notification preferences</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notification Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your notification preferences and delivery methods
            </p>
          </div>
          <PageRefreshButton />
        </div>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Types
            </CardTitle>
            <CardDescription>
              Choose which types of notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sale-notifications">Sale Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when sales are completed
                </p>
              </div>
              <Switch
                id="sale-notifications"
                checked={preferences.enable_sale_notifications}
                onCheckedChange={() => handleToggle("enable_sale_notifications")}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="stock-notifications">Stock Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about low stock alerts
                </p>
              </div>
              <Switch
                id="stock-notifications"
                checked={preferences.enable_stock_notifications}
                onCheckedChange={() => handleToggle("enable_stock_notifications")}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="staff-notifications">Staff Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when staff members are added or updated
                </p>
              </div>
              <Switch
                id="staff-notifications"
                checked={preferences.enable_staff_notifications}
                onCheckedChange={() => handleToggle("enable_staff_notifications")}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="system-notifications">System Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about system events (shifts, deliveries, etc.)
                </p>
              </div>
              <Switch
                id="system-notifications"
                checked={preferences.enable_system_notifications}
                onCheckedChange={() => handleToggle("enable_system_notifications")}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="payment-notifications">Payment Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when payments are received
                </p>
              </div>
              <Switch
                id="payment-notifications"
                checked={preferences.enable_payment_notifications}
                onCheckedChange={() => handleToggle("enable_payment_notifications")}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="customer-notifications">Customer Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when new customers are added
                </p>
              </div>
              <Switch
                id="customer-notifications"
                checked={preferences.enable_customer_notifications}
                onCheckedChange={() => handleToggle("enable_customer_notifications")}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="report-notifications">Report Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about report generation and updates
                </p>
              </div>
              <Switch
                id="report-notifications"
                checked={preferences.enable_report_notifications}
                onCheckedChange={() => handleToggle("enable_report_notifications")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Priority Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Filters</CardTitle>
            <CardDescription>
              Choose which priority levels you want to receive notifications for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="low-priority">Low Priority</Label>
                <p className="text-sm text-muted-foreground">
                  Receive low priority notifications
                </p>
              </div>
              <Switch
                id="low-priority"
                checked={preferences.enable_low_priority}
                onCheckedChange={() => handleToggle("enable_low_priority")}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="normal-priority">Normal Priority</Label>
                <p className="text-sm text-muted-foreground">
                  Receive normal priority notifications
                </p>
              </div>
              <Switch
                id="normal-priority"
                checked={preferences.enable_normal_priority}
                onCheckedChange={() => handleToggle("enable_normal_priority")}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="high-priority">High Priority</Label>
                <p className="text-sm text-muted-foreground">
                  Receive high priority notifications
                </p>
              </div>
              <Switch
                id="high-priority"
                checked={preferences.enable_high_priority}
                onCheckedChange={() => handleToggle("enable_high_priority")}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="urgent-priority">Urgent Priority</Label>
                <p className="text-sm text-muted-foreground">
                  Receive urgent priority notifications
                </p>
              </div>
              <Switch
                id="urgent-priority"
                checked={preferences.enable_urgent_priority}
                onCheckedChange={() => handleToggle("enable_urgent_priority")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Delivery Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Methods</CardTitle>
            <CardDescription>
              Choose how you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-enabled">In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications in the application
                </p>
              </div>
              <Switch
                id="push-enabled"
                checked={preferences.push_enabled}
                onCheckedChange={() => handleToggle("push_enabled")}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-enabled">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email (coming soon)
                </p>
              </div>
              <Switch
                id="email-enabled"
                checked={preferences.email_enabled}
                onCheckedChange={() => handleToggle("email_enabled")}
                disabled
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-enabled">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via SMS (coming soon)
                </p>
              </div>
              <Switch
                id="sms-enabled"
                checked={preferences.sms_enabled}
                onCheckedChange={() => handleToggle("sms_enabled")}
                disabled
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
