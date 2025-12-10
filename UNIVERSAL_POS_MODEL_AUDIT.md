# 🔍 Universal POS Model Audit Report
## PrimePOS Multi-Tenant SaaS System

**Audit Date:** 2024  
**System Type:** Multi-Tenant SaaS POS  
**Target Scale:** 10,000+ tenants, 50,000+ daily transactions per tenant  
**Business Types Supported:** Retail, Wholesale, Restaurant, Bar, Pharmacy, Service Businesses

---

## 📋 1. WORKSPACE MODEL SUMMARY

### Existing Models (23 Total)

#### **Core Multi-Tenant Architecture**
1. **Tenant** (`apps.tenants.models.Tenant`)
   - Multi-tenant business entity
   - Fields: name, type (retail/restaurant/bar), currency, settings (JSON)
   - Relationships: hasMany Users, Outlets, Products, Sales, Customers

2. **User** (`apps.accounts.models.User`)
   - Custom user extending Django AbstractUser
   - Fields: email, name, phone, tenant (FK), role, is_saas_admin
   - Relationships: belongsTo Tenant, hasMany Sales, Shifts

#### **Outlet & Till Management**
3. **Outlet** (`apps.outlets.models.Outlet`)
   - Branch/location model
   - Fields: name, address, phone, email, is_active
   - Relationships: belongsTo Tenant, hasMany Tills, Shifts, Sales

4. **Till** (`apps.outlets.models.Till`)
   - Cash register/till model
   - Fields: name, is_active, is_in_use
   - Relationships: belongsTo Outlet, hasMany Shifts

#### **Products & Inventory**
5. **Category** (`apps.products.models.Category`)
   - Product categorization
   - Fields: name, description
   - Relationships: belongsTo Tenant, hasMany Products

6. **Product** (`apps.products.models.Product`)
   - Product/item model with dual pricing
   - Fields: name, sku, barcode, retail_price, cost, wholesale_price, wholesale_enabled, minimum_wholesale_quantity, stock, low_stock_threshold, unit, image
   - Relationships: belongsTo Tenant, Category; hasMany SaleItems, StockMovements

7. **StockMovement** (`apps.inventory.models.StockMovement`)
   - Stock movement tracking
   - Fields: movement_type (sale/purchase/adjustment/transfer/return/damage/expiry), quantity, reason, reference_id
   - Relationships: belongsTo Tenant, Product, Outlet, User

8. **StockTake** (`apps.inventory.models.StockTake`)
   - Stock counting session
   - Fields: operating_date, status (running/completed/cancelled), description
   - Relationships: belongsTo Tenant, Outlet, User; hasMany StockTakeItems

9. **StockTakeItem** (`apps.inventory.models.StockTakeItem`)
   - Stock take line items
   - Fields: expected_quantity, counted_quantity, difference, notes
   - Relationships: belongsTo StockTake, Product

#### **Sales & Transactions**
10. **Sale** (`apps.sales.models.Sale`)
    - Main transaction/sale model
    - Fields: receipt_number, subtotal, tax, discount, total, payment_method, status, payment_status, due_date, amount_paid, table (restaurant), guests, priority
    - Relationships: belongsTo Tenant, Outlet, User, Shift, Customer, Table; hasMany SaleItems, Payments

11. **SaleItem** (`apps.sales.models.SaleItem`)
    - Sale line items
    - Fields: product_name (denormalized), quantity, price, total, kitchen_status (restaurant), notes, prepared_at
    - Relationships: belongsTo Sale, Product

#### **Customers & CRM**
12. **Customer** (`apps.customers.models.Customer`)
    - Customer profile with credit management
    - Fields: name, email, phone, address, loyalty_points, total_spent, last_visit, credit_enabled, credit_limit, payment_terms_days, credit_status, credit_notes
    - Relationships: belongsTo Tenant, Outlet; hasMany Purchases, LoyaltyTransactions, CreditPayments

13. **LoyaltyTransaction** (`apps.customers.models.LoyaltyTransaction`)
    - Loyalty points history
    - Fields: transaction_type (earned/redeemed/adjusted), points, reason
    - Relationships: belongsTo Customer

14. **CreditPayment** (`apps.customers.models.CreditPayment`)
    - Payments against credit sales
    - Fields: amount, payment_method, payment_date, reference_number, notes
    - Relationships: belongsTo Tenant, Customer, Sale, User

#### **Payments**
15. **PaymentMethod** (`apps.payments.models.PaymentMethod`)
    - Payment method configuration
    - Fields: name, payment_type, is_active, requires_authorization, fee_percentage, fee_fixed
    - Relationships: belongsTo Tenant

16. **Payment** (`apps.payments.models.Payment`)
    - Payment transaction record
    - Fields: amount, payment_method, transaction_id, reference_number, status, processing_fee, net_amount, error_message
    - Relationships: belongsTo Tenant, Outlet, Sale, Customer, User; hasMany PaymentSplits

17. **PaymentSplit** (`apps.payments.models.PaymentSplit`)
    - Split payment records
    - Fields: amount, payment_method, reference_number, notes
    - Relationships: belongsTo Payment

#### **Shifts & Cash Management**
18. **Shift** (`apps.shifts.models.Shift`)
    - Day shift management (BASIC - needs enhancement)
    - Fields: operating_date, opening_cash_balance, floating_cash, closing_cash_balance, status (OPEN/CLOSED), notes, start_time, end_time
    - Relationships: belongsTo Outlet, Till, User; hasMany Sales
    - **CRITICAL GAP:** No cash movement ledger, no reconciliation, no cash drops/adds tracking

#### **Restaurant Features**
19. **Table** (`apps.restaurant.models.Table`)
    - Restaurant table management
    - Fields: number, capacity, status (available/occupied/reserved/out_of_service), location, notes
    - Relationships: belongsTo Tenant, Outlet; hasMany Orders, KitchenOrders

20. **KitchenOrderTicket** (`apps.restaurant.models.KitchenOrderTicket`)
    - Kitchen order tracking (KOT)
    - Fields: kot_number, status (pending/preparing/ready/served/cancelled), priority, sent_to_kitchen_at, started_at, ready_at, served_at
    - Relationships: belongsTo Tenant, Outlet, Sale, Table

#### **Suppliers**
21. **Supplier** (`apps.suppliers.models.Supplier`)
    - Supplier/vendor model
    - Fields: name, contact_name, email, phone, address, city, state, zip_code, country, tax_id, payment_terms, notes
    - Relationships: belongsTo Tenant, Outlet

#### **Staff & Security**
22. **Role** (`apps.staff.models.Role`)
    - Permission role model
    - Fields: name, description, can_sales, can_inventory, can_products, can_customers, can_reports, can_staff, can_settings, can_dashboard
    - Relationships: belongsTo Tenant; hasMany Staff

23. **Staff** (`apps.staff.models.Staff`)
    - Staff member profile
    - Fields: is_active
    - Relationships: OneToOne User, belongsTo Tenant, Role; ManyToMany Outlets

24. **Attendance** (`apps.staff.models.Attendance`)
    - Staff attendance tracking
    - Fields: check_in, check_out, notes
    - Relationships: belongsTo Staff, Outlet

---

## ❌ 2. MISSING CRITICAL MODELS

### **A. CASH DRAWER & SHIFT MANAGEMENT (CRITICAL)**

#### **1. CashDrawerSession** ⚠️ **MISSING - CRITICAL**
**Why Required:**
- Current `Shift` model only tracks opening/closing balances but lacks:
  - Real-time cash drawer state
  - Cash movement ledger (drops, adds, petty cash)
  - Multi-device synchronization
  - Offline mode support
  - Immutable audit trail

**Required Fields:**
- `tenant`, `outlet`, `till`, `shift` (FK)
- `opening_cash` (Decimal) - Opening float
- `expected_cash` (Decimal) - Calculated: opening + cash sales - cash refunds
- `counted_cash` (Decimal) - Physical count
- `difference` (Decimal) - Variance
- `status` (open/closed/reconciled)
- `opened_by`, `closed_by`, `reconciled_by` (User FKs)
- `opened_at`, `closed_at`, `reconciled_at` (DateTime)
- `notes` (Text)
- `device_id` (CharField) - For multi-device tracking
- `is_synced` (Boolean) - For offline mode

**Relationships:**
- belongsTo Tenant, Outlet, Till, Shift, User (opened_by, closed_by)
- hasMany CashMovements, CashupSettlements

---

#### **2. CashMovement** ⚠️ **MISSING - CRITICAL**
**Why Required:**
- Track every cash transaction (adds, drops, petty cash, refunds)
- Immutable audit log for fraud prevention
- Required for reconciliation and variance analysis

**Required Fields:**
- `tenant`, `outlet`, `till`, `cash_drawer_session` (FK)
- `movement_type` (add/drop/petty_cash/refund/sale/opening_float)
- `amount` (Decimal)
- `reason` (CharField) - e.g., "Cash drop to safe", "Petty cash for supplies"
- `reference_id` (CharField) - Link to sale, refund, or other transaction
- `user` (FK) - Who performed the movement
- `device_id` (CharField) - Device that recorded the movement
- `created_at` (DateTime) - IMMUTABLE timestamp
- `is_synced` (Boolean) - For offline mode
- `notes` (Text)

**Relationships:**
- belongsTo Tenant, Outlet, Till, CashDrawerSession, User, Sale (optional)

**Immutable Rules:**
- Once created, cannot be deleted or modified
- Only corrections via reversal entries
- All fields must be immutable after creation

---

#### **3. CashupSettlement** ⚠️ **MISSING - CRITICAL**
**Why Required:**
- End-of-day cash reconciliation
- Breakdown by payment method
- Variance analysis and reporting

**Required Fields:**
- `tenant`, `outlet`, `till`, `shift`, `cash_drawer_session` (FK)
- `settlement_date` (Date)
- `opening_cash` (Decimal)
- `cash_sales` (Decimal) - Total cash received from sales
- `cash_refunds` (Decimal) - Total cash refunded
- `cash_adds` (Decimal) - Cash added to drawer
- `cash_drops` (Decimal) - Cash removed from drawer
- `petty_cash_payouts` (Decimal) - Petty cash disbursements
- `expected_cash` (Decimal) - Calculated
- `counted_cash` (Decimal) - Physical count
- `difference` (Decimal) - Variance
- `card_sales` (Decimal) - Non-cash payment totals
- `mobile_sales` (Decimal)
- `credit_sales` (Decimal)
- `other_sales` (Decimal)
- `total_sales` (Decimal)
- `status` (pending/reconciled/discrepancy)
- `reconciled_by` (User FK)
- `reconciled_at` (DateTime)
- `notes` (Text)
- `discrepancy_reason` (Text) - If variance exists

**Relationships:**
- belongsTo Tenant, Outlet, Till, Shift, CashDrawerSession, User

---

#### **4. PettyCashPayout** ⚠️ **MISSING**
**Why Required:**
- Track small cash disbursements (supplies, tips, etc.)
- Separate from cash drops (which go to safe/bank)
- Required for accurate cash reconciliation

**Required Fields:**
- `tenant`, `outlet`, `till`, `cash_drawer_session` (FK)
- `amount` (Decimal)
- `reason` (CharField) - e.g., "Office supplies", "Staff tips"
- `recipient` (CharField) - Who received the cash
- `receipt_number` (CharField) - Optional receipt reference
- `user` (FK) - Who authorized/disbursed
- `created_at` (DateTime)
- `is_synced` (Boolean)

**Relationships:**
- belongsTo Tenant, Outlet, Till, CashDrawerSession, User

---

### **B. DISCOUNTS & PROMOTIONS**

#### **5. Discount** ⚠️ **MISSING**
**Why Required:**
- Current system only has `discount` field on Sale (amount)
- No discount codes, rules, or promotion management
- Cannot track discount usage, limits, or effectiveness

**Required Fields:**
- `tenant`, `outlet` (optional - outlet-specific discounts)
- `code` (CharField, unique per tenant)
- `name` (CharField)
- `discount_type` (percentage/fixed_amount)
- `value` (Decimal)
- `min_purchase_amount` (Decimal)
- `max_discount_amount` (Decimal) - Cap for percentage discounts
- `usage_limit` (Integer) - Total uses allowed (0 = unlimited)
- `usage_count` (Integer) - Current usage
- `customer_limit` (Integer) - Uses per customer
- `start_date`, `end_date` (DateTime)
- `is_active` (Boolean)
- `applicable_to` (all/products/categories/customers)
- `product_ids` (JSONField) - If applicable_to = products
- `category_ids` (JSONField) - If applicable_to = categories
- `customer_ids` (JSONField) - If applicable_to = customers
- `created_at`, `updated_at`

**Relationships:**
- belongsTo Tenant, Outlet (optional)
- hasMany DiscountUsages

---

#### **6. DiscountUsage** ⚠️ **MISSING**
**Why Required:**
- Track which discounts were used on which sales
- Enforce usage limits
- Analytics and reporting

**Required Fields:**
- `tenant`, `outlet`, `sale` (FK)
- `discount` (FK)
- `customer` (FK, optional)
- `discount_amount` (Decimal) - Actual discount applied
- `used_at` (DateTime)
- `user` (FK) - Who applied the discount

**Relationships:**
- belongsTo Tenant, Outlet, Sale, Discount, Customer (optional), User

---

#### **7. Promotion** ⚠️ **MISSING**
**Why Required:**
- Complex promotional rules (buy X get Y, bundle deals, etc.)
- Different from simple discounts
- Required for advanced marketing

**Required Fields:**
- `tenant`, `outlet` (optional)
- `name` (CharField)
- `promotion_type` (buy_x_get_y/bundle/volume_discount/free_shipping)
- `rules` (JSONField) - Flexible rule configuration
- `start_date`, `end_date` (DateTime)
- `is_active` (Boolean)
- `priority` (Integer) - For multiple promotions
- `created_at`, `updated_at`

**Relationships:**
- belongsTo Tenant, Outlet (optional)
- hasMany PromotionUsages

---

### **C. PRICING & CATALOG**

#### **8. PriceList** ⚠️ **MISSING**
**Why Required:**
- Different prices for different customer groups
- Wholesale vs retail pricing tiers
- Seasonal pricing
- Contract pricing

**Required Fields:**
- `tenant`, `outlet` (optional)
- `name` (CharField)
- `price_list_type` (retail/wholesale/contract/seasonal)
- `customer_group` (FK, optional) - If specific to customer group
- `start_date`, `end_date` (DateTime, optional)
- `is_active` (Boolean)
- `is_default` (Boolean) - Default price list
- `created_at`, `updated_at`

**Relationships:**
- belongsTo Tenant, Outlet (optional), CustomerGroup (optional)
- hasMany PriceListItems

---

#### **9. PriceListItem** ⚠️ **MISSING**
**Why Required:**
- Product prices within a price list
- Override base product prices

**Required Fields:**
- `price_list` (FK)
- `product` (FK)
- `price` (Decimal)
- `cost` (Decimal, optional)
- `min_quantity` (Integer) - Minimum quantity for this price
- `created_at`, `updated_at`

**Relationships:**
- belongsTo PriceList, Product

---

### **D. PROCUREMENT & SUPPLIERS**

#### **10. PurchaseOrder** ⚠️ **MISSING**
**Why Required:**
- Track orders to suppliers
- Manage procurement workflow
- Link to supplier invoices

**Required Fields:**
- `tenant`, `outlet`, `supplier` (FK)
- `po_number` (CharField, unique per tenant)
- `order_date`, `expected_delivery_date` (Date)
- `status` (draft/sent/confirmed/partial_received/received/cancelled)
- `subtotal` (Decimal)
- `tax` (Decimal)
- `total` (Decimal)
- `notes` (Text)
- `created_by`, `approved_by` (User FKs)
- `created_at`, `updated_at`

**Relationships:**
- belongsTo Tenant, Outlet, Supplier, User (created_by, approved_by)
- hasMany PurchaseOrderItems

---

#### **11. PurchaseOrderItem** ⚠️ **MISSING**
**Why Required:**
- Line items in purchase orders

**Required Fields:**
- `purchase_order` (FK)
- `product` (FK, optional) - May be new product
- `product_name` (CharField) - Denormalized name
- `quantity` (Integer)
- `unit_cost` (Decimal)
- `total` (Decimal)
- `received_quantity` (Integer) - For partial receipts
- `notes` (Text)

**Relationships:**
- belongsTo PurchaseOrder, Product (optional)

---

#### **12. SupplierInvoice** ⚠️ **MISSING**
**Why Required:**
- Track supplier invoices
- Link to purchase orders
- Accounts payable management

**Required Fields:**
- `tenant`, `outlet`, `supplier` (FK)
- `invoice_number` (CharField)
- `purchase_order` (FK, optional)
- `invoice_date`, `due_date` (Date)
- `subtotal` (Decimal)
- `tax` (Decimal)
- `total` (Decimal)
- `amount_paid` (Decimal)
- `payment_status` (unpaid/partially_paid/paid/overdue)
- `payment_method` (CharField)
- `paid_at` (DateTime, optional)
- `notes` (Text)
- `created_at`, `updated_at`

**Relationships:**
- belongsTo Tenant, Outlet, Supplier, PurchaseOrder (optional)

---

#### **13. PurchaseReturn** ⚠️ **MISSING**
**Why Required:**
- Return defective/damaged goods to suppliers
- Track return authorizations
- Credit notes management

**Required Fields:**
- `tenant`, `outlet`, `supplier` (FK)
- `return_number` (CharField, unique)
- `purchase_order` (FK, optional)
- `return_date` (Date)
- `reason` (CharField)
- `status` (pending/authorized/returned/credited)
- `total` (Decimal)
- `credit_note_number` (CharField, optional)
- `notes` (Text)
- `created_by` (User FK)
- `created_at`, `updated_at`

**Relationships:**
- belongsTo Tenant, Outlet, Supplier, PurchaseOrder (optional), User
- hasMany PurchaseReturnItems

---

#### **14. PurchaseReturnItem** ⚠️ **MISSING**
**Why Required:**
- Line items in purchase returns

**Required Fields:**
- `purchase_return` (FK)
- `product` (FK)
- `quantity` (Integer)
- `unit_cost` (Decimal)
- `total` (Decimal)
- `reason` (CharField)

**Relationships:**
- belongsTo PurchaseReturn, Product

---

### **E. INVENTORY ENHANCEMENTS**

#### **15. UnitOfMeasure** ⚠️ **MISSING**
**Why Required:**
- Current system has `unit` as CharField (e.g., "pcs")
- No conversion between units (e.g., 1 box = 12 pcs)
- Required for proper inventory management

**Required Fields:**
- `tenant`
- `name` (CharField) - e.g., "Piece", "Box", "Case"
- `abbreviation` (CharField) - e.g., "pcs", "box", "case"
- `base_unit` (FK, optional) - If this is a derived unit
- `conversion_factor` (Decimal) - e.g., 12 if 1 box = 12 pcs
- `is_base_unit` (Boolean)
- `created_at`, `updated_at`

**Relationships:**
- belongsTo Tenant, UnitOfMeasure (base_unit, optional)

---

#### **16. StockTransfer** ⚠️ **MISSING**
**Why Required:**
- Current system tracks transfers via StockMovement but lacks:
  - Transfer requests/approvals
  - Transfer tracking between outlets
  - Transfer receipts

**Required Fields:**
- `tenant`, `from_outlet`, `to_outlet` (FKs)
- `transfer_number` (CharField, unique)
- `transfer_date`, `expected_delivery_date` (Date)
- `status` (pending/in_transit/received/cancelled)
- `notes` (Text)
- `requested_by`, `approved_by`, `received_by` (User FKs)
- `created_at`, `updated_at`

**Relationships:**
- belongsTo Tenant, Outlet (from, to), User (requested_by, approved_by, received_by)
- hasMany StockTransferItems

---

#### **17. StockTransferItem** ⚠️ **MISSING**
**Why Required:**
- Line items in stock transfers

**Required Fields:**
- `stock_transfer` (FK)
- `product` (FK)
- `quantity_requested` (Integer)
- `quantity_sent` (Integer)
- `quantity_received` (Integer)
- `notes` (Text)

**Relationships:**
- belongsTo StockTransfer, Product

---

### **F. FINANCIAL MANAGEMENT**

#### **18. Expense** ⚠️ **MISSING**
**Why Required:**
- Track business expenses
- Link to petty cash payouts
- Expense reporting and categorization

**Required Fields:**
- `tenant`, `outlet` (FK)
- `expense_number` (CharField, unique)
- `expense_date` (Date)
- `category` (CharField) - e.g., "Rent", "Utilities", "Supplies"
- `amount` (Decimal)
- `payment_method` (CharField)
- `vendor` (CharField) - Vendor name
- `receipt_number` (CharField, optional)
- `description` (Text)
- `petty_cash_payout` (FK, optional) - If paid from petty cash
- `created_by`, `approved_by` (User FKs)
- `created_at`, `updated_at`

**Relationships:**
- belongsTo Tenant, Outlet, PettyCashPayout (optional), User (created_by, approved_by)

---

#### **19. Refund** ⚠️ **MISSING**
**Why Required:**
- Current system marks Sale as "refunded" but lacks:
  - Separate refund records
  - Refund reasons and approvals
  - Refund method tracking
  - Impact on cash drawer

**Required Fields:**
- `tenant`, `outlet`, `sale` (FK)
- `refund_number` (CharField, unique)
- `refund_date` (DateTime)
- `refund_type` (full/partial)
- `refund_amount` (Decimal)
- `refund_method` (CharField) - cash/card/mobile/store_credit
- `reason` (CharField) - Customer request, defective, etc.
- `status` (pending/approved/processed/cancelled)
- `cash_movement` (FK, optional) - Link to CashMovement if cash refund
- `approved_by`, `processed_by` (User FKs)
- `notes` (Text)
- `created_at`, `updated_at`

**Relationships:**
- belongsTo Tenant, Outlet, Sale, CashMovement (optional), User (approved_by, processed_by)

---

### **G. BAR-SPECIFIC FEATURES**

#### **20. BarTab** ⚠️ **MISSING**
**Why Required:**
- Frontend has bar tabs page but no backend model
- Track open tabs for bar customers
- Link multiple sales to a tab
- Tab settlement

**Required Fields:**
- `tenant`, `outlet`, `customer` (FK)
- `tab_number` (CharField, unique)
- `opened_at` (DateTime)
- `closed_at` (DateTime, optional)
- `status` (open/closed/paid)
- `total_amount` (Decimal) - Sum of all sales on tab
- `amount_paid` (Decimal)
- `balance` (Decimal) - Calculated
- `payment_method` (CharField, optional)
- `opened_by`, `closed_by` (User FKs)
- `notes` (Text)

**Relationships:**
- belongsTo Tenant, Outlet, Customer, User (opened_by, closed_by)
- hasMany Sales (via Sale.tab FK - needs to be added)

---

### **H. CUSTOMER MANAGEMENT**

#### **21. CustomerGroup** ⚠️ **MISSING**
**Why Required:**
- Group customers for pricing, discounts, reporting
- Wholesale customers, VIP customers, etc.

**Required Fields:**
- `tenant`
- `name` (CharField)
- `description` (Text)
- `discount_percentage` (Decimal, optional) - Default discount for group
- `is_active` (Boolean)
- `created_at`, `updated_at`

**Relationships:**
- belongsTo Tenant
- ManyToMany Customers

---

### **I. RECEIPTS & DOCUMENTS**

#### **22. ReceiptTemplate** ⚠️ **MISSING**
**Why Required:**
- Customizable receipt templates
- Different templates for retail/wholesale/restaurant
- Branding and compliance

**Required Fields:**
- `tenant`, `outlet` (optional)
- `name` (CharField)
- `template_type` (receipt/invoice/delivery_note)
- `template_content` (JSONField or TextField) - HTML/PDF template
- `is_default` (Boolean)
- `is_active` (Boolean)
- `created_at`, `updated_at`

**Relationships:**
- belongsTo Tenant, Outlet (optional)

---

### **J. AUDIT & SECURITY**

#### **23. ActivityLog** ⚠️ **MISSING**
**Why Required:**
- Audit trail for all critical actions
- Compliance and security
- User activity tracking

**Required Fields:**
- `tenant`, `outlet` (optional)
- `user` (FK, optional) - Null for system actions
- `action_type` (CharField) - create/update/delete/view/export
- `model_name` (CharField) - Which model was affected
- `object_id` (CharField) - ID of affected object
- `object_repr` (CharField) - String representation
- `changes` (JSONField) - What changed (for updates)
- `ip_address` (CharField)
- `user_agent` (CharField)
- `device_id` (CharField, optional)
- `created_at` (DateTime) - IMMUTABLE

**Relationships:**
- belongsTo Tenant, Outlet (optional), User (optional)

**Immutable Rules:**
- Cannot be deleted or modified
- Append-only log

---

#### **24. DeviceSession** ⚠️ **MISSING**
**Why Required:**
- Track device logins/logouts
- Multi-device synchronization
- Offline mode support
- Security (device fingerprinting)

**Required Fields:**
- `tenant`, `outlet`, `user` (FK)
- `device_id` (CharField, unique)
- `device_name` (CharField)
- `device_type` (CharField) - tablet/desktop/mobile
- `ip_address` (CharField)
- `last_sync_at` (DateTime)
- `is_online` (Boolean)
- `is_active` (Boolean)
- `logged_in_at`, `logged_out_at` (DateTime)
- `created_at`, `updated_at`

**Relationships:**
- belongsTo Tenant, Outlet, User

---

### **K. PHARMACY-SPECIFIC (Future)**

#### **25. Prescription** ⚠️ **MISSING - Future**
**Why Required:**
- For pharmacy businesses
- Track prescriptions, refills, controlled substances

---

#### **26. Batch/Lot Tracking** ⚠️ **MISSING**
**Why Required:**
- Track product batches/lots
- Expiry date management
- Recall management
- Required for pharmaceuticals, food items

**Required Fields:**
- `tenant`, `product` (FK)
- `batch_number` (CharField)
- `lot_number` (CharField, optional)
- `manufacture_date`, `expiry_date` (Date)
- `quantity` (Integer)
- `outlet` (FK)
- `created_at`, `updated_at`

**Relationships:**
- belongsTo Tenant, Product, Outlet

---

---

## 📌 3. COMPLETE UNIVERSAL MODEL BLUEPRINT

### **CASH DRAWER & SHIFT ARCHITECTURE (DEEP-DIVE)**

#### **CashDrawerSession Model**

**Purpose:**
Manages the physical cash drawer state for each till during a shift. Provides real-time cash tracking, multi-device synchronization, and immutable audit trail for fraud prevention.

**Key Fields:**
- `tenant` (FK): Multi-tenant isolation
- `outlet` (FK): Which location
- `till` (FK): Which cash register
- `shift` (FK): Links to Shift model
- `opening_cash` (Decimal): Starting float/change fund
- `expected_cash` (Decimal): Calculated = opening + cash sales - cash refunds + cash adds - cash drops - petty cash
- `counted_cash` (Decimal): Physical cash count (entered during cashup)
- `difference` (Decimal): Variance = counted - expected
- `status` (CharField): open/closed/reconciled/discrepancy
- `opened_by`, `closed_by`, `reconciled_by` (User FKs): Accountability
- `opened_at`, `closed_at`, `reconciled_at` (DateTime): Timestamps
- `device_id` (CharField): For multi-device tracking
- `is_synced` (Boolean): Offline mode support
- `notes` (Text): Manager notes

**Relationships:**
- belongsTo: Tenant, Outlet, Till, Shift, User (opened_by, closed_by, reconciled_by)
- hasMany: CashMovements, CashupSettlements

**How It Works in Multi-Tenant SaaS:**
- Every query filters by `tenant_id`
- Cash drawer sessions are isolated per tenant
- SaaS admins can view all (for support)
- Tenant admins can view all their outlets
- Regular users only see their assigned outlet/till

**How It Works in One-Shop Mode:**
- Single outlet automatically selected
- Till selector may be hidden if only one till
- Simplified UI, same backend logic

**Fraud Prevention:**
- All fields immutable after reconciliation
- Every cash movement creates a CashMovement record
- Reconciliation requires manager approval for discrepancies
- ActivityLog records all cash operations
- Device tracking prevents unauthorized access

**Multi-Device Synchronization:**
- Each device has unique `device_id`
- Cash movements synced via `is_synced` flag
- Last-write-wins with conflict resolution
- Offline mode: queue movements, sync when online

---

#### **CashMovement Model**

**Purpose:**
Immutable ledger of all cash transactions (adds, drops, petty cash, sales, refunds). Provides complete audit trail for cash reconciliation and fraud detection.

**Key Fields:**
- `tenant`, `outlet`, `till`, `cash_drawer_session` (FKs)
- `movement_type` (CharField): add/drop/petty_cash/refund/sale/opening_float
- `amount` (Decimal): Always positive, type indicates direction
- `reason` (CharField): "Cash drop to safe", "Petty cash for supplies", etc.
- `reference_id` (CharField): Link to Sale, Refund, or other transaction
- `sale` (FK, optional): If movement_type = sale
- `refund` (FK, optional): If movement_type = refund
- `user` (FK): Who performed the movement
- `device_id` (CharField): Device that recorded it
- `created_at` (DateTime): IMMUTABLE timestamp
- `is_synced` (Boolean): Offline mode
- `notes` (Text)

**Relationships:**
- belongsTo: Tenant, Outlet, Till, CashDrawerSession, User, Sale (optional), Refund (optional)

**Immutable Rules:**
- Once created, cannot be deleted or modified
- Corrections via reversal entries (negative amount, opposite type)
- All timestamps and user IDs are locked
- Required for financial audit compliance

**How Refunds Affect Cash Ledger:**
- When refund processed: create CashMovement(type='refund', amount=refund_amount)
- Deducts from expected_cash in CashDrawerSession
- Links to Refund model for traceability
- Requires manager approval if refund > threshold

---

#### **CashupSettlement Model**

**Purpose:**
End-of-day cash reconciliation. Breaks down all transactions by payment method, calculates variance, and provides settlement report.

**Key Fields:**
- `tenant`, `outlet`, `till`, `shift`, `cash_drawer_session` (FKs)
- `settlement_date` (Date)
- `opening_cash` (Decimal): From CashDrawerSession
- `cash_sales` (Decimal): Sum of cash payments from Sales
- `cash_refunds` (Decimal): Sum of cash refunds
- `cash_adds` (Decimal): Sum of CashMovements(type='add')
- `cash_drops` (Decimal): Sum of CashMovements(type='drop')
- `petty_cash_payouts` (Decimal): Sum of PettyCashPayouts
- `expected_cash` (Decimal): opening + cash_sales - cash_refunds + cash_adds - cash_drops - petty_cash
- `counted_cash` (Decimal): Physical count
- `difference` (Decimal): Variance
- `card_sales`, `mobile_sales`, `credit_sales`, `other_sales` (Decimal): Non-cash totals
- `total_sales` (Decimal): All payment methods
- `status` (CharField): pending/reconciled/discrepancy
- `reconciled_by` (User FK): Manager who reconciled
- `reconciled_at` (DateTime)
- `notes`, `discrepancy_reason` (Text)

**Relationships:**
- belongsTo: Tenant, Outlet, Till, Shift, CashDrawerSession, User (reconciled_by)

**Reconciliation Logic:**
1. Calculate `expected_cash` from all CashMovements
2. User enters `counted_cash` (physical count)
3. System calculates `difference`
4. If difference = 0: auto-reconcile
5. If difference > threshold: require manager approval + `discrepancy_reason`
6. Once reconciled: status = 'reconciled', all related records become immutable

**Settlement Breakdown:**
- Payment method totals for reporting
- Cash vs non-cash split
- Variance analysis
- Historical comparison

---

#### **PettyCashPayout Model**

**Purpose:**
Track small cash disbursements separate from cash drops. Cash drops go to safe/bank; petty cash is for operational expenses.

**Key Fields:**
- `tenant`, `outlet`, `till`, `cash_drawer_session` (FKs)
- `amount` (Decimal)
- `reason` (CharField): "Office supplies", "Staff tips", "Delivery fees"
- `recipient` (CharField): Who received the cash
- `receipt_number` (CharField, optional): Receipt reference
- `expense` (FK, optional): Link to Expense if categorized
- `user` (FK): Who disbursed
- `created_at` (DateTime)
- `is_synced` (Boolean)

**Relationships:**
- belongsTo: Tenant, Outlet, Till, CashDrawerSession, Expense (optional), User

**How It Works:**
- Deducts from cash drawer
- Creates CashMovement(type='petty_cash')
- Can link to Expense for categorization
- Requires receipt if amount > threshold

---

### **SHIFT ENHANCEMENT REQUIREMENTS**

**Current Shift Model Issues:**
1. No cash movement tracking
2. No reconciliation logic
3. No multi-device support
4. No offline mode
5. No immutable audit trail

**Required Enhancements:**
1. Link to CashDrawerSession (one-to-one)
2. Add `device_id` field
3. Add `sync_status` field
4. Add reconciliation workflow
5. Add variance tracking

---

## 🏗️ 4. ARCHITECTURE NOTES

### **Warnings & Issues**

#### **1. Cash Management Gaps (CRITICAL)**
- **Issue:** Current Shift model is insufficient for production POS
- **Risk:** Cannot track cash movements, reconcile drawers, or prevent fraud
- **Impact:** High - Financial integrity at risk
- **Recommendation:** Implement CashDrawerSession, CashMovement, CashupSettlement immediately

#### **2. Missing Discount/Promotion System**
- **Issue:** No discount code management or promotion rules
- **Risk:** Cannot run marketing campaigns or track discount effectiveness
- **Impact:** Medium - Business growth limitation
- **Recommendation:** Implement Discount, DiscountUsage, Promotion models

#### **3. No Purchase Order Management**
- **Issue:** Cannot track procurement workflow
- **Risk:** Inventory management gaps, supplier relationship issues
- **Impact:** Medium - Operational efficiency
- **Recommendation:** Implement PurchaseOrder, SupplierInvoice, PurchaseReturn models

#### **4. Missing Audit Trail**
- **Issue:** No ActivityLog model
- **Risk:** Cannot track user actions, compliance issues, security breaches
- **Impact:** High - Compliance and security risk
- **Recommendation:** Implement ActivityLog with immutable records

#### **5. Bar Tabs Not Implemented**
- **Issue:** Frontend has bar tabs but no backend model
- **Risk:** Feature incomplete, data loss
- **Impact:** Medium - Feature gap
- **Recommendation:** Implement BarTab model, add `tab` FK to Sale

#### **6. No Unit of Measure Conversion**
- **Issue:** Cannot convert between units (e.g., boxes to pieces)
- **Risk:** Inventory inaccuracy
- **Impact:** Medium - Inventory management
- **Recommendation:** Implement UnitOfMeasure model

#### **7. Refund Model Missing**
- **Issue:** Refunds only tracked via Sale.status
- **Risk:** Cannot track refund reasons, approvals, or impact on cash
- **Impact:** Medium - Customer service and cash management
- **Recommendation:** Implement Refund model

#### **8. No Expense Tracking**
- **Issue:** Cannot track business expenses
- **Risk:** Incomplete financial picture
- **Impact:** Medium - Financial reporting
- **Recommendation:** Implement Expense model

#### **9. Multi-Device Synchronization**
- **Issue:** No device tracking or offline mode support
- **Risk:** Data loss, sync conflicts
- **Impact:** High - Multi-device reliability
- **Recommendation:** Implement DeviceSession, add sync fields to all models

#### **10. Tenant Filtering Consistency**
- **Issue:** Some ViewSets may not consistently apply tenant filtering
- **Risk:** Data leakage between tenants
- **Impact:** Critical - Security breach
- **Recommendation:** Audit all ViewSets, ensure TenantFilterMixin is applied

---

### **Scalability Considerations**

#### **Database Indexing**
- All models have `tenant_id` indexed ✓
- Consider composite indexes for common queries:
  - `(tenant_id, outlet_id, created_at)` for sales reports
  - `(tenant_id, status, created_at)` for active records
  - `(cash_drawer_session_id, created_at)` for cash movements

#### **Query Optimization**
- Use `select_related()` for FK relationships ✓
- Use `prefetch_related()` for reverse FK relationships
- Consider read replicas for reporting queries

#### **Caching Strategy**
- Cache tenant settings
- Cache product catalogs per tenant
- Cache active shifts per till
- Invalidate on updates

#### **Partitioning (Future)**
- Partition large tables by `tenant_id` or `created_at`
- Consider time-based partitioning for ActivityLog, CashMovement

---

## ✅ 5. FINAL RECOMMENDATIONS

### **Priority 1: CRITICAL (Implement Immediately)**

1. **CashDrawerSession Model**
   - Real-time cash drawer state
   - Multi-device synchronization
   - Offline mode support

2. **CashMovement Model**
   - Immutable cash ledger
   - Fraud prevention
   - Complete audit trail

3. **CashupSettlement Model**
   - End-of-day reconciliation
   - Variance analysis
   - Settlement reports

4. **ActivityLog Model**
   - Audit trail
   - Compliance
   - Security monitoring

5. **DeviceSession Model**
   - Multi-device tracking
   - Offline mode
   - Security

---

### **Priority 2: HIGH (Implement Soon)**

6. **Discount & DiscountUsage Models**
   - Marketing campaigns
   - Discount tracking

7. **Refund Model**
   - Refund management
   - Cash impact tracking

8. **PettyCashPayout Model**
   - Operational expenses
   - Cash reconciliation

9. **BarTab Model**
   - Complete bar functionality
   - Tab management

10. **Expense Model**
    - Business expense tracking
    - Financial reporting

---

### **Priority 3: MEDIUM (Implement When Needed)**

11. **PurchaseOrder & PurchaseOrderItem Models**
    - Procurement workflow

12. **SupplierInvoice Model**
    - Accounts payable

13. **PurchaseReturn & PurchaseReturnItem Models**
    - Return management

14. **PriceList & PriceListItem Models**
    - Advanced pricing

15. **Promotion Model**
    - Complex promotional rules

16. **StockTransfer & StockTransferItem Models**
    - Inter-outlet transfers

17. **UnitOfMeasure Model**
    - Unit conversion

18. **CustomerGroup Model**
    - Customer segmentation

19. **ReceiptTemplate Model**
    - Customizable receipts

---

### **Priority 4: FUTURE (Pharmacy & Advanced Features)**

20. **Prescription Model** (Pharmacy)
21. **Batch/Lot Tracking Model** (Pharmaceuticals, Food)

---

## 📊 6. MODEL COUNT SUMMARY

- **Existing Models:** 24
- **Missing Critical Models:** 26
- **Total Required Models:** 50

---

## 🎯 7. IMPLEMENTATION ROADMAP

### **Phase 1: Cash Management (Weeks 1-2)**
- CashDrawerSession
- CashMovement
- CashupSettlement
- PettyCashPayout
- Enhance Shift model

### **Phase 2: Audit & Security (Week 3)**
- ActivityLog
- DeviceSession
- Enhance all models with audit fields

### **Phase 3: Sales Enhancements (Week 4)**
- Discount
- DiscountUsage
- Refund
- BarTab

### **Phase 4: Procurement (Weeks 5-6)**
- PurchaseOrder
- PurchaseOrderItem
- SupplierInvoice
- PurchaseReturn

### **Phase 5: Advanced Features (Weeks 7-8)**
- PriceList
- Promotion
- StockTransfer
- UnitOfMeasure
- CustomerGroup
- Expense

---

## 🔒 8. SECURITY & COMPLIANCE REQUIREMENTS

### **Immutable Records**
- CashMovement: Never delete, only reverse
- ActivityLog: Append-only, never modify
- CashupSettlement: Lock after reconciliation
- All financial transactions: Immutable after creation

### **Audit Trail Requirements**
- Every financial transaction logged
- Every user action logged
- Every cash movement logged
- Device tracking for all operations
- IP address and user agent logging

### **Multi-Tenant Isolation**
- All queries filter by `tenant_id`
- No cross-tenant data access
- Tenant admins limited to their tenant
- SaaS admins can view all (for support)

### **Fraud Prevention**
- Cash variance alerts
- Unusual transaction patterns
- Device authorization
- Manager approvals for large transactions
- Reconciliation requirements

---

## 📝 9. DATA MIGRATION NOTES

### **Existing Data**
- Current `Shift` model data can be migrated to `CashDrawerSession`
- `Sale.discount` field can be migrated to `DiscountUsage` records
- Existing sales with `status='refunded'` can be migrated to `Refund` records

### **Backward Compatibility**
- Maintain `Shift` model for existing integrations
- Add `CashDrawerSession` as enhancement
- Gradually migrate functionality

---

## 🎓 10. BEST PRACTICES

### **Model Design**
- Always include `tenant_id` FK
- Use `DecimalField` for money (never Float)
- Include `created_at`, `updated_at` timestamps
- Add indexes for common queries
- Use `related_name` for reverse relationships

### **Multi-Tenant Queries**
- Always filter by `tenant_id` first
- Use `TenantFilterMixin` in ViewSets
- Test tenant isolation thoroughly
- Never trust client-provided tenant_id

### **Cash Management**
- Calculate expected cash from movements (never trust manual entry)
- Require manager approval for discrepancies
- Lock records after reconciliation
- Maintain immutable audit trail

### **Offline Mode**
- Add `is_synced` boolean to all transactional models
- Queue operations when offline
- Sync on reconnect
- Handle conflicts gracefully

---

---

**Audit complete. Would you like me to generate the ERD or convert this into models for your backend (Django, Node, Prisma, SQL)?**

