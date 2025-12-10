# Outlet Flow Implementation Summary

## Overview
This document summarizes the implementation of the outlet switching flow across the entire codebase, enabling seamless multi-outlet management for tenants.

## Implementation Date
Completed: Current Session

## Key Features Implemented

### 1. Outlet Switcher in Dashboard Header
**Location:** `frontend/components/layouts/dashboard-layout.tsx`

- Added dropdown menu for outlet switching in the dashboard header
- Only displays when tenant has multiple outlets (`outlets.length > 1`)
- Shows current outlet name with store icon
- Displays all active outlets in dropdown
- Highlights current outlet with checkmark
- Provides visual feedback during switching (loading state)

**Key Code:**
```typescript
{outlets.length > 1 && currentOutlet ? (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm" className="h-8 gap-2">
        <Store className="h-4 w-4" />
        <span className="font-medium">{currentOutlet.name}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    {/* Outlet list */}
  </DropdownMenu>
) : (
  /* Single outlet display */
)}
```

### 2. Auto-Refresh Mechanism
**Location:** `frontend/contexts/tenant-context.tsx`

- Implemented custom event dispatch on outlet switch
- Dispatches `outlet-changed` event with outlet details
- Updates both tenant context and business store synchronously

**Key Code:**
```typescript
// Dispatch custom event to notify all components
if (typeof window !== "undefined") {
  window.dispatchEvent(new CustomEvent("outlet-changed", {
    detail: {
      outletId: outlet.id,
      outletName: outlet.name,
      outlet: outlet
    }
  }))
}
```

### 3. Event Listeners on All Dashboard Pages

#### Dashboard Pages Updated:
1. **Main Dashboard** (`frontend/app/dashboard/page.tsx`)
   - Listens for `outlet-changed` event
   - Refreshes KPI data, charts, activities, and top items

2. **Retail Dashboard** (`frontend/app/dashboard/retail/dashboard/page.tsx`)
   - Listens for `outlet-changed` event
   - Refreshes all dashboard metrics

3. **Restaurant Dashboard** (`frontend/app/dashboard/restaurant/dashboard/page.tsx`)
   - Listens for `outlet-changed` event
   - Refreshes dashboard data

4. **Bar Dashboard** (`frontend/app/dashboard/bar/dashboard/page.tsx`)
   - Listens for `outlet-changed` event
   - Refreshes dashboard data

### 4. Event Listeners on Inventory Pages

#### Inventory Pages Updated:
1. **Low Stock Page** (`frontend/app/dashboard/inventory/low-stock/page.tsx`)
   - Listens for `outlet-changed` event
   - Refreshes low stock items for new outlet

2. **Receiving Page** (`frontend/app/dashboard/inventory/receiving/page.tsx`)
   - Listens for `outlet-changed` event
   - Refreshes receiving data

3. **Stock Adjustments Page** (`frontend/app/dashboard/inventory/stock-adjustments/page.tsx`)
   - Listens for `outlet-changed` event
   - Refreshes adjustments list

### 5. Event Listeners on Sales Pages

#### Sales Pages Updated:
1. **Transactions Page** (`frontend/app/dashboard/sales/transactions/page.tsx`)
   - Listens for `outlet-changed` event
   - Automatically updates outlet filter to current outlet
   - Refreshes sales data

### 6. Event Listeners on Products Page

#### Products Page Updated:
1. **Products Page** (`frontend/app/dashboard/products/page.tsx`)
   - Listens for `outlet-changed` event
   - Refreshes product catalog
   - Maintains existing auto-refresh mechanisms (30s polling, visibility/focus listeners)

## Implementation Pattern

All pages follow a consistent pattern for outlet change handling:

```typescript
useEffect(() => {
  if (currentBusiness) {
    loadData()
    
    // Listen for outlet changes
    const handleOutletChange = () => {
      loadData()
    }
    window.addEventListener("outlet-changed", handleOutletChange)
    
    return () => {
      window.removeEventListener("outlet-changed", handleOutletChange)
    }
  }
}, [currentBusiness, currentOutlet, /* other dependencies */])
```

## User Experience Flow

1. **User clicks outlet switcher** in dashboard header
2. **Dropdown displays** all active outlets
3. **User selects new outlet**
4. **System switches outlet**:
   - Updates tenant context
   - Updates business store
   - Dispatches `outlet-changed` event
   - Shows toast notification
   - Triggers router refresh
5. **All pages automatically refresh**:
   - Dashboard pages reload metrics
   - Inventory pages reload stock data
   - Sales pages reload transactions
   - Products page reloads catalog
6. **Data is filtered** by new outlet automatically

## Outlet Filtering

All data fetching respects the current outlet:

- **Dashboard KPIs**: Filtered by `outletId`
- **Sales Data**: Filtered by `outlet` parameter
- **Inventory Data**: Filtered by outlet through backend `TenantFilterMixin`
- **Stock Levels**: Per-outlet via `LocationStock` model

## Backend Integration

The implementation leverages existing backend features:

- **TenantFilterMixin**: Automatically filters data by tenant
- **LocationStock Model**: Manages per-outlet inventory
- **Outlet Filtering**: API endpoints support outlet filtering

## Testing Checklist

- [x] Outlet switcher appears only when multiple outlets exist
- [x] Outlet switcher displays current outlet name
- [x] Switching outlet updates context and store
- [x] Custom event is dispatched on switch
- [x] All dashboard pages refresh on outlet change
- [x] All inventory pages refresh on outlet change
- [x] Sales pages refresh and update filter on outlet change
- [x] Products page refreshes on outlet change
- [x] Toast notification shows on successful switch
- [x] Error handling for failed switches
- [x] Loading state during switch operation

## Future Enhancements

Potential improvements for future iterations:

1. **Persistent Outlet Selection**: Remember last selected outlet per user
2. **Outlet-Specific Permissions**: Control access per outlet
3. **Cross-Outlet Analytics**: Compare metrics across outlets
4. **Outlet-Specific Settings**: Customize settings per outlet
5. **Bulk Operations**: Perform actions across multiple outlets

## Files Modified

### Core Components
- `frontend/components/layouts/dashboard-layout.tsx` - Added outlet switcher
- `frontend/contexts/tenant-context.tsx` - Added event dispatch

### Dashboard Pages
- `frontend/app/dashboard/page.tsx`
- `frontend/app/dashboard/retail/dashboard/page.tsx`
- `frontend/app/dashboard/restaurant/dashboard/page.tsx`
- `frontend/app/dashboard/bar/dashboard/page.tsx`

### Inventory Pages
- `frontend/app/dashboard/inventory/low-stock/page.tsx`
- `frontend/app/dashboard/inventory/receiving/page.tsx`
- `frontend/app/dashboard/inventory/stock-adjustments/page.tsx`

### Sales Pages
- `frontend/app/dashboard/sales/transactions/page.tsx`

### Products Pages
- `frontend/app/dashboard/products/page.tsx`

## Conclusion

The outlet flow implementation is complete and production-ready. All pages now automatically refresh when users switch outlets, ensuring data consistency and a seamless multi-outlet experience. The implementation follows React best practices with proper event cleanup and dependency management.

