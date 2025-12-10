# Wholesale & Retail Excel Template - Quick Reference
## Copy-Paste Ready for Excel/CSV

---

## 📋 Column Headers (Copy This Row)

```
product_name,category,description,variation_name,price,cost,wholesale_price,minimum_wholesale_quantity,variation_sku,variation_barcode,track_inventory,unit,low_stock_threshold,outlet,quantity,is_active,sort_order
```

---

## ✅ Required Columns Only (Minimal Template)

**Headers:**
```
product_name,price
```

**Example:**
```
product_name,price
Rice 5kg,45.00
Sugar 1kg,35.00
Soap Bar,5.00
```

---

## 📊 Standard Template (Recommended)

**Headers:**
```
product_name,category,price,cost,wholesale_price,minimum_wholesale_quantity,outlet,quantity
```

**Example:**
```
product_name,category,price,cost,wholesale_price,minimum_wholesale_quantity,outlet,quantity
Rice 5kg,Groceries,45.00,30.00,38.00,10,Main Warehouse,200
Sugar 1kg,Groceries,35.00,22.00,28.00,10,Main Warehouse,150
Soap Bar,Personal Care,5.00,2.50,4.00,12,Main Warehouse,500
```

---

## 🎯 Complete Template (All Fields)

**Headers:**
```
product_name,category,description,variation_name,price,cost,wholesale_price,minimum_wholesale_quantity,variation_sku,variation_barcode,track_inventory,unit,low_stock_threshold,outlet,quantity,is_active,sort_order
```

**Example Data:**
```
Premium Coffee Beans,Beverages,Premium arabica coffee,250g Pack,25.00,15.00,20.00,12,COFFEE-250G,1234567890123,Yes,pack,20,Main Warehouse,150,Yes,1
Premium Coffee Beans,Beverages,Premium arabica coffee,500g Pack,45.00,28.00,38.00,6,COFFEE-500G,1234567890124,Yes,pack,15,Main Warehouse,100,Yes,2
Soap Bar,Personal Care,Antibacterial soap,Single,5.00,2.50,4.00,12,SOAP-SINGLE,1112223334444,Yes,pcs,50,Main Warehouse,500,Yes,1
Soap Bar,Personal Care,Antibacterial soap,Pack of 12,48.00,30.00,40.00,1,SOAP-PACK12,1112223334445,Yes,pack,10,Main Warehouse,100,Yes,2
Rice 5kg,Groceries,Long grain white rice,,45.00,30.00,38.00,10,RICE-5KG,9876543210123,Yes,bag,20,Main Warehouse,200,Yes,0
```

---

## 📝 Field Descriptions

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| `product_name` | ✅ | Product name | "Rice 5kg" |
| `price` | ✅ | Retail price | 45.00 |
| `category` | ⚠️ | Category name | "Groceries" |
| `description` | ⚠️ | Product description | "Long grain white rice" |
| `variation_name` | ⚠️ | Size/pack variation | "250g Pack", "Pack of 12" |
| `cost` | ⚠️ | Cost price | 30.00 |
| `wholesale_price` | ⚠️ | Wholesale price | 38.00 |
| `minimum_wholesale_quantity` | ⚠️ | Min qty for wholesale | 10 |
| `variation_sku` | ⚠️ | SKU code | "RICE-5KG" |
| `variation_barcode` | ⚠️ | Barcode | "1234567890123" |
| `track_inventory` | ⚠️ | Track stock (Yes/No) | Yes |
| `unit` | ⚠️ | Unit of measure | pcs, kg, pack, box |
| `low_stock_threshold` | ⚠️ | Low stock alert | 20 |
| `outlet` | ⚠️ | Outlet name | "Main Warehouse" |
| `quantity` | ⚠️ | Stock quantity | 200 |
| `is_active` | ⚠️ | Active status (Yes/No) | Yes |
| `sort_order` | ⚠️ | Display order | 0 |

---

## 💡 Quick Tips

1. **Same product_name** = Same product (creates variations)
2. **Empty variation_name** = Creates "Default" variation
3. **wholesale_price** = Enables wholesale pricing
4. **outlet + quantity** = Stock at that location
5. **Leave wholesale fields empty** = Retail-only product

---

## 📁 Template Files Available

- `templates/wholesale-retail-product-import-template.csv` - Complete template with examples
- `templates/wholesale-retail-product-import-minimal.csv` - Minimal template (required fields only)

---

**For detailed instructions, see:** `WHOLESALE_RETAIL_EXCEL_TEMPLATE.md`

