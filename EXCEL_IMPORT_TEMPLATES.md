# Excel Import Templates for Products & Variations
## Square POS-Compatible Multi-Tenant SaaS POS System

**Version:** 1.0  
**Last Updated:** 2024  
**System:** Django Backend with Product + ItemVariation + LocationStock Architecture

---

## 📋 Table of Contents

1. [Universal Excel Header (Shared Across All Businesses)](#1-universal-excel-header)
2. [Retail Product Import Template](#2-retail-product-import-template)
3. [Wholesale Product Import Template](#3-wholesale-product-import-template)
4. [Bar Product Import Template](#4-bar-product-import-template)
5. [Restaurant Product Import Template](#5-restaurant-product-import-template)
6. [Import Validation Rules](#6-import-validation-rules)
7. [Django Import Logic Notes](#7-django-import-logic-notes)

---

## 1️⃣ Universal Excel Header (Shared Across All Businesses)

### Core Product Fields (Product Model)

| Column | Required | Description | Example | Model Field |
|--------|----------|------------|---------|-------------|
| `product_name` | ✅ | Base product/item name (shared across variations) | "Coca Cola" | `Product.name` |
| `category` | ⚠️ | Product category (auto-created if missing) | "Beverages" | `Product.category` |
| `description` | ⚠️ | Product description | "Carbonated soft drink" | `Product.description` |
| `is_active` | ⚠️ | Product active status (Yes/No, True/False, 1/0) | "Yes" | `Product.is_active` |

### Variation Fields (ItemVariation Model)

| Column | Required | Description | Example | Model Field |
|--------|----------|------------|---------|-------------|
| `variation_name` | ⚠️ | Variation name (size, color, pack, volume). Empty = default variation | "500ml", "Large", "Bottle" | `ItemVariation.name` |
| `price` | ✅ | Selling price for this variation | "25.00" | `ItemVariation.price` |
| `cost` | ⚠️ | Cost price for this variation | "15.00" | `ItemVariation.cost` |
| `variation_sku` | ⚠️ | SKU for this variation (unique per product) | "COKE-500ML" | `ItemVariation.sku` |
| `variation_barcode` | ⚠️ | Barcode for this variation | "1234567890123" | `ItemVariation.barcode` |
| `track_inventory` | ⚠️ | Track inventory for this variation (Yes/No) | "Yes" | `ItemVariation.track_inventory` |
| `unit` | ⚠️ | Unit of measurement | "pcs", "ml", "kg", "box" | `ItemVariation.unit` |
| `low_stock_threshold` | ⚠️ | Low stock alert threshold | "10" | `ItemVariation.low_stock_threshold` |
| `sort_order` | ⚠️ | Display order (lower = first) | "0" | `ItemVariation.sort_order` |

### Inventory & Tracking Fields (LocationStock Model)

| Column | Required | Description | Example | Model Field |
|--------|----------|------------|---------|-------------|
| `outlet` | ⚠️ | Outlet name or code (for per-location stock) | "Main Store", "OUTLET-001" | `LocationStock.outlet` |
| `quantity` | ⚠️ | Stock quantity at this outlet (only if track_inventory=Yes) | "100" | `LocationStock.quantity` |

### Business-Specific Optional Fields

| Column | Business Type | Required | Description | Example | Model Field |
|--------|--------------|----------|-------------|---------|-------------|
| `wholesale_price` | Wholesale | ⚠️ | Wholesale price (at product level) | "20.00" | `Product.wholesale_price` |
| `minimum_wholesale_quantity` | Wholesale | ⚠️ | Minimum qty for wholesale pricing | "12" | `Product.minimum_wholesale_quantity` |
| `volume_ml` | Bar | ⚠️ | Volume in milliliters (for bar variations) | "750" | Used in `variation_name` |
| `alcohol_percentage` | Bar | ⚠️ | Alcohol percentage (for bar items) | "40" | Used in description |
| `preparation_time` | Restaurant | ⚠️ | Prep time in minutes | "15" | Used in description |
| `is_menu_item` | Restaurant | ⚠️ | Is this a menu item (Yes/No) | "Yes" | Used for `track_inventory` |

---

## 2️⃣ Retail Product Import Template

### Field List

**Required Columns:**
- ✅ `product_name`
- ✅ `price`

**Optional Columns:**
- ⚠️ `variation_name` (if multiple sizes/colors)
- ⚠️ `category`
- ⚠️ `description`
- ⚠️ `cost`
- ⚠️ `variation_sku`
- ⚠️ `variation_barcode`
- ⚠️ `track_inventory` (default: Yes)
- ⚠️ `unit` (default: pcs)
- ⚠️ `low_stock_threshold`
- ⚠️ `outlet`
- ⚠️ `quantity`
- ⚠️ `is_active` (default: Yes)
- ⚠️ `sort_order`

### ✅ Sample Rows (3 products, 1 with variations)

| product_name | category | variation_name | price | cost | variation_sku | variation_barcode | track_inventory | unit | low_stock_threshold | outlet | quantity | is_active | sort_order |
|--------------|----------|----------------|-------|------|---------------|-------------------|-----------------|------|---------------------|--------|----------|-----------|------------|
| Coca Cola | Beverages | 330ml Can | 25.00 | 15.00 | COKE-330ML | 1234567890123 | Yes | pcs | 10 | Main Store | 100 | Yes | 1 |
| Coca Cola | Beverages | 500ml Bottle | 30.00 | 18.00 | COKE-500ML | 1234567890124 | Yes | pcs | 10 | Main Store | 80 | Yes | 2 |
| Coca Cola | Beverages | 1.5L Bottle | 45.00 | 28.00 | COKE-1.5L | 1234567890125 | Yes | pcs | 5 | Main Store | 50 | Yes | 3 |
| Bread White | Bakery | | 15.00 | 8.00 | BREAD-WHITE | 9876543210123 | Yes | pcs | 20 | Main Store | 200 | Yes | 0 |
| Milk Fresh | Dairy | | 35.00 | 22.00 | MILK-FRESH | 9876543210124 | Yes | l | 15 | Main Store | 150 | Yes | 0 |

**Notes:**
- Row 1-3: Same `product_name` with different `variation_name` = 3 variations of "Coca Cola"
- Row 4-5: Empty `variation_name` = default variation created automatically
- `outlet` and `quantity` create LocationStock entries per outlet

---

## 3️⃣ Wholesale Product Import Template

### Field List

**Required Columns:**
- ✅ `product_name`
- ✅ `price`

**Optional Columns:**
- ⚠️ `variation_name` (pack sizes: Single, Pack of 12, Case of 144)
- ⚠️ `category`
- ⚠️ `description`
- ⚠️ `cost`
- ⚠️ `variation_sku`
- ⚠️ `variation_barcode`
- ⚠️ `wholesale_price` (at product level)
- ⚠️ `minimum_wholesale_quantity` (at product level)
- ⚠️ `track_inventory`
- ⚠️ `unit` (pcs, pack, box, case)
- ⚠️ `low_stock_threshold`
- ⚠️ `outlet`
- ⚠️ `quantity`
- ⚠️ `is_active`
- ⚠️ `sort_order`

### ✅ Sample Rows

| product_name | category | variation_name | price | cost | wholesale_price | minimum_wholesale_quantity | variation_sku | track_inventory | unit | low_stock_threshold | outlet | quantity | is_active |
|--------------|----------|----------------|-------|------|-----------------|----------------------------|---------------|-----------------|------|---------------------|--------|----------|-----------|
| Soap Bar | Personal Care | Single | 5.00 | 2.50 | 4.00 | 12 | SOAP-SINGLE | Yes | pcs | 50 | Warehouse | 500 | Yes |
| Soap Bar | Personal Care | Pack of 12 | 48.00 | 30.00 | 40.00 | 1 | SOAP-PACK12 | Yes | pack | 10 | Warehouse | 100 | Yes |
| Soap Bar | Personal Care | Case of 144 | 480.00 | 360.00 | 400.00 | 1 | SOAP-CASE144 | Yes | case | 5 | Warehouse | 50 | Yes |
| Rice 5kg | Groceries | | 45.00 | 30.00 | 38.00 | 10 | RICE-5KG | Yes | bag | 20 | Warehouse | 200 | Yes |

**Notes:**
- `wholesale_price` and `minimum_wholesale_quantity` are at Product level (business logic)
- Variations represent different pack sizes with different prices
- Each variation can have different stock levels

---

## 4️⃣ Bar Product Import Template

### Field List

**Required Columns:**
- ✅ `product_name`
- ✅ `price`

**Optional Columns:**
- ⚠️ `variation_name` (Shot, Bottle, 750ml, 1L)
- ⚠️ `category` (Spirits, Beer, Wine, Cocktails)
- ⚠️ `description`
- ⚠️ `cost`
- ⚠️ `variation_sku`
- ⚠️ `variation_barcode`
- ⚠️ `volume_ml` (for reference)
- ⚠️ `alcohol_percentage` (for reference)
- ⚠️ `track_inventory`
- ⚠️ `unit` (ml, shot, bottle)
- ⚠️ `low_stock_threshold`
- ⚠️ `outlet` (Bar Counter, Storage Room)
- ⚠️ `quantity`
- ⚠️ `is_active`
- ⚠️ `sort_order`

### ✅ Sample Rows

| product_name | category | variation_name | price | cost | volume_ml | alcohol_percentage | variation_sku | track_inventory | unit | low_stock_threshold | outlet | quantity | is_active | sort_order |
|--------------|----------|----------------|-------|------|-----------|---------------------|---------------|-----------------|------|---------------------|--------|----------|-----------|------------|
| Vodka Premium | Spirits | Shot (30ml) | 8.00 | 4.00 | 30 | 40 | VODKA-SHOT | Yes | shot | 20 | Bar Counter | 50 | Yes | 1 |
| Vodka Premium | Spirits | Bottle (750ml) | 180.00 | 120.00 | 750 | 40 | VODKA-750ML | Yes | bottle | 5 | Storage Room | 12 | Yes | 2 |
| Beer Local | Beer | Bottle (500ml) | 15.00 | 8.00 | 500 | 5 | BEER-500ML | Yes | bottle | 30 | Bar Counter | 100 | Yes | 1 |
| Cocktail Mojito | Cocktails | | 25.00 | 12.00 | 250 | 15 | MOJITO | No | glass | 0 | Bar Counter | 0 | Yes | 0 |

**Notes:**
- Volume-based variations (Shot, Bottle, different ml sizes)
- `track_inventory=No` for cocktails (made-to-order, no stock tracking)
- `volume_ml` and `alcohol_percentage` are informational (can be in description)

---

## 5️⃣ Restaurant Product Import Template

### Field List

**Required Columns:**
- ✅ `product_name`
- ✅ `price`

**Optional Columns:**
- ⚠️ `variation_name` (Small, Medium, Large, Extra Large)
- ⚠️ `category` (Appetizers, Main Course, Desserts, Drinks)
- ⚠️ `description`
- ⚠️ `cost`
- ⚠️ `variation_sku`
- ⚠️ `variation_barcode`
- ⚠️ `preparation_time` (minutes)
- ⚠️ `is_menu_item` (Yes/No - affects track_inventory)
- ⚠️ `track_inventory` (No for most menu items)
- ⚠️ `unit` (serving, portion)
- ⚠️ `low_stock_threshold`
- ⚠️ `outlet` (Kitchen, Bar)
- ⚠️ `quantity` (only if track_inventory=Yes)
- ⚠️ `is_active`
- ⚠️ `sort_order`

### ✅ Sample Rows

| product_name | category | variation_name | price | cost | preparation_time | is_menu_item | track_inventory | variation_sku | unit | low_stock_threshold | outlet | quantity | is_active | sort_order |
|--------------|----------|----------------|-------|------|------------------|--------------|-----------------|---------------|------|---------------------|--------|----------|-----------|------------|
| Pizza Margherita | Main Course | Small (8") | 45.00 | 20.00 | 15 | Yes | No | PIZZA-SMALL | serving | 0 | Kitchen | 0 | Yes | 1 |
| Pizza Margherita | Main Course | Medium (12") | 65.00 | 30.00 | 15 | Yes | No | PIZZA-MEDIUM | serving | 0 | Kitchen | 0 | Yes | 2 |
| Pizza Margherita | Main Course | Large (16") | 85.00 | 40.00 | 15 | Yes | No | PIZZA-LARGE | serving | 0 | Kitchen | 0 | Yes | 3 |
| Soft Drink | Drinks | | 15.00 | 5.00 | 0 | Yes | Yes | DRINK-SOFT | bottle | 20 | Bar | 50 | Yes | 0 |
| Service Charge | Services | | 10.00 | 0.00 | 0 | No | No | SERVICE-CHARGE | service | 0 | Kitchen | 0 | Yes | 0 |

**Notes:**
- Size-based variations (Small, Medium, Large)
- Most menu items have `track_inventory=No` (made-to-order)
- Drinks/beverages may track inventory (`track_inventory=Yes`)
- `preparation_time` is informational (can be in description)

---

## 6️⃣ Import Validation Rules

### Required Columns

**Universal:**
- ✅ `product_name` - Must not be empty
- ✅ `price` - Must be > 0.01, numeric

**Conditional:**
- If `variation_name` is provided, it must be unique per `product_name`
- If `track_inventory=Yes`, `outlet` and `quantity` are recommended
- If `wholesale_price` is provided, `minimum_wholesale_quantity` defaults to 1

### Grouping Logic (Product vs Variation)

**Product Grouping:**
- Rows with the same `product_name` belong to the same Product
- First row with a `product_name` creates the Product
- Subsequent rows with same `product_name` create Variations

**Variation Creation:**
- If `variation_name` is empty/null → Create default variation named "Default"
- If `variation_name` is provided → Create variation with that name
- Multiple rows with same `product_name` + different `variation_name` = multiple variations

**Example:**
```
Row 1: product_name="Coke", variation_name="", price=25.00
  → Creates: Product "Coke" + Variation "Default" (price=25.00)

Row 2: product_name="Coke", variation_name="500ml", price=30.00
  → Adds: Variation "500ml" to existing Product "Coke" (price=30.00)
```

### Duplicate Handling

**Product Level:**
- If Product with same `product_name` exists → Update existing Product (or skip based on import mode)
- Category, description, is_active can be updated

**Variation Level:**
- If Variation with same `product_name` + `variation_name` exists → Update existing Variation
- If `variation_sku` is provided and exists for another variation → Error (SKU must be unique per product)

**LocationStock Level:**
- If LocationStock with same `variation` + `outlet` exists → Update quantity
- If LocationStock doesn't exist and `track_inventory=Yes` → Create new entry

### Data Type Validation

| Column | Type | Validation |
|--------|------|------------|
| `product_name` | String | Max 255 chars, not empty |
| `variation_name` | String | Max 255 chars, can be empty |
| `price` | Decimal | >= 0.01, 2 decimal places |
| `cost` | Decimal | >= 0, 2 decimal places, optional |
| `quantity` | Integer | >= 0, only if track_inventory=Yes |
| `low_stock_threshold` | Integer | >= 0 |
| `sort_order` | Integer | >= 0 |
| `track_inventory` | Boolean | Yes/No, True/False, 1/0 |
| `is_active` | Boolean | Yes/No, True/False, 1/0 |
| `wholesale_price` | Decimal | >= 0.01 if provided |
| `minimum_wholesale_quantity` | Integer | >= 1 if provided |

---

## 7️⃣ Notes for Django Import Logic

### Mapping Excel → Product → ItemVariation → LocationStock

**Step 1: Parse Excel File**
```python
df = pd.read_excel(file)
# Group by product_name
products = df.groupby('product_name')
```

**Step 2: Create/Update Product**
```python
for product_name, rows in products:
    # Get first row for product-level data
    first_row = rows.iloc[0]
    
    product_data = {
        'name': product_name,
        'category': resolve_category(first_row.get('category')),
        'description': first_row.get('description', ''),
        'is_active': parse_boolean(first_row.get('is_active', True)),
        # Wholesale fields (if provided)
        'wholesale_price': first_row.get('wholesale_price'),
        'minimum_wholesale_quantity': first_row.get('minimum_wholesale_quantity', 1),
    }
    
    product, created = Product.objects.get_or_create(
        tenant=tenant,
        name=product_name,
        defaults=product_data
    )
    
    if not created:
        # Update existing product
        for key, value in product_data.items():
            setattr(product, key, value)
        product.save()
```

**Step 3: Create/Update Variations**
```python
for idx, row in rows.iterrows():
    variation_name = row.get('variation_name', '').strip()
    
    # Default variation if name is empty
    if not variation_name:
        variation_name = 'Default'
    
    variation_data = {
        'product': product,
        'name': variation_name,
        'price': Decimal(row['price']),
        'cost': Decimal(row['cost']) if pd.notna(row.get('cost')) else None,
        'sku': row.get('variation_sku', '').strip() or '',
        'barcode': row.get('variation_barcode', '').strip() or '',
        'track_inventory': parse_boolean(row.get('track_inventory', True)),
        'unit': row.get('unit', 'pcs'),
        'low_stock_threshold': int(row.get('low_stock_threshold', 0)),
        'sort_order': int(row.get('sort_order', 0)),
        'is_active': parse_boolean(row.get('is_active', True)),
    }
    
    variation, created = ItemVariation.objects.get_or_create(
        product=product,
        name=variation_name,
        defaults=variation_data
    )
    
    if not created:
        # Update existing variation
        for key, value in variation_data.items():
            if key != 'product':  # Don't update FK
                setattr(variation, key, value)
        variation.save()
```

**Step 4: Create/Update LocationStock**
```python
    # Only if track_inventory is enabled
    if variation.track_inventory and pd.notna(row.get('outlet')) and pd.notna(row.get('quantity')):
        outlet_name = row['outlet'].strip()
        outlet = resolve_outlet(outlet_name, tenant)
        
        if outlet:
            quantity = int(row['quantity'])
            
            location_stock, created = LocationStock.objects.get_or_create(
                tenant=tenant,
                variation=variation,
                outlet=outlet,
                defaults={'quantity': quantity}
            )
            
            if not created:
                location_stock.quantity = quantity
                location_stock.save()
```

### How Default Variations Are Created

**Scenario 1: Empty variation_name**
```
Excel Row: product_name="Bread", variation_name="", price=15.00
Result: Product "Bread" + Variation "Default" (price=15.00)
```

**Scenario 2: No variation_name column**
```
Excel Row: product_name="Bread", price=15.00
Result: Product "Bread" + Variation "Default" (price=15.00)
```

**Scenario 3: Multiple rows, some with empty variation_name**
```
Row 1: product_name="Bread", variation_name="", price=15.00
Row 2: product_name="Bread", variation_name="Large", price=20.00
Result: 
  - Product "Bread"
  - Variation "Default" (price=15.00)
  - Variation "Large" (price=20.00)
```

**Backward Compatibility:**
- If importing legacy products (no variations), create default variation automatically
- Copy Product.retail_price → ItemVariation.price
- Copy Product.cost → ItemVariation.cost
- Copy Product.sku → ItemVariation.sku (if variation_sku not provided)
- Copy Product.barcode → ItemVariation.barcode (if variation_barcode not provided)

### Error Handling

**Row-Level Errors:**
- Invalid price → Skip row, log error
- Missing product_name → Skip row, log error
- Duplicate SKU within same product → Skip variation, log error
- Invalid outlet name → Skip LocationStock creation, log warning

**Product-Level Errors:**
- Category not found → Create category automatically (or log warning)
- Outlet not found → Skip LocationStock, log warning

**Transaction Safety:**
- Use `transaction.atomic()` per product group
- If variation creation fails, rollback entire product group
- Continue processing other products even if one fails

### Import Modes (Future Enhancement)

**Mode 1: Create Only**
- Skip existing products/variations
- Only create new items

**Mode 2: Update Only**
- Only update existing products/variations
- Skip new items

**Mode 3: Upsert (Default)**
- Create if new, update if exists
- Recommended for most use cases

---

## 📝 Summary

### Key Principles

1. **No Field Duplication**: Price, SKU, barcode at variation level (not product level)
2. **Multiple Variations**: Same `product_name` + different `variation_name` = multiple variations
3. **Per-Location Stock**: `outlet` + `quantity` columns for LocationStock
4. **Backward Compatible**: Empty `variation_name` creates default variation
5. **Business-Specific**: Optional columns for wholesale, bar, restaurant features

### Excel Structure

```
Row 1: Headers (product_name, variation_name, price, cost, ...)
Row 2+: Data rows
  - Same product_name = same Product
  - Different variation_name = different Variation
  - outlet + quantity = LocationStock entry
```

### Django Processing Flow

```
Excel File
  ↓
Parse & Group by product_name
  ↓
For each product_name:
  ├─ Create/Update Product
  ├─ For each row:
  │   ├─ Create/Update ItemVariation
  │   └─ Create/Update LocationStock (if track_inventory=Yes)
  └─ Return results
```

---

**End of Document**

