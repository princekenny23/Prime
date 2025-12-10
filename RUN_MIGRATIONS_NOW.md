# Run Migrations Now - Step by Step Guide

## Problem
You have existing products in the database, but they're showing as 0 in the frontend. This is because:
1. Products don't have outlets assigned yet
2. The backend filters products by outlet, so products without outlets don't show

## Solution
Run the migrations to assign products to outlets.

## Step-by-Step Instructions

### Step 1: Run the Initial Migration (if not done)
```bash
python manage.py migrate products
```

This adds the `outlet` field to the Product table (allows NULL initially).

### Step 2: Run the Data Migration
The data migration file `0011_assign_products_to_outlets.py` is already created. Just run:

```bash
python manage.py migrate products
```

This will:
- Find all products without outlets
- Assign them to the first active outlet of each tenant
- Create a default outlet if none exists
- Print progress information

**Expected Output:**
```
Found X products without outlet
Processing Y tenants...
Assigned X products to outlets
Created Z default outlets
✅ Migration complete
```

### Step 3: Make Outlet Required (Optional but Recommended)
After all products have outlets, make the field required:

```bash
python manage.py migrate products
```

This will make the outlet field non-nullable (required).

## Verify It Worked

### Check Products Have Outlets
```bash
python manage.py shell
```

```python
from apps.products.models import Product
from apps.outlets.models import Outlet

# Check products with outlets
products_with_outlets = Product.objects.filter(outlet__isnull=False).count()
print(f"Products with outlets: {products_with_outlets}")

# Check products without outlets (should be 0 after migration)
products_without_outlets = Product.objects.filter(outlet__isnull=True).count()
print(f"Products without outlets: {products_without_outlets}")

# Check outlets
outlets = Outlet.objects.all()
for outlet in outlets:
    product_count = Product.objects.filter(outlet=outlet).count()
    print(f"Outlet '{outlet.name}': {product_count} products")
```

### Test in Frontend
1. **Select an outlet** (if not already selected)
2. **Go to Products page** - products should now show
3. **Switch to another outlet** - products should change
4. **Create a new product** - should work automatically

## Troubleshooting

### Issue: "No products to assign"
- This means all products already have outlets
- Skip Step 2, go to Step 3

### Issue: "Tenant not found" warnings
- Some products might have invalid tenant references
- Check your database integrity

### Issue: Products still showing 0 after migration
1. **Check if outlet is selected** in frontend
2. **Check browser console** for errors
3. **Verify X-Outlet-ID header** is being sent (check Network tab)
4. **Check backend logs** for filtering issues

### Issue: Migration fails
- Check database connection
- Verify all dependencies are installed
- Check migration file syntax

## Quick Command Summary

```bash
# Run all migrations (recommended)
python manage.py migrate products

# Check migration status
python manage.py showmigrations products

# If you need to rollback (not recommended)
python manage.py migrate products 0010_add_outlet_to_product
```

## After Migration

✅ Products should now show in the frontend
✅ Products are assigned to outlets
✅ Each outlet has its own product catalog
✅ Switching outlets shows different products

