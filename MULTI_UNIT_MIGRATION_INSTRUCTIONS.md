# Multi-Unit Product Selling - Migration Instructions

## Overview
This document provides instructions for applying database migrations to enable multi-unit product selling (retail + wholesale) with unit conversion support.

## Migration Files Created

1. **Products App**: `0013_add_product_unit.py`
   - Creates `ProductUnit` model for multi-unit selling
   - Adds support for unit_name, conversion_factor, retail_price, wholesale_price

2. **Sales App**: `0007_add_unit_to_sale_item.py`
   - Adds `unit`, `unit_name`, and `quantity_in_base_units` fields to `SaleItem`
   - Migrates existing data (sets quantity_in_base_units = quantity for existing records)

## Migration Commands

### Step 1: Review Migration Status
```bash
cd backend
python manage.py showmigrations products
python manage.py showmigrations sales
```

### Step 2: Apply Products Migration
```bash
python manage.py migrate products
```

### Step 3: Apply Sales Migration
```bash
python manage.py migrate sales
```

### Step 4: Apply All Migrations (Alternative)
```bash
python manage.py migrate
```

## Verification

After running migrations, verify the changes:

1. **Check ProductUnit table exists:**
```bash
python manage.py dbshell
# Then in SQL:
SELECT * FROM products_productunit LIMIT 5;
```

2. **Check SaleItem has new fields:**
```bash
python manage.py dbshell
# Then in SQL:
SELECT id, quantity, quantity_in_base_units, unit_id, unit_name FROM sales_saleitem LIMIT 5;
```

## Rollback (if needed)

If you need to rollback:

```bash
# Rollback sales migration
python manage.py migrate sales 0006_add_variation_support

# Rollback products migration
python manage.py migrate products 0012_make_outlet_required
```

## Important Notes

1. **Data Migration**: The sales migration includes a data migration that sets `quantity_in_base_units = quantity` for all existing `SaleItem` records. This ensures backward compatibility.

2. **Default Values**: Existing `SaleItem` records will have:
   - `quantity_in_base_units` = `quantity` (from data migration)
   - `unit` = NULL (no unit assigned)
   - `unit_name` = empty string

3. **No Data Loss**: All existing sales data will be preserved. The new fields are nullable/optional to maintain backward compatibility.

## Next Steps

After migrations are applied:

1. **Backend API**: ProductUnit endpoints will be available at `/api/v1/products/{id}/units/`
2. **Frontend**: Update product forms to allow adding multiple units
3. **Sales**: Update sales screen to show unit selector dropdown

## Troubleshooting

If you encounter issues:

1. **Migration conflicts**: Check if migrations are already applied:
   ```bash
   python manage.py showmigrations
   ```

2. **Database errors**: Ensure database connection is working:
   ```bash
   python manage.py check --database default
   ```

3. **Model conflicts**: Ensure all model changes are saved before running migrations

## Support

If migrations fail, check:
- Database connection
- Existing data integrity
- Migration file syntax
- Dependencies between apps

