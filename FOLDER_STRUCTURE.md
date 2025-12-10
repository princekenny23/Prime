# PrimePOS - Complete Folder Structure

## 📁 Backend Structure (Django)

```
backend/
├── apps/                          # Django Applications
│   ├── accounts/                  # User Management
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py              # User model
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   └── migrations/
│   │       ├── __init__.py
│   │       └── 0001_initial.py
│   │
│   ├── admin/                     # SaaS Admin Management
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── urls.py
│   │   └── views.py
│   │
│   ├── customers/                 # Customer Management
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py              # Customer model
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   └── migrations/
│   │       ├── __init__.py
│   │       ├── 0001_initial.py
│   │       └── 0002_customer_credit_enabled_customer_credit_limit_and_more.py
│   │
│   ├── inventory/                 # Inventory Management
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py              # StockMovement, StockTake, StockTakeItem
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   └── migrations/
│   │       ├── __init__.py
│   │       └── 0001_initial.py
│   │
│   ├── outlets/                   # Outlet & Till Management
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py              # Outlet, Till models
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   └── migrations/
│   │       ├── __init__.py
│   │       ├── 0001_initial.py
│   │       ├── 0002_table.py
│   │       └── 0003_delete_table.py
│   │
│   ├── payments/                  # Payment Processing
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py              # Payment, PaymentMethod models
│   │   ├── serializers.py
│   │   ├── services.py            # PaymentService class
│   │   ├── urls.py
│   │   ├── views.py
│   │   └── migrations/
│   │       ├── __init__.py
│   │       └── 0001_initial.py
│   │
│   ├── products/                  # Products & Categories
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py              # Product, Category models (with wholesale pricing)
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── views.py               # ProductViewSet with bulk import/export
│   │   └── migrations/
│   │       ├── __init__.py
│   │       ├── 0001_initial.py
│   │       ├── 0002_make_sku_optional.py
│   │       ├── 0003_remove_sku_unique_together.py
│   │       ├── 0004_add_wholesale_fields.py
│   │       ├── 0005_rename_price_to_retail_price.py
│   │       └── 0006_alter_product_cost.py
│   │
│   ├── reports/                   # Reporting
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── urls.py
│   │   └── views.py
│   │
│   ├── restaurant/                # Restaurant-Specific Features
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py              # Table, KitchenOrderTicket models
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   └── migrations/
│   │       ├── __init__.py
│   │       ├── 0001_initial.py
│   │       └── 0002_kitchenorderticket.py
│   │
│   ├── sales/                     # Sales & Transactions
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py              # Sale, SaleItem models
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── views.py               # SaleViewSet with refund action
│   │   └── migrations/
│   │       ├── __init__.py
│   │       ├── 0001_initial.py
│   │       ├── 0002_sale_amount_paid_sale_due_date_sale_payment_status_and_more.py
│   │       └── 0003_sale_guests_sale_priority_sale_table_and_more.py
│   │
│   ├── shifts/                    # Shift & Cash Management
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py              # Shift, CashDrawerSession, CashMovement, 
│   │   │                          # CashupSettlement, PettyCashPayout
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── views.py               # Multiple ViewSets for cash management
│   │   ├── tests/
│   │   └── migrations/
│   │       ├── __init__.py
│   │       ├── 0001_initial.py
│   │       └── 0002_add_cash_management_models.py
│   │
│   ├── staff/                     # Staff Management
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py              # Staff model
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   └── migrations/
│   │       ├── __init__.py
│   │       └── 0001_initial.py
│   │
│   ├── suppliers/                 # Supplier Management
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py              # Supplier model
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   └── migrations/
│   │       ├── __init__.py
│   │       ├── 0001_initial.py
│   │       └── 0002_supplier_state_supplier_zip_code.py
│   │
│   └── tenants/                   # Multi-Tenancy Core
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── authentication.py     # JWT Authentication
│       ├── middleware.py          # TenantMiddleware
│       ├── models.py              # Tenant model
│       ├── permissions.py         # TenantFilterMixin, permissions
│       ├── serializers.py
│       ├── urls.py
│       ├── views.py
│       └── migrations/
│           ├── __init__.py
│           ├── 0001_initial.py
│           ├── 0002_make_sku_optional.py
│           └── 0003_alter_tenant_type.py
│
├── primepos/                      # Django Project Settings
│   ├── __init__.py
│   ├── api_root.py
│   ├── asgi.py
│   ├── urls.py                    # Main URL routing
│   ├── wsgi.py
│   └── settings/                  # Environment-specific settings
│       ├── __init__.py
│       ├── base.py                # Base settings
│       ├── development.py         # Development settings
│       └── production.py          # Production settings
│
├── env/                           # Python Virtual Environment
├── manage.py
├── requirements.txt
├── API_TEST_SCRIPT.py
├── check_payment_tables.py
└── make_saas_admin.py
```

## 📁 Frontend Structure (Next.js)

```
frontend/
├── app/                           # Next.js App Router
│   ├── about/
│   ├── admin/                     # SaaS Admin Pages
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── billing/
│   │   │   └── page.tsx
│   │   ├── page.tsx               # Admin dashboard
│   │   ├── plans/
│   │   │   └── page.tsx
│   │   ├── support-tickets/
│   │   │   └── page.tsx
│   │   ├── tenants/
│   │   │   └── page.tsx
│   │   └── users/
│   │       └── page.tsx
│   │
│   ├── auth/                      # Authentication Pages
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   └── verify-email/
│   │       └── page.tsx
│   │
│   ├── contact/
│   │
│   ├── dashboard/                 # Main Dashboard Pages
│   │   ├── activity-log/
│   │   │   └── page.tsx
│   │   ├── attendance/
│   │   │   └── page.tsx
│   │   │
│   │   ├── bar/                   # Bar-Specific Pages
│   │   │   ├── drinks/
│   │   │   │   └── page.tsx
│   │   │   ├── expenses/
│   │   │   │   └── page.tsx
│   │   │   ├── page.tsx           # Bar dashboard
│   │   │   └── tabs/
│   │   │       └── page.tsx
│   │   │
│   │   ├── cash-management/       # Cash Management
│   │   │   └── page.tsx
│   │   │
│   │   ├── crm/
│   │   │   └── page.tsx
│   │   │
│   │   ├── customers/             # Customer Management
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── discounts/             # Universal: Discounts
│   │   │   └── page.tsx
│   │   │
│   │   ├── inventory/             # Inventory Management
│   │   │   ├── page.tsx
│   │   │   ├── receiving/
│   │   │   │   └── page.tsx
│   │   │   ├── stock-adjustments/
│   │   │   │   └── page.tsx
│   │   │   ├── stock-taking/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   └── transfers/
│   │   │       └── page.tsx
│   │   │
│   │   ├── loyalty/               # Universal: Loyalty Programs
│   │   │   └── page.tsx
│   │   │
│   │   ├── notifications/
│   │   │   └── page.tsx
│   │   │
│   │   ├── office/                # Office Management
│   │   │   ├── accounts/
│   │   │   │   └── page.tsx
│   │   │   ├── crm/
│   │   │   │   ├── credits/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── payments/
│   │   │   │       └── page.tsx
│   │   │   ├── page.tsx
│   │   │   ├── payments/
│   │   │   │   └── page.tsx
│   │   │   ├── reports/
│   │   │   │   ├── customers/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── expenses/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── products/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── profit-loss/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── sales/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── stock-movement/
│   │   │   │       └── page.tsx
│   │   │   ├── staff/
│   │   │   │   └── page.tsx
│   │   │   └── suppliers/
│   │   │       └── page.tsx
│   │   │
│   │   ├── outlets/                # Outlet Management
│   │   │   ├── [id]/
│   │   │   │   ├── analytics/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │   ├── page.tsx
│   │   │   └── tills/
│   │   │       └── page.tsx
│   │   │
│   │   ├── page.tsx               # Universal Dashboard (redirects to type-specific)
│   │   │
│   │   ├── pos/                   # POS Terminal
│   │   │   ├── page.tsx
│   │   │   └── start-shift/
│   │   │       └── page.tsx
│   │   │
│   │   ├── products/              # Product Management
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   ├── categories/
│   │   │   │   └── page.tsx
│   │   │   ├── items/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── purchase-orders/       # Universal: Purchase Orders
│   │   │   └── page.tsx
│   │   │
│   │   ├── reports/               # Reports
│   │   │   ├── customers/
│   │   │   │   └── page.tsx
│   │   │   ├── expenses/
│   │   │   │   └── page.tsx
│   │   │   ├── page.tsx
│   │   │   ├── products/
│   │   │   │   └── page.tsx
│   │   │   ├── profit-loss/
│   │   │   │   └── page.tsx
│   │   │   ├── sales/
│   │   │   │   └── page.tsx
│   │   │   └── stock-movement/
│   │   │       └── page.tsx
│   │   │
│   │   ├── restaurant/           # Restaurant-Specific Pages
│   │   │   ├── kitchen/
│   │   │   │   └── page.tsx
│   │   │   ├── menu/
│   │   │   │   └── page.tsx
│   │   │   ├── orders/
│   │   │   │   └── page.tsx
│   │   │   ├── page.tsx           # Restaurant dashboard
│   │   │   ├── recipes/
│   │   │   │   └── page.tsx
│   │   │   └── tables/
│   │   │       └── page.tsx
│   │   │
│   │   ├── retail/                # Retail/Wholesale-Specific Pages
│   │   │   ├── customer-groups/
│   │   │   │   └── page.tsx       # Wholesale customer groups
│   │   │   ├── discounts/         # (Empty - moved to universal)
│   │   │   ├── loyalty/           # (Empty - moved to universal)
│   │   │   ├── page.tsx           # Retail dashboard
│   │   │   ├── price-lists/
│   │   │   │   └── page.tsx       # Wholesale price lists
│   │   │   ├── purchase-orders/   # (Empty - moved to universal)
│   │   │   ├── returns/           # (Empty - moved to universal)
│   │   │   └── wholesale/
│   │   │       └── page.tsx       # Wholesale pricing management
│   │   │
│   │   ├── returns/               # Universal: Returns & Refunds
│   │   │   └── page.tsx
│   │   │
│   │   ├── roles/
│   │   │   └── page.tsx
│   │   │
│   │   ├── sales/
│   │   │   └── page.tsx
│   │   │
│   │   ├── settings/              # Settings
│   │   │   ├── page.tsx
│   │   │   └── payment-methods/
│   │   │       └── page.tsx
│   │   │
│   │   ├── shift-history/
│   │   │   └── page.tsx
│   │   │
│   │   ├── staff/
│   │   │   └── page.tsx
│   │   │
│   │   └── suppliers/             # Universal: Suppliers
│   │       └── page.tsx
│   │
│   ├── onboarding/                # Onboarding Flow
│   │   ├── add-first-user/
│   │   │   └── page.tsx
│   │   ├── page.tsx
│   │   ├── setup-business/
│   │   │   └── page.tsx
│   │   └── setup-outlet/
│   │       └── page.tsx
│   │
│   ├── pos/                       # POS Terminal Pages
│   │   ├── bar/
│   │   │   └── page.tsx
│   │   ├── restaurant/
│   │   │   └── page.tsx
│   │   └── retail/
│   │       └── page.tsx            # Unified POS (retail + wholesale)
│   │
│   ├── pricing/
│   ├── select-business/
│   ├── globals.css
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page
│   └── providers.tsx              # Context providers
│
├── components/                     # React Components
│   ├── dashboard/                 # Dashboard components
│   ├── layouts/                   # Layout components
│   │   └── dashboard-layout.tsx
│   ├── modals/                    # Modal components
│   │   ├── add-edit-customer-modal.tsx
│   │   ├── add-edit-product-modal.tsx
│   │   ├── add-supplier-modal.tsx
│   │   ├── cashup-settlement-modal.tsx
│   │   ├── close-cash-drawer-modal.tsx
│   │   ├── customer-select-modal.tsx
│   │   ├── discount-modal.tsx
│   │   ├── open-cash-drawer-modal.tsx
│   │   ├── payment-modal.tsx
│   │   └── receipt-preview-modal.tsx
│   ├── pos/                       # POS components
│   │   ├── cart-panel.tsx
│   │   ├── unified-pos.tsx        # Unified POS for retail/wholesale
│   │   └── ...
│   └── ui/                        # UI components (shadcn/ui)
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── table.tsx
│       └── ...
│
├── lib/                           # Utilities & Services
│   ├── api.ts                     # API configuration
│   ├── services/                  # API service functions
│   │   ├── cashService.ts
│   │   ├── customerService.ts
│   │   ├── productService.ts
│   │   ├── saleService.ts
│   │   └── ...
│   ├── types/                     # TypeScript types
│   │   └── mock-data.ts
│   └── utils/                     # Utility functions
│       ├── dashboard-stats.ts
│       └── sidebar.ts             # Navigation configuration
│
├── stores/                        # Zustand State Management
│   ├── authStore.ts
│   ├── businessStore.ts
│   └── posStore.ts
│
├── contexts/                      # React Contexts
│   ├── tenant-context.tsx
│   └── shift-context.tsx
│
├── public/                        # Static assets
├── next.config.js
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## 📊 Key Features by Location

### Universal Features (All Business Types)
- ✅ Returns & Refunds: `/dashboard/returns`
- ✅ Discounts: `/dashboard/discounts`
- ✅ Loyalty Programs: `/dashboard/loyalty`
- ✅ Purchase Orders: `/dashboard/purchase-orders`
- ✅ Suppliers: `/dashboard/suppliers`
- ✅ Products, Inventory, Sales, Customers, etc.

### Retail/Wholesale-Specific Features
- ✅ Wholesale Pricing: `/dashboard/retail/wholesale`
- ✅ Customer Groups: `/dashboard/retail/customer-groups`
- ✅ Price Lists: `/dashboard/retail/price-lists`

### Restaurant-Specific Features
- ✅ Kitchen Display: `/dashboard/restaurant/kitchen`
- ✅ Menu Builder: `/dashboard/restaurant/menu`
- ✅ Orders: `/dashboard/restaurant/orders`
- ✅ Tables: `/dashboard/restaurant/tables`
- ✅ Recipes: `/dashboard/restaurant/recipes`

### Bar-Specific Features
- ✅ Drinks Menu: `/dashboard/bar/drinks`
- ✅ Bar Tabs: `/dashboard/bar/tabs`
- ✅ Expenses: `/dashboard/bar/expenses`

## 🔑 Backend API Structure

All APIs follow RESTful conventions:
- `/api/v1/accounts/` - User management
- `/api/v1/tenants/` - Tenant management
- `/api/v1/products/` - Products & categories
- `/api/v1/sales/` - Sales & transactions
- `/api/v1/customers/` - Customer management
- `/api/v1/inventory/` - Inventory operations
- `/api/v1/payments/` - Payment processing
- `/api/v1/shifts/` - Shifts & cash management
- `/api/v1/restaurant/` - Restaurant features
- `/api/v1/suppliers/` - Supplier management
- `/api/v1/reports/` - Reporting endpoints

