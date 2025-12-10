# Tenant/Outlet Isolation Architecture

## Overview
This document explains how tenant and outlet isolation works in PrimePOS, specifically addressing the relationship between products, outlets, and tenant data.

## Key Principle
**Products are TENANT-LEVEL (shared across all outlets), NOT outlet-specific.**

## Data Isolation Rules

### Tenant Level (Shared Across All Outlets):
- ✅ **Products** - Created once, visible at all outlets
- ✅ **Categories** - Shared product categories
- ✅ **Customers** - Shared customer database
- ✅ **Suppliers** - Shared supplier database
- ✅ **Users** - User accounts (with outlet-specific permissions)

### Outlet Level (Isolated Per Outlet):
- ✅ **Sales/Transactions** - Each outlet has its own sales
- ✅ **Inventory Stock (LocationStock)** - Stock levels per outlet
- ✅ **Stock Movements** - Movement history per outlet
- ✅ **Shifts** - Shift management per outlet
- ✅ **Reports** - Can be filtered by outlet
- ✅ **Tills** - Till management per outlet

## How Products Work

### Product Creation
1. Products are created at the **tenant level**
2. When a user creates a product in Outlet A, it's available in ALL outlets
3. The product is stored with `tenant` foreign key, NOT `outlet`

### Product Visibility
- Products are **always visible** across all outlets in the same tenant
- Switching outlets does NOT filter products
- Products list shows ALL tenant products regardless of current outlet

### Stock Per Outlet
- While products are shared, **stock levels are outlet-specific**
- Each outlet has its own `LocationStock` records
- Stock is tracked per variation per outlet
- When viewing products, stock shown is for the current outlet (if outlet context is provided)

## Backend Implementation

### ProductViewSet (`backend/apps/products/views.py`)

#### Query Filtering:
```python
def get_queryset(self):
    # Only filters by TENANT, NOT by outlet
    queryset = Product.objects.select_related('category', 'tenant').all()
    if not is_saas_admin:
        if tenant:
            queryset = queryset.filter(tenant=tenant)  # Tenant filter only
        else:
            return queryset.none()
    return queryset
```

#### Outlet Context (for Stock Calculations):
```python
def get_serializer_context(self):
    # Outlet is used ONLY for stock calculations, NOT for filtering products
    outlet_id = self.request.query_params.get('outlet') or self.request.headers.get('X-Outlet-ID')
    if outlet_id:
        outlet = Outlet.objects.get(id=outlet_id, tenant=tenant)
        context['outlet'] = outlet  # Used by serializer for stock calculations
    return context
```

### Product Model (`backend/apps/products/models.py`)
- Product has `tenant` ForeignKey (required)
- Product does NOT have `outlet` ForeignKey
- Stock is calculated from `LocationStock` which has both `variation` and `outlet`

## Frontend Implementation

### API Client (`frontend/lib/api.ts`)
- Automatically sends `X-Outlet-ID` header in all requests
- Reads `currentOutletId` from localStorage
- Header is used for outlet-specific data (stock, sales, etc.)

### Product Service (`frontend/lib/services/productService.ts`)
- `productService.list()` does NOT filter by outlet
- Products are fetched for the entire tenant
- Stock values reflect current outlet (if outlet header is sent)

### Product Pages
- Products page listens for `outlet-changed` event
- Refreshes products when outlet changes (to update stock values)
- Does NOT filter products by outlet

## Common Misconceptions

### ❌ WRONG: "Products should be outlet-specific"
- Products are shared across all outlets in a tenant
- This is by design - allows centralized product management

### ❌ WRONG: "Products added in Outlet A shouldn't show in Outlet B"
- Products are tenant-level, so they show in ALL outlets
- This is correct behavior

### ✅ CORRECT: "Stock levels are outlet-specific"
- Each outlet has its own stock levels
- Products show different stock values per outlet

## Troubleshooting

### Issue: "Products don't show when switching outlets"

**Possible Causes:**
1. **Frontend not refreshing** - Check if `outlet-changed` event listener is working
2. **API not returning products** - Check backend logs for tenant filtering issues
3. **Caching issue** - Clear browser cache or localStorage
4. **Wrong tenant** - Verify user has correct tenant assigned

**Solution:**
- Products should ALWAYS show regardless of outlet
- If products don't show, it's likely a tenant filtering issue, not outlet filtering

### Issue: "Stock shows wrong values when switching outlets"

**Possible Causes:**
1. **X-Outlet-ID header not sent** - Check API client
2. **Backend not reading header** - Verify `get_serializer_context()` checks headers
3. **Outlet context not set** - Check serializer context

**Solution:**
- Ensure `X-Outlet-ID` header is sent in API requests
- Verify backend reads header in `get_serializer_context()`

## Verification Checklist

- [x] Products are filtered by tenant only (not outlet)
- [x] Products show in all outlets after creation
- [x] Stock values update when switching outlets
- [x] X-Outlet-ID header is sent in API requests
- [x] Backend reads X-Outlet-ID header for stock calculations
- [x] Frontend refreshes products on outlet change
- [x] No frontend filtering of products by outlet

## Files Modified (Latest Fix)

### Backend
- `backend/apps/products/views.py`:
  - Updated `ProductViewSet.get_serializer_context()` to check `X-Outlet-ID` header
  - Updated `ItemVariationViewSet.get_serializer_context()` to check `X-Outlet-ID` header
  - Ensures outlet context is properly set for stock calculations

## Summary

**Products are tenant-level (shared) and should always be visible across all outlets. Stock levels are outlet-specific and update based on the current outlet context. The system is working as designed.**

