# Inventory Management System - Implementation Plan

## Overview

The inventory management system provides comprehensive stock control for multi-tenant businesses. All inventory operations are **tenant-specific** and tracked through **StockMovement** records for complete audit trails.

---

## System Architecture

### Core Principle: **Stock Movements as Source of Truth**

All inventory changes are recorded as **StockMovement** entries. The `Product.stock` field is a **calculated/cached value** that can be recalculated from movements, but is updated in real-time for performance.

### Database Models (Backend)

1. **StockMovement** - Records all stock changes
   - `tenant` (FK) - Which business owns this movement
   - `product` (FK) - Which product was affected
   - `outlet` (FK) - Which outlet location
   - `user` (FK) - Who performed the action
   - `movement_type` - Type of movement (sale, purchase, adjustment, transfer_in, transfer_out, return, damage, expiry)
   - `quantity` - Amount changed (positive for increases, negative for decreases)
   - `reason` - Optional explanation
   - `reference_id` - Links to related records (sale ID, transfer ID, etc.)
   - `created_at` - Timestamp

2. **StockTake** - Stock counting/audit sessions
   - `tenant` (FK) - Business owner
   - `outlet` (FK) - Location being counted
   - `user` (FK) - Who started the count
   - `operating_date` - Date of the count
   - `status` - running, completed, cancelled
   - `description` - Optional notes
   - `created_at`, `completed_at` - Timestamps

3. **StockTakeItem** - Individual product counts in a stock take
   - `stock_take` (FK) - Parent stock take session
   - `product` (FK) - Product being counted
   - `expected_quantity` - System stock level
   - `counted_quantity` - Physical count
   - `difference` - Auto-calculated (counted - expected)
   - `notes` - Optional notes

---

## Inventory Modules & Flows

### 1. **Stock Adjustments** (`/dashboard/inventory/stock-adjustments`)

**Purpose**: Manual stock corrections (damage, loss, found items, etc.)

**Flow**:
1. User selects product and outlet
2. Enters adjustment quantity (positive = increase, negative = decrease)
3. Provides reason (required)
4. System validates stock won't go negative
5. **Database Operations**:
   - Create `StockMovement` record (type: 'adjustment')
   - Update `Product.stock` field
   - Both operations in **atomic transaction**

**API Endpoint**: `POST /api/v1/inventory/adjust/`
**Request Body**:
```json
{
  "product_id": "123",
  "outlet_id": "456",
  "quantity": -5,  // Negative for decrease
  "reason": "Damaged items found",
  "type": "adjustment"  // Optional, defaults to 'adjustment'
}
```

**Tenant Filtering**: 
- Backend automatically filters by `request.user.tenant`
- Product must belong to the same tenant
- Outlet must belong to the same tenant

---

### 2. **Stock Transfers** (`/dashboard/inventory/transfers`)

**Purpose**: Move inventory between outlets of the same tenant

**Flow**:
1. User selects product
2. Selects source outlet (from)
3. Selects destination outlet (to)
4. Enters quantity to transfer
5. Provides optional reason
6. **Database Operations**:
   - Create `StockMovement` (type: 'transfer_out') for source outlet
   - Create `StockMovement` (type: 'transfer_in') for destination outlet
   - Update `Product.stock` (decrease from source, increase to destination)
   - Both movements linked via `reference_id`
   - All operations in **atomic transaction**

**API Endpoint**: `POST /api/v1/inventory/transfer/`
**Request Body**:
```json
{
  "product_id": "123",
  "from_outlet_id": "456",
  "to_outlet_id": "789",
  "quantity": 10,
  "reason": "Restocking branch"
}
```

**Tenant Filtering**:
- All outlets must belong to the same tenant
- Product must belong to the same tenant
- Backend validates tenant consistency

**Note**: Current implementation tracks movements but doesn't track per-outlet stock. For full multi-outlet support, you'd need an `OutletStock` model (future enhancement).

---

### 3. **Stock Taking** (`/dashboard/inventory/stock-taking`)

**Purpose**: Physical inventory counts/audits to reconcile system stock with actual stock

**Flow**:

#### Phase 1: Start Stock Take
1. User selects outlet
2. Sets operating date
3. Adds optional description
4. **Database Operations**:
   - Create `StockTake` record (status: 'running')
   - System loads all active products for that tenant/outlet
   - Create `StockTakeItem` records with `expected_quantity` = current `Product.stock`
   - `counted_quantity` starts at 0

**API Endpoint**: `POST /api/v1/inventory/stock-takes/`
**Request Body**:
```json
{
  "outlet": "456",
  "operating_date": "2025-01-15",
  "description": "Monthly inventory count"
}
```

#### Phase 2: Count Items
1. User navigates to stock take detail page (`/dashboard/inventory/stock-taking/{id}`)
2. System loads all `StockTakeItem` records for this stock take
3. User enters physical counts for each product
4. System calculates `difference` automatically
5. **Database Operations**:
   - Update `StockTakeItem.counted_quantity` and `difference`
   - Progress calculated: `counted_items / total_items * 100`

**API Endpoint**: `PATCH /api/v1/inventory/stock-takes/{id}/items/{item_id}/`
**Request Body**:
```json
{
  "counted_quantity": 45,
  "notes": "Found in back storage"
}
```

#### Phase 3: Complete Stock Take
1. User reviews all counts and differences
2. Clicks "Complete Stock Take"
3. **Database Operations** (atomic transaction):
   - For each item with `difference != 0`:
     - Update `Product.stock` by adding the difference
     - Create `StockMovement` (type: 'adjustment') with reason "Stock take adjustment"
   - Update `StockTake.status` to 'completed'
   - Set `StockTake.completed_at` timestamp

**API Endpoint**: `POST /api/v1/inventory/stock-takes/{id}/complete/`

**Tenant Filtering**:
- Stock take belongs to tenant
- All products loaded are tenant-filtered
- Outlet must belong to tenant

---

### 4. **Receiving** (`/dashboard/inventory/receiving`)

**Purpose**: Record incoming inventory from suppliers (purchases)

**Flow**:
1. User creates receiving order
2. Selects supplier (future: Supplier model)
3. Adds products with quantities and costs
4. Marks as received
5. **Database Operations**:
   - Create `StockMovement` records (type: 'purchase') for each product
   - Update `Product.stock` (increase)
   - Update `Product.cost` if new cost provided
   - Create purchase order record (future: PurchaseOrder model)

**API Endpoint**: `POST /api/v1/inventory/receiving/` (to be implemented)
**Request Body**:
```json
{
  "supplier": "Supplier Name",
  "outlet": "456",
  "items": [
    {
      "product_id": "123",
      "quantity": 50,
      "cost": 10.50
    }
  ],
  "notes": "Monthly order"
}
```

**Tenant Filtering**:
- All products must belong to tenant
- Outlet must belong to tenant

---

## Stock Movement Types

| Type | Description | Quantity Sign | Use Case |
|------|-------------|--------------|----------|
| `sale` | Product sold | Negative | POS sales (auto-created) |
| `purchase` | Product purchased | Positive | Receiving from suppliers |
| `adjustment` | Manual correction | +/- | Stock adjustments, stock take completion |
| `transfer_in` | Received from another outlet | Positive | Stock transfers |
| `transfer_out` | Sent to another outlet | Negative | Stock transfers |
| `return` | Customer return | Positive | Returned items |
| `damage` | Damaged items removed | Negative | Damage write-offs |
| `expiry` | Expired items removed | Negative | Expiry write-offs |

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    INVENTORY OPERATIONS                      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   Adjustment          Transfer          Stock Take
        │                   │                   │
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│              StockMovement Record Created                    │
│  - tenant (auto from user)                                   │
│  - product (validated to belong to tenant)                   │
│  - outlet (validated to belong to tenant)                    │
│  - movement_type                                             │
│  - quantity                                                  │
│  - reason                                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Product.stock Updated (Atomic)                  │
│  - Validates stock >= 0                                      │
│  - Updates in same transaction as StockMovement              │
└─────────────────────────────────────────────────────────────┘
```

---

## Tenant Isolation Strategy

### Backend (Django)

1. **TenantFilterMixin** on all ViewSets
   - Automatically filters queryset by `request.user.tenant`
   - SaaS admins see all (for platform management)
   - Regular users only see their tenant's data

2. **Explicit Tenant Validation**
   - All create/update operations validate:
     - Product belongs to user's tenant
     - Outlet belongs to user's tenant
     - StockTake belongs to user's tenant

3. **Automatic Tenant Assignment**
   - `StockMovement.tenant` = `request.user.tenant` (auto-set)
   - `StockTake.tenant` = `request.user.tenant` (auto-set)
   - Frontend never sends tenant ID

### Frontend (React/Next.js)

1. **Service Layer Filtering**
   - All API calls automatically filtered by current tenant
   - Uses `currentBusiness.id` from `businessStore`
   - Products, outlets, movements all tenant-scoped

2. **UI Filtering (Safety)**
   - Additional client-side filtering as safety measure
   - Ensures no cross-tenant data leakage
   - Logs warnings if wrong tenant data detected

---

## Implementation Checklist

### Backend (Django)

- [x] Models defined (`StockMovement`, `StockTake`, `StockTakeItem`)
- [x] Serializers created
- [x] ViewSets with TenantFilterMixin
- [x] Stock adjustment endpoint (`/inventory/adjust/`)
- [x] Stock transfer endpoint (`/inventory/transfer/`)
- [x] Stock take CRUD endpoints
- [x] Stock take completion endpoint
- [ ] Receiving endpoint (purchase orders)
- [ ] Stock movement list endpoint with filters
- [ ] Per-outlet stock tracking (future enhancement)

### Frontend (React/Next.js)

- [x] Inventory service (`inventoryService.ts`)
- [x] Stock adjustments page
- [x] Stock transfers page
- [x] Stock taking list page
- [x] Stock taking detail page
- [ ] Receiving page (needs backend)
- [ ] Stock adjustment modal (connect to API)
- [ ] Stock transfer modal (connect to API)
- [ ] Start stock take modal (connect to API)
- [ ] Stock movement history page
- [ ] Remove all mock data

---

## API Endpoints Summary

### Stock Movements
- `GET /api/v1/inventory/movements/` - List movements (filtered by tenant)
- `GET /api/v1/inventory/movements/{id}/` - Get movement details

### Stock Adjustments
- `POST /api/v1/inventory/adjust/` - Create adjustment
  - Body: `{ product_id, outlet_id, quantity, reason, type? }`

### Stock Transfers
- `POST /api/v1/inventory/transfer/` - Create transfer
  - Body: `{ product_id, from_outlet_id, to_outlet_id, quantity, reason? }`

### Stock Takes
- `GET /api/v1/inventory/stock-takes/` - List stock takes (filtered by tenant)
- `POST /api/v1/inventory/stock-takes/` - Create stock take
  - Body: `{ outlet, operating_date, description? }`
- `GET /api/v1/inventory/stock-takes/{id}/` - Get stock take details
- `PATCH /api/v1/inventory/stock-takes/{id}/` - Update stock take
- `POST /api/v1/inventory/stock-takes/{id}/complete/` - Complete stock take
- `GET /api/v1/inventory/stock-takes/{id}/items/` - List stock take items
- `POST /api/v1/inventory/stock-takes/{id}/items/` - Add item to stock take
- `PATCH /api/v1/inventory/stock-takes/{id}/items/{item_id}/` - Update item count

### Receiving (To Be Implemented)
- `GET /api/v1/inventory/receiving/` - List receiving orders
- `POST /api/v1/inventory/receiving/` - Create receiving order
- `GET /api/v1/inventory/receiving/{id}/` - Get receiving order details

---

## Data Validation Rules

1. **Stock Cannot Go Negative**
   - All operations validate final stock >= 0
   - Returns 400 error if validation fails

2. **Tenant Consistency**
   - Product, outlet, and operation must all belong to same tenant
   - Validated on backend before any database writes

3. **Atomic Transactions**
   - Stock updates and movement creation in same transaction
   - Prevents data inconsistency if operation fails

4. **Reference Integrity**
   - Stock movements reference valid products/outlets
   - Stock take items reference valid products
   - Foreign keys enforce integrity

---

## Frontend-Backend Data Flow

### Example: Stock Adjustment

```
Frontend (React)
├── User fills form: product, quantity, reason
├── Calls: inventoryService.adjust({ product_id, outlet_id, quantity, reason })
│
Backend (Django)
├── Receives request
├── Validates user authentication
├── Gets tenant from request.user.tenant
├── Validates product belongs to tenant
├── Validates outlet belongs to tenant
├── Starts atomic transaction:
│   ├── Creates StockMovement record
│   ├── Updates Product.stock
│   └── Validates stock >= 0
├── Commits transaction
└── Returns StockMovement data
│
Frontend
├── Receives response
├── Shows success message
├── Refreshes product list (updated stock)
└── Refreshes adjustment history
```

---

## Key Implementation Notes

1. **Product.stock is the Source of Truth (Currently)**
   - For single-outlet businesses, `Product.stock` represents total stock
   - For multi-outlet, consider adding `OutletStock` model later
   - Stock movements provide audit trail

2. **All Operations are Tenant-Scoped**
   - Backend automatically filters by tenant
   - Frontend uses current business context
   - No cross-tenant data access possible

3. **Stock Movements are Immutable**
   - Once created, movements are never deleted
   - Corrections create new movements
   - Complete audit trail maintained

4. **Stock Takes are Multi-Step**
   - Created in 'running' status
   - Items counted incrementally
   - Completed when all items counted
   - Completion applies adjustments automatically

5. **Receiving is Purchase Recording**
   - Records incoming inventory
   - Updates product stock
   - Can update product cost
   - Links to suppliers (future)

---

## Next Steps for Implementation

1. **Connect Frontend Modals to Backend APIs**
   - Stock adjustment modal → `/inventory/adjust/`
   - Stock transfer modal → `/inventory/transfer/`
   - Start stock take modal → `/inventory/stock-takes/`

2. **Implement Stock Take Detail Page**
   - Load stock take items from API
   - Save counts incrementally
   - Complete stock take action

3. **Add Receiving Functionality**
   - Create receiving order model/endpoint
   - Connect to stock movements
   - Update product costs

4. **Add Stock Movement History**
   - List all movements with filters
   - Show movement details
   - Export capabilities

5. **Remove All Mock Data**
   - Replace with real API calls
   - Remove simulation mode checks
   - Ensure all data is tenant-filtered

---

## Testing Strategy

1. **Tenant Isolation Tests**
   - Verify users can only see their tenant's data
   - Verify cross-tenant operations fail

2. **Stock Validation Tests**
   - Verify stock cannot go negative
   - Verify atomic transactions work
   - Verify movements are created correctly

3. **Stock Take Flow Tests**
   - Verify stock take creation
   - Verify item counting
   - Verify completion applies adjustments

4. **Transfer Tests**
   - Verify both movements created
   - Verify tenant validation
   - Verify quantity validation

---

## Future Enhancements

1. **Per-Outlet Stock Tracking**
   - Add `OutletStock` model
   - Track stock per outlet location
   - Enable true multi-outlet inventory

2. **Supplier Management**
   - Supplier model
   - Purchase order tracking
   - Supplier performance metrics

3. **Advanced Reporting**
   - Stock valuation reports
   - Movement analysis
   - Turnover rates
   - ABC analysis

4. **Barcode Scanning**
   - Mobile-friendly stock taking
   - Quick adjustments via barcode
   - Receiving via barcode

5. **Automated Reordering**
   - Low stock alerts
   - Auto-generate purchase orders
   - Supplier integration

---

## Summary

The inventory system is built on **StockMovement** records that provide a complete audit trail. All operations are **tenant-specific** and validated. The system supports:

- ✅ Manual stock adjustments
- ✅ Inter-outlet transfers
- ✅ Physical stock counts (stock taking)
- ⏳ Receiving from suppliers (to be implemented)

All data is automatically filtered by tenant, ensuring complete multi-tenancy isolation.

