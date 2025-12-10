# Outlet Data Isolation Fix

## Problem
Data from different outlets within the same tenant was not being isolated. Users could see data from all outlets when they should only see data from the currently selected outlet.

## Root Cause
1. Backend views were filtering by tenant but not by outlet
2. Frontend was not sending the current outlet ID in API requests
3. No automatic outlet filtering mechanism existed

## Solution Implemented

### 1. Backend Changes

#### Added Helper Method to TenantFilterMixin
**File:** `backend/apps/tenants/permissions.py`

Added `get_outlet_for_request()` method that:
- Checks query params for `outlet` or `outlet_id`
- Checks headers for `X-Outlet-ID`
- Checks request data for `outlet` or `outlet_id`
- Validates outlet belongs to tenant
- Returns outlet instance or None

#### Updated ViewSets to Filter by Outlet

**Sales ViewSet** (`backend/apps/sales/views.py`):
- Added automatic outlet filtering in `get_queryset()`
- Filters by outlet from request if available
- Falls back to query param for backward compatibility

**Stock Movement ViewSet** (`backend/apps/inventory/views.py`):
- Added automatic outlet filtering in `get_queryset()`
- Filters by outlet from request if available
- Logs outlet filtering for debugging

**Location Stock ViewSet** (`backend/apps/inventory/views.py`):
- Added automatic outlet filtering in `get_queryset()`
- Filters by outlet from request if available

**Shift ViewSet** (`backend/apps/shifts/views.py`):
- Added automatic outlet filtering in `get_queryset()`
- Filters by outlet from request if available

**Reports** (`backend/apps/reports/views.py`):
- Added `get_outlet_id_from_request()` helper function
- Updated all report functions to check headers first, then query params
- Applied outlet filtering to:
  - `sales_report()`
  - `profit_loss_report()`
  - `stock_movement_report()`
  - `daily_sales_report()`
  - `cash_summary_report()`
  - `shift_summary_report()`

### 2. Frontend Changes

#### Updated API Client
**File:** `frontend/lib/api.ts`

- Added automatic outlet ID header injection
- Reads `currentOutletId` from localStorage
- Sends `X-Outlet-ID` header in all API requests
- Works automatically without manual intervention

#### Updated Tenant Context
**File:** `frontend/contexts/tenant-context.tsx`

- Modified `setCurrentOutlet()` to store outlet ID in localStorage
- Stores outlet ID whenever outlet is set or switched
- Removes outlet ID from localStorage when outlet is cleared
- Ensures API client always has current outlet ID

## How It Works

### Flow:
1. User switches outlet in dashboard header
2. `switchOutlet()` is called in tenant context
3. Outlet ID is stored in localStorage as `currentOutletId`
4. All subsequent API requests include `X-Outlet-ID` header
5. Backend views automatically filter by outlet from header
6. Only data for the selected outlet is returned

### Backward Compatibility:
- Query params (`?outlet=123`) still work
- Request data (`{"outlet": 123}`) still works
- Header (`X-Outlet-ID: 123`) is now the primary method

## Data Isolation Rules

### Tenant Level (Shared):
- Products
- Categories
- Customers
- Suppliers
- Users

### Outlet Level (Isolated):
- Sales/Transactions
- Inventory Stock (LocationStock)
- Stock Movements
- Shifts
- Reports (when outlet filter applied)
- Tills

## Testing Checklist

- [x] Switch outlet in dashboard header
- [x] Verify sales data filters by outlet
- [x] Verify inventory data filters by outlet
- [x] Verify stock movements filter by outlet
- [x] Verify reports filter by outlet
- [x] Verify shifts filter by outlet
- [x] Verify outlet ID is stored in localStorage
- [x] Verify API requests include X-Outlet-ID header
- [x] Verify backward compatibility with query params

## Files Modified

### Backend
- `backend/apps/tenants/permissions.py` - Added `get_outlet_for_request()` method
- `backend/apps/sales/views.py` - Added outlet filtering to `get_queryset()`
- `backend/apps/inventory/views.py` - Added outlet filtering to both ViewSets
- `backend/apps/shifts/views.py` - Added outlet filtering to `get_queryset()`
- `backend/apps/reports/views.py` - Added helper and updated all reports

### Frontend
- `frontend/lib/api.ts` - Added automatic outlet ID header injection
- `frontend/contexts/tenant-context.tsx` - Store outlet ID in localStorage

## Notes

- Outlet filtering is automatic when outlet is selected
- Users can still explicitly filter by outlet via query params if needed
- SaaS admins can see all outlets (no filtering applied)
- Regular users only see their tenant's outlets
- Data isolation is enforced at the database query level

