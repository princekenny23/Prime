# Tenant/Outlet Isolation Audit

## Current Status by App

### ✅ Products
- **Model**: Has `outlet` field (required)
- **ViewSet**: Filters by both tenant AND outlet ✅
- **Status**: ✅ **CORRECT** - Outlet-specific

### ⚠️ Suppliers
- **Model**: Has `outlet` field (nullable/optional)
- **ViewSet**: Filters by tenant only, NOT automatically by outlet
- **Issue**: Suppliers can be outlet-specific but ViewSet doesn't auto-filter by outlet from header
- **Status**: ⚠️ **NEEDS FIX** - Should filter by outlet if provided

### ✅ Purchase Orders
- **Model**: Has `outlet` field (required)
- **ViewSet**: Has `filterset_fields` with outlet, but doesn't auto-filter from header
- **Issue**: Should automatically filter by outlet from X-Outlet-ID header
- **Status**: ⚠️ **NEEDS FIX** - Should auto-filter by outlet

### ✅ Supplier Invoices
- **Model**: Has `outlet` field (required)
- **ViewSet**: Has `filterset_fields` with outlet
- **Status**: ⚠️ **NEEDS FIX** - Should auto-filter by outlet

### ✅ Purchase Returns
- **Model**: Has `outlet` field (required)
- **ViewSet**: Has `filterset_fields` with outlet
- **Status**: ⚠️ **NEEDS FIX** - Should auto-filter by outlet

### ✅ Staff
- **Model**: 
  - Role: Tenant-only ✅
  - Staff: Tenant + ManyToMany outlets ✅
  - Attendance: Outlet-specific ✅
- **ViewSet**: 
  - Role: Tenant-only ✅
  - Staff: Tenant-only ✅ (correct - staff can work at multiple outlets)
  - Attendance: Filters by outlet ✅
- **Status**: ✅ **CORRECT**

### ✅ Shifts
- **Model**: Has `outlet` field (required)
- **ViewSet**: Filters by both tenant AND outlet ✅
- **Status**: ✅ **CORRECT** - Outlet-specific

### ✅ Sales
- **Model**: Has `outlet` field (required)
- **ViewSet**: Filters by both tenant AND outlet ✅
- **Status**: ✅ **CORRECT** - Outlet-specific

### ⚠️ Reports
- **Model**: N/A (function-based views)
- **Views**: Uses `get_outlet_id_from_request()` but only filters if outlet_id provided
- **Issue**: Should automatically filter by outlet from X-Outlet-ID header
- **Status**: ⚠️ **NEEDS FIX** - Should auto-filter by outlet

### ✅ Outlets
- **Model**: Tenant-only (correct)
- **ViewSet**: Filters by tenant only ✅
- **Status**: ✅ **CORRECT** - Tenant-specific

### ✅ Notifications
- **Model**: Tenant-only (no outlet field)
- **ViewSet**: Filters by tenant only ✅
- **Status**: ✅ **CORRECT** - Tenant-level (shared)

## Summary

### ✅ Correctly Isolated (6 apps):
1. Products - Outlet-specific ✅
2. Shifts - Outlet-specific ✅
3. Sales - Outlet-specific ✅
4. Staff - Tenant-level (correct) ✅
5. Outlets - Tenant-level ✅
6. Notifications - Tenant-level ✅

### ✅ Fixed (5 apps):
1. Suppliers - ✅ Now filters by outlet if provided
2. Purchase Orders - ✅ Now auto-filters by outlet (required)
3. Supplier Invoices - ✅ Now auto-filters by outlet (required)
4. Purchase Returns - ✅ Now auto-filters by outlet (required)
5. Reports - ✅ All outlet-specific reports now require outlet

## Fixes Applied

### 1. Suppliers ✅
- Added automatic outlet filtering from X-Outlet-ID header
- Outlet is optional in model, so filters only if outlet provided
- Updated `SupplierViewSet.get_queryset()` to filter by outlet

### 2. Purchase Orders ✅
- Added automatic outlet filtering from X-Outlet-ID header
- Outlet is required, returns empty queryset if no outlet
- Updated `PurchaseOrderViewSet.get_queryset()` and `perform_create()`

### 3. Supplier Invoices ✅
- Added automatic outlet filtering from X-Outlet-ID header
- Outlet is required, returns empty queryset if no outlet
- Updated `SupplierInvoiceViewSet.get_queryset()` and `perform_create()`

### 4. Purchase Returns ✅
- Added automatic outlet filtering from X-Outlet-ID header
- Outlet is required, returns empty queryset if no outlet
- Updated `PurchaseReturnViewSet.get_queryset()` and `perform_create()`

### 5. Reports ✅
- Updated all outlet-specific reports to require outlet:
  - `sales_report` - Requires outlet
  - `products_report` - Requires outlet
  - `profit_loss_report` - Requires outlet
  - `stock_movement_report` - Requires outlet
  - `daily_sales_report` - Requires outlet
  - `top_products_report` - Requires outlet
  - `cash_summary_report` - Requires outlet
  - `shift_summary_report` - Requires outlet
- `customers_report` remains tenant-level (customers are shared)

## Final Status

### ✅ All Apps Correctly Isolated:
1. Products - Outlet-specific ✅
2. Suppliers - Filters by outlet if provided ✅
3. Purchase Orders - Outlet-specific ✅
4. Supplier Invoices - Outlet-specific ✅
5. Purchase Returns - Outlet-specific ✅
6. Shifts - Outlet-specific ✅
7. Sales - Outlet-specific ✅
8. Reports - Outlet-specific (where applicable) ✅
9. Staff - Tenant-level (correct) ✅
10. Outlets - Tenant-level ✅
11. Notifications - Tenant-level ✅

