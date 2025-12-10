# Outlet-Specific Products Implementation

## Summary
Products have been changed from **tenant-level (shared)** to **outlet-level (isolated)**. Each outlet now has its own independent product catalog.

## Architecture Change

### Before (Tenant-Level)
- Products were shared across all outlets in a tenant
- Product created in Outlet A would show in Outlet B
- Products filtered by tenant only

### After (Outlet-Level)
- Products are isolated per outlet
- Product created in Outlet A only shows in Outlet A
- Products filtered by both tenant AND outlet
- Each outlet has its own product catalog

## Changes Made

### 1. Model Changes (`backend/apps/products/models.py`)
- ✅ Added `outlet` ForeignKey field to `Product` model
- ✅ Added indexes for `outlet` and composite `tenant, outlet`
- ✅ Products now belong to a specific outlet

### 2. ViewSet Changes (`backend/apps/products/views.py`)
- ✅ `get_queryset()` filters by outlet (from X-Outlet-ID header or query param)
- ✅ `perform_create()` requires outlet and validates it belongs to tenant
- ✅ `update()` and `destroy()` verify outlet matches
- ✅ Bulk import requires outlet
- ✅ Updated queryset to include `outlet` in select_related

### 3. Serializer Changes (`backend/apps/products/serializers.py`)
- ✅ Added `outlet` field to `ProductSerializer`
- ✅ Outlet field is read-only (set automatically from request context)

### 4. Migration (`backend/apps/products/migrations/0010_add_outlet_to_product.py`)
- ✅ Created migration to add outlet field
- ✅ Field is nullable initially (for existing products)
- ✅ Added indexes for performance

## API Behavior

### Creating Products
**Required**: Outlet must be specified via:
- `X-Outlet-ID` header (recommended - automatically sent by frontend)
- `?outlet=<id>` query parameter
- Request body `{"outlet": <id>}`

**Example**:
```bash
POST /api/v1/products/
Headers: X-Outlet-ID: 123
Body: {
  "name": "Product Name",
  "retail_price": "10.00",
  ...
}
```

### Listing Products
Products are automatically filtered by:
1. Tenant (from user authentication)
2. Outlet (from X-Outlet-ID header)

**Example**:
```bash
GET /api/v1/products/
Headers: X-Outlet-ID: 123
# Returns only products for outlet 123
```

### Updating/Deleting Products
- Can only update/delete products that belong to the current outlet
- Outlet is validated on every operation

## Frontend Impact

### Already Implemented ✅
- `X-Outlet-ID` header is automatically sent in all API requests
- Header is set from `localStorage.getItem("currentOutletId")`
- Outlet ID is stored when switching outlets

### No Changes Required ✅
- Frontend already sends outlet header
- Products will automatically filter by current outlet
- Product creation will use current outlet automatically

## Migration Steps

### For New Installations
1. Run migrations:
   ```bash
   python manage.py migrate products
   ```

### For Existing Installations (with existing products)
1. Run initial migration:
   ```bash
   python manage.py migrate products
   ```

2. **IMPORTANT**: Assign existing products to outlets. Options:
   - Use Django admin to manually assign
   - Create a data migration (see `OUTLET_SPECIFIC_PRODUCTS_MIGRATION.md`)
   - Use management command

3. After all products have outlets, make field required (optional):
   ```python
   # Create migration to make outlet required
   # See OUTLET_SPECIFIC_PRODUCTS_MIGRATION.md for details
   ```

## Testing Checklist

- [x] Model has outlet field
- [x] ViewSet filters by outlet
- [x] Product creation requires outlet
- [x] Product update/delete validates outlet
- [x] Serializer includes outlet field
- [x] Migration created
- [ ] Run migration on test database
- [ ] Test product creation with outlet
- [ ] Test product listing filters by outlet
- [ ] Test switching outlets shows different products
- [ ] Test product update/delete respects outlet boundaries
- [ ] Test bulk import with outlet

## Breaking Changes

⚠️ **This is a breaking change**:
- Existing products without outlets will need to be assigned
- Products are no longer shared across outlets
- Each outlet must have its own product catalog

## Benefits

1. **Isolation**: Each outlet has independent product management
2. **Flexibility**: Different outlets can sell different products
3. **Security**: Products are properly isolated per outlet
4. **Scalability**: Better suited for multi-outlet businesses with different inventories

## Notes

- Categories remain tenant-level (shared) - this can be changed if needed
- Stock levels were already outlet-specific (via LocationStock)
- The frontend already sends X-Outlet-ID header, so no frontend changes needed

