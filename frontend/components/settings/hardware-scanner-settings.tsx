"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

const STORAGE_KEY = "scanner_settings_v1"

export default function HardwareScannerSettings() {
  const { toast } = useToast()
  const [enabled, setEnabled] = useState(true)
  const [suffixKey, setSuffixKey] = useState("Enter")
  const [scanTimeout, setScanTimeout] = useState<number>(60)
  const [minLength, setMinLength] = useState<number>(3)
  const [isSaving, setIsSaving] = useState(false)
  const [testPayload, setTestPayload] = useState("")

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setEnabled(parsed.enabled ?? true)
        setSuffixKey(parsed.suffixKey ?? "Enter")
        setScanTimeout(parsed.scanTimeout ?? 60)
        setMinLength(parsed.minLength ?? 3)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  const save = () => {
    setIsSaving(true)
    try {
      const payload = { enabled, suffixKey, scanTimeout, minLength }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
      // Notify listeners (hooks/components) that scanner settings changed
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('scanner-settings-changed', { detail: payload }))
        }
      } catch (e) {
        // ignore
      }
      setTimeout(() => {
        setIsSaving(false)
        toast({ title: "Settings saved", description: "Scanner settings updated" })
      }, 500)
    } catch (err) {
      setIsSaving(false)
      toast({ title: "Save failed", description: String(err), variant: "destructive" })
    }
  }

  const testScan = () => {
    const code = (testPayload && testPayload.trim()) || "TEST123456"
    try {
      const ev = new CustomEvent("barcode-scanned", { detail: String(code) })
      window.dispatchEvent(ev)
      toast({ title: "Test scan dispatched", description: `Code: ${code}` })
    } catch (err) {
      toast({ title: "Test failed", description: String(err), variant: "destructive" })
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="flex items-center justify-between">
        <div>
          <Label>Enable Hardware Scanner</Label>
          <div className="text-sm text-muted-foreground">Capture keyboard-wedge barcode scans globally</div>
        </div>
        <Switch checked={enabled} onCheckedChange={(v) => setEnabled(Boolean(v))} />
      </div>

      <div>
        <Label htmlFor="suffixKey">Suffix Key</Label>
        <Input id="suffixKey" value={suffixKey} onChange={(e) => setSuffixKey(e.target.value)} placeholder="Enter" />
        <div className="text-sm text-muted-foreground mt-1">Key that terminates a scan (e.g., Enter)</div>
      </div>

      <div>
        <Label htmlFor="scanTimeout">Scan Timeout (ms)</Label>
        <Input id="scanTimeout" type="number" value={scanTimeout} onChange={(e) => setScanTimeout(parseInt(e.target.value || "0", 10))} />
        <div className="text-sm text-muted-foreground mt-1">Maximum time between keystrokes to consider them one scan (default 60ms)</div>
      </div>

      <div>
        <Label htmlFor="minLength">Minimum Scan Length</Label>
        <Input id="minLength" type="number" value={minLength} onChange={(e) => setMinLength(parseInt(e.target.value || "0", 10))} />
        <div className="text-sm text-muted-foreground mt-1">Ignore very short sequences to avoid false positives</div>
      </div>

      <div className="flex items-center gap-2">
        <Input placeholder="Test barcode (optional)" value={testPayload} onChange={(e) => setTestPayload(e.target.value)} />
        <Button onClick={testScan}>Send Test Scan</Button>
        <Button variant="ghost" onClick={() => { setTestPayload(""); toast({ title: "Cleared" }) }}>Clear</Button>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => {
          try { localStorage.removeItem(STORAGE_KEY); setEnabled(true); setSuffixKey("Enter"); setScanTimeout(60); setMinLength(3); toast({ title: "Reset", description: "Scanner settings reset to defaults" }) } catch(e){}
        }}>Reset</Button>
        <Button onClick={save} disabled={isSaving}>{isSaving ? "Saving..." : "Save Scanner Settings"}</Button>
      </div>
    </div>
  )
}
