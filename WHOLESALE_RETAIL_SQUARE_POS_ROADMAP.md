# Wholesale & Retail Square POS Implementation Roadmap

**Priority**: 🔴 URGENT - Primary Client Focus  
**Target**: Square POS Feature Parity for Wholesale & Retail Businesses  
**Current Status**: ~85% Complete for Cash-Only Operations

---

## 📊 Current State Assessment

### ✅ **Fully Implemented (Production Ready)**

#### **Core Wholesale & Retail Features**
- ✅ **Dual Pricing System** - Retail and wholesale prices per product
- ✅ **Wholesale Quantity Thresholds** - Minimum wholesale quantity enforcement
- ✅ **Wholesale Toggle** - Enable/disable wholesale per product
- ✅ **Unified POS** - Single interface supporting both retail and wholesale sales
- ✅ **Customer Management** - Customer profiles with credit/accounts receivable
- ✅ **Product Variations** - Square POS compatible (sizes, colors, pack sizes)
- ✅ **Location-based Inventory** - Per-outlet stock tracking
- ✅ **Bulk Import/Export** - Excel templates for wholesale/retail products
- ✅ **Returns & Refunds** - Complete refund processing
- ✅ **Discount Application** - Discounts in sales transactions
- ✅ **Supplier Management** - Complete supplier CRUD operations
- ✅ **Auto-Purchase Orders** - Supplier-optional auto-PO system implemented
- ✅ **Low Stock Alerts** - Variation-level and product-level alerts
- ✅ **Stock Movements** - Complete audit trail
- ✅ **Stock Transfers** - Inter-outlet transfers
- ✅ **Stock Taking** - Physical inventory counting

#### **Sales & Transactions**
- ✅ **Cash Sales** - Fully operational with atomic transactions
- ✅ **Wholesale Sales** - Automatic price selection based on quantity
- ✅ **Retail Sales** - Standard retail pricing
- ✅ **Stock Validation** - Prevents overselling
- ✅ **Receipt Numbers** - Automatic generation
- ✅ **Shift Management** - Cash reconciliation

#### **Reporting**
- ✅ **Daily Sales Report** - Retail and wholesale breakdown
- ✅ **Top Products Report** - Revenue and quantity analysis
- ✅ **Cash Summary** - Shift-based cash tracking
- ✅ **Product Performance** - Sales analytics
- ✅ **Profit & Loss** - Basic P&L reporting

---

### ⚠️ **Partially Implemented (Needs Completion)**

#### **1. Payment Processing** 🔴 **CRITICAL**
- ✅ Cash payments: **100% Complete**
- ⚠️ Card payments: **30% Complete** (structure ready, gateway integration needed)
- ⚠️ Mobile Money: **30% Complete** (structure ready, provider integration needed)
- ⚠️ Split payments: **50% Complete** (UI ready, backend logic needed)

**What's Needed:**
- Stripe/Square/Paystack integration for card payments
- M-Pesa/Airtel Money integration for mobile payments
- Split payment backend processing logic
- Payment confirmation flows
- Payment error handling and retry logic

**Estimated Effort**: 2-3 weeks

---

#### **2. Receipt System** 🔴 **HIGH PRIORITY**
- ✅ Receipt numbers: **100% Complete**
- ✅ Receipt preview: **100% Complete**
- ❌ PDF generation: **0% Complete**
- ❌ Receipt printing: **0% Complete**
- ❌ Digital receipt storage: **0% Complete**
- ❌ Email receipts: **0% Complete**

**What's Needed:**
- Receipt model in database
- PDF generation service (reportlab/weasyprint)
- Thermal printer integration (ESC/POS)
- Receipt retrieval API
- Email receipt sending

**Estimated Effort**: 1-2 weeks

---

#### **3. Barcode Scanner** 🟡 **MEDIUM PRIORITY**
- ✅ Barcode field: **100% Complete**
- ✅ Barcode search: **100% Complete**
- ❌ Hardware scanner: **0% Complete**
- ❌ Keyboard wedge: **0% Complete**

**What's Needed:**
- Keyboard wedge handler for barcode scanners
- Scanner configuration UI
- Auto-add to cart on scan
- Multiple scanner support

**Estimated Effort**: 3-5 days

---

#### **4. Price Lists** 🟡 **MEDIUM PRIORITY**
- ✅ Frontend UI: **100% Complete**
- ❌ Backend API: **0% Complete**
- ❌ Price list models: **0% Complete**

**What's Needed:**
- PriceList model (tenant, name, customer_group, is_active)
- PriceListItem model (price_list, variation, price)
- CRUD endpoints for price lists
- Price list application in POS

**Estimated Effort**: 3-5 days

---

#### **5. Customer Groups** 🟡 **MEDIUM PRIORITY**
- ✅ Frontend UI: **100% Complete**
- ❌ Backend API: **0% Complete**
- ❌ Customer group models: **0% Complete**

**What's Needed:**
- CustomerGroup model (tenant, name, discount_percentage, is_active)
- Customer-to-group assignment
- Group-based pricing in POS

**Estimated Effort**: 2-3 days

---

#### **6. Discount Management** 🟡 **MEDIUM PRIORITY**
- ✅ Discount application: **100% Complete** (in sales)
- ✅ Frontend UI: **100% Complete**
- ⚠️ Standalone management: **50% Complete**

**What's Needed:**
- Discount model (if not exists)
- Discount rules engine
- Automatic discount application
- Discount validation

**Estimated Effort**: 3-5 days

---

### ❌ **Not Implemented (Post-MVP)**

#### **1. Loyalty Programs** 🟢 **LOW PRIORITY**
- ✅ Frontend UI: **100% Complete**
- ❌ Backend API: **0% Complete**

**Estimated Effort**: 1-2 weeks (Post-MVP)

#### **2. Gift Cards** 🟢 **LOW PRIORITY**
- ❌ Not implemented
- **Estimated Effort**: 1 week (Post-MVP)

#### **3. Advanced Reporting** 🟢 **LOW PRIORITY**
- ✅ Basic reports: **100% Complete**
- ❌ Custom date ranges: **0% Complete**
- ❌ Export to PDF/Excel: **0% Complete**
- ❌ Advanced analytics: **0% Complete**

**Estimated Effort**: 1-2 weeks (Post-MVP)

---

## 🎯 Square POS MVP Completion Plan for Wholesale & Retail

### **Phase 1: Critical MVP Features (3-4 weeks)** 🔴 **URGENT**

#### **Week 1-2: Payment Gateway Integration**
**Priority**: 🔴 CRITICAL
- [ ] Choose payment gateway (Stripe/Square/Paystack)
- [ ] Implement card payment processing
- [ ] Implement mobile money integration (M-Pesa/Airtel)
- [ ] Payment confirmation flows
- [ ] Payment error handling
- [ ] Transaction logging and audit trail

**Files to Modify:**
- `backend/apps/payments/services.py` - Gateway integration
- `backend/apps/payments/views.py` - Payment endpoints
- `frontend/components/modals/payment-modal.tsx` - Enable card/mobile tabs
- `frontend/lib/services/paymentService.ts` - Payment processing

**Dependencies:**
- Payment gateway API keys
- Mobile money provider credentials
- SSL certificate for production

---

#### **Week 2-3: Receipt System**
**Priority**: 🔴 HIGH
- [ ] Create Receipt model
- [ ] Implement PDF generation
- [ ] Implement thermal printer support
- [ ] Receipt storage in database
- [ ] Receipt retrieval API
- [ ] Email receipt option

**Files to Create/Modify:**
- `backend/apps/sales/models.py` - Add Receipt model
- `backend/apps/sales/receipts.py` - Receipt generation service (NEW)
- `backend/apps/sales/views.py` - Receipt endpoints
- `frontend/components/modals/receipt-preview-modal.tsx` - Print/PDF buttons
- `frontend/lib/services/receiptService.ts` - Receipt service (NEW)

**Dependencies:**
- PDF library (reportlab or weasyprint)
- Thermal printer library (python-escpos)
- Email service (SMTP or SendGrid)

---

#### **Week 3-4: Split Payments & Barcode Scanner**
**Priority**: 🟡 MEDIUM
- [ ] Implement split payment backend logic
- [ ] Payment allocation validation
- [ ] Connect frontend to backend
- [ ] Barcode scanner keyboard wedge handler
- [ ] Scanner configuration UI
- [ ] Auto-add to cart on scan

**Files to Modify:**
- `backend/apps/payments/services.py` - Split payment logic
- `backend/apps/payments/views.py` - Split payment endpoint
- `frontend/components/modals/payment-modal.tsx` - Connect split payment
- `frontend/components/pos/unified-pos.tsx` - Barcode scanner handler
- `frontend/components/settings/hardware-tab.tsx` - Scanner config (NEW)

---

### **Phase 2: Enhanced Features (1-2 weeks)** 🟡 **HIGH PRIORITY**

#### **Week 5: Price Lists & Customer Groups**
- [ ] Create PriceList and PriceListItem models
- [ ] Implement price list CRUD endpoints
- [ ] Integrate price lists in POS
- [ ] Create CustomerGroup model
- [ ] Implement customer group assignment
- [ ] Group-based pricing in POS

**Files to Create/Modify:**
- `backend/apps/products/models.py` - Price list models
- `backend/apps/products/views.py` - Price list endpoints
- `backend/apps/customers/models.py` - Customer group model
- `backend/apps/customers/views.py` - Customer group endpoints
- `frontend/app/dashboard/retail/price-lists/page.tsx` - Connect to backend
- `frontend/components/pos/unified-pos.tsx` - Apply price lists

---

#### **Week 6: Discount Management & Testing**
- [ ] Standalone discount management
- [ ] Discount rules engine
- [ ] Automatic discount application
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit

---

## 📋 Implementation Checklist for Wholesale & Retail MVP

### **Backend (Django)**
- [x] Multi-tenant architecture
- [x] User authentication & authorization
- [x] Product & inventory management (with variations)
- [x] Wholesale/retail pricing system
- [x] Sales & transaction processing
- [x] Cash payment processing
- [x] Shift management
- [x] Customer management
- [x] Supplier management
- [x] Auto-purchase orders
- [x] Basic reporting
- [ ] **Card payment gateway integration** 🔴
- [ ] **Mobile money provider integration** 🔴
- [ ] **Receipt generation (PDF/Print)** 🔴
- [ ] **Split payment processing** 🟡
- [ ] **Barcode scanner support** 🟡
- [ ] **Price lists** 🟡
- [ ] **Customer groups** 🟡

### **Frontend (Next.js)**
- [x] Authentication flow
- [x] Dashboard (retail-specific)
- [x] POS interface (unified retail/wholesale)
- [x] Product management
- [x] Inventory management
- [x] Sales history
- [x] Customer management
- [x] Shift management
- [x] Cash management
- [x] Wholesale pricing UI
- [ ] **Receipt printing** 🔴
- [ ] **Barcode scanner integration** 🟡
- [ ] **Payment gateway UI (card/mobile)** 🔴
- [ ] **Price lists UI (connect to backend)** 🟡
- [ ] **Customer groups UI (connect to backend)** 🟡

### **Integration & Testing**
- [x] API endpoints tested
- [x] Multi-tenant isolation verified
- [x] Cash sales flow tested
- [x] Wholesale pricing logic tested
- [ ] **Payment gateway testing** 🔴
- [ ] **Receipt printing testing** 🔴
- [ ] **End-to-end testing** 🟡
- [ ] **Performance testing** 🟡
- [ ] **Security audit** 🟡

---

## 🚀 Wholesale & Retail MVP Launch Readiness: **85% Complete**

### **What's Working Now** ✅
- **Cash-only POS is fully operational** for wholesale and retail
- Complete sales flow from cart to receipt (cash only)
- Wholesale pricing automatically applied based on quantity
- Shift management and cash reconciliation
- Real-time inventory tracking (variation-based)
- Customer management with credit support
- Supplier management and auto-PO system
- Basic reporting (sales, products, cash)

### **What's Needed for Full MVP** 🔴
1. **Payment Gateway Integration** (2-3 weeks) - **CRITICAL**
   - Card payment processing
   - Mobile money integration
   - Payment confirmation flows

2. **Receipt Printing** (1-2 weeks) - **HIGH PRIORITY**
   - PDF generation
   - Thermal printer support
   - Email receipt option

3. **Split Payments** (3-5 days) - **MEDIUM PRIORITY**
   - Backend processing logic
   - Frontend integration

4. **Barcode Scanner** (3-5 days) - **MEDIUM PRIORITY**
   - Keyboard wedge handler
   - Auto-add to cart

5. **Price Lists & Customer Groups** (1 week) - **MEDIUM PRIORITY**
   - Backend API implementation
   - Frontend integration

**Estimated Time to Full Wholesale & Retail MVP: 4-6 weeks**

---

## 🔄 How to Update Restaurant & Bar When Wholesale/Retail is Running

### **Strategy: Feature Flags & Business Type Isolation**

Since Wholesale & Retail is the urgent client, we'll implement a **phased rollout** approach:

#### **1. Multi-Tenant Architecture Benefits**
✅ **Already Implemented:**
- Each business type (Wholesale/Retail, Restaurant, Bar) is completely isolated
- Tenant-based data separation ensures no cross-contamination
- Business type is stored in `Tenant.type` field
- All features are conditionally rendered based on `businessType`

#### **2. Feature Flag System** (Recommended Approach)

**Backend Feature Flags:**
```python
# backend/apps/tenants/models.py
class Tenant(models.Model):
    # ... existing fields ...
    feature_flags = models.JSONField(default=dict, help_text="Feature flags per business type")
    
    # Example:
    # {
    #   "wholesale_retail": {
    #     "card_payments": True,
    #     "receipt_printing": True,
    #     "barcode_scanner": True
    #   },
    #   "restaurant": {
    #     "card_payments": False,  # Not yet implemented
    #     "reservations": False
    #   },
    #   "bar": {
    #     "card_payments": False,
    #     "tab_management": False
    #   }
    # }
```

**Frontend Feature Flags:**
```typescript
// frontend/lib/utils/featureFlags.ts
export const getFeatureFlags = (businessType: BusinessType) => {
  const flags = {
    "wholesale and retail": {
      cardPayments: true,
      receiptPrinting: true,
      barcodeScanner: true,
      priceLists: true,
      customerGroups: true,
    },
    "restaurant": {
      cardPayments: false, // Will be enabled later
      reservations: false,
      // ... other restaurant features
    },
    "bar": {
      cardPayments: false, // Will be enabled later
      tabManagement: false,
      // ... other bar features
    },
  }
  return flags[businessType] || {}
}
```

#### **3. Gradual Feature Rollout**

**Phase 1: Wholesale & Retail (Weeks 1-6)**
- ✅ Focus all development on wholesale/retail features
- ✅ Test with wholesale/retail clients only
- ✅ Deploy to production for wholesale/retail tenants only

**Phase 2: Restaurant & Bar Updates (Weeks 7-10)**
- ✅ Enable payment gateway for restaurant/bar (reuse wholesale/retail code)
- ✅ Enable receipt printing for restaurant/bar (reuse wholesale/retail code)
- ✅ Add restaurant-specific features (reservations, etc.)
- ✅ Add bar-specific features (tab management, etc.)

#### **4. Code Reusability Strategy**

**Shared Components:**
- ✅ Payment processing logic (reusable across all business types)
- ✅ Receipt generation (reusable across all business types)
- ✅ Barcode scanner (reusable across all business types)
- ✅ Core POS functionality (already shared)

**Business-Specific Components:**
- ✅ Restaurant: Table management, KOT, Kitchen Display
- ✅ Bar: Drink menu, tab management (when implemented)
- ✅ Wholesale/Retail: Price lists, customer groups, wholesale pricing

#### **5. Database Migration Strategy**

**Safe Migration Approach:**
1. **Additive Changes Only**: New features add new tables/fields, don't modify existing ones
2. **Backward Compatible**: Old features continue working
3. **Feature Flags**: Control feature availability per business type
4. **Gradual Rollout**: Enable features for one business type at a time

**Example Migration:**
```python
# Migration: Add receipt model (affects all business types)
class Receipt(models.Model):
    sale = OneToOneField(Sale)  # Works for all business types
    # ... receipt fields ...

# Feature flag controls which business types can use it
if tenant.type == "wholesale and retail" and feature_flags.get("receipt_printing"):
    # Enable receipt printing
```

#### **6. Testing Strategy**

**Isolation Testing:**
- ✅ Test wholesale/retail features independently
- ✅ Test restaurant features independently
- ✅ Test bar features independently
- ✅ Verify no cross-contamination between business types

**Integration Testing:**
- ✅ Test shared features (payments, receipts) across all business types
- ✅ Verify feature flags work correctly
- ✅ Test multi-tenant isolation

---

## 📝 Implementation Guide

### **Step 1: Implement Wholesale/Retail Features (Weeks 1-6)**
Focus all development on:
1. Payment gateway integration
2. Receipt printing
3. Split payments
4. Barcode scanner
5. Price lists
6. Customer groups

### **Step 2: Enable for Restaurant/Bar (Weeks 7-10)**
1. Update feature flags to enable shared features for restaurant/bar
2. Test payment gateway with restaurant/bar
3. Test receipt printing with restaurant/bar
4. Add restaurant-specific features (reservations, etc.)
5. Add bar-specific features (tab management, etc.)

### **Step 3: Production Deployment**
1. Deploy wholesale/retail features to production
2. Monitor and fix any issues
3. Gradually enable features for restaurant/bar
4. Monitor and fix any issues

---

## 🎯 Success Metrics

### **Wholesale & Retail MVP Success Criteria**
- ✅ Cash payments working
- ✅ Product & inventory management
- ✅ Wholesale pricing working
- ✅ Sales transactions
- ✅ Shift management
- ✅ Basic reporting
- 🔴 Card payments (CRITICAL)
- 🔴 Receipt printing (CRITICAL)
- 🟡 Split payments (HIGH)
- 🟡 Barcode scanner (MEDIUM)
- 🟡 Price lists (MEDIUM)

---

## 📞 Support & Questions

For implementation questions or clarifications, refer to:
- `SQUARE_POS_MVP_AUDIT.md` - Complete feature audit
- `AUTO_PO_COMPLETE_IMPLEMENTATION.md` - Auto-PO system details
- `README.md` - General system documentation

---

**Last Updated**: 2024  
**Status**: Ready for Wholesale & Retail MVP Implementation  
**Next Steps**: Begin Phase 1 implementation (Payment Gateway)

