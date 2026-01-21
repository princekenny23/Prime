/**
 * QZ Tray Certificate Management
 * 
 * Handles certificate generation and signing for QZ Tray
 * Certificates are cached in localStorage to avoid repeated prompts
 */

const CERT_STORAGE_KEY = "qz_certificates_v1"

interface CertificateData {
  certificate: string
  privateKey: string
  timestamp: number
}

/**
 * Pre-generated self-signed certificate for development
 * In production, replace with your own signed certificate from a CA
 */
const DEFAULT_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIEFzCCAv+gAwIBAgIUQvLUhKzMGz8cHvYxKzMxMjE0MTAwMB0GA1UdDgQWBBRO
-----END CERTIFICATE-----`

const DEFAULT_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDN9z8v8cxR
-----END PRIVATE KEY-----`

/**
 * Load cached certificates from localStorage
 */
export function loadCertificates(): CertificateData | null {
  try {
    const stored = localStorage.getItem(CERT_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error("Failed to load certificates:", error)
  }
  return null
}

/**
 * Save certificates to localStorage
 */
export function saveCertificates(cert: string, key: string): void {
  try {
    const data: CertificateData = {
      certificate: cert,
      privateKey: key,
      timestamp: Date.now(),
    }
    localStorage.setItem(CERT_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("Failed to save certificates:", error)
  }
}

/**
 * Get or create certificates for QZ Tray signing
 * Uses default certificates for seamless operation
 */
export function getOrCreateCertificates(): { certificate: string; privateKey: string } {
  // Check for cached certificates
  const cached = loadCertificates()
  if (cached && cached.certificate && cached.privateKey) {
    return {
      certificate: cached.certificate,
      privateKey: cached.privateKey,
    }
  }

  // Use default certificates
  const certificate = DEFAULT_CERTIFICATE
  const privateKey = DEFAULT_PRIVATE_KEY

  // Cache for future use
  saveCertificates(certificate, privateKey)

  return { certificate, privateKey }
}

/**
 * Set custom certificates (for production use with real CA-signed certs)
 */
export function setCustomCertificates(cert: string, key: string): void {
  saveCertificates(cert, key)
}

/**
 * Clear cached certificates
 */
export function clearCertificates(): void {
  try {
    localStorage.removeItem(CERT_STORAGE_KEY)
  } catch (error) {
    console.error("Failed to clear certificates:", error)
  }
}

/**
 * Generate SHA256 hash for QZ signing (browser implementation)
 */
export async function sha256(message: string): Promise<string> {
  if (typeof window === 'undefined') return ""
  
  try {
    const msgBuffer = new TextEncoder().encode(message)
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  } catch (error) {
    console.error("SHA256 hashing failed:", error)
    return ""
  }
}
