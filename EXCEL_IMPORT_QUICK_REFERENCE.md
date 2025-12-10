# Excel Import Quick Reference Card
## Copy-Paste Ready Field Definitions

---

## 🔵 Universal Core Fields (All Business Types)

### Product Fields
```
product_name          ✅ Required | Product base name
category              ⚠️ Optional | Category name (auto-created)
description           ⚠️ Optional | Product description
is_active             ⚠️ Optional | Yes/No (default: Yes)
```

### Variation Fields
```
variation_name        ⚠️ Optional | Variation name (empty = "Default")
price                 ✅ Required | Selling price (>= 0.01)
cost                  ⚠️ Optional | Cost price (>= 0)
variation_sku         ⚠️ Optional | SKU (unique per product)
variation_barcode     ⚠️ Optional | Barcode
track_inventory       ⚠️ Optional | Yes/No (default: Yes)
unit                  ⚠️ Optional | pcs/ml/kg/etc (default: pcs)
low_stock_threshold   ⚠️ Optional | Alert threshold (default: 0)
sort_order            ⚠️ Optional | Display order (default: 0)
```

### Inventory Fields
```
outlet                ⚠️ Optional | Outlet name/code
quantity              ⚠️ Optional | Stock qty (if track_inventory=Yes)
```

---

## 🟢 Retail-Specific Fields

**No additional fields** - Use universal core fields only.

**Example:**
```
product_name,category,variation_name,price,cost,outlet,quantity
T-Shirt,Clothing,Small,25.00,15.00,Main Store,50
T-Shirt,Clothing,Medium,25.00,15.00,Main Store,50
T-Shirt,Clothing,Large,25.00,15.00,Main Store,30
```

---

## 🟡 Wholesale-Specific Fields

```
wholesale_price              ⚠️ Optional | Wholesale price (at product level)
minimum_wholesale_quantity   ⚠️ Optional | Min qty for wholesale (default: 1)
```

**Example:**
```
product_name,variation_name,price,wholesale_price,minimum_wholesale_quantity
Soap Bar,Single,5.00,4.00,12
Soap Bar,Pack of 12,48.00,40.00,1
```

---

## 🟠 Bar-Specific Fields

```
volume_ml            ⚠️ Optional | Volume in milliliters (informational)
alcohol_percentage   ⚠️ Optional | Alcohol % (informational)
```

**Example:**
```
product_name,variation_name,price,volume_ml,alcohol_percentage,unit
Vodka,Shot,8.00,30,40,shot
Vodka,Bottle,180.00,750,40,bottle
```

---

## 🔴 Restaurant-Specific Fields

```
preparation_time     ⚠️ Optional | Prep time in minutes (informational)
is_menu_item         ⚠️ Optional | Yes/No (affects track_inventory)
```

**Example:**
```
product_name,variation_name,price,preparation_time,is_menu_item,track_inventory
Pizza,Small,45.00,15,Yes,No
Pizza,Medium,65.00,15,Yes,No
Soft Drink,,15.00,0,Yes,Yes
```

---

## 📋 Import Rules Summary

### ✅ Required
- `product_name` - Cannot be empty
- `price` - Must be >= 0.01

### ⚠️ Optional but Recommended
- `variation_name` - Empty = default variation
- `outlet` + `quantity` - If `track_inventory=Yes`
- `category` - For organization

### 🔄 Grouping Logic
- **Same `product_name`** = Same Product
- **Different `variation_name`** = Different Variation
- **Same `product_name` + `variation_name`** = Update existing Variation

### ⚠️ Validation
- `price` >= 0.01
- `cost` >= 0 (if provided)
- `quantity` >= 0 (if provided)
- `variation_sku` unique per product
- `track_inventory` = Yes/No/True/False/1/0

---

## 🚀 Quick Start

1. **Download template CSV** from `templates/` folder
2. **Open in Excel** and modify data
3. **Save as .xlsx** or keep as .csv
4. **Upload via UI** at `/dashboard/products` → Import

---

**For full documentation, see `EXCEL_IMPORT_TEMPLATES.md`**

