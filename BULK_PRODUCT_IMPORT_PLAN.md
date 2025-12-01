# Bulk Product Import - Excel/CSV Format & Implementation Plan

## Overview

This document outlines the Excel/CSV format requirements for bulk product import and the implementation plan to make it work with the backend database.

---

## Supported File Formats

1. **Excel (.xlsx)** - Recommended format
2. **CSV (.csv)** - Alternative format

Both formats will be supported, but Excel is recommended for better data handling.

---

## Excel/CSV Format Requirements

### Required Columns

| Column Name | Required | Data Type | Description | Example |
|------------|----------|-----------|-------------|---------|
| **Name** | ✅ Yes | Text | Product name (max 255 chars) | "Coca Cola 500ml" |
| **Price** | ✅ Yes | Number | Selling price (must be > 0.01) | 1500.00 |
| **Stock** | ❌ No | Integer | Initial stock quantity (default: 0) | 100 |
| **Unit** | ❌ No | Text | Unit of measurement (default: "pcs") | "pcs", "kg", "l", "ml", "box", "pack" |

### Optional Columns

| Column Name | Required | Data Type | Description | Example |
|------------|----------|-----------|-------------|---------|
| **SKU** | ❌ No | Text | Product SKU (auto-generated if empty) | "KFC-PROD-0001" |
| **Category** | ❌ No | Text | Category name (must exist or will be skipped) | "Beverages" |
| **Barcode** | ❌ No | Text | Product barcode | "1234567890123" |
| **Cost** | ❌ No | Number | Product cost price | 1000.00 |
| **Description** | ❌ No | Text | Product description | "Carbonated soft drink" |
| **Low Stock Threshold** | ❌ No | Integer | Alert when stock falls below this (default: 0) | 10 |
| **Is Active** | ❌ No | Boolean/Text | Active status (default: true) | "Yes", "True", "1" or "No", "False", "0" |

---

## Excel Template Format

### Sample Data (First 3 rows)

| Name | Price | Stock | Unit | SKU | Category | Barcode | Cost | Description | Low Stock Threshold | Is Active |
|------|-------|-------|------|-----|----------|---------|------|-------------|---------------------|-----------|
| Coca Cola 500ml | 1500.00 | 100 | pcs | | Beverages | 1234567890123 | 1000.00 | Carbonated soft drink | 10 | Yes |
| Bread White | 500.00 | 50 | pcs | | Food | 9876543210987 | 300.00 | Fresh white bread | 5 | Yes |
| Milk 1L | 2000.00 | 30 | l | | Dairy | 5555555555555 | 1500.00 | Fresh milk | 10 | Yes |

### Column Order

**Important**: Column order doesn't matter, but column **names** must match exactly (case-insensitive).

### Header Row

The first row **must** contain column headers. The system will:
- Match columns by name (case-insensitive)
- Ignore extra columns
- Skip rows with missing required fields

---

## Data Validation Rules

### 1. Required Fields
- **Name**: Cannot be empty
- **Price**: Must be a number > 0.01

### 2. Optional Fields with Defaults
- **Stock**: Defaults to 0 if empty
- **Unit**: Defaults to "pcs" if empty
- **SKU**: Auto-generated if empty (format: `TENANT-PROD-0001`)
- **Low Stock Threshold**: Defaults to 0 if empty
- **Is Active**: Defaults to true if empty

### 3. Category Handling
- If **Category** column is provided:
  - System looks for existing category by name (case-insensitive)
  - If category exists → Product assigned to that category
  - If category doesn't exist → Product created without category (category field skipped)
  - **Note**: Categories must be created first via the Categories page

### 4. Data Type Validation
- **Price**: Must be numeric, minimum 0.01
- **Cost**: Must be numeric, minimum 0 (if provided)
- **Stock**: Must be integer, minimum 0
- **Low Stock Threshold**: Must be integer, minimum 0
- **Is Active**: Accepts "Yes", "True", "1", "Y" (true) or "No", "False", "0", "N" (false)

### 5. SKU Uniqueness
- If SKU is provided, it must be unique within the tenant
- If SKU is empty, system auto-generates unique SKU per tenant
- Duplicate SKUs in the same import will cause validation errors

---

## Excel Template Example

### Minimal Template (Required Fields Only)

| Name | Price |
|------|-------|
| Product A | 1000.00 |
| Product B | 2000.00 |

### Full Template (All Fields)

| Name | Price | Stock | Unit | SKU | Category | Barcode | Cost | Description | Low Stock Threshold | Is Active |
|------|-------|-------|------|-----|----------|---------|------|-------------|---------------------|-----------|
| Coca Cola 500ml | 1500.00 | 100 | pcs | COKE-001 | Beverages | 1234567890123 | 1000.00 | Carbonated soft drink | 10 | Yes |
| Bread White | 500.00 | 50 | pcs | BREAD-001 | Food | 9876543210987 | 300.00 | Fresh white bread | 5 | Yes |
| Milk 1L | 2000.00 | 30 | l | MILK-001 | Dairy | 5555555555555 | 1500.00 | Fresh milk | 10 | Yes |

---

## Implementation Plan

### Backend (Django)

#### 1. Install Required Libraries
```bash
pip install openpyxl pandas  # For Excel file parsing
```

#### 2. Create Bulk Import Endpoint
**Endpoint**: `POST /api/v1/products/bulk-import/`

**Request**:
- Content-Type: `multipart/form-data`
- Body: `file` (Excel or CSV file)

**Response**:
```json
{
  "success": true,
  "total_rows": 100,
  "imported": 95,
  "failed": 5,
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
      "warning": "Category 'NonExistent' not found, product created without category"
    }
  ]
}
```

#### 3. Backend Processing Flow

```
1. Receive file upload
2. Validate file format (Excel or CSV)
3. Parse file and extract rows
4. Validate header row (check required columns)
5. For each data row:
   a. Validate required fields (name, price)
   b. Transform data to match Product model
   c. Handle category lookup/assignment
   d. Auto-generate SKU if not provided
   e. Validate SKU uniqueness (within tenant)
   f. Create Product in database (atomic transaction)
   g. Record success or error
6. Return summary with success/failure counts
```

#### 4. Backend Code Structure

**File**: `backend/apps/products/views.py`
- Add `@action` method to `ProductViewSet` for bulk import
- Use `openpyxl` for Excel parsing
- Use `pandas` or `csv` module for CSV parsing
- Validate each row before creating products
- Use bulk_create for performance (or individual creates for better error reporting)

**File**: `backend/apps/products/serializers.py`
- Create `BulkProductImportSerializer` for validation
- Handle category name → category ID conversion
- Validate SKU uniqueness per tenant

---

### Frontend (React/Next.js)

#### 1. Update Import Modal

**File**: `frontend/components/modals/import-products-modal.tsx`

**Changes**:
- Accept both `.xlsx` and `.csv` files
- Show file validation before upload
- Display upload progress
- Show import results (success/failure summary)
- Allow download of error report

#### 2. Update Product Service

**File**: `frontend/lib/services/productService.ts`

**Add Method**:
```typescript
async bulkImport(file: File): Promise<{
  success: boolean
  total_rows: number
  imported: number
  failed: number
  errors: Array<{ row: number; product_name: string; error: string }>
  warnings: Array<{ row: number; product_name: string; warning: string }>
}> {
  const formData = new FormData()
  formData.append('file', file)
  
  return api.post('/products/bulk-import/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
```

#### 3. Add Template Download

**File**: `frontend/components/modals/import-products-modal.tsx`

**Add Function**:
- Generate Excel template with sample data
- Download button to get template
- Include all columns with examples

---

## Excel File Structure Details

### Column Name Matching (Case-Insensitive)

The system will match columns by name, so these are all valid:
- `Name`, `name`, `NAME`, `Product Name`
- `Price`, `price`, `PRICE`, `Selling Price`
- `Stock`, `stock`, `STOCK`, `Quantity`, `Initial Stock`

### Supported Unit Values

- `pcs` (pieces) - Default
- `kg` (kilograms)
- `g` (grams)
- `l` (liters)
- `ml` (milliliters)
- `box` (box)
- `pack` (pack)

### Boolean Values (Is Active)

Accepted values (case-insensitive):
- **True**: "Yes", "True", "1", "Y", "yes", "true"
- **False**: "No", "False", "0", "N", "no", "false"

---

## Error Handling

### Validation Errors

Rows with validation errors will be **skipped** and reported in the response:

1. **Missing Required Field**: "Name is required"
2. **Invalid Price**: "Price must be greater than 0.01"
3. **Invalid Data Type**: "Stock must be a number"
4. **Duplicate SKU**: "SKU already exists for this tenant"
5. **Invalid Category**: Category not found (warning, not error)

### Import Limits

- **Maximum file size**: 10MB
- **Maximum rows per import**: 1000 products
- **Timeout**: 60 seconds

---

## Tenant Isolation

### Automatic Tenant Assignment

- All imported products are **automatically assigned** to the current user's tenant
- Frontend never sends tenant ID
- Backend gets tenant from `request.user.tenant`
- SKU uniqueness is enforced **per tenant**

### Category Handling

- Categories are **tenant-specific**
- If category name doesn't exist for the tenant, product is created without category
- User should create categories first via Categories page

---

## Sample Excel File Creation Guide

### Using Microsoft Excel

1. Open Excel
2. Create headers in Row 1:
   ```
   Name | Price | Stock | Unit | SKU | Category | Barcode | Cost | Description | Low Stock Threshold | Is Active
   ```
3. Fill in product data starting from Row 2
4. Save as `.xlsx` format

### Using Google Sheets

1. Create spreadsheet with same headers
2. Fill in data
3. Download as `.xlsx` format

### Using CSV

1. Create file with headers on first line:
   ```csv
   Name,Price,Stock,Unit,SKU,Category,Barcode,Cost,Description,Low Stock Threshold,Is Active
   ```
2. Add data rows (comma-separated)
3. Save as `.csv` file

---

## Implementation Steps

### Phase 1: Backend Endpoint
1. Install `openpyxl` and `pandas`
2. Create bulk import action in `ProductViewSet`
3. Add file parsing logic
4. Add validation logic
5. Add error reporting
6. Test with sample Excel file

### Phase 2: Frontend Integration
1. Update `ImportProductsModal` to accept Excel files
2. Add file upload to `productService.bulkImport()`
3. Add progress indicator
4. Add results display (success/failure summary)
5. Add template download functionality
6. Test end-to-end flow

### Phase 3: Error Handling & UX
1. Add detailed error messages
2. Add warning messages (e.g., category not found)
3. Add export error report (CSV with failed rows)
4. Add import history/logging
5. Add validation preview before import

---

## Example Excel Template (Downloadable)

The system will provide a downloadable template with:

1. **Header row** with all column names
2. **Sample data** (3-5 example products)
3. **Data validation** hints in comments (if Excel format)
4. **Formatting** to make it easy to use

---

## Testing Checklist

- [ ] Import with all fields filled
- [ ] Import with only required fields
- [ ] Import with missing required fields (should fail gracefully)
- [ ] Import with invalid price (should report error)
- [ ] Import with duplicate SKU (should report error)
- [ ] Import with non-existent category (should create product without category, show warning)
- [ ] Import with existing category (should assign correctly)
- [ ] Import with auto-generated SKU (should work)
- [ ] Import large file (1000 products)
- [ ] Verify all products belong to correct tenant
- [ ] Verify SKU uniqueness per tenant

---

## Summary

### Excel Format Requirements

**Required Columns**:
- `Name` (text)
- `Price` (number, > 0.01)

**Optional Columns**:
- `Stock` (integer, default: 0)
- `Unit` (text, default: "pcs")
- `SKU` (text, auto-generated if empty)
- `Category` (text, must exist or skipped)
- `Barcode` (text)
- `Cost` (number, >= 0)
- `Description` (text)
- `Low Stock Threshold` (integer, default: 0)
- `Is Active` (boolean/text, default: true)

### Key Points

1. ✅ **Excel (.xlsx) and CSV (.csv) both supported**
2. ✅ **Column names are case-insensitive**
3. ✅ **First row must be headers**
4. ✅ **SKU auto-generated if not provided**
5. ✅ **Categories must exist (created via Categories page)**
6. ✅ **All products automatically assigned to current tenant**
7. ✅ **SKU uniqueness enforced per tenant**
8. ✅ **Detailed error reporting for failed rows**

---

## Next Steps

1. **Create Excel template** with sample data
2. **Implement backend endpoint** for bulk import
3. **Update frontend modal** to handle Excel/CSV uploads
4. **Add template download** functionality
5. **Test with real Excel files**

Once this is implemented, you'll be able to:
- Download a template Excel file
- Fill it with your products
- Upload it to import all products at once
- See detailed results of what was imported and what failed

