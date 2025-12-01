# Credit & Accounts Receivable System Implementation Plan

## Overview
This document outlines the professional implementation of a credit/accounts receivable system for wholesale businesses where customers can purchase on credit and pay later according to agreed payment terms.

---

## 1. Professional POS Credit Flow

### 1.1 Credit Setup Phase
**Customer Onboarding:**
- Business sets credit limit for customer (e.g., MWK 100,000)
- Business sets payment terms (e.g., Net 30, Net 60, COD)
- Business can enable/disable credit for specific customers
- Credit status tracked (Active, Suspended, Closed)

### 1.2 Credit Sale Process
**During POS Transaction:**
1. Customer selected at POS
2. System checks:
   - Is customer credit-enabled?
   - Current outstanding balance
   - Available credit (credit_limit - outstanding_balance)
   - Any overdue payments
3. If credit available:
   - Cashier selects "Credit" payment method
   - Sale is created with `payment_method='credit'` and `status='pending'`
   - Outstanding balance increases
   - Due date calculated (sale_date + payment_terms_days)
4. If credit limit exceeded:
   - System blocks sale or requires partial payment
   - Warning displayed to cashier

### 1.3 Payment Collection Process
**Recording Payments:**
1. Customer comes to pay outstanding balance
2. Staff accesses customer's account from CRM
3. System shows:
   - Total outstanding balance
   - List of unpaid invoices (sales)
   - Due dates and overdue status
4. Staff records payment:
   - Select invoices to pay (or partial payment)
   - Enter payment amount
   - Select payment method (cash, card, mobile money)
   - System allocates payment to oldest invoices first (FIFO)
5. System updates:
   - Outstanding balance decreases
   - Invoice status changes to 'paid' or 'partially_paid'
   - Payment history recorded

### 1.4 Credit Management
**Ongoing Operations:**
- Automatic overdue detection (daily job)
- Credit limit monitoring
- Payment reminders
- Credit reports (aging analysis)
- Bad debt tracking

---

## 2. Database Schema Design

### 2.1 Customer Model Extensions
```python
# Add to Customer model:
- credit_enabled: Boolean (default=False)
- credit_limit: Decimal (default=0)
- payment_terms_days: Integer (default=30)  # Net 30, Net 60, etc.
- outstanding_balance: Decimal (calculated field)
- credit_status: CharField (choices: 'active', 'suspended', 'closed')
- credit_notes: TextField
```

### 2.2 Sale Model Extensions
```python
# Add to Sale model:
- due_date: DateTimeField (calculated from created_at + payment_terms)
- amount_paid: Decimal (default=0)  # For partial payments
- payment_status: CharField (choices: 'unpaid', 'partially_paid', 'paid', 'overdue')
- is_credit_sale: Boolean (computed from payment_method='credit')
```

### 2.3 New Models

#### CreditPayment Model
```python
class CreditPayment(models.Model):
    """Records payments against credit sales"""
    tenant = ForeignKey(Tenant)
    customer = ForeignKey(Customer)
    sale = ForeignKey(Sale)  # The invoice being paid
    amount = DecimalField  # Payment amount
    payment_method = CharField  # cash, card, mobile, etc.
    payment_date = DateTimeField
    reference_number = CharField  # Receipt/invoice number
    notes = TextField
    user = ForeignKey(User)  # Who recorded the payment
    created_at = DateTimeField
```

#### CreditTransaction Model (Optional - for audit trail)
```python
class CreditTransaction(models.Model):
    """Audit trail for all credit-related transactions"""
    TRANSACTION_TYPES = [
        ('credit_sale', 'Credit Sale'),
        ('payment', 'Payment'),
        ('adjustment', 'Adjustment'),
        ('write_off', 'Write Off'),
    ]
    
    tenant = ForeignKey(Tenant)
    customer = ForeignKey(Customer)
    transaction_type = CharField
    amount = DecimalField
    balance_before = DecimalField
    balance_after = DecimalField
    reference = CharField  # Sale ID or Payment ID
    notes = TextField
    created_at = DateTimeField
```

---

## 3. Implementation Components

### 3.1 Backend Components

#### A. Customer Model Updates
- Add credit fields to Customer model
- Add `outstanding_balance` property (calculated from unpaid sales)
- Add `available_credit` property (credit_limit - outstanding_balance)
- Add validation methods (check credit limit, payment terms)

#### B. Sale Model Updates
- Add `due_date` field (auto-calculated)
- Add `amount_paid` and `payment_status` fields
- Update sale creation to handle credit sales
- Add method to calculate payment status

#### C. CreditPayment ViewSet
- Create payment endpoint: `POST /api/v1/credit-payments/`
- List customer payments: `GET /api/v1/credit-payments/?customer={id}`
- Payment allocation logic (FIFO - oldest invoices first)
- Update sale payment status automatically

#### D. Credit Management Endpoints
- Get customer credit summary: `GET /api/v1/customers/{id}/credit-summary/`
- Get overdue invoices: `GET /api/v1/sales/?payment_status=overdue`
- Get aging report: `GET /api/v1/reports/aging-analysis/`
- Adjust credit limit: `PATCH /api/v1/customers/{id}/adjust-credit/`

#### E. Business Logic
- Credit limit validation before sale
- Automatic due date calculation
- Overdue detection (daily cron job or on-demand)
- Payment allocation algorithm (FIFO)
- Balance reconciliation

### 3.2 Frontend Components

#### A. Customer Management (CRM Page)
- **Credit Information Section:**
  - Credit enabled toggle
  - Credit limit input
  - Payment terms selector (Net 15, 30, 60, 90)
  - Current outstanding balance display
  - Available credit display
  - Credit status badge

- **Credit History Tab:**
  - List of all credit sales
  - Payment history
  - Aging analysis chart
  - Overdue invoices highlighted

#### B. POS Integration
- **Customer Selection:**
  - Show credit status badge
  - Display available credit
  - Show outstanding balance warning

- **Payment Method Selection:**
  - "Credit" option (only if customer has credit enabled)
  - Credit limit check before allowing credit sale
  - Warning if credit limit would be exceeded
  - Show due date preview

#### C. Payment Collection Page
- **Customer Payment Interface:**
  - Search/select customer
  - Display outstanding balance
  - List unpaid invoices with:
    - Invoice number
    - Date
    - Amount
    - Due date
    - Days overdue (if applicable)
  - Payment form:
    - Amount to pay
    - Payment method
    - Reference number
    - Notes
  - Payment allocation preview
  - Payment confirmation

#### D. Credit Reports
- **Aging Analysis:**
  - Current (0-30 days)
  - 31-60 days
  - 61-90 days
  - Over 90 days
  - Total outstanding

- **Overdue Report:**
  - List of overdue invoices
  - Customer details
  - Amount overdue
  - Days overdue
  - Export functionality

---

## 4. Key Features & Business Rules

### 4.1 Credit Limit Enforcement
- **Rule:** Sale cannot proceed if (outstanding_balance + sale_total) > credit_limit
- **Exception:** Allow override with manager approval (logged)
- **Warning:** Show warning at 80% of credit limit

### 4.2 Payment Terms
- **Net 30:** Payment due 30 days from sale date
- **Net 60:** Payment due 60 days from sale date
- **COD:** Cash on delivery (no credit)
- **Custom:** Business can set custom days

### 4.3 Payment Allocation
- **FIFO (First In, First Out):** Oldest invoices paid first
- **Partial Payments:** Allowed, tracked per invoice
- **Overpayment:** Can be applied to future invoices or refunded

### 4.4 Overdue Management
- **Automatic Detection:** Mark invoices as overdue when due_date < today
- **Grace Period:** Optional grace period before marking overdue
- **Notifications:** Email/SMS reminders (future feature)
- **Credit Suspension:** Auto-suspend credit if overdue > X days

### 4.5 Credit Status Management
- **Active:** Customer can make credit purchases
- **Suspended:** Credit temporarily disabled (overdue, limit exceeded)
- **Closed:** Credit account closed (no new credit sales)

---

## 5. Data Flow Diagrams

### 5.1 Credit Sale Flow
```
1. Customer Selected at POS
   ↓
2. Check Credit Status
   ├─ Credit Enabled? → Yes
   │  ├─ Check Outstanding Balance
   │  ├─ Calculate Available Credit
   │  └─ Sale Total <= Available Credit? → Yes → Proceed
   │                                    → No → Block/Override
   └─ Credit Enabled? → No → Use Cash/Card
   ↓
3. Create Sale with payment_method='credit'
   ↓
4. Update Customer Outstanding Balance
   ↓
5. Set Due Date (created_at + payment_terms_days)
   ↓
6. Set Sale payment_status='unpaid'
   ↓
7. Complete Transaction
```

### 5.2 Payment Collection Flow
```
1. Select Customer
   ↓
2. Load Unpaid Invoices (ordered by date, oldest first)
   ↓
3. Enter Payment Amount
   ↓
4. Allocate Payment (FIFO):
   ├─ Payment >= Oldest Invoice? → Pay in full, move to next
   └─ Payment < Oldest Invoice? → Partial payment, update invoice
   ↓
5. Create CreditPayment Records
   ↓
6. Update Sale payment_status:
   ├─ amount_paid == total → 'paid'
   ├─ amount_paid > 0 → 'partially_paid'
   └─ amount_paid == 0 → 'unpaid'
   ↓
7. Update Customer Outstanding Balance
   ↓
8. Generate Payment Receipt
```

---

## 6. API Endpoints

### 6.1 Customer Credit Endpoints
```
GET    /api/v1/customers/{id}/credit-summary/
PATCH  /api/v1/customers/{id}/adjust-credit/
POST   /api/v1/customers/{id}/suspend-credit/
POST   /api/v1/customers/{id}/activate-credit/
```

### 6.2 Credit Payment Endpoints
```
GET    /api/v1/credit-payments/
POST   /api/v1/credit-payments/
GET    /api/v1/credit-payments/{id}/
GET    /api/v1/credit-payments/?customer={id}
GET    /api/v1/credit-payments/?sale={id}
```

### 6.3 Sales Endpoints (Extended)
```
GET    /api/v1/sales/?payment_status=unpaid
GET    /api/v1/sales/?payment_status=overdue
GET    /api/v1/sales/?customer={id}&payment_status=unpaid
```

### 6.4 Reports Endpoints
```
GET    /api/v1/reports/aging-analysis/
GET    /api/v1/reports/overdue-invoices/
GET    /api/v1/reports/credit-summary/
```

---

## 7. Security & Permissions

### 7.1 Role-Based Access
- **Cashier:** Can process credit sales, record payments
- **Manager:** Can adjust credit limits, suspend credit, view reports
- **Admin:** Full access to all credit management features

### 7.2 Audit Trail
- Log all credit limit changes
- Log all payment recordings
- Log credit status changes
- Track who made changes (user, timestamp)

---

## 8. Implementation Phases

### Phase 1: Core Credit System
1. Update Customer model with credit fields
2. Update Sale model with credit-related fields
3. Create CreditPayment model
4. Implement credit validation in sale creation
5. Basic payment recording

### Phase 2: Payment Management
1. Payment collection interface
2. Payment allocation logic (FIFO)
3. Payment history tracking
4. Invoice status updates

### Phase 3: Reporting & Analytics
1. Aging analysis report
2. Overdue invoices report
3. Credit summary dashboard
4. Customer credit history

### Phase 4: Advanced Features
1. Automatic overdue detection
2. Payment reminders
3. Credit limit warnings
4. Bad debt write-off
5. Credit score/rating

---

## 9. Testing Considerations

### 9.1 Unit Tests
- Credit limit validation
- Payment allocation logic
- Due date calculation
- Outstanding balance calculation

### 9.2 Integration Tests
- Credit sale creation flow
- Payment recording flow
- Credit limit enforcement
- Payment status updates

### 9.3 Edge Cases
- Partial payments
- Overpayments
- Multiple payments for same invoice
- Credit limit exactly reached
- Payment after due date
- Negative outstanding balance (credit)

---

## 10. Future Enhancements

1. **Automated Reminders:** Email/SMS for overdue invoices
2. **Credit Scoring:** Automatic credit limit suggestions
3. **Payment Plans:** Installment payment options
4. **Discounts:** Early payment discounts
5. **Integration:** Accounting software integration (QuickBooks, Xero)
6. **Mobile App:** Customer portal to view invoices and make payments
7. **Multi-Currency:** Support for different currencies
8. **Credit Insurance:** Integration with credit insurance providers

---

## Summary

This implementation provides a complete credit and accounts receivable system that:
- ✅ Allows businesses to extend credit to customers
- ✅ Tracks outstanding balances and payment terms
- ✅ Enforces credit limits
- ✅ Records payments and allocates them to invoices
- ✅ Provides comprehensive reporting
- ✅ Maintains audit trails
- ✅ Integrates seamlessly with existing POS system

The system follows professional accounting practices and provides the flexibility needed for wholesale businesses while maintaining data integrity and security.

