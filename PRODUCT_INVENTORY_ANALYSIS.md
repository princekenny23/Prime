# Product & Inventory System Analysis
## Square POS Alignment - Current State Assessment

**Date:** 2024  
**Purpose:** Refactor to Square POS Item & Variations model while preserving existing logic

---

## 1. CURRENT SYSTEM ANALYSIS

### 1.1 Product Model (`backend/apps/products/models.py`)

**Current Fields:**
```python
- tenant (FK) ✅
- category (FK) ✅
- name ✅
- description ✅
- sku (CharField, optional, indexed) ✅
- barcode (CharField, optional, indexed) ✅
- retail_price (Decimal, required) ⚠️ (should move to variation if variations exist)
- cost (Decimal, optional) ⚠️ (should move to variation)
- wholesale_price (Decimal, optional) ⚠️ (business logic, not variation)
- wholesale_enabled (Boolean) ⚠️ (business logic)
- minimum_wholesale_quantity (Integer) ⚠️ (business logic)
- stock (Integer, default=0) ❌ (should be per-variation, per-location)
- low_stock_threshold (Integer) ⚠️ (should be per-variation)
- unit (CharField, default='pcs') ✅ (exists but not used for variations)
- image (ImageField) ✅
- is_active (Boolean) ✅
- created_at, updated_at ✅
```

**Responsibilities:**
- Base product/item definition
- Currently stores pricing (should move to variations)
- Currently stores stock (should move to variations/locations)
- SKU/barcode at product level (should be at variation level)

**Issues:**
1. ❌ No variation support - all products are single sellable units
2. ❌ Stock is global (not per-outlet, not per-variation)
3. ⚠️ Pricing at product level (works for simple products, but not for variations)
4. ⚠️ SKU/barcode at product level (should be at variation level in Square model)

---

### 1.2 Inventory Models (`backend/apps/inventory/models.py`)

#### StockMovement
**Current Fields:**
```python
- tenant (FK) ✅
- product (FK) ✅
- outlet (FK) ✅ (tracks WHERE movement happened, but stock is global)
- user (FK) ✅
- movement_type (CharField) ✅
- quantity (Integer) ✅
- reason (TextField) ✅
- reference_id (CharField) ✅
- created_at ✅
```

**Responsibilities:**
- ✅ Ledger-based inventory tracking (Square-compatible)
- ✅ Tracks outlet where movement occurred
- ⚠️ References Product directly (should reference Variation if variations exist)

**Issues:**
1. ⚠️ References Product, not Variation (will need FK to variation when added)
2. ✅ Outlet tracking exists (good for per-location stock later)

#### StockTake & StockTakeItem
**Current Fields:**
- StockTake: tenant, outlet, user, operating_date, status, description
- StockTakeItem: stock_take (FK), product (FK), expected_quantity, counted_quantity, difference

**Issues:**
1. ⚠️ References Product directly (should reference Variation)
2. ✅ Outlet-scoped (good)

---

### 1.3 Sales Models (`backend/apps/sales/models.py`)

#### SaleItem
**Current Fields:**
```python
- sale (FK) ✅
- product (FK) ✅
- product_name (CharField) ✅ (snapshot for deleted products)
- quantity (Integer) ✅
- price (Decimal) ✅ (CUSTOM PRICING AT SALE - Square compatible!)
- total (Decimal) ✅
- kitchen_status (CharField) ✅ (restaurant-specific)
- notes (TextField) ✅
- prepared_at (DateTime) ✅
```

**Responsibilities:**
- ✅ Stores custom price at sale time (Square-compatible)
- ✅ References Product
- ⚠️ No variation reference

**Issues:**
1. ⚠️ References Product, not Variation
2. ✅ Custom pricing support (Square-compatible)

---

### 1.4 Procurement Models (`backend/apps/suppliers/models.py`)

#### PurchaseOrderItem
**Current Fields:**
```python
- purchase_order (FK) ✅
- product (FK) ✅
- quantity (Integer) ✅
- unit_price (Decimal) ✅
- total (Decimal) ✅
- received_quantity (Integer) ✅
```

**Issues:**
1. ⚠️ References Product, not Variation

---

## 2. SQUARE POS MODEL COMPARISON

### 2.1 Square POS Structure

```
Item (Base Product)
├── Name, Description, Category, Status
├── Image
└── Variations (sellable units)
    ├── Name (e.g., "Bottle", "Shot", "500ml")
    ├── Price
    ├── Cost (optional)
    ├── SKU
    ├── Barcode
    ├── Track Inventory (toggle)
    ├── Unit Type (piece, ml, kg)
    └── Low Stock Alert
        └── Inventory (per location)
            └── Stock Level
            └── Stock Movements (ledger)
```

### 2.2 Feature Comparison Matrix

| Feature | Square POS | Current System | Status |
|---------|-----------|----------------|--------|
| **Item (Base Product)** | ✅ | ✅ Product model | ✅ Exists |
| **Item Variations** | ✅ Required | ❌ Missing | ❌ **MISSING** |
| **Price per Variation** | ✅ | ⚠️ At Product level | ⚠️ **PARTIAL** |
| **Cost per Variation** | ✅ Optional | ⚠️ At Product level | ⚠️ **PARTIAL** |
| **SKU per Variation** | ✅ | ⚠️ At Product level | ⚠️ **PARTIAL** |
| **Barcode per Variation** | ✅ | ⚠️ At Product level | ⚠️ **PARTIAL** |
| **Track Inventory Toggle** | ✅ Per variation | ❌ Missing | ❌ **MISSING** |
| **Unit Type** | ✅ Per variation | ✅ At Product (not used) | ⚠️ **PARTIAL** |
| **Low Stock Alert** | ✅ Per variation | ⚠️ At Product level | ⚠️ **PARTIAL** |
| **Inventory per Location** | ✅ | ❌ Global stock only | ❌ **MISSING** |
| **Inventory Ledger** | ✅ | ✅ StockMovement | ✅ **EXISTS** |
| **Custom Pricing at Sale** | ✅ | ✅ SaleItem.price | ✅ **EXISTS** |
| **Multi-location Support** | ✅ | ⚠️ Outlet tracked but stock global | ⚠️ **PARTIAL** |

---

## 3. IDENTIFIED GAPS & ISSUES

### 3.1 Critical Missing Features

1. **❌ ItemVariation Model**
   - No way to have multiple sellable units per product
   - Cannot support: sizes, colors, pack sizes, volume variations

2. **❌ Track Inventory Toggle**
   - All products currently track inventory
   - No way to disable tracking for services, digital products, etc.

3. **❌ Per-Location Stock**
   - Stock is global (`Product.stock`)
   - StockMovement tracks outlet but doesn't affect per-outlet stock
   - Cannot have different stock levels per outlet

4. **❌ Variation Support in Sales/Inventory**
   - SaleItem references Product only
   - StockMovement references Product only
   - Cannot sell specific variations

### 3.2 Partially Implemented Features

1. **⚠️ Pricing Structure**
   - Currently: `Product.retail_price`
   - Should be: `ItemVariation.price` (if variations exist)
   - **Solution:** Keep product price for backward compatibility, add variation price

2. **⚠️ SKU/Barcode**
   - Currently: `Product.sku`, `Product.barcode`
   - Should be: `ItemVariation.sku`, `ItemVariation.barcode`
   - **Solution:** Move to variation, keep product level for simple products

3. **⚠️ Unit Type**
   - Currently: `Product.unit` (exists but not used for variations)
   - Should be: `ItemVariation.unit`
   - **Solution:** Move to variation

4. **⚠️ Low Stock Alerts**
   - Currently: `Product.low_stock_threshold`
   - Should be: `ItemVariation.low_stock_threshold`
   - **Solution:** Move to variation

### 3.3 Duplication & Redundancy

1. **Price Fields:**
   - `Product.retail_price` ✅ (keep for backward compat)
   - `Product.wholesale_price` ⚠️ (business logic, not variation-specific)
   - `SaleItem.price` ✅ (custom pricing - keep)

2. **Stock Fields:**
   - `Product.stock` ❌ (should be per-variation, per-location)
   - StockMovement tracks outlet but stock is global

3. **SKU/Barcode:**
   - `Product.sku` ⚠️ (should be at variation level)
   - `Product.barcode` ⚠️ (should be at variation level)

---

## 4. BUSINESS TYPE REQUIREMENTS

### 4.1 Retail
- **Needs:** Simple variations (sizes, colors)
- **Current:** ✅ Works (single product = single variation)
- **After Refactor:** ✅ Will work (1 product = 1 variation by default)

### 4.2 Wholesale
- **Needs:** Pack-size variations (e.g., "Single", "Pack of 12", "Case of 144")
- **Current:** ⚠️ Uses `wholesale_price` field (not variation-based)
- **After Refactor:** ✅ Variations with different prices per pack size

### 4.3 Bar
- **Needs:** Volume-based variations (ml, shots, bottles)
- **Current:** ⚠️ Single product per drink
- **After Refactor:** ✅ Variations: "Shot (30ml)", "Bottle (750ml)", etc.

### 4.4 Restaurant
- **Needs:** Menu item variations + modifiers
- **Current:** ⚠️ Single product per menu item
- **After Refactor:** ✅ Variations: "Small", "Large", "Extra Large" + modifiers (future)

---

## 5. PROPOSED MINIMAL CHANGE PLAN

### 5.1 Phase 1: Add ItemVariation Model (NEW)

**Create:** `backend/apps/products/models.py` - `ItemVariation`

```python
class ItemVariation(models.Model):
    """Item variation model - Square POS compatible"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variations')
    name = models.CharField(max_length=255)  # e.g., "Bottle", "Shot", "500ml"
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    sku = models.CharField(max_length=100, db_index=True, blank=True)
    barcode = models.CharField(max_length=100, blank=True, db_index=True)
    track_inventory = models.BooleanField(default=True)
    unit = models.CharField(max_length=50, default='pcs')
    low_stock_threshold = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'products_itemvariation'
        unique_together = [['product', 'sku']]  # SKU unique per product
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['sku']),
            models.Index(fields=['barcode']),
        ]
```

**Migration Strategy:**
1. Create ItemVariation model
2. Auto-create default variation for all existing products
3. Migrate data: `Product.retail_price` → `ItemVariation.price`, etc.

---

### 5.2 Phase 2: Add Per-Location Stock (NEW)

**Create:** `backend/apps/inventory/models.py` - `LocationStock`

```python
class LocationStock(models.Model):
    """Stock level per location/variation"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    variation = models.ForeignKey(ItemVariation, on_delete=models.CASCADE, related_name='location_stocks')
    outlet = models.ForeignKey(Outlet, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'inventory_locationstock'
        unique_together = [['variation', 'outlet']]
        indexes = [
            models.Index(fields=['variation', 'outlet']),
            models.Index(fields=['outlet']),
        ]
```

**Migration Strategy:**
1. Create LocationStock model
2. Initialize from Product.stock (distribute evenly or to default outlet)
3. Update StockMovement to reference Variation instead of Product

---

### 5.3 Phase 3: Update References (REFACTOR)

**Update Models:**
1. `StockMovement.product` → `StockMovement.variation` (nullable for backward compat)
2. `SaleItem.product` → `SaleItem.variation` (nullable for backward compat)
3. `StockTakeItem.product` → `StockTakeItem.variation` (nullable)
4. `PurchaseOrderItem.product` → `PurchaseOrderItem.variation` (nullable)

**Backward Compatibility:**
- Keep `product` FK nullable
- Add `variation` FK
- Migration script to populate variation from product

---

### 5.4 Phase 4: Update Business Logic (REFACTOR)

**Update Views/Services:**
1. Sales: Reference variation instead of product
2. Inventory: Update variation stock instead of product stock
3. Stock movements: Reference variation
4. Stock takes: Reference variation

**Backward Compatibility:**
- If variation is null, fall back to product
- Auto-create default variation if missing

---

## 6. BACKWARD COMPATIBILITY STRATEGY

### 6.1 Product Model Fields (DEPRECATE, DON'T DELETE)

**Mark as deprecated but keep:**
- `Product.retail_price` → Use `variations.first().price` if variations exist
- `Product.cost` → Use `variations.first().cost` if variations exist
- `Product.sku` → Use `variations.first().sku` if variations exist
- `Product.barcode` → Use `variations.first().barcode` if variations exist
- `Product.stock` → Calculate from `LocationStock` or keep as aggregate
- `Product.low_stock_threshold` → Use `variations.first().low_stock_threshold`
- `Product.unit` → Use `variations.first().unit`

**Properties for backward compatibility:**
```python
@property
def price(self):
    """Backward compat: return first variation price or retail_price"""
    if self.variations.exists():
        return self.variations.first().price
    return self.retail_price  # Fallback for old data
```

---

### 6.2 Migration Script

**Data Migration Steps:**
1. Create default variation for all existing products
2. Copy Product fields to default variation:
   - `retail_price` → `variation.price`
   - `cost` → `variation.cost`
   - `sku` → `variation.sku`
   - `barcode` → `variation.barcode`
   - `unit` → `variation.unit`
   - `low_stock_threshold` → `variation.low_stock_threshold`
3. Create LocationStock entries from Product.stock
4. Update StockMovement to reference variations
5. Update SaleItem to reference variations (where possible)

---

## 7. IMPLEMENTATION CHECKLIST

### Phase 1: Models & Migrations
- [ ] Create ItemVariation model
- [ ] Create LocationStock model
- [ ] Add variation FK to StockMovement (nullable)
- [ ] Add variation FK to SaleItem (nullable)
- [ ] Add variation FK to StockTakeItem (nullable)
- [ ] Add variation FK to PurchaseOrderItem (nullable)
- [ ] Create migration scripts
- [ ] Test migrations on sample data

### Phase 2: Serializers & APIs
- [ ] Update ProductSerializer to include variations
- [ ] Create ItemVariationSerializer
- [ ] Update StockMovementSerializer
- [ ] Update SaleItemSerializer
- [ ] Update inventory endpoints
- [ ] Update sales endpoints

### Phase 3: Business Logic
- [ ] Update sales creation to use variations
- [ ] Update stock deduction to use variations
- [ ] Update stock movements to reference variations
- [ ] Update stock takes to use variations
- [ ] Update receiving to use variations
- [ ] Update transfers to use variations

### Phase 4: Frontend
- [ ] Update Product interface
- [ ] Add Variation management UI
- [ ] Update POS to select variations
- [ ] Update inventory pages
- [ ] Update sales pages

### Phase 5: Testing & Validation
- [ ] Test backward compatibility
- [ ] Test variation creation
- [ ] Test sales with variations
- [ ] Test inventory with variations
- [ ] Test per-location stock
- [ ] Validate no data loss

---

## 8. RISK ASSESSMENT

### Low Risk
- ✅ Adding ItemVariation model (new table, no breaking changes)
- ✅ Adding LocationStock model (new table)
- ✅ Making FKs nullable (backward compatible)

### Medium Risk
- ⚠️ Updating business logic to use variations
- ⚠️ Data migration (need thorough testing)
- ⚠️ Frontend updates (extensive changes)

### High Risk
- ❌ Removing Product fields (DON'T DO - mark deprecated)
- ❌ Changing existing FKs without migration

---

## 9. VALIDATION RULES

### After Implementation, Verify:

1. ✅ **No Duplication**
   - Price only in ItemVariation (or Product for backward compat)
   - SKU only in ItemVariation (or Product for backward compat)
   - Stock only in LocationStock (or Product.stock as aggregate)

2. ✅ **Backward Compatibility**
   - Old products without variations still work
   - Old sales still reference products
   - Old stock movements still work

3. ✅ **Square POS Compatibility**
   - Items have variations
   - Variations have pricing, SKU, barcode
   - Inventory tracked per location
   - Track inventory toggle works

4. ✅ **Business Type Support**
   - Retail: Simple variations work
   - Wholesale: Pack-size variations work
   - Bar: Volume variations work
   - Restaurant: Size variations work

---

## 10. NEXT STEPS

1. **Review this analysis** with team
2. **Approve minimal change plan**
3. **Create detailed implementation plan**
4. **Start with Phase 1 (Models)**
5. **Test thoroughly before proceeding**

---

**Status:** ✅ Analysis Complete - Ready for Implementation Planning

