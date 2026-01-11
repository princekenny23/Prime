# PrimePOS — Architecture & Data Flow Guide 🚀

This document explains, step-by-step, how data flows through PrimePOS — from a user action in the Next.js frontend to persistence and response in the Django REST backend. It includes concrete examples for Sale, Product, and Receipt flows, an error-handling guide, a file connection map, and a practical debugging checklist.

---

## Architecture Diagram 🗺️

```mermaid
%% Architecture diagram showing key components and flows
flowchart LR
  subgraph Frontend [Frontend (Next.js)]
    UI["Pages / Components / Modals\n(e.g., POS page, CreateSaleModal)"]
    Services["Services (saleService, productService, receiptService)"]
    Hooks["Hooks (useBarcodeScanner, stores)"]
    UI --> Services
    Hooks --> Services
  end

  APIClient["API Client (lib/api.ts)\nAdds auth & tenant headers"]
  Services --> APIClient

  APIClient -->|HTTP/JSON| BackendAPI["Django REST (ViewSets/Views)"]

  subgraph Backend [Backend (Django + DRF)]
    View["ViewSet / View\n(e.g., SaleViewSet.create)"]
    Serializer["Serializer\n(e.g., SaleSerializer validates payload)"]
    Service["Backend Services\n(receipt generation / stock adjustments)"]
    Model["Models\n(Sale, SaleItem, Product, Variation)"]
    DB[("Database\n(Postgres)")]

    View --> Serializer
    Serializer --> Model
    Model --> DB
    Serializer --> Service
    Service -->|returns| View
  end

  BackendAPI --> View
  View -->|JSON Response| APIClient
  APIClient --> Services

  %% Optional printing flow
  Service --> ESC["ESC/POS Generator (bytes/base64)"]
  ESC -->|sent to| QZ["Client print helper (QZ Tray)"]
  QZ -->|prints| POSPrinter["Receipt printer"]

  %% Lookup flow (barcode)
  Hooks -->|barcode event| Services
  Services -->|lookup| BackendAPI
  BackendAPI --> ProductView["ProductViewSet.lookup"]
  ProductView --> Serializer
  Serializer --> Model
  Model --> DB
  ProductView -->|JSON| APIClient
  APIClient --> Services
```

## 1) High-level overview 🔭

- Frontend (Next.js) communicates with Backend (Django + DRF) using REST API endpoints (fetch/axios).
- Request lifecycle:
  1. User action triggers frontend code (component/modal/page)
  2. Frontend calls service (e.g., `saleService.create(payload)`)
  3. API request reaches Django view/viewset
  4. Permissions/middleware run, serializer validates
  5. Model is saved; response returned
  6. Frontend updates UI state

- Authentication & Tenant Context
  - Auth is typically an access token or cookie sent with each request.
  - Tenant or outlet context can be: encoded in token, provided by a header (e.g., `X-Outlet-ID`), or inferred from the authenticated user. On the frontend, context is stored in `useBusinessStore`/`useTenant`.

---

## 2) Backend flow (Django) — what each file does 🔁

- `models.py` — database representation (tables). Example: `Sale`, `SaleItem`, `Product`, `ItemVariation`.
- `serializers.py` — converts model instances <-> JSON and validates incoming payloads. If validation fails, DRF returns 400 with field errors.
- `views.py` / `viewsets.py` — handle requests, run serializer logic, return responses.
- `urls.py` / `router` — map viewsets to endpoints (e.g., `router.register('sales', SaleViewSet)`).
- `permissions` & `middleware` — control access, inject tenant context or request metadata.

Real example: `Sale` creation flow
1. `POST /api/v1/sales/` -> `SaleViewSet.create()`
2. `SaleSerializer` validates items and total
3. `serializer.save()` creates `Sale` and `SaleItem` objects and returns serialized result

---

## 3) Frontend flow (Next.js) — how pages, components, and services connect 🧭

- Page vs component vs modal
  - Page (e.g., `app/dashboard/inventory/products/page.tsx`): route-level UI.
  - Component (e.g., `components/pos/retail-pos.tsx`): reusable pieces.
  - Modal (e.g., `components/modals/AddEditProductModal.tsx`): dialog with form and submission logic.

- Where API calls live
  - `frontend/lib/api.ts`: base client and auth handling
  - `frontend/lib/services/*`: resource APIs (productService, saleService, receiptService)

- Modal flow (CreateSaleModal)
  1. Parent page toggles `showModal`
  2. Modal manages local inputs/state
  3. On submit, modal calls service and handles loading/validation UI
  4. On success, modal closes and parent reloads or updates state

- Form data
  - Use controlled inputs or form library
  - Ensure payload matches serializer keys and nested structures

---

## 4) End-to-end example: Create Sale (detailed) 🎯

1. Cashier clicks **Create Sale** (POS page) -> `CreateSaleModal` opens.
2. Cashier completes cart and submits.
3. Frontend calls `saleService.create(payload)` (POST `/api/v1/sales/`).
4. Django `SaleViewSet.create()` checks auth & permissions.
5. `SaleSerializer` validates each item and totals; on fail -> return 400 with detailed errors.
6. `serializer.save()` creates `Sale`, `SaleItem`, updates stock, triggers receipts/notifications.
7. Backend returns `201` with serialized sale.
8. Frontend receives response, closes modal, updates UI, and optionally requests a receipt for printing.

---

## 5) Error handling guide — diagnose quickly ⚠️

- 400 Bad Request: serializer validation errors — check response JSON for field-specific messages.
- 401 Unauthorized: token missing or invalid.
- 403 Forbidden: permission or tenant mismatch.
- 404 Not Found: invalid endpoint or resource.
- 500 Internal Server Error: unhandled exceptions — check server logs for stack traces.

Tracing process:
1. Reproduce and inspect Network tab.
2. Check request headers & payload (Auth, tenant header).
3. Read response body (DRF returns helpful validation messages).
4. If 500, consult Django logs, capture exception stack trace and line numbers.

Quick tip: If response is `400`, add `console.log(payload)` and run serializer validation in Django shell to reproduce errors.

---

## 6) File connection map — quick reference 🔗

**Frontend**
```
components/modals/CreateSaleModal.tsx   // modal UI + submit logic
lib/services/saleService.ts              // create/list/get sale methods
app/dashboard/pos/page.tsx               // page that opens modal
lib/api.ts                               // attaches headers and base URL
```

**Backend**
```
backend/apps/sales/models.py             // Sale, SaleItem models
backend/apps/sales/serializers.py        // SaleSerializer validate/create
backend/apps/sales/views.py              // SaleViewSet handles endpoint
backend/apps/sales/urls.py               // router.register('sales', SaleViewSet)
backend/apps/sales/services.py           // receipt generation
```

How they connect: Page -> Modal -> service -> API request -> viewset -> serializer -> model -> response -> UI update

---

## 7) Debugging checklist — follow this every time ✅

1. Reproduce in the browser; capture the Network request.
2. Verify headers: Authorization and tenant/outlet header.
3. Compare payload shape to serializer fields.
4. If 400: inspect `response.json()` for field messages.
5. If 401/403: check token & permissions.
6. If 500: read server stack trace in console or logs.
7. Add debug logs in serializer/view and reproduce locally.
8. Create a unit test reproducing the failing payload.

---

## 8) Next steps and helpful additions ✨

- Add `docs/diagram.mmd` (Mermaid) for a visual flow.
- Add serializer unit tests for `Sale` and `Product`.
- Add example request payloads in `tests/fixtures` to speed up debugging.

---

If you'd like, I can:
- Add a `docs/diagram.mmd` mermaid file and a small unit test for `SaleSerializer` and open a PR with tests and documentation.

Tell me which of these you'd like next and I'll prepare a PR. 👇