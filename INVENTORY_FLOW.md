# Inventory Management System - Complete Flow Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Core Components](#core-components)
4. [Stock Movement Types](#stock-movement-types)
5. [Complete Inventory Flow](#complete-inventory-flow)
6. [Business Type Specifics](#business-type-specifics)
7. [API Endpoints](#api-endpoints)
8. [Frontend Pages](#frontend-pages)
9. [Workflows](#workflows)
10. [Best Practices](#best-practices)

---

## Overview

The PrimePOS Inventory Management System provides comprehensive stock tracking, movement recording, and inventory control for all business types (Retail, Restaurant, Bar). The system maintains real-time stock levels, tracks all inventory movements, and provides audit trails for compliance and reporting.

### Key Features
- **Real-time Stock Tracking**: Automatic stock updates on sales, purchases, and adjustments
- **Multi-Outlet Support**: Track inventory across multiple outlets with transfers
- **Stock Movements**: Complete audit trail of all inventory changes
- **Stock Taking**: Physical inventory counts with automatic adjustments
- **Purchase Integration**: Receive inventory from suppliers and purchase orders
- **Sales Integration**: Automatic stock deduction on sales completion
- **Tenant Isolation**: Secure multi-tenant architecture

---

## System Architecture

### Database Models

#### 1. StockMovement
Tracks all inventory movements with complete audit trail.

**Fields:**
- `tenant`: Business/tenant owner
- `product`: Product being moved
- `outlet`: Outlet where movement occurs
- `user`: User who performed the action
- `movement_type`: Type of movement (sale, purchase, adjustment, etc.)
- `quantity`: Quantity moved (always positive)
- `reason`: Optional reason/description
- `reference_id`: Reference to related transaction (sale ID, PO ID, etc.)
- `created_at`: Timestamp

#### 2. StockTake
Represents a physical inventory count session.

**Fields:**
- `tenant`: Business owner
- `outlet`: Outlet being counted
- `user`: User performing the count
- `operating_date`: Date of stock take
- `status`: running, completed, cancelled
- `description`: Optional notes
- `created_at`: When stock take started
- `completed_at`: When stock take was finalized

#### 3. StockTakeItem
Individual product count within a stock take.

**Fields:**
- `stock_take`: Parent stock take
- `product`: Product being counted
- `expected_quantity`: System stock level
- `counted_quantity`: Physical count
- `difference`: Auto-calculated (counted - expected)
- `notes`: Optional notes

---

## Core Components

### Backend Components

1. **Inventory App** (`backend/apps/inventory/`)
   - Models: StockMovement, StockTake, StockTakeItem
   - Views: StockMovementViewSet, StockTakeViewSet, adjust, transfer, receive
   - Serializers: StockMovementSerializer, StockTakeSerializer

2. **Products App** (`backend/apps/products/`)
   - Product model with `stock` field
   - Stock is updated automatically on movements

3. **Sales App** (`backend/apps/sales/`)
   - Automatically deducts stock on sale completion
   - Creates StockMovement record

4. **Suppliers App** (`backend/apps/suppliers/`)
   - Purchase orders can receive inventory
   - Creates StockMovement records

### Frontend Components

1. **Inventory Dashboard** (`/dashboard/inventory`)
   - Main inventory management hub
   - Links to all inventory operations

2. **Stock Adjustments** (`/dashboard/inventory/stock-adjustments`)
   - Manual stock adjustments
   - Damage, expiry, loss tracking

3. **Stock Taking** (`/dashboard/inventory/stock-taking`)
   - Physical inventory counts
   - Audit and reconciliation

4. **Transfers** (`/dashboard/inventory/transfers`)
   - Inter-outlet stock transfers

5. **Receiving** (`/dashboard/inventory/receiving`)
   - Receive inventory from suppliers
   - Purchase order receiving

---

## Stock Movement Types

The system tracks 9 different movement types:

| Type | Description | Stock Effect | Common Use Cases |
|------|-------------|-------------|------------------|
| `sale` | Product sold | Decreases | POS sales, online orders |
| `purchase` | Inventory received | Increases | Supplier deliveries, PO receiving |
| `adjustment` | Manual correction | +/- | Stock corrections, stock take adjustments |
| `transfer_in` | Received from another outlet | Increases | Inter-outlet transfers |
| `transfer_out` | Sent to another outlet | Decreases | Inter-outlet transfers |
| `return` | Customer return | Increases | Product returns, refunds |
| `damage` | Damaged goods | Decreases | Broken items, spoilage |
| `expiry` | Expired products | Decreases | Food expiry, expired inventory |

---

## Complete Inventory Flow

### 1. Stock Increase Flows

#### A. Purchase/Receiving Flow
```
Supplier Delivery → Receive Inventory → Stock Increase
```

**Process:**
1. User navigates to `/dashboard/inventory/receiving`
2. Selects outlet and supplier
3. Adds products with quantities and optional costs
4. System creates StockMovement (type: `purchase`)
5. Product stock is increased
6. Product cost can be updated if provided

**API:** `POST /api/v1/inventory/receive/`

**Request:**
```json
{
  "outlet_id": 1,
  "supplier": "Supplier Name",
  "items": [
    {
      "product_id": 123,
      "quantity": 50,
      "cost": 10.50
    }
  ],
  "reason": "Weekly delivery"
}
```

#### B. Purchase Order Receiving Flow
```
Create PO → Approve PO → Receive PO → Stock Increase
```

**Process:**
1. Create purchase order with items
2. Approve purchase order
3. When goods arrive, mark as received
4. System creates StockMovement (type: `purchase`)
5. Product stock is increased

**API:** `POST /api/v1/purchase-orders/{id}/receive/`

#### C. Customer Return Flow
```
Customer Return → Process Return → Stock Increase
```

**Process:**
1. Customer returns product
2. Process return in sales system
3. System creates StockMovement (type: `return`)
4. Product stock is increased

#### D. Transfer In Flow
```
Transfer Out (Outlet A) → Transfer In (Outlet B) → Stock Increase (B)
```

**Process:**
1. Initiate transfer from source outlet
2. System creates two movements:
   - `transfer_out` at source outlet
   - `transfer_in` at destination outlet
3. Stock increases at destination

**API:** `POST /api/v1/inventory/transfer/`

---

### 2. Stock Decrease Flows

#### A. Sale Flow
```
Create Sale → Add Items → Complete Sale → Stock Decrease
```

**Process:**
1. Cashier creates sale in POS
2. Adds products to cart
3. Completes sale
4. For each item:
   - Product stock is decreased
   - StockMovement created (type: `sale`)
   - Reference ID links to sale

**Automatic Integration:**
- Happens automatically in `SaleViewSet.create()`
- Uses database transactions for atomicity
- Prevents negative stock (can be configured)

#### B. Manual Adjustment Flow
```
Identify Discrepancy → Create Adjustment → Stock Decrease/Increase
```

**Process:**
1. User navigates to `/dashboard/inventory/stock-adjustments`
2. Selects product and outlet
3. Enters adjustment quantity (positive or negative)
4. Provides reason
5. System creates StockMovement (type: `adjustment`)
6. Product stock is adjusted

**API:** `POST /api/v1/inventory/adjust/`

**Request:**
```json
{
  "product_id": 123,
  "outlet_id": 1,
  "quantity": -5,
  "reason": "Found damaged items",
  "type": "adjustment"
}
```

#### C. Damage/Expiry Flow
```
Identify Damage/Expiry → Record Loss → Stock Decrease
```

**Process:**
1. User identifies damaged/expired items
2. Creates adjustment with type `damage` or `expiry`
3. Stock is decreased
4. Movement recorded for audit

#### D. Transfer Out Flow
```
Initiate Transfer → Transfer Out → Stock Decrease (Source)
```

**Process:**
1. User initiates transfer between outlets
2. System creates `transfer_out` movement
3. Stock decreases at source outlet
4. Corresponding `transfer_in` at destination

---

### 3. Stock Taking Flow (Audit)

```
Start Stock Take → Count Products → Record Counts → Complete → Auto-Adjust
```

**Detailed Process:**

1. **Start Stock Take**
   - Navigate to `/dashboard/inventory/stock-taking`
   - Create new stock take
   - Select outlet and date
   - System auto-creates items for all active products
   - Status: `running`

2. **Physical Count**
   - User counts physical inventory
   - Updates `counted_quantity` for each product
   - System calculates `difference` automatically

3. **Review Discrepancies**
   - View differences between expected and counted
   - Add notes for significant variances

4. **Complete Stock Take**
   - User completes stock take
   - System processes all items with differences:
     - Updates product stock
     - Creates StockMovement (type: `adjustment`)
     - Links to stock take ID
   - Status changes to `completed`

**API:** 
- `POST /api/v1/inventory/stock-take/` - Create
- `PUT /api/v1/inventory/stock-take/{id}/items/{item_id}/` - Update count
- `POST /api/v1/inventory/stock-take/{id}/complete/` - Complete

---

## Business Type Specifics

### Retail Business
- **Focus**: Product sales, stock levels, reorder points
- **Common Operations**:
  - Daily receiving from suppliers
  - Frequent stock adjustments
  - Regular stock takes
  - Inter-store transfers

### Restaurant Business
- **Focus**: Ingredient tracking, kitchen inventory
- **Common Operations**:
  - Daily receiving of fresh ingredients
  - Recipe-based stock deduction (future feature)
  - Expiry tracking for perishables
  - Waste/damage tracking

### Bar Business
- **Focus**: Beverage inventory, bottle tracking
- **Common Operations**:
  - Alcohol receiving and tracking
  - Partial bottle tracking
  - Expiry for perishable mixers
  - Waste/spillage tracking

**Note**: All business types use the same inventory system. Business-specific features can be added through product categories, custom fields, or business logic.

---

## API Endpoints

### Stock Movements (Read-Only)
```
GET    /api/v1/inventory/movements/          # List all movements
GET    /api/v1/inventory/movements/{id}/     # Get movement details
```

**Filters:**
- `product`: Filter by product ID
- `outlet`: Filter by outlet ID
- `movement_type`: Filter by type
- `tenant`: Filter by tenant (auto-applied)

### Stock Adjustments
```
POST   /api/v1/inventory/adjust/             # Manual stock adjustment
```

**Request Body:**
```json
{
  "product_id": 123,
  "outlet_id": 1,
  "quantity": -5,
  "reason": "Damage found",
  "type": "adjustment"
}
```

### Stock Transfers
```
POST   /api/v1/inventory/transfer/           # Transfer between outlets
```

**Request Body:**
```json
{
  "product_id": 123,
  "from_outlet_id": 1,
  "to_outlet_id": 2,
  "quantity": 10,
  "reason": "Restocking"
}
```

### Stock Receiving
```
POST   /api/v1/inventory/receive/            # Receive from supplier
```

**Request Body:**
```json
{
  "outlet_id": 1,
  "supplier": "ABC Suppliers",
  "items": [
    {
      "product_id": 123,
      "quantity": 50,
      "cost": 10.50
    }
  ],
  "reason": "Weekly delivery"
}
```

### Stock Taking
```
GET    /api/v1/inventory/stock-take/         # List stock takes
POST   /api/v1/inventory/stock-take/         # Create stock take
GET    /api/v1/inventory/stock-take/{id}/    # Get stock take details
PUT    /api/v1/inventory/stock-take/{id}/     # Update stock take
DELETE /api/v1/inventory/stock-take/{id}/    # Cancel stock take
POST   /api/v1/inventory/stock-take/{id}/complete/  # Complete stock take
```

### Stock Take Items
```
GET    /api/v1/inventory/stock-take/{id}/items/           # List items
POST   /api/v1/inventory/stock-take/{id}/items/           # Add item
GET    /api/v1/inventory/stock-take/{id}/items/{item_id}/ # Get item
PUT    /api/v1/inventory/stock-take/{id}/items/{item_id}/ # Update count
DELETE /api/v1/inventory/stock-take/{id}/items/{item_id}/ # Remove item
```

---

## Frontend Pages

### Main Inventory Dashboard
**Path:** `/dashboard/inventory`

**Features:**
- Overview of inventory operations
- Quick access to all inventory functions
- Links to:
  - Stock & Items (Products)
  - Stock Control (Adjustments)
  - Stock Taking
  - Transfers
  - Receiving

### Stock Adjustments
**Path:** `/dashboard/inventory/stock-adjustments`

**Features:**
- Manual stock adjustments
- Filter by product, outlet, date
- View adjustment history
- Create new adjustments with reason

### Stock Taking
**Path:** `/dashboard/inventory/stock-taking`

**Features:**
- List all stock takes
- Create new stock take
- View stock take details
- Update counted quantities
- Complete stock takes

### Stock Taking Detail
**Path:** `/dashboard/inventory/stock-taking/[id]`

**Features:**
- View stock take details
- Update product counts
- See expected vs counted
- View differences
- Complete stock take

### Transfers
**Path:** `/dashboard/inventory/transfers`

**Features:**
- List all transfers
- Create new transfers
- Filter by outlet, product, date
- View transfer history

### Receiving
**Path:** `/dashboard/inventory/receiving`

**Features:**
- Receive inventory from suppliers
- Add multiple products
- Update product costs
- View receiving history

---

## Workflows

### Workflow 1: Daily Receiving
**Scenario:** Receiving daily delivery from supplier

1. Supplier delivers goods
2. Staff opens `/dashboard/inventory/receiving`
3. Selects outlet and supplier
4. Scans/enters products and quantities
5. Optionally updates product costs
6. Submits receiving
7. System:
   - Increases stock for each product
   - Creates StockMovement records
   - Updates product costs if provided
8. Staff verifies stock levels updated

### Workflow 2: Stock Take (Monthly Audit)
**Scenario:** Monthly physical inventory count

1. Manager creates stock take for outlet
2. System auto-generates items for all active products
3. Staff physically counts each product
4. Staff updates counted quantities in system
5. System shows differences (expected vs counted)
6. Manager reviews discrepancies
7. Manager completes stock take
8. System:
   - Adjusts stock for all differences
   - Creates StockMovement records
   - Marks stock take as completed
9. Manager reviews adjustment report

### Workflow 3: Inter-Outlet Transfer
**Scenario:** Transferring stock from main store to branch

1. Manager at main store initiates transfer
2. Selects product, quantity, destination outlet
3. System creates transfer
4. Creates two movements:
   - `transfer_out` at source
   - `transfer_in` at destination
5. Stock decreases at source
6. Stock increases at destination
7. Both outlets can view transfer history

### Workflow 4: Damage/Expiry Handling
**Scenario:** Finding expired or damaged products

1. Staff identifies expired/damaged items
2. Opens stock adjustments page
3. Selects product and outlet
4. Enters negative quantity (e.g., -5)
5. Selects type: `damage` or `expiry`
6. Adds reason/notes
7. System:
   - Decreases stock
   - Creates StockMovement with type
   - Records for audit/reporting

### Workflow 5: Sale with Stock Deduction
**Scenario:** Customer purchase at POS

1. Cashier creates sale
2. Adds products to cart
3. Completes sale
4. System automatically:
   - Deducts stock for each item
   - Creates StockMovement (type: `sale`)
   - Links movement to sale ID
5. Stock levels update in real-time
6. If stock goes negative (if allowed), system records it

### Workflow 6: Purchase Order Receiving
**Scenario:** Receiving goods from approved purchase order

1. Purchase order created and approved
2. Goods arrive from supplier
3. Staff marks PO as received
4. Enters received quantities for each item
5. System:
   - Updates PO status
   - Creates StockMovement (type: `purchase`)
   - Increases product stock
   - Links to PO ID
6. PO status updates to `received` or `partial`

---

## Best Practices

### 1. Regular Stock Takes
- Perform monthly or quarterly physical counts
- Use stock takes to reconcile system vs physical inventory
- Review discrepancies to identify issues

### 2. Accurate Receiving
- Always receive inventory immediately upon delivery
- Verify quantities before receiving
- Update product costs when they change

### 3. Proper Documentation
- Always provide reasons for adjustments
- Use notes in stock takes for significant variances
- Document damage/expiry with details

### 4. Transfer Management
- Verify transfers at both outlets
- Use transfers for inter-outlet movements only
- Document transfer reasons

### 5. Stock Movement Review
- Regularly review stock movement reports
- Investigate unusual patterns
- Use movement history for audits

### 6. Negative Stock Prevention
- Configure system to prevent negative stock (optional)
- Monitor low stock alerts
- Set up reorder points

### 7. User Permissions
- Restrict inventory adjustments to authorized staff
- Require manager approval for large adjustments
- Audit trail tracks all users

---

## Integration Points

### Sales Integration
- **Automatic**: Stock deducted on sale completion
- **Location**: `backend/apps/sales/views.py` - `SaleViewSet.create()`
- **Movement Type**: `sale`
- **Reference**: Sale ID stored in `reference_id`

### Purchase Order Integration
- **Automatic**: Stock increased on PO receiving
- **Location**: `backend/apps/suppliers/views.py` - `PurchaseOrderViewSet.receive()`
- **Movement Type**: `purchase`
- **Reference**: PO ID stored in `reference_id`

### Product Integration
- **Automatic**: Product stock field updated on all movements
- **Location**: Product model in `backend/apps/products/models.py`
- **Real-time**: Stock reflects current inventory level

---

## Security & Multi-Tenancy

### Tenant Isolation
- All inventory operations are tenant-scoped
- Users can only access their tenant's inventory
- SaaS admins can view all tenants (for support)

### Permission Checks
- All endpoints require authentication
- Tenant filtering applied automatically
- Outlet validation ensures outlet belongs to tenant

### Audit Trail
- Every movement records:
  - User who performed action
  - Timestamp
  - Reason/description
  - Reference to related transaction
- Complete history for compliance

---

## Reporting & Analytics

### Available Reports
1. **Stock Movement Report**
   - All movements by date range
   - Filter by product, outlet, type
   - Export capabilities

2. **Stock Take Report**
   - All stock takes and results
   - Discrepancy analysis
   - Adjustment summaries

3. **Low Stock Alerts**
   - Products below reorder point
   - Out of stock items
   - Fast-moving items

4. **Inventory Valuation**
   - Current stock value
   - Cost analysis
   - Profit margins

---

## Troubleshooting

### Common Issues

1. **Stock Not Updating**
   - Check if movement was created
   - Verify product belongs to tenant
   - Check transaction logs

2. **Negative Stock**
   - Review recent movements
   - Check for missing sales deductions
   - Perform stock take to correct

3. **Missing Movements**
   - Verify API calls succeeded
   - Check database constraints
   - Review error logs

4. **Transfer Issues**
   - Verify both outlets exist
   - Check outlet belongs to tenant
   - Review transfer history

---

## Future Enhancements

### Planned Features
- **Per-Outlet Stock**: Track stock separately per outlet
- **Batch/Lot Tracking**: Track by batch numbers
- **Expiry Date Management**: Automatic expiry alerts
- **Recipe Integration**: Auto-deduct ingredients from recipes
- **Barcode Scanning**: Mobile barcode scanning for stock takes
- **Automated Reordering**: Auto-generate POs based on stock levels
- **Inventory Forecasting**: Predict stock needs

---

## Support & Documentation

For additional support:
- Check API documentation at `/api/v1/`
- Review code comments in `backend/apps/inventory/`
- Contact development team for custom requirements

---

**Last Updated:** 2024
**Version:** 1.0
**Maintained By:** PrimePOS Development Team

