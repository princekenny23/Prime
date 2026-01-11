// Lightweight client-side print helper using QZ Tray
// Responsibilities:
// - Resolve printer for an outlet
// - Ensure QZ Tray connected
// - Prefer backend-generated ESC/POS payloads (base64) and print them raw
// - Use a minimal emergency fallback only if backend fails

import { api, apiEndpoints, apiConfig } from "./api"

type ReceiptPayload = {
  cart: Array<{ name: string; price: number; quantity: number; total: number; sku?: string }>
  subtotal: number
  discount: number
  tax: number
  total: number
  sale: any // backend sale object (may contain outlet, business, payments, cashier, created_at, etc.)
}

// Optional backend endpoints to support certificate-based auto-approval in QZ Tray.
// Backend should implement a secure signing endpoint and a certificate endpoint.
const QZ_CERT_PEM_ENDPOINT = `${apiConfig.baseURL}/outlets/qz_certificate/`
const QZ_SIGN_ENDPOINT = `${apiConfig.baseURL}/outlets/qz_sign/`

async function configureQzSecurity(): Promise<void> {
  if (typeof window === "undefined") return
  const anyWin: any = window
  if (!anyWin.qz || !anyWin.qz.security) return

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
  const certHeaders: Record<string, string> = { "Content-Type": "text/plain" }
  const signHeaders: Record<string, string> = { "Content-Type": "application/json" }
  if (token) {
    certHeaders.Authorization = `Bearer ${token}`
    signHeaders.Authorization = `Bearer ${token}`
  }

  try {
    // Always attempt to probe endpoints. Even if previously configured, probes may
    // fail (expired token, rotated key, etc.), so we overwrite the client-side hooks
    // with safe no-op functions when probes fail to avoid unhandled runtime errors.

    // Probe certificate endpoint first.
    let pem: string | null = null
    try {
      const certResp = await fetch(QZ_CERT_PEM_ENDPOINT, { headers: certHeaders })
      if (certResp.ok) {
        pem = await certResp.text()
      } else {
        const body = await certResp.text().catch(() => '')
        // eslint-disable-next-line no-console
        console.warn(`QZ certificate probe failed (${certResp.status}): ${body}`)
      }
    } catch (err) {
      // Network or CORS error - log and proceed to set safe fallbacks
      // eslint-disable-next-line no-console
      console.warn("QZ certificate probe network error", err)
    }

    // Probe sign endpoint with a lightweight probe to ensure signing is permitted
    let signAvailable = false
    try {
      const probeResp = await fetch(QZ_SIGN_ENDPOINT, {
        method: "POST",
        headers: signHeaders,
        body: JSON.stringify({ data: "probe-signature" }),
      })
      if (probeResp.ok) {
        signAvailable = true
      } else {
        const body = await probeResp.text().catch(() => '')
        // eslint-disable-next-line no-console
        console.warn(`QZ signing probe failed (${probeResp.status}): ${body}`)
      }
    } catch (err) {
      // Network or CORS error - log and proceed to set safe fallbacks
      // eslint-disable-next-line no-console
      console.warn("QZ signing probe network error", err)
    }

    // Register certificate promise (resolve to PEM if available, otherwise null)
    anyWin.qz.security.setCertificatePromise(() => Promise.resolve(pem))

    // Register signature promise. Always catch errors and return an empty string on failure
    // to avoid unhandled runtime exceptions in QZ Tray. An empty signature indicates
    // signing was not completed; QZ will fall back to manual approval flow.
    anyWin.qz.security.setSignaturePromise(async (toSign: string) => {
      try {
        if (!signAvailable) {
          // Signing not available - return empty string to avoid throwing
          return ''
        }
        const r = await fetch(QZ_SIGN_ENDPOINT, {
          method: "POST",
          headers: signHeaders,
          body: JSON.stringify({ data: toSign }),
        })
        if (!r.ok) {
          const body = await r.text().catch(() => '')
          // eslint-disable-next-line no-console
          console.warn(`Failed to sign QZ payload (${r.status}): ${body}`)
          return ''
        }
        return r.text()
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("QZ signing failed", err)
        return ''
      }
    })

    (anyWin as any).__qzSecurityConfigured = true
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("QZ security configuration failed", err)
  }
}

async function ensureQzConnected(): Promise<void> {
  if (typeof window === "undefined") throw new Error("Must run in browser")
  const anyWin: any = window
  if (!anyWin.qz) {
    // Load QZ Tray library if it's not already present
    const script = document.createElement("script")
    script.src = "https://unpkg.com/qz-tray/dist/qz-tray.js"
    document.head.appendChild(script)
    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load QZ Tray library"))
    })
  }

  // Configure optional security hooks so QZ Tray can auto-approve this client
  // (requires server endpoints that return PEM cert and signatures)
  await configureQzSecurity()

  // Ensure websocket connected (with retries)
  if (!anyWin.qz.websocket.isActive()) {
    try {
      await anyWin.qz.websocket.connect()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("QZ websocket connection failed", err)
      // Let caller handle retry/backoff as appropriate
      throw err
    }
  }
}

/**
 * Scan available printers using QZ Tray and optionally persist a chosen default.
 * - Returns an array of printer names.
 * - If `persistDefault` is true and printers exist, the first printer will be
 *   stored in localStorage under `defaultPrinter` (or you can call your own API
 *   to persist per-outlet default printer).
 */
export async function scanPrinters(persistDefault = true): Promise<string[]> {
  if (typeof window === "undefined") return []
  const anyWin: any = window
  await ensureQzConnected()
  try {
    const printers: string[] = await anyWin.qz.printers.find()
    if (Array.isArray(printers) && printers.length > 0 && persistDefault) {
      try {
        localStorage.setItem("defaultPrinter", printers[0])
      } catch {
        // ignore localStorage errors
      }
    }
    return printers || []
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("Failed to scan printers via QZ Tray", err)
    return []
  }
}

async function getDefaultPrinterNameForOutlet(outletId: number | string): Promise<string | null> {
  try {
    const response: any = await api.get(`${apiEndpoints.printers.list}?outlet=${outletId}`)
    const list = Array.isArray(response) ? response : (response.results || [])
    const def = list.find((p: any) => p.is_default || p.isDefault)
    if (def) return String(def.identifier || def.name)
    if (list.length > 0) return String(list[0].identifier || list[0].name)
  } catch (err) {
    // fallback to localStorage below
  }

  try {
    if (typeof window !== "undefined") {
      return localStorage.getItem("defaultPrinter")
    }
  } catch {
    // ignore localStorage errors
  }

  return null
}

// Client-side formatting is intentionally removed to enforce Square-style rules:
// Receipts are legal documents and must be generated and stored by the backend.
// Any local/emergency formatting was a source of mismatch; do not add fallbacks here.

/**
 * Print a receipt using QZ Tray.
 *
 * Behavior:
 *  - Always try the backend ESC/POS endpoint first (/escpos-receipt/).
 *  - If backend returns an ESC/POS base64 payload, print it raw via QZ Tray.
 *  - If backend call fails or returns no escpos payload, fall back to a minimal client-side receipt.
 *
 * Safety:
 *  - Preserves QZ Tray connection checks and printer resolution logic.
 */
export async function printReceipt(payload: ReceiptPayload, outletId?: number | string): Promise<void> {
  if (typeof window === "undefined") throw new Error("Printing must be initiated from the browser")

  let printerName = outletId
    ? await getDefaultPrinterNameForOutlet(outletId)
    : (typeof window !== "undefined" ? localStorage.getItem("defaultPrinter") : null)

  // If no printer configured, attempt a scan and persist the first found printer locally
  if (!printerName) {
    // Scan printers and automatically persist the first found as a default.
    const found = await scanPrinters(true)
    if (found && found.length > 0) {
      printerName = found[0]
    }
  }

  if (!printerName) throw new Error("No printer configured for this outlet")

  await ensureQzConnected()

  const anyWin: any = window
  const config = anyWin.qz.configs.create(printerName)

  // 1) Prefer backend-generated ESC/POS payload
  try {
    const saleId = (payload.sale && (payload.sale.id || (payload.sale._raw && payload.sale._raw.id)))
    if (saleId) {
      // Try to GET an existing escpos payload
      let esc: any = await api.get(`${apiEndpoints.sales.get(String(saleId))}escpos-receipt/`)
      if (esc && esc.format === "escpos" && esc.content) {
        // Print backend base64 ESC/POS raw bytes
        await anyWin.qz.print(config, [{ type: "raw", format: "base64", data: esc.content }])
        return
      }

      // If none, request server to generate one on-demand, then retry GET
      try {
        await api.post(`${apiEndpoints.sales.get(String(saleId))}generate-receipt/`, { format: 'escpos' })
        esc = await api.get(`${apiEndpoints.sales.get(String(saleId))}escpos-receipt/`)
        if (esc && esc.format === "escpos" && esc.content) {
          await anyWin.qz.print(config, [{ type: "raw", format: "base64", data: esc.content }])
          return
        }
      } catch (genErr) {
        // Generation failed or not available
        // eslint-disable-next-line no-console
        console.warn('On-demand escpos generation failed', genErr)
      }
    }

    // If we reach here, no escpos payload was returned. Per Square-style rules,
    // the frontend must NOT fabricate or fallback to local formatting. Throw a
    // hard error so the POS can handle it explicitly (retry, notify user, etc.).
    throw new Error('ESC/POS receipt missing: backend did not provide an ESC/POS payload')
  } catch (err) {
    // Bubble up the error to caller; printing must only succeed with server-provided ESC/POS
    // eslint-disable-next-line no-console
    console.error('Printing failed: ESC/POS payload unavailable or backend error', err)
    throw err
  }
}

export default printReceipt

/**
 * Open the receipts settings page in a new tab so admins can quickly edit templates/tenant name.
 * (This helper is UI convenience only and does not change backend behavior.)
 */
export function openReceiptSettings(): void {
  if (typeof window === "undefined") return
  try {
    const origin = window.location ? window.location.origin : ""
    const url = `${origin}/dashboard/settings/receipts`
    window.open(url, "_blank")
  } catch (e) {
    // ignore any navigation errors
  }
}
