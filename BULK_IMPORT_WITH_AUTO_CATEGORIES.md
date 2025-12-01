# Bulk Product Import with Auto-Category Creation

## Overview

This document explains how to implement automatic category creation during bulk product import. When a product has a category name in the Excel file that doesn't exist, the system will **automatically create it** instead of skipping it.

---

## Current Behavior vs. New Behavior

### Current Plan (Manual Categories)
1. User creates categories first via Categories page
2. User imports products with category names
3. If category doesn't exist → Product created without category (warning shown)

### New Behavior (Auto-Create Categories)
1. User imports products with category names in Excel
2. System checks if category exists for tenant
3. If category exists → Product assigned to existing category
4. If category doesn't exist → **Category automatically created**, then product assigned
5. All happens in one import operation

---

## Implementation Strategy

### Backend Implementation Flow

#### Step 1: Parse Excel File
```
1. Read Excel/CSV file
2. Extract all unique category names from "Category" column
3. Get current tenant from request.user.tenant
```

#### Step 2: Category Resolution (Before Product Creation)
```
For each unique category name in the file:
  1. Normalize category name (trim, lowercase for comparison)
  2. Check if category exists for tenant:
     - Query: Category.objects.filter(tenant=tenant, name__iexact=category_name)
  3. If exists:
     - Use existing category ID
  4. If doesn't exist:
     - Create new Category:
       * tenant = current tenant
       * name = category_name (original case preserved)
       * description = "" (empty, can be updated later)
     - Store new category ID
  5. Create category mapping: {category_name: category_id}
```

#### Step 3: Product Creation
```
For each product row:
  1. Validate required fields (name, price)
  2. Get category_id from mapping (if category provided)
  3. Create product with category_id
  4. Handle SKU auto-generation
  5. Record success/error
```

---

## Technical Implementation Details

### Backend Code Structure

**File**: `backend/apps/products/views.py`

**New Method**: `bulk_import` action in `ProductViewSet`

```python
@action(detail=False, methods=['post'])
def bulk_import(self, request):
    """
    Bulk import products from Excel/CSV file
    Auto-creates categories if they don't exist
    """
    # 1. Get file from request
    # 2. Parse file (Excel or CSV)
    # 3. Extract unique categories
    # 4. Resolve/create categories
    # 5. Create products
    # 6. Return results
```

### Category Auto-Creation Logic

```python
def resolve_categories(category_names, tenant):
    """
    Resolve category names to category IDs
    Creates categories if they don't exist
    
    Returns: dict {category_name: category_id}
    """
    category_map = {}
    
    for category_name in category_names:
        if not category_name or category_name.strip() == "":
            continue
            
        # Normalize for lookup (case-insensitive)
        normalized = category_name.strip()
        
        # Check if exists (case-insensitive match)
        category = Category.objects.filter(
            tenant=tenant,
            name__iexact=normalized
        ).first()
        
        if category:
            # Use existing category
            category_map[category_name] = category.id
        else:
            # Create new category
            new_category = Category.objects.create(
                tenant=tenant,
                name=normalized,  # Use original case
                description=""
            )
            category_map[category_name] = new_category.id
    
    return category_map
```

### Product Creation with Categories

```python
def create_products_from_rows(rows, tenant, category_map):
    """
    Create products from parsed rows
    Uses category_map to assign categories
    """
    results = {
        'imported': 0,
        'failed': 0,
        'errors': [],
        'warnings': []
    }
    
    for row_num, row_data in enumerate(rows, start=2):  # Start at 2 (row 1 is header)
        try:
            # Extract data
            name = row_data.get('Name', '').strip()
            price = float(row_data.get('Price', 0))
            category_name = row_data.get('Category', '').strip()
            
            # Validate required fields
            if not name:
                results['errors'].append({
                    'row': row_num,
                    'product_name': name or 'Unknown',
                    'error': 'Name is required'
                })
                results['failed'] += 1
                continue
            
            if price <= 0.01:
                results['errors'].append({
                    'row': row_num,
                    'product_name': name,
                    'error': 'Price must be greater than 0.01'
                })
                results['failed'] += 1
                continue
            
            # Get category ID (if provided)
            category_id = None
            if category_name:
                category_id = category_map.get(category_name)
                if not category_id:
                    # Category was created, but not in map (shouldn't happen)
                    results['warnings'].append({
                        'row': row_num,
                        'product_name': name,
                        'warning': f'Category "{category_name}" not found, product created without category'
                    })
            
            # Create product
            product_data = {
                'name': name,
                'price': price,
                'stock': int(row_data.get('Stock', 0) or 0),
                'unit': row_data.get('Unit', 'pcs') or 'pcs',
                'category_id': category_id,
                # ... other fields
            }
            
            # Handle SKU
            sku = row_data.get('SKU', '').strip()
            if sku:
                product_data['sku'] = sku
            # Otherwise, SKU will be auto-generated by serializer
            
            # Create product (using serializer for validation)
            serializer = ProductSerializer(
                data=product_data,
                context={'request': request}
            )
            
            if serializer.is_valid():
                serializer.save(tenant=tenant)
                results['imported'] += 1
            else:
                results['errors'].append({
                    'row': row_num,
                    'product_name': name,
                    'error': str(serializer.errors)
                })
                results['failed'] += 1
                
        except Exception as e:
            results['errors'].append({
                'row': row_num,
                'product_name': row_data.get('Name', 'Unknown'),
                'error': str(e)
            })
            results['failed'] += 1
    
    return results
```

---

## Complete Import Flow

```
1. User uploads Excel/CSV file
   ↓
2. Backend receives file
   ↓
3. Parse file and extract data
   ↓
4. Extract unique category names from "Category" column
   ↓
5. For each unique category:
   - Check if exists (case-insensitive)
   - If exists → use existing
   - If not → create new category
   ↓
6. Create category mapping {name: id}
   ↓
7. For each product row:
   - Validate required fields
   - Get category_id from mapping
   - Create product with category
   - Handle SKU auto-generation
   ↓
8. Return results:
   - Total imported
   - Total failed
   - List of errors
   - List of warnings (e.g., category created)
```

---

## Category Name Matching Rules

### Case-Insensitive Matching
- "Beverages" = "beverages" = "BEVERAGES"
- System uses `name__iexact` for lookup
- New category created with **original case** from Excel

### Examples

**Excel has**: "Beverages"
- If "Beverages" exists → Use it
- If "beverages" exists → Use it (case-insensitive match)
- If neither exists → Create "Beverages" (preserve original case)

**Excel has**: "Main Dishes"
- If "Main Dishes" exists → Use it
- If "main dishes" exists → Use it
- If neither exists → Create "Main Dishes"

### Whitespace Handling
- Leading/trailing spaces are trimmed
- " Beverages " becomes "Beverages"
- Multiple spaces normalized to single space

---

## Response Format

### Success Response
```json
{
  "success": true,
  "total_rows": 100,
  "imported": 95,
  "failed": 5,
  "categories_created": 8,
  "categories_existing": 12,
  "errors": [
    {
      "row": 3,
      "product_name": "Invalid Product",
      "error": "Price must be greater than 0.01"
    }
  ],
  "warnings": [
    {
      "row": 5,
      "product_name": "Product X",
      "warning": "Category 'NewCategory' was automatically created"
    }
  ]
}
```

### Key Fields
- `categories_created` - How many new categories were created
- `categories_existing` - How many categories already existed
- `warnings` - Informational messages (e.g., category created)

---

## Edge Cases & Handling

### 1. Duplicate Category Names in Excel
**Scenario**: Excel has "Beverages" and "beverages" (different case)
**Handling**: 
- Both normalized to same category
- Only one category created/used
- All products with either name get same category

### 2. Empty Category Column
**Scenario**: Some rows have category, some don't
**Handling**:
- Empty category → Product created without category
- No error or warning (this is valid)

### 3. Category Name with Special Characters
**Scenario**: Category name like "Café & Bar"
**Handling**:
- Preserved as-is
- No sanitization needed
- Stored exactly as in Excel

### 4. Very Long Category Names
**Scenario**: Category name > 255 characters
**Handling**:
- Truncate to 255 characters (database limit)
- Show warning in response

### 5. Category Name Already Exists (Different Case)
**Scenario**: "Beverages" exists, Excel has "beverages"
**Handling**:
- Use existing category (case-insensitive match)
- No duplicate created
- Product assigned to existing category

---

## Database Operations

### Transaction Handling

**Option 1: Single Transaction (Recommended)**
```python
with transaction.atomic():
    # 1. Create all categories
    # 2. Create all products
    # If any product fails, rollback everything
```
**Pros**: All-or-nothing, data consistency
**Cons**: If one product fails, entire import fails

**Option 2: Per-Product Transaction**
```python
for product in products:
    with transaction.atomic():
        # Create category if needed
        # Create product
        # Continue even if one fails
```
**Pros**: Partial success, more products imported
**Cons**: Some products might succeed, some fail

**Recommendation**: Use **Option 2** (per-product) for better UX - import as many as possible, report failures.

### Category Creation
- Categories created **before** products
- All categories created in one batch (bulk_create)
- Then products created with category references

---

## Frontend Changes

### Import Modal Updates

**File**: `frontend/components/modals/import-products-modal.tsx`

**New Features**:
1. Show category auto-creation notice
2. Display import results with:
   - Categories created count
   - Categories existing count
   - Product import summary
3. Show warnings for auto-created categories
4. Allow user to review created categories

### Response Display

```typescript
interface ImportResult {
  success: boolean
  total_rows: number
  imported: number
  failed: number
  categories_created: number
  categories_existing: number
  errors: Array<{row: number; product_name: string; error: string}>
  warnings: Array<{row: number; product_name: string; warning: string}>
}
```

**UI Display**:
- Success message: "95 products imported successfully"
- Category info: "8 new categories created, 12 existing categories used"
- Error list: Show failed rows with reasons
- Warning list: Show auto-created categories

---

## Excel File Format (Updated)

### Category Column Behavior

| Name | Price | Category |
|------|-------|----------|
| Coca Cola | 1500.00 | Beverages |
| Pizza Margherita | 5000.00 | Main Dishes |
| Fresh Salad | 2000.00 | Salads |

**What Happens**:
1. "Beverages" → Check if exists → Create if not → Use it
2. "Main Dishes" → Check if exists → Create if not → Use it
3. "Salads" → Check if exists → Create if not → Use it

**No manual category creation needed!**

---

## Benefits of Auto-Category Creation

### User Experience
✅ **One-step process** - Import products and categories together
✅ **No pre-work** - Don't need to create categories first
✅ **Faster setup** - Get products in system quickly
✅ **Less errors** - No typos in category names (system handles matching)

### Workflow Improvement
- **Before**: Create categories → Import products (2 steps)
- **After**: Import products with categories (1 step)

### Flexibility
- Can still create categories manually if preferred
- Auto-created categories can be edited later
- System handles case-insensitive matching automatically

---

## Implementation Checklist

### Backend
- [ ] Install `openpyxl` and `pandas` libraries
- [ ] Create `bulk_import` action in `ProductViewSet`
- [ ] Implement file parsing (Excel and CSV)
- [ ] Implement category resolution function
- [ ] Implement category auto-creation logic
- [ ] Implement product creation with category assignment
- [ ] Add error handling and reporting
- [ ] Add transaction management
- [ ] Test with various Excel files

### Frontend
- [ ] Update `ImportProductsModal` to accept Excel files
- [ ] Add `bulkImport` method to `productService`
- [ ] Update UI to show category creation info
- [ ] Add results display with categories created
- [ ] Add template download with category examples
- [ ] Test end-to-end flow

---

## Example: Complete Import Flow

### Excel File
```
Name              | Price   | Category
Coca Cola 500ml   | 1500.00 | Beverages
Pizza Margherita  | 5000.00 | Main Dishes
Fresh Salad       | 2000.00 | Salads
```

### What Happens
1. System extracts categories: ["Beverages", "Main Dishes", "Salads"]
2. Checks each category:
   - "Beverages" → Doesn't exist → Creates it
   - "Main Dishes" → Doesn't exist → Creates it
   - "Salads" → Doesn't exist → Creates it
3. Creates mapping: {"Beverages": 1, "Main Dishes": 2, "Salads": 3}
4. Creates products with category assignments
5. Returns: "3 products imported, 3 categories created"

### Result
- ✅ 3 products created
- ✅ 3 categories created automatically
- ✅ All products assigned to correct categories
- ✅ Ready to use immediately

---

## Summary

### Key Changes
1. **Category auto-creation** - Categories created automatically if they don't exist
2. **Case-insensitive matching** - "Beverages" = "beverages"
3. **One-step import** - Products and categories in one operation
4. **Better UX** - No manual category creation needed

### Excel File Requirements
- Include "Category" column with category names
- Category names are case-insensitive
- Empty category = product without category (valid)
- System handles everything automatically

### User Workflow
1. Create Excel file with products and categories
2. Upload file
3. System creates categories automatically
4. Products imported with categories assigned
5. Done! ✅

---

This approach makes bulk import much more user-friendly - users can just put category names in their Excel file and the system handles everything automatically!

