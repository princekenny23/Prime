# Multi-Outlet Management Architecture
## Professional Guide for Wholesale & Retail Businesses

**Version:** 1.0  
**Last Updated:** 2024  
**Business Focus:** Wholesale & Retail Operations

---

## Executive Summary

PrimePOS is designed as a **multi-tenant, multi-outlet** system where:
- **One Tenant** = One Business/Company (e.g., "ABC Wholesale Ltd")
- **Multiple Outlets** = Multiple physical locations/branches (e.g., "Main Warehouse", "Downtown Store", "Airport Branch")

Each outlet operates as an **independent business unit** with its own inventory, sales, staff, and financial records, while sharing core business data (products, customers, suppliers) at the tenant level.

---

## Architecture Overview

### Hierarchy Structure

```
Tenant (Business)
├── Products (Shared across all outlets)
├── Categories (Shared)
├── Customers (Shared, but can be outlet-specific)
├── Suppliers (Shared)
├── Staff (Can be assigned to specific outlets)
├── Outlet 1 (Main Warehouse)
│   ├── Inventory Stock (LocationStock)
│   ├── Sales Transactions
│   ├── Stock Movements
│   ├── Shifts & Tills
│   └── Reports
├── Outlet 2 (Downtown Store)
│   ├── Inventory Stock (LocationStock)
│   ├── Sales Transactions
│   ├── Stock Movements
│   ├── Shifts & Tills
│   └── Reports
└── Outlet 3 (Airport Branch)
    ├── Inventory Stock (LocationStock)
    ├── Sales Transactions
    ├── Stock Movements
    ├── Shifts & Tills
    └── Reports
```

---

## Data Isolation Model

### 1. **Shared Data (Tenant Level)**

These are managed at the business level and shared across all outlets:

#### Products & Catalog
- **Product Master Data**: Name, SKU, description, pricing, images
- **Product Categories**: Organizational structure
- **Item Variations**: Sizes, colors, pack sizes (e.g., "500ml Bottle", "1L Bottle")
- **Pricing Structure**: 
  - Retail prices (base pricing)
  - Wholesale prices (if enabled)
  - Customer group pricing
  - Price lists

**Why Shared?**
- Ensures consistency across all locations
- Centralized product management
- Easier catalog updates
- Unified pricing strategy

#### Customers
- **Customer Master Data**: Name, contact info, credit limits
- **Customer Groups**: For wholesale pricing tiers
- **Purchase History**: Aggregated across all outlets
- **Loyalty Points**: Can be shared or outlet-specific

**Why Shared?**
- Customer can shop at any outlet
- Unified customer experience
- Centralized credit management
- Cross-outlet loyalty programs

#### Suppliers
- **Supplier Master Data**: Contact info, payment terms
- **Purchase Orders**: Can be created for any outlet
- **Supplier Relationships**: Managed centrally

**Why Shared?**
- Single supplier can serve multiple outlets
- Centralized procurement
- Better negotiation power

---

### 2. **Outlet-Specific Data**

Each outlet maintains its own independent records:

#### Inventory Stock (`LocationStock` Model)

**Key Concept**: Stock is tracked **per variation per outlet**

```python
LocationStock:
  - variation: ItemVariation (e.g., "500ml Bottle")
  - outlet: Outlet (e.g., "Main Warehouse")
  - quantity: 150 units  # Stock at THIS outlet only
```

**Example Scenario:**
- Product: "Coca-Cola"
  - Variation: "500ml Bottle"
    - Main Warehouse: 500 units
    - Downtown Store: 150 units
    - Airport Branch: 75 units
  - Variation: "1L Bottle"
    - Main Warehouse: 300 units
    - Downtown Store: 100 units
    - Airport Branch: 50 units

**Why Outlet-Specific?**
- Physical inventory is location-specific
- Each outlet has its own warehouse/storage
- Stock levels differ by location
- Enables accurate stock tracking and transfers

#### Sales Transactions (`Sale` Model)

**Key Concept**: Every sale is tied to a specific outlet

```python
Sale:
  - tenant: Tenant (Business)
  - outlet: Outlet (Specific location)
  - items: SaleItem[] (Products sold)
  - total: Amount
  - created_at: Timestamp
```

**Why Outlet-Specific?**
- Sales happen at physical locations
- Each outlet has its own cash register/till
- Revenue tracking per location
- Performance analysis per outlet
- Tax reporting per location

#### Stock Movements (`StockMovement` Model)

**Key Concept**: All inventory changes are tracked per outlet

```python
StockMovement:
  - outlet: Outlet (Where movement occurred)
  - variation: ItemVariation (What moved)
  - movement_type: 'sale', 'purchase', 'transfer_in', 'transfer_out', 'adjustment'
  - quantity: Amount changed
  - reason: Why it changed
```

**Movement Types:**
- **Sale**: Stock decreases at selling outlet
- **Purchase/Receiving**: Stock increases at receiving outlet
- **Transfer Out**: Stock decreases at source outlet
- **Transfer In**: Stock increases at destination outlet
- **Adjustment**: Manual correction at specific outlet
- **Damage/Expiry**: Stock decrease at affected outlet

**Why Outlet-Specific?**
- Accurate audit trail per location
- Compliance and reporting requirements
- Loss prevention and accountability
- Transfer tracking between outlets

#### Shifts & Cash Management (`Till` Model)

**Key Concept**: Each outlet has its own cash registers and shifts

```python
Till:
  - outlet: Outlet (Specific location)
  - name: "Register 1"
  - is_active: Boolean
  - current_shift: Shift (if any)
```

```python
Shift:
  - outlet: Outlet
  - till: Till
  - user: Staff member
  - start_time: When shift started
  - end_time: When shift ended
  - opening_cash: Starting cash
  - closing_cash: Ending cash
```

**Why Outlet-Specific?**
- Each outlet has separate cash registers
- Different staff work at different locations
- Cash reconciliation per location
- Security and accountability

#### Reports & Analytics

**Outlet-Level Reports:**
- Daily sales per outlet
- Inventory levels per outlet
- Top-selling products per outlet
- Staff performance per outlet
- Profit margins per outlet

**Tenant-Level Reports:**
- Aggregated sales across all outlets
- Total inventory value
- Cross-outlet product performance
- Overall business health

---

## Operational Workflows

### 1. **Product Management**

**Centralized Product Creation:**
1. Admin creates product at tenant level
2. Product appears in all outlets' catalogs
3. Each outlet can set its own stock levels
4. Pricing can be outlet-specific (via price lists) or shared

**Example:**
```
Create Product: "Premium Coffee Beans"
├── Set base retail price: $25.00
├── Set wholesale price: $20.00 (if enabled)
└── Product now available at all outlets

Outlet 1 (Main Warehouse):
  └── Set initial stock: 100 units

Outlet 2 (Downtown Store):
  └── Set initial stock: 50 units

Outlet 3 (Airport Branch):
  └── Set initial stock: 25 units
```

### 2. **Inventory Management**

**Stock Receiving (Per Outlet):**
1. Purchase order created (can specify destination outlet)
2. Goods arrive at specific outlet
3. Staff at that outlet receives inventory
4. `LocationStock` updated for that outlet only
5. `StockMovement` recorded with `movement_type='purchase'`

**Stock Transfers (Between Outlets):**
1. Source outlet initiates transfer
2. System creates two movements:
   - `transfer_out` at source outlet (stock decreases)
   - `transfer_in` at destination outlet (stock increases)
3. Both outlets' `LocationStock` updated
4. Transfer tracked for audit purposes

**Example Transfer:**
```
Transfer: 50 units of "Premium Coffee Beans"
From: Main Warehouse (Outlet 1)
To: Downtown Store (Outlet 2)

Result:
├── Outlet 1: Stock decreases from 100 to 50
├── Outlet 2: Stock increases from 50 to 100
└── Transfer record created for audit trail
```

### 3. **Sales Processing**

**Point of Sale (Per Outlet):**
1. Staff member logs in at specific outlet
2. Opens shift on specific till at that outlet
3. Processes sales - each sale tied to outlet
4. Stock automatically decreases at that outlet
5. `StockMovement` created with `movement_type='sale'`
6. Sale recorded with outlet reference

**Example Sale:**
```
Sale at Downtown Store (Outlet 2):
├── Customer: "ABC Restaurant"
├── Items:
│   ├── Premium Coffee Beans x 10 units
│   └── Wholesale price: $20.00 each
├── Total: $200.00
└── Stock Impact:
    └── Outlet 2 stock: 100 → 90 units
```

### 4. **Multi-Outlet Reporting**

**Outlet-Specific Reports:**
- Sales by outlet (daily, weekly, monthly)
- Inventory value per outlet
- Top products per outlet
- Staff performance per outlet

**Cross-Outlet Reports:**
- Total sales across all outlets
- Product performance across outlets
- Inventory distribution
- Transfer history

---

## Technical Implementation

### Database Schema

#### Core Models

```python
# Tenant (Business)
class Tenant:
    id: UUID
    name: "ABC Wholesale Ltd"
    type: "wholesale and retail"
    outlets: Outlet[]  # One-to-many

# Outlet (Location)
class Outlet:
    id: UUID
    tenant: Tenant  # Foreign key
    name: "Main Warehouse"
    address: "123 Main St"
    is_active: Boolean

# Product (Shared)
class Product:
    id: UUID
    tenant: Tenant  # Foreign key
    name: "Premium Coffee Beans"
    retail_price: Decimal
    # No outlet FK - shared across outlets

# LocationStock (Outlet-Specific)
class LocationStock:
    id: UUID
    tenant: Tenant  # Foreign key
    variation: ItemVariation  # What product/variation
    outlet: Outlet  # Where it is
    quantity: Integer  # How many at this outlet
    # Unique constraint: (variation, outlet)

# Sale (Outlet-Specific)
class Sale:
    id: UUID
    tenant: Tenant  # Foreign key
    outlet: Outlet  # Where sale occurred
    total: Decimal
    created_at: DateTime

# StockMovement (Outlet-Specific)
class StockMovement:
    id: UUID
    tenant: Tenant  # Foreign key
    outlet: Outlet  # Where movement occurred
    variation: ItemVariation  # What moved
    movement_type: String  # 'sale', 'purchase', etc.
    quantity: Integer
```

### API Filtering

**Automatic Tenant Filtering:**
- All API endpoints automatically filter by `tenant`
- Users can only see data for their business
- Backend enforces tenant isolation

**Outlet Filtering:**
- Most endpoints support `?outlet=<outlet_id>` parameter
- If provided, returns data for that outlet only
- If omitted, returns aggregated data across all outlets

**Example API Calls:**
```javascript
// Get all products (shared, no outlet filter)
GET /api/v1/products/

// Get stock for specific outlet
GET /api/v1/inventory/location-stock/?outlet=123

// Get sales for specific outlet
GET /api/v1/sales/?outlet=123

// Get all sales (across all outlets)
GET /api/v1/sales/
```

### Frontend Context Management

**TenantContext:**
- Manages current tenant (business)
- Manages current outlet (location)
- Provides `switchOutlet()` function
- Automatically filters API calls by current outlet

**Usage:**
```typescript
const { currentTenant, currentOutlet, switchOutlet } = useTenant()

// Switch to different outlet
await switchOutlet("outlet-123")

// All subsequent API calls filtered by new outlet
```

---

## Business Benefits

### 1. **Operational Efficiency**
- Centralized product management
- Consistent pricing and catalog
- Unified customer database
- Streamlined procurement

### 2. **Financial Control**
- Per-outlet revenue tracking
- Location-specific profitability
- Individual outlet performance analysis
- Consolidated financial reporting

### 3. **Inventory Accuracy**
- Real-time stock per location
- Accurate transfer tracking
- Location-specific stock alerts
- Optimized inventory distribution

### 4. **Scalability**
- Easy to add new outlets
- Minimal setup required
- Shared infrastructure
- Centralized management

### 5. **Compliance & Reporting**
- Location-specific tax reporting
- Audit trail per outlet
- Staff accountability
- Regulatory compliance

---

## Use Cases for Wholesale & Retail

### Scenario 1: Multi-Location Wholesale Business

**Business:** "ABC Wholesale Ltd"
- **Outlet 1:** Main Warehouse (Bulk storage, B2B sales)
- **Outlet 2:** Retail Store (B2C sales)
- **Outlet 3:** Distribution Center (Transfers only)

**Workflow:**
1. Products created once, available at all outlets
2. Main Warehouse receives bulk inventory
3. Transfers stock to Retail Store as needed
4. Distribution Center manages inter-outlet transfers
5. Each outlet processes its own sales
6. Reports show performance per outlet and aggregated

### Scenario 2: Chain of Retail Stores

**Business:** "XYZ Retail Chain"
- **Outlet 1:** Downtown Flagship Store
- **Outlet 2:** Mall Location
- **Outlet 3:** Airport Kiosk

**Workflow:**
1. Centralized product catalog
2. Each store manages its own inventory
3. Stock transfers between stores as needed
4. Individual store performance tracking
5. Aggregated chain-wide reporting

### Scenario 3: Hybrid Wholesale/Retail

**Business:** "Premium Distributors"
- **Outlet 1:** Wholesale Warehouse (B2B only)
- **Outlet 2:** Retail Showroom (B2C only)
- **Outlet 3:** Mixed Location (Both B2B and B2C)

**Workflow:**
1. Same products, different pricing per outlet
2. Wholesale outlet uses wholesale prices
3. Retail outlet uses retail prices
4. Mixed outlet can use both based on customer
5. Inventory shared but tracked separately

---

## Best Practices

### 1. **Outlet Setup**
- Create outlets during business onboarding
- Assign unique, descriptive names
- Set up tills/cash registers per outlet
- Configure outlet-specific settings

### 2. **Inventory Management**
- Set initial stock levels per outlet
- Use transfers for stock redistribution
- Regular stock takes per outlet
- Monitor low stock alerts per location

### 3. **Staff Management**
- Assign staff to specific outlets
- Set permissions per outlet
- Track performance per location
- Manage shifts per outlet

### 4. **Reporting**
- Review outlet-specific reports daily
- Compare performance across outlets
- Identify best/worst performing locations
- Make data-driven decisions

### 5. **Data Integrity**
- Always specify outlet in transactions
- Verify outlet context before operations
- Use outlet filters in reports
- Maintain audit trails

---

## Security & Access Control

### Tenant Isolation
- **Automatic**: All data filtered by tenant
- **Enforced**: Backend validates tenant on every request
- **Secure**: Users cannot access other businesses' data

### Outlet Access Control
- Staff can be assigned to specific outlets
- Permissions can be outlet-specific
- Reports can be filtered by outlet
- Transfers require authorization

---

## Conclusion

PrimePOS's multi-outlet architecture provides:
- ✅ **Centralized Management**: Shared products, customers, suppliers
- ✅ **Independent Operations**: Separate inventory, sales, staff per outlet
- ✅ **Scalability**: Easy to add new locations
- ✅ **Flexibility**: Supports various business models
- ✅ **Compliance**: Location-specific reporting and audit trails

This architecture is specifically designed for **wholesale and retail businesses** that need to manage multiple locations while maintaining operational efficiency and financial control.

---

## Technical Support

For implementation details, refer to:
- `backend/apps/outlets/models.py` - Outlet model
- `backend/apps/inventory/models.py` - LocationStock model
- `frontend/contexts/tenant-context.tsx` - Frontend outlet management
- `TENANT_ISOLATION_AUDIT.md` - Security implementation

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** Production Ready

