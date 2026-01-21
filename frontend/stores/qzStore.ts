import { create } from "zustand"
import { qzService } from "@/lib/qz/qz-service"

interface QZState {
  enabled: boolean
  connected: boolean
  printers: string[]
  selected: {
    receipt?: string
    label?: string
    kitchen?: string
  }
  setEnabled: (enabled: boolean) => Promise<void>
  refreshPrinters: () => Promise<void>
  setSelected: (type: keyof QZState["selected"], name: string) => void
  bootstrap: () => Promise<void>
}

export const useQZStore = create<QZState>((set, get) => ({
  enabled: false,
  connected: false,
  printers: [],
  selected: qzService.loadPrinters(),

  bootstrap: async () => {
    const enabled = qzService.loadEnabled()
    set({ enabled })
    if (enabled && qzService.isAvailable()) {
      try {
        await qzService.enable()
        const printers = await qzService.findPrinters()
        set({ connected: true, printers })
      } catch {
        set({ connected: false })
      }
    }
  },

  setEnabled: async (enabled: boolean) => {
    set({ enabled })
    if (enabled) {
      try {
        const { printers } = await qzService.enable()
        set({ connected: true, printers })
      } catch {
        set({ connected: false })
      }
    } else {
      await qzService.disable()
      set({ connected: false })
    }
  },

  refreshPrinters: async () => {
    const printers = await qzService.findPrinters()
    set({ printers })
  },

  setSelected: (type, name) => {
    const newSelected = { ...get().selected, [type]: name }
    qzService.savePrinters(newSelected)
    set({ selected: newSelected })
  },
}))
