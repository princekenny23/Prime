Square-style Receipt Policy

Summary
- Receipt templates are editable by tenants via the Settings UI.
- Generated receipts are immutable legal records stored by the backend.
- The frontend must never modify stored receipt content.
- Printing MUST use backend-generated ESC/POS payloads (base64) and send raw bytes to QZ Tray.
- Settings pages must not trigger live printing.

Backend
- Receipts are versioned and immutable. A regenerated receipt creates a new Receipt record and voids the previous one.
- Receipt generation is template-driven. On sale completion, the backend generates canonical HTML and ESC/POS receipts.
- Endpoint: `GET /api/sales/{id}/escpos-receipt/` returns ESC/POS base64; the frontend will throw an error if this is missing.
- The old `update-content` endpoint was removed to prevent edits of stored receipts.

Frontend
- Settings UI provides template editing (`ReceiptTemplateEditor`) and server-rendered preview (`ReceiptTemplatePreview`).
- The settings page no longer edits stored receipts or triggers printing.
- The print helper (`frontend/lib/print.ts`) only prints server-supplied ESC/POS payloads and throws if not available.

Rationale
- Protects auditability and legal integrity of receipts.
- Centralizes formatting for consistent printing across clients and devices.
- Avoids client-side formatting mismatches and silent fallbacks that caused discrepancies.

Notes
- Migration: `Receipt` model was refactored to allow versioning (`is_current`, `voided`, `superseded_by`). A migration has been added to start the schema change; run `python manage.py makemigrations && python manage.py migrate` to apply.
