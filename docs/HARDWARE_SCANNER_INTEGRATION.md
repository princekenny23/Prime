Hardware Scanner Integration

Overview
- Added a lightweight keyboard-wedge barcode scanner handler (`useBarcodeScanner`) that buffers fast keystrokes and emits a global `barcode-scanned` event.
- Integrated scanner handling into key places:
  - POS terminal: `frontend/components/pos/retail-pos.tsx` now registers a handler to look up scanned barcodes and add products to cart (handles variations, multiple matches, and product creation flow).
  - Stock Take: `frontend/app/dashboard/inventory/stock-taking/[id]/page.tsx` listens for scans and increments counts or opens product creation if not found.
  - Product creation modal: `AddEditProductModal` already listens for `barcode-scanned` and will prefill the barcode field when open.

How it works
- The hook listens for `keydown` events and treats bursts of fast characters (default gap 60ms) as a scan.
- A suffix key (default Enter) also finalizes a scan immediately.
- On detection, the hook dispatches a `CustomEvent('barcode-scanned', { detail: code })` and calls any provided `onScan(code)` callback.

Configuration
- Hook options (defaults shown):
  - `minLength: 3`
  - `suffixKey: 'Enter'`
  - `scanTimeout: 60` (ms between keys)
  - `onScan?: (code: string) => void`

Testing
- Focus anywhere in the app and use a keyboard-wedge barcode scanner (or emulate by typing a barcode quickly followed by Enter).
- Confirm that:
  - In POS, scanning a known barcode adds the product to the cart.
  - In Stock Take, scanning increments counts when item exists in the stock take, or opens the Add Product modal with barcode prefilled when missing.
  - In Add Product modal, opening the modal and scanning pre-fills the barcode input.

Next steps / TODO
- Add a Hardware Settings UI to control global scanner options (suffix key, timeout, enable/disable).
- Add integration tests and unit tests for `useBarcodeScanner`.
- Consider adding direct device access (WebHID/WebUSB) for advanced scanners that support them.
