"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useQZStore } from "@/stores/qzStore"

const STORAGE_KEY = "qz_settings_v1"

export default function QzSettings() {
  const { toast } = useToast()
  const enabled = useQZStore((s) => s.enabled)
  const connected = useQZStore((s) => s.connected)
  const printers = useQZStore((s) => s.printers)
  const setEnabled = useQZStore((s) => s.setEnabled)
  const refreshPrinters = useQZStore((s) => s.refreshPrinters)
  const [autoConnect, setAutoConnect] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setEnabled(parsed.enabled ?? false)
        setAutoConnect(parsed.autoConnect ?? true)
      }
    } catch (e) {}
  }, [])

  const save = () => {
    setIsSaving(true)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, autoConnect }))
      setTimeout(() => {
        setIsSaving(false)
        toast({ title: "QZ settings saved", description: "QZ settings updated" })
      }, 400)
    } catch (err) {
      setIsSaving(false)
      toast({ title: "Save failed", description: String(err), variant: "destructive" })
    }
  }

  const probe = async () => {
    // Lightweight probe - user should open QZ Tray in their machine for real testing
    try {
      // Try to access window.qz safely
      if (typeof window !== 'undefined' && (window as any).qz) {
        toast({ title: "QZ available", description: "QZ Tray is present in this browser session" })
      } else {
        toast({ title: "QZ not found", description: "No QZ Tray detected. Make sure QZ Tray is running and allowed.", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Probe failed", description: String(err), variant: "destructive" })
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="flex items-center justify-between">
        <div>
          <Label>Enable QZ Tray Integration</Label>
          <div className="text-sm text-muted-foreground">Allow automatic printing via QZ Tray</div>
        </div>
        <Switch checked={enabled} onCheckedChange={(v) => setEnabled(Boolean(v))} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Auto-connect Printers</Label>
          <div className="text-sm text-muted-foreground">When enabled, the app will try to auto-discover and connect to QZ printers</div>
        </div>
        <Switch checked={autoConnect} onCheckedChange={(v) => setAutoConnect(Boolean(v))} />
      </div>

      <div className="rounded border p-3 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Status</div>
            <div className="text-muted-foreground">{connected ? "Connected" : "Disconnected"}</div>
          </div>
          <Button variant="outline" size="sm" onClick={refreshPrinters} disabled={!connected}>Refresh Printers</Button>
        </div>
        {connected && (
          <div className="mt-3 text-muted-foreground">Found {printers.length} printer{printers.length !== 1 ? "s" : ""}</div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={probe}>Probe QZ</Button>
        <Button onClick={save} disabled={isSaving}>{isSaving ? "Saving..." : "Save QZ Settings"}</Button>
      </div>
    </div>
  )
}
