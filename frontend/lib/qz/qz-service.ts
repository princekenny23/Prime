"use client"

import { getOrCreateCertificates, sha256 } from "./qz-certificates"

const QZ_ENABLED_KEY = "qz_enabled_v1"
const QZ_LAST_PRINTERS_KEY = "qz_printers_v1"

interface PrinterState {
  receipt?: string
  label?: string
  kitchen?: string
}

function saveEnabled(enabled: boolean) {
  try { localStorage.setItem(QZ_ENABLED_KEY, JSON.stringify(enabled)) } catch {}
}
function loadEnabled(): boolean {
  try { return JSON.parse(localStorage.getItem(QZ_ENABLED_KEY) || "false") } catch { return false }
}

function savePrinters(state: PrinterState) {
  try { localStorage.setItem(QZ_LAST_PRINTERS_KEY, JSON.stringify(state)) } catch {}
}
function loadPrinters(): PrinterState {
  try { return JSON.parse(localStorage.getItem(QZ_LAST_PRINTERS_KEY) || "{}") } catch { return {} }
}

export const qzService = {
  async loadLibrary(): Promise<void> {
    if (typeof window === 'undefined') return
    if ((window as any).qz) return

    try {
      const qzModule: any = await import('qz-tray')
      const qzLib: any = (qzModule && (qzModule as any).default) || qzModule
      ;(window as any).qz = qzLib
      return
    } catch (e) {
      // Fallback: try public bundle
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = '/qz-tray.js'
        script.async = true
        script.onload = () => ((window as any).qz ? resolve() : reject(new Error('qz not available')))
        script.onerror = () => reject(new Error('failed to load qz-tray'))
        document.body.appendChild(script)
      })
    }
  },

  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as any).qz
  },

  async setupSecurity() {
    const qz = (window as any).qz
    if (!qz) return

    const { certificate, privateKey } = getOrCreateCertificates()

    // Configure QZ security callbacks
    qz.security.setCertificatePromise(async () => certificate)

    qz.security.setSignaturePromise(async (toSign: string) => {
      // In production, use a real signing implementation
      // Here, we hash to mimic a signature to avoid prompts
      const hash = await sha256(toSign)
      return hash
    })
  },

  async connect(): Promise<void> {
    const qz = (window as any).qz
    if (!qz) throw new Error("QZ not available")

    // If already connected, do nothing
    if (qz.websocket.isActive()) return

    // Add auto-reconnect options
    qz.websocket.setClosedCallbacks(() => {
      // Attempt reconnect silently
      this.reconnectWithBackoff()
    })

    await qz.websocket.connect()
  },

  async reconnectWithBackoff() {
    const qz = (window as any).qz
    if (!qz) return

    let attempts = 0
    const maxAttempts = 5

    while (!qz.websocket.isActive() && attempts < maxAttempts) {
      attempts++
      try {
        await qz.websocket.connect()
        break
      } catch {
        await new Promise(r => setTimeout(r, 1000 * attempts))
      }
    }
  },

  async findPrinters(): Promise<string[]> {
    const qz = (window as any).qz
    if (!qz) return []
    try {
      const printers = await qz.printers.find()
      return printers || []
    } catch (err) {
      console.error("findPrinters failed", err)
      return []
    }
  },

  async enable(): Promise<{ printers: string[] }> {
    saveEnabled(true)
    await this.loadLibrary()
    await this.setupSecurity()
    await this.connect()
    const printers = await this.findPrinters()
    return { printers }
  },

  async disable(): Promise<void> {
    saveEnabled(false)
    const qz = (window as any).qz
    try { await qz?.websocket?.disconnect() } catch {}
  },

  loadEnabled,
  savePrinters,
  loadPrinters,
}
