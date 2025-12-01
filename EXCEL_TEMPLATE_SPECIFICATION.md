# Excel Template Specification for ChatGPT

## Task: Create an Excel Template File for Bulk Product Import

Create an Excel (.xlsx) file with the following specifications:

---

## File Requirements

- **Format**: Microsoft Excel (.xlsx)
- **File Name**: `product_import_template.xlsx`
- **Sheet Name**: "Products" (or default Sheet1)
- **Encoding**: UTF-8 compatible

---

## Column Specifications

### Column Structure (in order)

| Column # | Column Name | Required | Data Type | Max Length | Default Value | Example |
|----------|-------------|----------|-----------|------------|---------------|---------|
| 1 | **Name** | ✅ Yes | Text | 255 | - | "Coca Cola 500ml" |
| 2 | **Price** | ✅ Yes | Number | - | - | 1500.00 |
| 3 | **Stock** | ❌ No | Integer | - | 0 | 100 |
| 4 | **Unit** | ❌ No | Text | 50 | "pcs" | "pcs", "kg", "l", "ml" |
| 5 | **SKU** | ❌ No | Text | 100 | Auto-generated | "COKE-001" or leave empty |
| 6 | **Category** | ❌ No | Text | 255 | - | "Beverages" |
| 7 | **Barcode** | ❌ No | Text | 100 | - | "1234567890123" |
| 8 | **Cost** | ❌ No | Number | - | - | 1000.00 |
| 9 | **Description** | ❌ No | Text | Unlimited | - | "Carbonated soft drink" |
| 10 | **Low Stock Threshold** | ❌ No | Integer | - | 0 | 10 |
| 11 | **Is Active** | ❌ No | Text/Boolean | - | "Yes" | "Yes" or "No" |

---

## Header Row (Row 1)

**Exact column headers** (case-sensitive for display, but system accepts case-insensitive):

```
Name | Price | Stock | Unit | SKU | Category | Barcode | Cost | Description | Low Stock Threshold | Is Active
```

---

## Sample Data Rows (Rows 2-6)

Provide **5 example products** with realistic restaurant data:

### Row 2: Beverage
- Name: "Coca Cola 500ml"
- Price: 1500.00
- Stock: 100
- Unit: "pcs"
- SKU: (leave empty - will auto-generate)
- Category: "Beverages"
- Barcode: "1234567890123"
- Cost: 1000.00
- Description: "Carbonated soft drink"
- Low Stock Threshold: 10
- Is Active: "Yes"

### Row 3: Main Dish
- Name: "Pizza Margherita"
- Price: 5000.00
- Stock: 50
- Unit: "pcs"
- SKU: (leave empty)
- Category: "Main Dishes"
- Barcode: "9876543210987"
- Cost: 3000.00
- Description: "Classic pizza with tomato and mozzarella"
- Low Stock Threshold: 5
- Is Active: "Yes"

### Row 4: Appetizer
- Name: "Caesar Salad"
- Price: 3000.00
- Stock: 30
- Unit: "pcs"
- SKU: (leave empty)
- Category: "Appetizers"
- Barcode: "5555555555555"
- Cost: 1500.00
- Description: "Fresh romaine lettuce with caesar dressing"
- Low Stock Threshold: 10
- Is Active: "Yes"

### Row 5: Dessert
- Name: "Chocolate Cake"
- Price: 2500.00
- Stock: 20
- Unit: "pcs"
- SKU: (leave empty)
- Category: "Desserts"
- Barcode: "1111111111111"
- Cost: 1200.00
- Description: "Rich chocolate layer cake"
- Low Stock Threshold: 5
- Is Active: "Yes"

### Row 6: Side Dish
- Name: "French Fries"
- Price: 1500.00
- Stock: 200
- Unit: "pcs"
- SKU: (leave empty)
- Category: "Sides"
- Barcode: "2222222222222"
- Cost: 500.00
- Description: "Crispy golden fries"
- Low Stock Threshold: 50
- Is Active: "Yes"

---

## Formatting Requirements

### Header Row (Row 1)
- **Bold** text
- **Background color**: Light blue (#D9E1F2 or similar)
- **Text color**: Dark blue or black
- **Font size**: 11pt
- **Alignment**: Center
- **Borders**: All cells with borders

### Data Rows (Rows 2+)
- **Regular** text (not bold)
- **White** background
- **Font size**: 10pt
- **Alignment**: 
  - Text columns: Left
  - Number columns: Right
- **Borders**: All cells with borders

### Column Widths
- Name: 25 characters
- Price: 12 characters
- Stock: 10 characters
- Unit: 8 characters
- SKU: 15 characters
- Category: 20 characters
- Barcode: 15 characters
- Cost: 12 characters
- Description: 40 characters
- Low Stock Threshold: 18 characters
- Is Active: 12 characters

### Number Formatting
- **Price**: Number with 2 decimal places (e.g., 1500.00)
- **Cost**: Number with 2 decimal places (e.g., 1000.00)
- **Stock**: Integer (no decimals, e.g., 100)
- **Low Stock Threshold**: Integer (no decimals, e.g., 10)

---

## Data Validation Rules (Excel Data Validation)

### Price Column
- **Type**: Decimal
- **Minimum**: 0.01
- **Error message**: "Price must be greater than 0.01"

### Stock Column
- **Type**: Whole number
- **Minimum**: 0
- **Error message**: "Stock must be 0 or greater"

### Unit Column
- **Type**: List
- **Values**: pcs, kg, g, l, ml, box, pack
- **Error message**: "Please select a valid unit"

### Is Active Column
- **Type**: List
- **Values**: Yes, No
- **Error message**: "Please enter Yes or No"

### Low Stock Threshold Column
- **Type**: Whole number
- **Minimum**: 0
- **Error message**: "Low Stock Threshold must be 0 or greater"

---

## Instructions for ChatGPT

1. **Create Excel file** with the exact column structure above
2. **Add header row** with formatting (bold, blue background)
3. **Add 5 sample data rows** as specified
4. **Apply formatting** (borders, column widths, number formats)
5. **Add data validation** where specified
6. **Freeze header row** (so it stays visible when scrolling)
7. **Name the sheet** "Products"
8. **Save as .xlsx format**

---

## Additional Notes

### Empty Cells
- **SKU column**: Leave empty in sample rows (system will auto-generate)
- **Optional fields**: Can be left empty (will use defaults)

### Category Names
Use these restaurant categories in the sample data:
- "Beverages"
- "Main Dishes"
- "Appetizers"
- "Desserts"
- "Sides"

### Currency
- Prices are in **MWK (Malawian Kwacha)**
- No currency symbol in Excel (just numbers)
- Example: 1500.00 (represents MWK 1,500.00)

### Boolean Values (Is Active)
- Use "Yes" or "No" (text)
- Case doesn't matter (system accepts: Yes, yes, YES, No, no, NO)

---

## Complete Example Row Structure

```
Row 1 (Header):
Name | Price | Stock | Unit | SKU | Category | Barcode | Cost | Description | Low Stock Threshold | Is Active

Row 2:
Coca Cola 500ml | 1500.00 | 100 | pcs | | Beverages | 1234567890123 | 1000.00 | Carbonated soft drink | 10 | Yes

Row 3:
Pizza Margherita | 5000.00 | 50 | pcs | | Main Dishes | 9876543210987 | 3000.00 | Classic pizza with tomato and mozzarella | 5 | Yes

Row 4:
Caesar Salad | 3000.00 | 30 | pcs | | Appetizers | 5555555555555 | 1500.00 | Fresh romaine lettuce with caesar dressing | 10 | Yes

Row 5:
Chocolate Cake | 2500.00 | 20 | pcs | | Desserts | 1111111111111 | 1200.00 | Rich chocolate layer cake | 5 | Yes

Row 6:
French Fries | 1500.00 | 200 | pcs | | Sides | 2222222222222 | 500.00 | Crispy golden fries | 50 | Yes
```

---

## File Output Requirements

- **File name**: `product_import_template.xlsx`
- **Format**: Excel 2007+ (.xlsx)
- **Sheet name**: "Products"
- **Total rows**: 6 (1 header + 5 data rows)
- **Total columns**: 11

---

## Testing Checklist

After creating the file, verify:
- [ ] All 11 columns are present
- [ ] Header row is formatted (bold, colored background)
- [ ] 5 sample products with different categories
- [ ] Price values are numbers with 2 decimals
- [ ] Stock values are integers
- [ ] SKU column is empty (for auto-generation)
- [ ] Category column has valid category names
- [ ] File opens correctly in Excel
- [ ] Data validation works (try entering invalid values)

---

## Usage Instructions (for end user)

1. Open the Excel template file
2. Delete the sample rows (rows 2-6) or keep them as examples
3. Add your products starting from row 2
4. Fill in at minimum: **Name** and **Price** (required)
5. Optionally fill other columns
6. Leave **SKU** empty to auto-generate
7. Use category names from your restaurant (will be auto-created if they don't exist)
8. Save the file
9. Upload via the Import Products feature

---

## Important Notes

1. **First row must be headers** - Don't delete or modify header row
2. **Column order doesn't matter** - But keep headers exact
3. **Case-insensitive** - "Beverages" = "beverages" = "BEVERAGES"
4. **SKU optional** - Leave empty for auto-generation
5. **Category auto-creation** - Categories will be created automatically if they don't exist
6. **Maximum 1000 rows** per import (including header)

---

This specification should be sufficient for ChatGPT to create a properly formatted Excel template file.

