# Auto Purchase Order Implementation - Supplier-Optional Design

## Overview
This document outlines the implementation of an auto-purchase-order system that supports Malawi-style informal suppliers where:
- Products can exist WITHOUT a supplier
- Suppliers are informal and can change per purchase
- Users often add or choose a supplier AFTER stock is already low
- The system automatically creates POs even when no supplier is assigned

## Business Requirements

### Core Principles
1. ✅ Products can exist WITHOUT a supplier
2. ✅ Suppliers are NOT permanently tied to products
3. ✅ Auto-reorder works WITHOUT requiring supplier upfront
4. ✅ Supplier selection is deferred to later in the workflow
5. ✅ Removing supplier from product does NOT break auto-reordering

## Data Model Changes

### 1. PurchaseOrder Model Updates

**Changes:**
- `supplier` field: Make nullable (`null=True, blank=True`)
- Status choices: Add `'pending_supplier'` status
- Add validation: Require supplier only when status moves beyond `draft` or `pending_supplier`

**Status Flow:**
```
DRAFT → PENDING_SUPPLIER → READY_TO_ORDER → ORDERED → RECEIVED
```

### 2. PurchaseOrderItem Model Updates

**Changes:**
- Add `supplier` field: `ForeignKey(Supplier, null=True, blank=True)`
- Add `supplier_status` field: `CharField` with choices:
  - `'no_supplier'` - No supplier assigned
  - `'supplier_assigned'` - Supplier assigned at item level
- Update constraints: Allow same product/variation in different items if supplier differs

**Rationale:**
- Item-level supplier allows different suppliers for different items in same PO
- Supports Malawi-style informal supplier relationships
- PO-level supplier is optional fallback

### 3. ProductSupplier Model

**No Changes Required:**
- This model remains for preference/configuration only
- Removing ProductSupplier does NOT prevent auto-reorder
- It's just a hint for preferred supplier, not a requirement

## Auto Reorder Logic

### Trigger Points
1. **Stock Movement** (sale, adjustment, waste)
2. **LocationStock Update** (variation-level stock)
3. **Product Stock Update** (product-level stock, backward compat)

### Logic Flow

```
WHEN stock_quantity <= reorder_level:
  1. Check if auto-PO is enabled (tenant settings)
  2. Check if item already in pending PO (prevent duplicates)
  3. IF supplier found (via ProductSupplier):
     - Create/update PO with supplier
  4. ELSE (no supplier):
     - Create/update PO WITHOUT supplier
     - Status = 'pending_supplier'
     - Item appears in Purchase Orders module
  5. Add product as PurchaseOrderItem
  6. Set required_quantity based on reorder rules
  7. Log audit event
```

### Duplicate Prevention
- Check for existing PO items with same product/variation
- If exists in DRAFT or PENDING_SUPPLIER PO:
  - Update quantity instead of creating duplicate
  - Recalculate based on current stock level

## Supplier Assignment Flow

### UI Flow
1. User navigates to Purchase Orders
2. Sees items with "No Supplier" badge
3. Clicks on item
4. Modal opens with:
   - List of existing suppliers
   - "Create New Supplier" button
   - Supplier selection dropdown
5. User selects or creates supplier
6. Supplier assigned to PurchaseOrderItem
7. If all items have suppliers, PO status can move to READY_TO_ORDER

### API Endpoints

#### 1. Assign Supplier to PO Item
```
PATCH /api/v1/purchase-orders/{po_id}/items/{item_id}/assign-supplier/
Body: { "supplier_id": 123 }
```

#### 2. Create Supplier Inline
```
POST /api/v1/suppliers/
Body: { "name": "...", ... }
Returns: { "id": 123, ... }
```

#### 3. Get Items Needing Supplier
```
GET /api/v1/purchase-orders/items-needing-supplier/
Returns: List of PurchaseOrderItems with supplier_status='no_supplier'
```

## Status Management

### PurchaseOrder Statuses
- `draft` - Auto-created, no supplier required
- `pending_supplier` - Has items but no supplier assigned
- `ready_to_order` - All items have suppliers, ready to send
- `ordered` - Sent to supplier
- `received` - Stock received
- `partial` - Partially received
- `cancelled` - Cancelled

### PurchaseOrderItem Statuses
- `no_supplier` - No supplier assigned
- `supplier_assigned` - Supplier assigned

## Multi-Tenant Safety

All operations MUST:
1. Filter by `tenant_id` in all queries
2. Validate tenant ownership before operations
3. Prevent cross-tenant data access
4. Use `TenantFilterMixin` in all ViewSets

## Audit & Alerts

### Audit Logging
- Log when auto-reorder triggers
- Log when supplier is added later
- Log when item stays too long without supplier (warning)

### Alert Thresholds
- Warn if item has no supplier for > 7 days
- Notify when PO is ready but waiting for supplier

## Implementation Checklist

### Backend
- [x] Update PurchaseOrder model (supplier nullable, new status)
- [ ] Update PurchaseOrderItem model (add supplier field)
- [ ] Create migration for model changes
- [ ] Update auto-PO service to create POs without supplier
- [ ] Update serializers for nullable supplier
- [ ] Add API endpoint: assign supplier to item
- [ ] Add API endpoint: get items needing supplier
- [ ] Update views to handle supplier-optional POs
- [ ] Add audit logging for supplier assignment
- [ ] Add warnings for items without supplier > 7 days

### Frontend
- [ ] Update Purchase Orders list to show "No Supplier" badge
- [ ] Create supplier assignment modal
- [ ] Add "Assign Supplier" button to PO items
- [ ] Create inline supplier creation form
- [ ] Update PO detail view for supplier assignment
- [ ] Add alerts for items waiting for supplier

### Testing
- [ ] Test auto-PO creation without supplier
- [ ] Test supplier assignment flow
- [ ] Test duplicate prevention
- [ ] Test multi-tenant isolation
- [ ] Test status transitions
- [ ] Test audit logging

## End-to-End Flow Example

### Scenario: Product goes low on stock, no supplier configured

1. **Sale occurs** → Stock decreases
2. **Signal triggers** → `check_low_stock_after_movement`
3. **Auto-PO service runs** → No supplier found for product
4. **PO created** → Status: `pending_supplier`, Supplier: `null`
5. **Item added** → PurchaseOrderItem with `supplier_status='no_supplier'`
6. **User sees PO** → In Purchase Orders list with "Needs Supplier" badge
7. **User clicks item** → Modal opens
8. **User creates supplier** → New supplier created
9. **User assigns supplier** → Item updated with supplier
10. **PO status updates** → If all items have suppliers, can move to `ready_to_order`

## Malawi-Style Supplier Support

This design fully supports informal supplier relationships:
- ✅ No permanent product-supplier links
- ✅ Supplier chosen per purchase
- ✅ Can change supplier between purchases
- ✅ Auto-reorder works without supplier
- ✅ Supplier added when convenient
- ✅ System doesn't block on missing supplier
