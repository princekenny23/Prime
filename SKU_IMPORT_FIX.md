# SKU Import Fix - Unique Constraint Issue

## Problem
When importing multiple products without SKU values, the import was failing with:
```
duplicate key value violates unique constraint "products_product_tenant_id_sku_5846d4a0_uniq"
Key (tenant_id, sku)=(20, ) already exists.
```

## Root Cause
1. The database had a unique constraint on `(tenant_id, sku)`
2. When products were imported without SKU, they all had empty strings `''` for SKU
3. Multiple products with empty SKU strings all had the same `(tenant_id, '')` combination, violating the unique constraint

## Solution

### 1. Made SKU Nullable
- Updated `Product.sku` to allow `null=True`
- Updated `ItemVariation.sku` to allow `null=True`
- This allows multiple products to have NULL SKU values (NULL != NULL in unique constraints)

### 2. Updated Serializers
- Changed empty string handling to use `None` instead of `''`
- Updated `validate_sku()` methods to return `None` for empty values
- Updated `validate()` method to set `attrs['sku'] = None` instead of `attrs['sku'] = ''`

### 3. Updated Import Logic
- Modified bulk import to only include SKU if it's provided and not empty
- Changed from `if sku: product_data['sku'] = sku` to `if sku and sku.strip(): product_data['sku'] = sku.strip()`

### 4. Created Migration
- Migration `0009_fix_sku_nullable_and_constraint.py`:
  - Converts existing empty string SKUs to NULL
  - Removes the unique constraint if it exists
  - Updates fields to allow NULL

## Files Modified

### Backend Models
- `backend/apps/products/models.py` - Added `null=True` to SKU fields

### Backend Serializers
- `backend/apps/products/serializers.py` - Updated to use `None` instead of empty strings

### Backend Views
- `backend/apps/products/views.py` - Updated import logic to handle empty SKU

### Migration
- `backend/apps/products/migrations/0009_fix_sku_nullable_and_constraint.py` - New migration

## How to Apply

1. Run the migration:
   ```bash
   python manage.py migrate products
   ```

2. The migration will:
   - Convert all existing empty string SKUs to NULL
   - Remove the unique constraint
   - Update the fields to allow NULL

## Testing

After applying the migration, you should be able to:
- Import multiple products without SKU
- Create products without SKU
- Have multiple products with NULL SKU in the same tenant

## Notes

- NULL values in unique constraints are treated as distinct (NULL != NULL)
- This allows multiple products to have NULL SKU without violating uniqueness
- Products with actual SKU values still need to be unique per tenant

