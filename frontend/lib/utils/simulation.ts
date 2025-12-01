// Simulation Mode Utilities
import type { MockDatabase } from "../types/mock-data"
import { loadDB, saveDB, getEmptyDB } from "../mockApi"

/**
 * Reset all simulation data
 * Clears all localStorage and reloads default mock data
 */
export function resetSimulation(): void {
  if (typeof window === "undefined") return

  try {
    // Clear all PrimePOS-related localStorage keys
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (
        key.startsWith("primepos_") ||
        key.startsWith("primepos-") ||
        key === "activeShift" ||
        key === "primepos_mock_db"
      )) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    // Initialize with empty database
    const emptyDB = getEmptyDB()
    saveDB(emptyDB)
    
    // Clear Zustand stores by removing their persisted data
    // Note: Zustand persist middleware stores data with the key we specify
    // We've already cleared them above, but this ensures everything is reset
    
    // Reload page to reset all state
    window.location.href = "/auth/login"
  } catch (error) {
    console.error("Error resetting simulation:", error)
    throw error
  }
}

/**
 * Export all mock data as JSON
 * Downloads a JSON file with all simulation data
 */
export function exportMockData(): void {
  if (typeof window === "undefined") return

  try {
    const db = loadDB()
    
    // Get all Zustand stores data
    const authData = localStorage.getItem("primepos-auth")
    const businessData = localStorage.getItem("primepos-business")
    const posData = localStorage.getItem("primepos-pos")
    const activeShift = localStorage.getItem("activeShift")
    
    const exportData = {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      mockDatabase: db,
      stores: {
        auth: authData ? JSON.parse(authData) : null,
        business: businessData ? JSON.parse(businessData) : null,
        pos: posData ? JSON.parse(posData) : null,
        activeShift: activeShift ? JSON.parse(activeShift) : null,
      },
    }
    
    // Create download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `primepos-simulation-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error exporting mock data:", error)
    throw error
  }
}

/**
 * Import mock data from JSON file
 */
export function importMockData(jsonData: string): void {
  if (typeof window === "undefined") return

  try {
    const data = JSON.parse(jsonData)
    
    // Restore mock database
    if (data.mockDatabase) {
      saveDB(data.mockDatabase)
    }
    
    // Restore Zustand stores
    if (data.stores) {
      if (data.stores.auth) {
        localStorage.setItem("primepos-auth", JSON.stringify(data.stores.auth))
      }
      if (data.stores.business) {
        localStorage.setItem("primepos-business", JSON.stringify(data.stores.business))
      }
      if (data.stores.pos) {
        localStorage.setItem("primepos-pos", JSON.stringify(data.stores.pos))
      }
      if (data.stores.activeShift) {
        localStorage.setItem("activeShift", JSON.stringify(data.stores.activeShift))
      }
    }
    
    // Reload page to apply changes
    window.location.reload()
  } catch (error) {
    console.error("Error importing mock data:", error)
    throw error
  }
}

/**
 * Check if simulation mode is active
 */
export function isSimulationMode(): boolean {
  // Simulation mode is always active in this implementation
  return true
}

