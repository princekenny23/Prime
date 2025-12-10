# Comprehensive Automated Low-Stock Detection & Draft PO Management

## Overview
This document describes the enhanced automated purchase order system that continuously monitors inventory, calculates sales velocity, creates/updates DRAFT purchase orders, and maintains a complete audit trail.

## Key Features Implemented

### 1. **Continuous Low-Stock Detection**
- Real-time monitoring via Django signals on stock movements
- Checks both product-level and variation-level stock (LocationStock)
- Evaluates stock against defined reorder thresholds
- Triggers automatically on sales, transfers, adjustments, damage, and expiry

### 2. **Sales Velocity Calculation**
- Calculates units sold per day/week/month based on recent sales history (default: 30 days)
- Considers outlet-specific sales if outlet is provided
- Used to optimize reorder quantities based on actual demand patterns
- Formula: `velocity_per_day = units_sold / days`

### 3. **Draft Purchase Order Management**
- **Always creates DRAFT status** - requires manual approval before sending to suppliers
- **No duplicate drafts** - checks for existing draft PO per supplier before creating
- **Updates existing drafts** - when stock decreases further, updates quantities in existing draft
- **Groups by supplier** - all low stock items for a supplier go into one draft PO
- **Recalculates quantities** - uses sales velocity to determine optimal order quantities

### 4. **Audit Logging**
- Complete audit trail of all auto-PO actions
- Tracks: draft creation, updates, item additions, quantity recalculations, duplicate prevention
- Stores context data (stock levels, velocities, quantities) in JSON format
- Links to related entities (PO, product, variation, supplier, user)

### 5. **Backward Compatibility**
- Works with existing procurement workflows
- Supports both product-level and variation-level inventory tracking
- Handles partial deliveries correctly during goods receipt
- Compatible with existing reporting and inventory management

## Implementation Details

### Models Added

#### AutoPOAuditLog
```python
- tenant (FK)
- purchase_order (FK, nullable)
- product (FK, nullable)
- variation (FK, nullable)
- supplier (FK, nullable)
- action_type (CharField) - Type of action logged
- description (TextField) - Human-readable description
- context_data (JSONField) - Flexible data storage
- triggered_by (FK to User, nullable) - User who triggered (null for automatic)
- created_at (DateTimeField)
```

### Service Functions

#### `calculate_sales_velocity(product, variation, outlet, days=30)`
Calculates sales velocity based on completed sales in the last N days.

**Returns:**
```python
{
    'units_sold': int,
    'days': int,
    'velocity_per_day': float,
    'velocity_per_week': float,
    'velocity_per_month': float,
    'last_sale_date': datetime or None
}
```

#### `calculate_reorder_quantity(product_supplier, current_stock, threshold, sales_velocity)`
Calculates optimal reorder quantity using:
- Base reorder quantity from ProductSupplier
- Sales velocity (if available)
- Stock deficit (threshold - current_stock)
- Lead time + safety stock (7 + 7 days)

**Formula:**
```
velocity_based_qty = velocity_per_day * (lead_time_days + safety_days)
recommended_qty = max(base_quantity, stock_deficit + 1, velocity_based_qty)
```

#### `log_auto_po_action(tenant, action_type, description, context_data, ...)`
Logs all auto-PO actions for audit trail.

#### `_get_or_create_draft_po(tenant, supplier, outlet, user)`
- Checks for existing draft PO for supplier
- Creates new draft if none exists
- Prevents duplicate drafts
- Logs duplicate prevention if existing draft found

#### `_create_grouped_purchase_orders(tenant, low_stock_items, settings, user, outlet)`
Enhanced function that:
1. Groups items by supplier
2. Gets or creates draft PO per supplier
3. Calculates sales velocity for each item
4. Calculates optimal reorder quantity
5. Adds new items or updates existing items in draft
6. Updates quantities when stock decreases further
7. Logs all actions

### Workflow

1. **Stock Movement Occurs**
   - Sale, transfer, adjustment, damage, or expiry
   - Django signal triggers `check_low_stock_after_movement`

2. **Low Stock Detection**
   - System checks if stock <= threshold
   - Only checks items with `low_stock_threshold > 0`
   - Checks both product-level and variation-level stock

3. **Supplier Selection**
   - Finds preferred supplier for product
   - Falls back to any active supplier if no preferred
   - Logs warning if no supplier found

4. **Draft PO Management**
   - Checks for existing draft PO for supplier
   - Uses existing draft if found (prevents duplicates)
   - Creates new draft if none exists

5. **Sales Velocity Calculation**
   - Calculates velocity from last 30 days of sales
   - Considers outlet-specific sales
   - Logs velocity calculation

6. **Quantity Calculation**
   - Uses sales velocity to optimize quantity
   - Ensures enough stock to cover lead time + safety stock
   - Updates existing item quantities if stock decreased further

7. **Audit Logging**
   - Logs draft creation/update
   - Logs item addition/update
   - Logs quantity recalculations
   - Logs duplicate prevention
   - Stores context data (stock, velocity, quantities)

8. **Manual Approval Required**
   - All POs created as DRAFT status
   - User must manually approve before sending to supplier
   - Approval workflow remains unchanged

## API Endpoints

### Auto-PO Settings
- `GET /auto-po-settings/` - Get current tenant's settings
- `PUT /auto-po-settings/{id}/` - Update settings
- `POST /auto-po-settings/check_low_stock/` - Manually trigger check

### Audit Logs (Future)
- `GET /auto-po-audit-logs/` - List audit logs
- `GET /auto-po-audit-logs/{id}/` - Get specific log

## Configuration

### Enable Auto-PO
1. Set `auto_po_enabled = True` in AutoPurchaseOrderSettings
2. Configure default reorder quantity
3. Set `group_by_supplier = True` (recommended)
4. Link products to suppliers with reorder settings

### Product-Supplier Configuration
- Set `reorder_quantity` - Base quantity to order
- Set `reorder_point` - Override product threshold (optional)
- Set `unit_cost` - Supplier-specific cost (optional)
- Mark `is_preferred = True` - Preferred supplier for auto-PO

## Example Scenarios

### Scenario 1: Initial Low Stock Detection
1. Product "Widget A" has threshold = 10, current stock = 8
2. System detects low stock
3. Calculates sales velocity: 2 units/day
4. Creates draft PO with quantity = 28 (2 units/day * 14 days)
5. Logs: draft_created, item_added, sales_velocity_calculated

### Scenario 2: Stock Decreases Further
1. Same product, stock now = 5
2. System detects stock decreased further
3. Finds existing draft PO
4. Updates item quantity: 28 → 35 (additional 7 units)
5. Logs: draft_updated, item_updated, quantity_recalculated

### Scenario 3: Multiple Products, Same Supplier
1. Products A, B, C all low stock
2. All linked to Supplier X
3. System creates ONE draft PO for Supplier X
4. Adds all three products to same PO
5. Groups efficiently to reduce PO count

### Scenario 4: Partial Delivery
1. Draft PO approved and sent to supplier
2. Supplier delivers partial quantity
3. User receives goods via existing receive endpoint
4. PO status updates to 'partial'
5. Stock increases for received items
6. System checks again - may create new draft for remaining items

## Database Schema

### AutoPOAuditLog Table
```sql
CREATE TABLE suppliers_autopoauditlog (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants_tenant(id),
    purchase_order_id BIGINT REFERENCES suppliers_purchaseorder(id),
    product_id BIGINT REFERENCES products_product(id),
    variation_id BIGINT REFERENCES products_itemvariation(id),
    supplier_id BIGINT REFERENCES suppliers_supplier(id),
    action_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    context_data JSONB DEFAULT '{}',
    triggered_by_id BIGINT REFERENCES accounts_user(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Migration Required

Run migration to create audit log table:
```bash
python manage.py makemigrations suppliers
python manage.py migrate suppliers
```

## Testing Checklist

- [ ] Low stock detection triggers on sale
- [ ] Draft PO created (not approved)
- [ ] No duplicate drafts for same supplier
- [ ] Sales velocity calculated correctly
- [ ] Quantities recalculated based on velocity
- [ ] Existing draft updated when stock decreases
- [ ] Audit logs created for all actions
- [ ] Manual approval required before sending
- [ ] Partial deliveries handled correctly
- [ ] Backward compatible with existing workflows

## Future Enhancements

- [ ] Celery periodic task for scheduled checks
- [ ] Email notifications on draft creation
- [ ] Dashboard showing draft POs requiring approval
- [ ] Analytics on auto-PO effectiveness
- [ ] Supplier lead time consideration
- [ ] Economic order quantity (EOQ) calculations
- [ ] Multi-outlet aggregation

