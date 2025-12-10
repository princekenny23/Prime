# Outlet-Specific Products Migration Guide

## Overview
Products have been changed from tenant-level (shared) to outlet-level (isolated). Each outlet now has its own product catalog.

## Changes Made

### 1. Model Changes
- Added `outlet` ForeignKey field to `Product` model
- Products are now filtered by both tenant AND outlet
- Each outlet has its own independent product catalog

### 2. ViewSet Changes
- `ProductViewSet.get_queryset()` now filters by outlet
- Products require outlet to be specified (via X-Outlet-ID header or query param)
- `perform_create()` requires outlet and validates it belongs to tenant

### 3. Serializer Changes
- Added `outlet` field to `ProductSerializer`
- Outlet field is read-only (set automatically from request context)

## Migration Steps

### Step 1: Run the Migration
**Note**: The migration file `0010_add_outlet_to_product.py` is already created. You just need to run it:

```bash
python manage.py migrate products
```

This will apply the migration that adds the `outlet` field to the Product table.

### Step 2: Data Migration (If You Have Existing Products)

**IMPORTANT**: If you have existing products in your database, you need to assign them to outlets before making the outlet field required.

#### Option A: Assign All Products to a Default Outlet
Create a data migration to assign existing products to the first outlet of each tenant:

```python
# backend/apps/products/migrations/0011_assign_products_to_outlets.py
from django.db import migrations

def assign_products_to_outlets(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    Outlet = apps.get_model('outlets', 'Outlet')
    
    # Get all products without outlet
    products_without_outlet = Product.objects.filter(outlet__isnull=True)
    
    for product in products_without_outlet:
        # Get first active outlet for the tenant
        outlet = Outlet.objects.filter(tenant=product.tenant, is_active=True).first()
        if outlet:
            product.outlet = outlet
            product.save()
        else:
            # If no outlet exists, create a default one
            outlet = Outlet.objects.create(
                tenant=product.tenant,
                name=f"{product.tenant.name} - Main Outlet",
                is_active=True
            )
            product.outlet = outlet
            product.save()

def reverse_assign_products_to_outlets(apps, schema_editor):
    # Reverse migration - set outlet to null
    Product = apps.get_model('products', 'Product')
    Product.objects.all().update(outlet=None)

class Migration(migrations.Migration):
    dependencies = [
        ('products', '0010_add_outlet_to_product'),
    ]

    operations = [
        migrations.RunPython(assign_products_to_outlets, reverse_assign_products_to_outlets),
    ]
```

#### Option B: Manual Assignment
If you want to manually assign products to specific outlets, you can do this via Django admin or a management command.

### Step 3: Make Outlet Required (After Data Migration)
Once all products have outlets assigned, make the field required:

```python
# backend/apps/products/migrations/0012_make_outlet_required.py
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('products', '0011_assign_products_to_outlets'),  # Adjust based on your data migration
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='outlet',
            field=models.ForeignKey(
                help_text='Outlet this product belongs to',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='products',
                to='outlets.outlet',
            ),
        ),
    ]
```

## API Changes

### Creating Products
Products now require an outlet. The outlet can be specified via:
- `X-Outlet-ID` header (recommended)
- `?outlet=<id>` query parameter
- Request body `{"outlet": <id>}`

### Listing Products
Products are automatically filtered by the current outlet (from `X-Outlet-ID` header).

### Updating/Deleting Products
You can only update/delete products that belong to the current outlet.

## Frontend Changes Required

✅ **NO FRONTEND CHANGES NEEDED!**

The frontend is already configured correctly:

1. **Product Creation**: ✅ `X-Outlet-ID` header is automatically sent by the API client (`frontend/lib/api.ts`)
2. **Product Listing**: ✅ Products automatically filter by current outlet (via header)
3. **Product Display**: ✅ Products only show for the current outlet
4. **Outlet Switching**: ✅ Products refresh when outlet changes (already implemented)

### How It Works (Already Implemented)

- The API client (`frontend/lib/api.ts`) reads `currentOutletId` from `localStorage`
- This value is set automatically when you switch outlets via `switchOutlet()`
- The `X-Outlet-ID` header is sent in **all** API requests automatically
- No manual changes needed in product creation, listing, or any other operations

### Important Notes

⚠️ **Before creating products, ensure:**
- User has selected/switched to an outlet
- `currentOutletId` is set in localStorage (happens automatically when outlet is selected)
- If no outlet is selected, product creation will fail (backend requires outlet)

✅ **Everything else works automatically!**

## Breaking Changes

⚠️ **IMPORTANT**: This is a breaking change:
- Products created before this change will need to be assigned to outlets
- Products are no longer shared across outlets
- Each outlet has its own independent product catalog

## Testing Checklist

- [ ] Run migrations successfully
- [ ] Assign existing products to outlets (if any)
- [ ] Create new product in Outlet A - verify it only shows in Outlet A
- [ ] Switch to Outlet B - verify products from Outlet A don't show
- [ ] Create product in Outlet B - verify it only shows in Outlet B
- [ ] Verify product update/delete respects outlet boundaries
- [ ] Test bulk import with outlet specified
- [ ] Test bulk export (should only export current outlet's products)

