"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"

export function ReceiptTemplatePreview({ templateId }: any) {
  // Preview is rendered by the backend using deterministic sample data to ensure
  // the preview matches production rendering. The frontend does not render or
  // modify template output locally for auditability and parity.
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [format, setFormat] = useState<string | null>(null)

  const loadPreview = async () => {
    if (!templateId) return
    setLoading(true)
    try {
      const res = await api.post(`/receipt-templates/${templateId}/preview/`, {}) as { preview: string; format: string }
      setPreview(res.preview)
      setFormat(res.format)
    } catch (err) {
      console.error('Preview failed', err)
      setPreview('Failed to render preview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Label>Preview</Label>
      <div className="flex gap-2 mt-2">
        <Button onClick={loadPreview} disabled={!templateId || loading}>{loading ? 'Loading...' : 'Load Preview'}</Button>
      </div>

      {preview && (
        <div className="mt-3 border p-3 bg-white text-sm">
          {/* Render HTML previews safely for admin UIs only; ensure sanitization if exposing to tenants */}
          {format === 'html' ? (
            <div dangerouslySetInnerHTML={{ __html: preview }} />
          ) : (
            <pre className="whitespace-pre-wrap text-xs">{preview}</pre>
          )}
        </div>
      )}
    </div>
  )
}
