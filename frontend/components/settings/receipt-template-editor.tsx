"use client"

import React, { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

// Templates are editable UI artifacts. DO NOT provide UI here to edit stored receipts.
// Receipts are immutable legal records and can only be regenerated (which creates
// a new immutable record) by authorized users via the backend APIs.
export function ReceiptTemplateEditor({ template, onSaved }: any) {
  const [name, setName] = useState(template?.name || 'Default Template')
  const [format, setFormat] = useState(template?.format || 'text')
  const [content, setContent] = useState(template?.content || '')
  const [isDefault, setIsDefault] = useState(Boolean(template?.is_default))
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = { name, format, content, is_default: isDefault }
      if (template && template.id) {
        await api.patch(`/receipt-templates/${template.id}/`, payload)
      } else {
        await api.post(`/receipt-templates/`, payload)
      }
      onSaved && onSaved()
    } catch (err) {
      console.error('Save template failed', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <div className="mt-3">
        <Label>Template Name</Label>
        <Input value={name} onChange={(e:any) => setName(e.target.value)} />
      </div>

      <div className="mt-3">
        <Label>Template Format</Label>
        <select value={format} onChange={(e) => setFormat(e.target.value)} className="rounded-md border px-2 py-1">
          <option value="text">Plain text</option>
          <option value="html">HTML</option>
          <option value="json">JSON</option>
        </select>
      </div>

      <div className="mt-3">
        <Label>Template Content</Label>
        <Textarea value={content} onChange={(e:any) => setContent(e.target.value)} className="min-h-[200px]" />
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Checkbox id="is-default-editor" checked={isDefault} onCheckedChange={(v) => setIsDefault(Boolean(v))} />
        <Label htmlFor="is-default-editor">Set as default template</Label>
      </div>

      <div className="flex gap-2 mt-3">
        <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Template'}</Button>
      </div>
    </div>
  )
}
