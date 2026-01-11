"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

export function ReceiptTemplateList({ templates, selectedId, onSelect, onDelete }: any) {
  return (
    <div>
      <Label>Saved Templates</Label>
      <div className="flex items-center gap-2 mt-2">
        <select
          value={selectedId || ''}
          onChange={(e) => onSelect(e.target.value || null)}
          className="rounded-md border px-2 py-1"
        >
          <option value="">-- New Template --</option>
          {templates.map((t: any) => (
            <option key={t.id} value={String(t.id)}>{t.name}</option>
          ))}
        </select>
        {selectedId && (
          <Button variant="destructive" size="sm" onClick={async () => {
            try {
              await api.delete(`/receipt-templates/${selectedId}/`)
              onDelete && onDelete(selectedId)
            } catch (err) {
              console.error('Delete template failed', err)
            }
          }}>Delete</Button>
        )}
      </div>
    </div>
  )
}
