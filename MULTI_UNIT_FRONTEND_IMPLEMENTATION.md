# Multi-Unit Product Selling - Frontend Implementation Guide

## Overview
This document outlines the frontend changes needed to support multi-unit product selling (retail + wholesale) with unit conversion.

## Changes Required

### 1. Product List Table ✅
- **File**: `frontend/app/dashboard/products/page.tsx`
- **Changes**: Added "Outlet" column to display outlet name
- **Status**: ✅ Completed

### 2. Product Form (Add/Edit) - IN PROGRESS
- **File**: `frontend/components/modals/add-edit-product-modal.tsx`
- **Changes Needed**:
  - Add outlet selector field
  - Add "Selling Units" section to manage multiple units
  - Each unit needs: unit_name, conversion_factor, retail_price, wholesale_price
  - Base unit is the product's `unit` field

### 3. Sales Screen (POS) - PENDING
- **File**: `frontend/components/pos/unified-pos.tsx`
- **Changes Needed**:
  - Add unit selector dropdown when adding product to cart
  - Display price based on selected unit
  - Display stock availability in selected unit
  - Calculate quantity in base units for inventory deduction

### 4. Product Service - PENDING
- **File**: `frontend/lib/services/productService.ts`
- **Changes Needed**:
  - Add methods to manage ProductUnits (CRUD)
  - Update product transformation to include `selling_units`
  - Handle unit conversion in product display

## Implementation Steps

### Step 1: Update Product Form
1. Add outlet selector (required field)
2. Add "Selling Units" section with:
   - List of existing units
   - Add/Edit/Delete unit buttons
   - Unit form: unit_name, conversion_factor, retail_price, wholesale_price
   - Base unit indicator (product.unit)

### Step 2: Update POS Screen
1. When product is selected, show unit selector dropdown
2. Display price based on selected unit
3. Display stock in selected unit (convert from base units)
4. Store unit_id in cart item

### Step 3: Update Product Service
1. Add `productUnitService` with CRUD methods
2. Update product transformation to include selling_units
3. Add helper functions for unit conversion

## API Endpoints Needed

- `GET /api/v1/products/{id}/units/` - List units for a product
- `POST /api/v1/products/{id}/units/` - Create unit
- `PUT /api/v1/products/{id}/units/{unit_id}/` - Update unit
- `DELETE /api/v1/products/{id}/units/{unit_id}/` - Delete unit

## Data Flow

1. **Product Creation**:
   - User selects outlet
   - User sets base unit (e.g., "pcs")
   - User adds selling units (e.g., "dozen" = 12 pcs, "box" = 24 pcs)
   - Each unit has retail_price and wholesale_price

2. **Sale Process**:
   - User selects product
   - System shows available units
   - User selects unit (e.g., "dozen")
   - System shows price for that unit
   - System shows stock in that unit (e.g., "5 dozen available")
   - When added to cart, quantity is in selected unit
   - Backend converts to base units for inventory deduction

3. **Inventory**:
   - Always stored in base units
   - Display converted to selected unit
   - Deduction uses conversion_factor × quantity

