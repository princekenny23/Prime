# Excel Import Template for Wholesale & Retail Products
## PrimePOS - Professional Product Import Guide

**Version:** 1.0  
**Last Updated:** 2024  
**Business Type:** Wholesale & Retail  
**Format:** Excel (.xlsx) or CSV

---

## 📋 Quick Start Guide

### Step 1: Download Template
Use the column headers below to create your Excel file.

### Step 2: Fill in Your Data
Follow the examples and validation rules.

### Step 3: Import
Upload via `/dashboard/products` → Import button.

---

## 📊 Complete Column List

### Required Columns (Must Have)
| Column Name | Type | Description | Example |
|------------|------|-------------|---------|
| `product_name` | Text | Product name (shared across variations) | "Premium Coffee Beans" |
| `price` | Number | Retail selling price (must be > 0.01) | 25.00 |

### Optional Columns (Recommended)
| Column Name | Type | Description | Example |
|------------|------|-------------|---------|
| `category` | Text | Product category (auto-created if new) | "Beverages" |
| `description` | Text | Product description | "Premium arabica coffee beans" |
| `variation_name` | Text | Variation name (size, pack, etc.) | "500g Pack", "1kg Pack" |
| `cost` | Number | Cost price per unit | 15.00 |
| `variation_sku` | Text | SKU for this variation (unique per product) | "COFFEE-500G" |
| `variation_barcode` | Text | Barcode for this variation | "1234567890123" |
| `track_inventory` | Yes/No | Track stock for this variation | Yes |
| `unit` | Text | Unit of measurement | pcs, kg, pack, box, case |
| `low_stock_threshold` | Number | Alert when stock falls to this level | 10 |
| `outlet` | Text | Outlet name where stock is located | "Main Warehouse" |
| `quantity` | Number | Initial stock quantity at outlet | 100 |
| `is_active` | Yes/No | Product active status | Yes |
| `sort_order` | Number | Display order (lower = first) | 0 |

### Wholesale-Specific Columns
| Column Name | Type | Description | Example |
|------------|------|-------------|---------|
| `wholesale_price` | Number | Wholesale price (at product level) | 20.00 |
| `minimum_wholesale_quantity` | Number | Minimum qty to qualify for wholesale price | 12 |

---

## 📝 Excel Template Structure

### Header Row (Row 1)
Copy these exact column names as your header row:

```
product_name | category | description | variation_name | price | cost | wholesale_price | minimum_wholesale_quantity | variation_sku | variation_barcode | track_inventory | unit | low_stock_threshold | outlet | quantity | is_active | sort_order
```

### Data Rows (Row 2+)
Fill in your product data following the examples below.

---

## ✅ Sample Data Examples

### Example 1: Simple Product (No Variations)

| product_name | category | price | cost | wholesale_price | minimum_wholesale_quantity | track_inventory | unit | outlet | quantity | is_active |
|--------------|----------|-------|------|-----------------|----------------------------|-----------------|------|--------|----------|-----------|
| Rice 5kg | Groceries | 45.00 | 30.00 | 38.00 | 10 | Yes | bag | Main Warehouse | 200 | Yes |

**Result:** Creates 1 product "Rice 5kg" with 1 default variation, wholesale enabled.

---

### Example 2: Product with Multiple Pack Sizes (Variations)

| product_name | category | variation_name | price | cost | wholesale_price | minimum_wholesale_quantity | variation_sku | track_inventory | unit | outlet | quantity | is_active |
|--------------|----------|----------------|-------|------|-----------------|----------------------------|---------------|-----------------|------|--------|----------|-----------|
| Soap Bar | Personal Care | Single | 5.00 | 2.50 | 4.00 | 12 | SOAP-SINGLE | Yes | pcs | Warehouse | 500 | Yes |
| Soap Bar | Personal Care | Pack of 12 | 48.00 | 30.00 | 40.00 | 1 | SOAP-PACK12 | Yes | pack | Warehouse | 100 | Yes |
| Soap Bar | Personal Care | Case of 144 | 480.00 | 360.00 | 400.00 | 1 | SOAP-CASE144 | Yes | case | Warehouse | 50 | Yes |

**Result:** Creates 1 product "Soap Bar" with 3 variations (Single, Pack of 12, Case of 144), all with wholesale pricing.

---

### Example 3: Product with Size Variations

| product_name | category | variation_name | price | cost | wholesale_price | minimum_wholesale_quantity | variation_sku | track_inventory | unit | outlet | quantity | is_active |
|--------------|----------|----------------|-------|------|-----------------|----------------------------|---------------|-----------------|------|--------|----------|-----------|
| Cooking Oil | Groceries | 500ml | 25.00 | 15.00 | 20.00 | 12 | OIL-500ML | Yes | bottle | Warehouse | 150 | Yes |
| Cooking Oil | Groceries | 1L | 45.00 | 28.00 | 38.00 | 6 | OIL-1L | Yes | bottle | Warehouse | 100 | Yes |
| Cooking Oil | Groceries | 5L | 200.00 | 130.00 | 170.00 | 2 | OIL-5L | Yes | bottle | Warehouse | 50 | Yes |

**Result:** Creates 1 product "Cooking Oil" with 3 size variations, all with wholesale pricing.

---

### Example 4: Multi-Outlet Stock

| product_name | category | variation_name | price | wholesale_price | minimum_wholesale_quantity | outlet | quantity | track_inventory |
|--------------|----------|----------------|-------|-----------------|----------------------------|--------|----------|-----------------|
| Sugar 1kg | Groceries | | 35.00 | 28.00 | 10 | Main Warehouse | 500 | Yes |
| Sugar 1kg | Groceries | | 35.00 | 28.00 | 10 | Downtown Store | 200 | Yes |
| Sugar 1kg | Groceries | | 35.00 | 28.00 | 10 | Airport Branch | 100 | Yes |

**Result:** Creates 1 product "Sugar 1kg" with stock at 3 different outlets (Main Warehouse: 500, Downtown Store: 200, Airport Branch: 100).

---

### Example 5: Retail-Only Product (No Wholesale)

| product_name | category | price | cost | track_inventory | unit | outlet | quantity | is_active |
|--------------|----------|-------|------|-----------------|------|--------|----------|-----------|
| Bread White | Bakery | 15.00 | 8.00 | Yes | pcs | Main Store | 200 | Yes |

**Result:** Creates 1 product "Bread White" with retail price only (no wholesale fields = retail-only).

---

### Example 6: Complete Wholesale Product with All Fields

| product_name | category | description | variation_name | price | cost | wholesale_price | minimum_wholesale_quantity | variation_sku | variation_barcode | track_inventory | unit | low_stock_threshold | outlet | quantity | is_active | sort_order |
|--------------|----------|------------|----------------|-------|------|-----------------|----------------------------|---------------|-------------------|-----------------|------|---------------------|--------|----------|-----------|------------|
| Premium Coffee Beans | Beverages | Premium arabica coffee beans, medium roast | 250g Pack | 25.00 | 15.00 | 20.00 | 12 | COFFEE-250G | 1234567890123 | Yes | pack | 20 | Main Warehouse | 150 | Yes | 1 |
| Premium Coffee Beans | Beverages | Premium arabica coffee beans, medium roast | 500g Pack | 45.00 | 28.00 | 38.00 | 6 | COFFEE-500G | 1234567890124 | Yes | pack | 15 | Main Warehouse | 100 | Yes | 2 |
| Premium Coffee Beans | Beverages | Premium arabica coffee beans, medium roast | 1kg Pack | 85.00 | 55.00 | 72.00 | 3 | COFFEE-1KG | 1234567890125 | Yes | pack | 10 | Main Warehouse | 75 | Yes | 3 |

**Result:** Creates 1 product "Premium Coffee Beans" with 3 pack size variations, all with wholesale pricing, SKUs, barcodes, and stock tracking.

---

## 📐 Field Validation Rules

### Required Fields
- ✅ **product_name**: Cannot be empty, max 255 characters
- ✅ **price**: Must be > 0.01, numeric with 2 decimal places

### Optional Fields Validation

| Field | Validation Rule | Example |
|-------|----------------|---------|
| `category` | Text, auto-created if new | "Beverages" |
| `description` | Text, max 1000 characters | "Premium quality product" |
| `variation_name` | Text, max 255 characters, empty = "Default" | "500ml", "Large", "Pack of 12" |
| `cost` | Number >= 0, 2 decimal places | 15.00 |
| `wholesale_price` | Number >= 0.01, 2 decimal places | 20.00 |
| `minimum_wholesale_quantity` | Integer >= 1 | 12 |
| `variation_sku` | Text, unique per product | "COFFEE-500G" |
| `variation_barcode` | Text, typically 8-13 digits | "1234567890123" |
| `track_inventory` | Yes/No, True/False, 1/0 | Yes |
| `unit` | Text, common: pcs, kg, g, l, ml, pack, box, case | pcs |
| `low_stock_threshold` | Integer >= 0 | 10 |
| `outlet` | Text, must match existing outlet name | "Main Warehouse" |
| `quantity` | Integer >= 0, only if track_inventory=Yes | 100 |
| `is_active` | Yes/No, True/False, 1/0 | Yes |
| `sort_order` | Integer >= 0 | 0 |

---

## 🎯 Common Wholesale & Retail Scenarios

### Scenario 1: Bulk Products with Wholesale Pricing

**Use Case:** Products sold in bulk to wholesale customers

**Template:**
```
product_name | category | variation_name | price | wholesale_price | minimum_wholesale_quantity | unit | outlet | quantity
Rice | Groceries | 5kg Bag | 45.00 | 38.00 | 10 | bag | Warehouse | 200
Rice | Groceries | 10kg Bag | 85.00 | 72.00 | 5 | bag | Warehouse | 150
Rice | Groceries | 25kg Bag | 200.00 | 170.00 | 2 | bag | Warehouse | 100
```

**Key Points:**
- Same `product_name` with different `variation_name` = multiple variations
- `wholesale_price` < `price` (retail price)
- `minimum_wholesale_quantity` determines when wholesale price applies

---

### Scenario 2: Pack Size Variations

**Use Case:** Same product in different pack sizes (Single, Pack, Case)

**Template:**
```
product_name | variation_name | price | wholesale_price | minimum_wholesale_quantity | unit
Soap | Single | 5.00 | 4.00 | 12 | pcs
Soap | Pack of 12 | 48.00 | 40.00 | 1 | pack
Soap | Case of 144 | 480.00 | 400.00 | 1 | case
```

**Key Points:**
- Pack sizes are variations
- Each variation has its own price and wholesale price
- `minimum_wholesale_quantity` can be 1 for packs/cases

---

### Scenario 3: Multi-Outlet Inventory

**Use Case:** Same product stocked at multiple locations

**Template:**
```
product_name | price | wholesale_price | minimum_wholesale_quantity | outlet | quantity
Sugar 1kg | 35.00 | 28.00 | 10 | Main Warehouse | 500
Sugar 1kg | 35.00 | 28.00 | 10 | Downtown Store | 200
Sugar 1kg | 35.00 | 28.00 | 10 | Airport Branch | 100
```

**Key Points:**
- Same `product_name` with different `outlet` = stock at different locations
- Each outlet has its own `quantity`
- Product-level fields (wholesale_price) are the same for all outlets

---

### Scenario 4: Retail-Only Products

**Use Case:** Products sold only at retail (no wholesale)

**Template:**
```
product_name | category | price | cost | track_inventory | unit | outlet | quantity
Bread White | Bakery | 15.00 | 8.00 | Yes | pcs | Main Store | 200
Milk Fresh | Dairy | 35.00 | 22.00 | Yes | l | Main Store | 150
```

**Key Points:**
- Leave `wholesale_price` and `minimum_wholesale_quantity` empty
- Product will be retail-only
- Can enable wholesale later via product edit

---

## 📋 Complete Template Example

### Full Template with All Columns

**Row 1 (Headers):**
```
product_name | category | description | variation_name | price | cost | wholesale_price | minimum_wholesale_quantity | variation_sku | variation_barcode | track_inventory | unit | low_stock_threshold | outlet | quantity | is_active | sort_order
```

**Row 2+ (Sample Data):**
```
Premium Coffee Beans | Beverages | Premium arabica coffee | 250g Pack | 25.00 | 15.00 | 20.00 | 12 | COFFEE-250G | 1234567890123 | Yes | pack | 20 | Main Warehouse | 150 | Yes | 1
Premium Coffee Beans | Beverages | Premium arabica coffee | 500g Pack | 45.00 | 28.00 | 38.00 | 6 | COFFEE-500G | 1234567890124 | Yes | pack | 15 | Main Warehouse | 100 | Yes | 2
Premium Coffee Beans | Beverages | Premium arabica coffee | 1kg Pack | 85.00 | 55.00 | 72.00 | 3 | COFFEE-1KG | 1234567890125 | Yes | pack | 10 | Main Warehouse | 75 | Yes | 3
Rice 5kg | Groceries | Long grain white rice | | 45.00 | 30.00 | 38.00 | 10 | RICE-5KG | 9876543210123 | Yes | bag | 20 | Main Warehouse | 200 | Yes | 0
Soap Bar | Personal Care | Antibacterial soap | Single | 5.00 | 2.50 | 4.00 | 12 | SOAP-SINGLE | 1112223334444 | Yes | pcs | 50 | Main Warehouse | 500 | Yes | 1
Soap Bar | Personal Care | Antibacterial soap | Pack of 12 | 48.00 | 30.00 | 40.00 | 1 | SOAP-PACK12 | 1112223334445 | Yes | pack | 10 | Main Warehouse | 100 | Yes | 2
```

---

## 🔍 Important Notes

### 1. Product Grouping
- **Same `product_name`** = Same Product
- **Different `variation_name`** = Different Variations of same product
- **Empty `variation_name`** = Creates "Default" variation

### 2. Wholesale Pricing
- `wholesale_price` is set at **Product level** (shared across all variations)
- `minimum_wholesale_quantity` is also at **Product level**
- If `wholesale_price` is provided, wholesale is automatically enabled
- If `wholesale_price` is empty, product is retail-only

### 3. Stock Management
- `outlet` + `quantity` = Stock at that outlet
- If `track_inventory=No`, `quantity` is ignored
- Multiple rows with same product but different `outlet` = Stock at multiple locations
- Stock is tracked per variation per outlet

### 4. Variations
- Use variations for: sizes, pack sizes, colors, volumes
- Each variation can have different: price, cost, SKU, barcode, stock
- Variations share: product name, category, description, wholesale pricing

### 5. Data Types
- **Numbers**: Use decimal format (25.00, not 25)
- **Yes/No**: Accepts "Yes", "No", "True", "False", "1", "0"
- **Text**: No special characters needed, but avoid commas in CSV

---

## ⚠️ Common Mistakes to Avoid

### ❌ Don't Do This:
1. **Duplicate SKUs**: Same SKU for different products
2. **Missing Prices**: Price must be > 0.01
3. **Invalid Outlets**: Outlet name must match existing outlet
4. **Negative Quantities**: Quantity must be >= 0
5. **Wholesale Price > Retail Price**: Wholesale should be lower than retail

### ✅ Do This Instead:
1. **Unique SKUs**: Each variation has unique SKU per product
2. **Valid Prices**: Always include price > 0.01
3. **Valid Outlets**: Use exact outlet name from system
4. **Positive Quantities**: Use 0 or positive numbers only
5. **Logical Pricing**: wholesale_price < price (retail)

---

## 📥 Import Process

### Step 1: Prepare Your Excel File
1. Create new Excel file (.xlsx) or CSV
2. Add header row with column names (exact match)
3. Fill in your product data
4. Save file

### Step 2: Upload
1. Go to `/dashboard/products`
2. Click "Import" button
3. Select your Excel/CSV file
4. Click "Upload"

### Step 3: Review Results
1. System will show:
   - Total rows processed
   - Products created
   - Variations created
   - Stock entries created
   - Errors (if any)
2. Fix any errors and re-import if needed

---

## 🎓 Best Practices

### 1. Start Simple
- Begin with required columns only
- Add optional columns as needed
- Test with small batch first

### 2. Use Consistent Naming
- Use consistent category names
- Use consistent outlet names
- Use consistent unit names

### 3. Validate Before Import
- Check all prices are valid
- Verify outlet names exist
- Ensure SKUs are unique
- Check wholesale_price < price

### 4. Organize Your Data
- Group products by category
- Use variations for different sizes/packs
- Include all relevant information

### 5. Backup First
- Export existing products before bulk import
- Test import with small sample
- Verify results before full import

---

## 📊 Template Download

### Minimal Template (Required Fields Only)
```
product_name,price
Rice 5kg,45.00
Sugar 1kg,35.00
```

### Standard Template (Recommended)
```
product_name,category,price,cost,wholesale_price,minimum_wholesale_quantity,outlet,quantity
Rice 5kg,Groceries,45.00,30.00,38.00,10,Main Warehouse,200
Sugar 1kg,Groceries,35.00,22.00,28.00,10,Main Warehouse,150
```

### Complete Template (All Fields)
```
product_name,category,description,variation_name,price,cost,wholesale_price,minimum_wholesale_quantity,variation_sku,variation_barcode,track_inventory,unit,low_stock_threshold,outlet,quantity,is_active,sort_order
Premium Coffee Beans,Beverages,Premium arabica coffee,250g Pack,25.00,15.00,20.00,12,COFFEE-250G,1234567890123,Yes,pack,20,Main Warehouse,150,Yes,1
```

---

## 🔧 Troubleshooting

### Issue: "Product name is required"
**Solution:** Ensure `product_name` column exists and has values

### Issue: "Price must be greater than 0.01"
**Solution:** Check all price values are numeric and > 0.01

### Issue: "Outlet not found"
**Solution:** Verify outlet name matches exactly (case-sensitive)

### Issue: "SKU already exists"
**Solution:** Ensure each variation has unique SKU per product

### Issue: "Wholesale price must be less than retail price"
**Solution:** Check that `wholesale_price` < `price`

---

## 📞 Support

For import issues:
1. Check validation errors in import results
2. Verify column names match exactly
3. Ensure data types are correct
4. Review sample templates above

---

**Template Version:** 1.0  
**Last Updated:** 2024  
**Status:** Production Ready ✅

