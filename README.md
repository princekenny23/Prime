# PrimePOS - Multi-Tenant Point of Sale System

A comprehensive, professional-grade SaaS Point of Sale (POS) platform designed for multi-tenant businesses across various industries (Retail, Restaurant, Bar, Wholesale, etc.). Built with Django REST Framework backend and Next.js frontend.

## 🚀 System Overview

PrimePOS is a full-featured POS system that enables businesses to:
- Manage multiple outlets/branches
- Process sales with multiple payment methods
- Track inventory in real-time
- Manage customer relationships and credit accounts
- Generate comprehensive reports and analytics
- Handle staff, roles, and permissions
- Support industry-specific workflows

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Features](#features)
- [System Flow](#system-flow)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Development Status](#development-status)
- [Remaining Features](#remaining-features)

## 🛠 Tech Stack

### Backend
- **Framework**: Django 4.2+
- **API**: Django REST Framework
- **Database**: PostgreSQL 15+
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Filtering**: Django Filter
- **File Processing**: Pandas, Openpyxl (for Excel/CSV imports)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: Zustand
- **Icons**: Lucide React
- **Charts**: Recharts

## 🏗 System Architecture

### Multi-Tenant Architecture
- **Tenant Isolation**: All data is automatically filtered by tenant
- **Outlet Management**: Each tenant can have multiple outlets
- **User Roles**: SaaS Admin, Admin, Manager, Cashier, Staff
- **Permission System**: Role-based access control (RBAC)

### Data Flow
```
Frontend (Next.js) 
    ↓ HTTP/REST API
Backend (Django REST Framework)
    ↓ ORM Queries
PostgreSQL Database
```

## ✨ Features

### ✅ Completed Features

#### 1. Authentication & Onboarding
- **User Authentication**: Login, Registration, Password Reset, Email Verification
- **JWT Token Management**: Access and refresh tokens with automatic renewal
- **Multi-Step Onboarding**: Business Setup → Outlet Setup → Add First User
- **Tenant Creation**: Automatic tenant assignment during onboarding

#### 2. Multi-Tenant Management
- **Tenant Context**: Automatic tenant filtering for all data
- **Outlet Management**: Create, update, delete outlets per tenant
- **Outlet Switching**: Seamless switching between outlets
- **SaaS Admin Panel**: Platform-level tenant management

#### 3. Product Management
- **Product CRUD**: Create, read, update, delete products
- **Category Management**: Organize products by categories
- **SKU Auto-Generation**: Automatic SKU generation per tenant
- **Bulk Import**: Excel/CSV import with auto-category creation
- **Stock Tracking**: Real-time stock levels with low stock alerts
- **Product Status**: In Stock, Low Stock, Out of Stock indicators

#### 4. Inventory Management
- **Stock Adjustments**: Manual stock increases/decreases with reason tracking
- **Stock Transfers**: Transfer inventory between outlets (bulk support)
- **Stock Taking**: Physical inventory counting with progress tracking
  - Search and filter items
  - Quick count adjustments
  - Auto-complete functionality
  - Multiple users can join sessions
- **Stock Receiving**: Record incoming inventory from suppliers (bulk support)
- **Stock Movements**: Complete audit trail of all inventory changes
- **History Tracking**: View adjustment, transfer, and receiving history

#### 5. Sales & POS
- **POS Terminal**: Full-screen sales interface
- **Product Grid**: Tile-based product selection
- **Cart Management**: Add, remove, update quantities
- **Payment Methods**: Cash, Card, Mobile Money, Credit
- **Receipt Generation**: Automatic receipt numbers
- **Sale History**: View all transactions with filters
- **Atomic Transactions**: Stock deduction happens atomically with sale creation

#### 6. Customer Relationship Management (CRM)
- **Customer Management**: Full CRUD operations
- **Credit System**: 
  - Enable/disable credit per customer
  - Set credit limits and payment terms (Net 15/30/60/90)
  - Track outstanding balances
  - Automatic due date calculation
  - Credit status management (Active, Suspended, Closed)
- **Payment Collection**: 
  - Record payments against invoices
  - FIFO payment allocation (oldest invoices first)
  - Payment history tracking
  - Overdue invoice detection
- **Loyalty Points**: Track and adjust customer loyalty points
- **Customer Analytics**: Total spent, visit history, purchase patterns

#### 7. Credit & Accounts Receivable
- **Credit Sales**: Process sales on credit with automatic validation
- **Credit Limits**: Enforce credit limits before allowing credit sales
- **Payment Terms**: Configurable payment terms per customer
- **Outstanding Balance Tracking**: Real-time balance calculations
- **Payment Recording**: Record payments with multiple payment methods
- **Invoice Management**: Track unpaid, partially paid, and paid invoices
- **Overdue Detection**: Automatic overdue status for past-due invoices
- **Credit Reports**: Credit summary, aging analysis, overdue reports

#### 8. Staff Management
- **Staff CRUD**: Create, read, update, delete staff members
- **Role Management**: Create custom roles with permission matrix
- **Permission System**: Granular permissions (Sales, Inventory, Products, Customers, Reports, Staff, Settings)
- **Attendance Tracking**: Check-in/check-out functionality
- **Outlet Assignment**: Assign staff to specific outlets
- **Password Management**: Reset passwords for staff accounts

#### 9. Supplier Management
- **Supplier CRUD**: Complete supplier information management
- **Contact Information**: Name, email, phone, address
- **Payment Terms**: Track supplier payment terms
- **Supplier History**: View purchase history from suppliers

#### 10. User Account Management
- **User CRUD**: Create, read, update, delete user accounts
- **Role Assignment**: Assign roles to users
- **Business Assignment**: Link users to tenants
- **Account Status**: Active/inactive status management

#### 11. Reports & Analytics
- **Sales Reports**: Sales performance, trends, top products
- **Product Reports**: Product performance, category breakdown
- **Customer Reports**: Customer segments, top customers
- **Stock Movement Reports**: Inventory movements, stock in/out
- **Export Functionality**: PDF and CSV export
- **Date Range Filtering**: Custom date ranges for all reports

#### 12. Office Management
- **Office Landing Page**: Central hub for office functions
- **Accounts**: User account management
- **Suppliers**: Supplier relationship management
- **CRM**: Customer relationship management with credit features
- **Staff**: Staff and role management
- **Reports**: Comprehensive reporting system

### 🚧 In Progress / Partially Complete

#### 1. Shift Management
- **Backend Models**: Shift model exists
- **Frontend**: Basic shift context created
- **Status**: Needs full implementation (start shift, close shift, shift history)

#### 2. Reports
- **Backend**: Report endpoints exist
- **Frontend**: Report pages created with UI
- **Status**: Needs data integration and chart implementation

#### 3. POS Integration
- **Basic POS**: Product selection and cart working
- **Credit Sales**: Backend ready, frontend integration needed
- **Receipt Printing**: UI ready, needs printer integration
- **Status**: Core functionality working, enhancements needed

## 🔄 System Flow

### 1. User Registration & Onboarding Flow
```
1. User registers → Creates account
2. Onboarding Step 1: Business Setup
   - Business name, type, currency
   - Contact information
3. Onboarding Step 2: Outlet Setup
   - Outlet name, address
   - Creates first outlet
4. Onboarding Step 3: Add First User
   - User details, role assignment
   - Completes onboarding
5. Redirect to Dashboard
```

### 2. Product Management Flow
```
1. Create Categories (optional)
   - Category name, description
2. Add Products
   - Manual entry OR
   - Bulk import (Excel/CSV)
   - Auto-generates SKU if not provided
   - Links to category
3. Manage Stock
   - View stock levels
   - Adjust stock (increase/decrease)
   - Transfer between outlets
   - Receive from suppliers
```

### 3. Sales Flow
```
1. Start Shift (if required)
   - Select outlet, till, date
   - Add opening cash balance
2. POS Terminal
   - Select products
   - Add to cart
   - Apply discounts (optional)
   - Select customer (optional)
3. Payment
   - Choose payment method:
     - Cash: Enter amount, calculate change
     - Card: Process card payment
     - Mobile Money: Process mobile payment
     - Credit: Validate credit limit, create credit sale
4. Complete Sale
   - Stock automatically deducted
   - Receipt generated
   - Customer updated (if selected)
   - Sale recorded
```

### 4. Credit Sales Flow
```
1. Customer Selection
   - System checks:
     - Credit enabled?
     - Current outstanding balance
     - Available credit
     - Credit status
2. Credit Validation
   - Sale total + outstanding ≤ credit limit?
   - If yes: Proceed
   - If no: Block sale or require override
3. Create Credit Sale
   - Payment method: 'credit'
   - Status: 'completed'
   - Payment status: 'unpaid'
   - Due date: created_at + payment_terms_days
   - Outstanding balance increases
4. Payment Collection (Later)
   - Customer comes to pay
   - View unpaid invoices
   - Record payment
   - Allocate to oldest invoices (FIFO)
   - Update payment status
   - Outstanding balance decreases
```

### 5. Inventory Management Flow
```
1. Stock Adjustment
   - Select product(s) - bulk support
   - Choose adjustment type (increase/decrease)
   - Enter quantity
   - Add reason/notes
   - Stock updated, movement recorded

2. Stock Transfer
   - Select product(s) - bulk support
   - Choose source and destination outlets
   - Enter quantity
   - Transfer recorded, stock updated

3. Stock Taking
   - Start stock take session
   - System auto-creates items for all products
   - Count items (search, filter, quick adjust)
   - Save progress
   - Complete stock take
   - System applies adjustments automatically

4. Stock Receiving
   - Select supplier
   - Add product(s) - bulk support
   - Enter quantities and costs
   - Select outlet
   - Record receiving
   - Stock updated, movement recorded
```

### 6. Customer Credit Management Flow
```
1. Enable Credit for Customer
   - Set credit limit
   - Set payment terms (Net 30, etc.)
   - Set credit status (Active)
   
2. Credit Sale Processing
   - Customer selected at POS
   - System validates credit
   - Sale created with credit payment method
   - Due date calculated
   
3. Payment Collection
   - Access Payment Collection page
   - Select customer
   - View unpaid invoices
   - Record payment
   - System allocates payment (FIFO)
   - Invoices updated
   
4. Credit Monitoring
   - View credit summary
   - Check outstanding balances
   - Identify overdue invoices
   - Manage credit status
```

## 📦 Installation & Setup

### Backend Setup

1. **Navigate to backend directory**:
```bash
cd backend
```

2. **Create virtual environment**:
```bash
python -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**:
Create a `.env` file in the `backend` directory:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=primepos_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

5. **Create database**:
```bash
createdb primepos_db
```

6. **Run migrations**:
```bash
python manage.py migrate
```

7. **Create superuser**:
```bash
python manage.py createsuperuser
```

8. **Run development server**:
```bash
python manage.py runserver
```

Backend API will be available at `http://localhost:8000/api/v1/`

### Frontend Setup

1. **Navigate to frontend directory**:
```bash
cd frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

4. **Run development server**:
```bash
npm run dev
```

Frontend will be available at `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/login/` - User login
- `POST /api/v1/auth/register/` - User registration
- `POST /api/v1/auth/refresh/` - Refresh access token
- `GET /api/v1/auth/me/` - Get current user

### Tenant Endpoints
- `GET /api/v1/tenants/` - List tenants
- `GET /api/v1/tenants/{id}/` - Get tenant details
- `POST /api/v1/tenants/` - Create tenant
- `PUT /api/v1/tenants/{id}/` - Update tenant
- `GET /api/v1/tenants/current/` - Get current user's tenant

### Product Endpoints
- `GET /api/v1/products/` - List products (filtered by tenant)
- `GET /api/v1/products/{id}/` - Get product
- `POST /api/v1/products/` - Create product
- `PUT /api/v1/products/{id}/` - Update product
- `DELETE /api/v1/products/{id}/` - Delete product
- `POST /api/v1/products/bulk-import/` - Bulk import products (Excel/CSV)
- `POST /api/v1/products/bulk-delete/` - Bulk delete products
- `GET /api/v1/products/low_stock/` - Get low stock products
- `GET /api/v1/products/generate-sku-preview/` - Preview auto-generated SKU

### Category Endpoints
- `GET /api/v1/categories/` - List categories
- `POST /api/v1/categories/` - Create category
- `PUT /api/v1/categories/{id}/` - Update category
- `DELETE /api/v1/categories/{id}/` - Delete category

### Sales Endpoints
- `GET /api/v1/sales/` - List sales
- `GET /api/v1/sales/{id}/` - Get sale details
- `POST /api/v1/sales/` - Create sale (with automatic stock deduction)
- `GET /api/v1/sales/?payment_status=unpaid` - Get unpaid credit sales
- `GET /api/v1/sales/?payment_status=overdue` - Get overdue credit sales

### Customer Endpoints
- `GET /api/v1/customers/` - List customers
- `GET /api/v1/customers/{id}/` - Get customer
- `POST /api/v1/customers/` - Create customer
- `PUT /api/v1/customers/{id}/` - Update customer
- `POST /api/v1/customers/{id}/adjust_points/` - Adjust loyalty points
- `GET /api/v1/customers/{id}/credit_summary/` - Get credit summary
- `PATCH /api/v1/customers/{id}/adjust_credit/` - Adjust credit settings

### Credit Payment Endpoints
- `GET /api/v1/credit-payments/` - List credit payments
- `POST /api/v1/credit-payments/` - Record payment
- `GET /api/v1/credit-payments/{id}/` - Get payment details
- `GET /api/v1/credit-payments/?customer={id}` - Get customer payments
- `GET /api/v1/credit-payments/?sale={id}` - Get sale payments

### Inventory Endpoints
- `POST /api/v1/inventory/adjust/` - Stock adjustment (bulk support)
- `POST /api/v1/inventory/transfer/` - Transfer stock (bulk support)
- `POST /api/v1/inventory/receive/` - Receive stock (bulk support)
- `GET /api/v1/inventory/movements/` - Get stock movements
- `GET /api/v1/inventory/stock-take/` - List stock takes
- `POST /api/v1/inventory/stock-take/` - Start stock take
- `GET /api/v1/inventory/stock-take/{id}/` - Get stock take details
- `PATCH /api/v1/inventory/stock-take/{id}/items/{item_id}/` - Update item count
- `POST /api/v1/inventory/stock-take/{id}/complete/` - Complete stock take
- `POST /api/v1/inventory/stock-take/{id}/auto-complete/` - Auto-complete stock take

### Outlet Endpoints
- `GET /api/v1/outlets/` - List outlets
- `GET /api/v1/outlets/{id}/` - Get outlet
- `POST /api/v1/outlets/` - Create outlet
- `PUT /api/v1/outlets/{id}/` - Update outlet

### Staff Endpoints
- `GET /api/v1/staff/` - List staff
- `GET /api/v1/staff/{id}/` - Get staff
- `POST /api/v1/staff/` - Create staff
- `PUT /api/v1/staff/{id}/` - Update staff
- `DELETE /api/v1/staff/{id}/` - Delete staff

### Supplier Endpoints
- `GET /api/v1/suppliers/` - List suppliers
- `GET /api/v1/suppliers/{id}/` - Get supplier
- `POST /api/v1/suppliers/` - Create supplier
- `PUT /api/v1/suppliers/{id}/` - Update supplier
- `DELETE /api/v1/suppliers/{id}/` - Delete supplier

### User Management Endpoints
- `GET /api/v1/auth/users/?tenant={id}` - List users (via tenant endpoint)
- `POST /api/v1/auth/users/create/` - Create user
- `PUT /api/v1/auth/users/{id}/` - Update user
- `DELETE /api/v1/auth/users/{id}/delete/` - Delete user

## 🗄 Database Models

### Core Models
- **Tenant**: Business/tenant information
- **Outlet**: Business locations/branches
- **User**: Extended Django user with tenant relationship
- **Product**: Products with SKU, pricing, stock
- **Category**: Product categories
- **Sale**: Transactions with payment method and status
- **SaleItem**: Transaction line items
- **Customer**: CRM data with credit fields
- **CreditPayment**: Payments against credit sales
- **Staff**: Staff members with roles
- **Role**: Permission roles
- **Supplier**: Supplier/vendor information
- **StockMovement**: Inventory movement tracking
- **StockTake**: Stock counting sessions
- **StockTakeItem**: Individual items in stock take

### Credit System Models
- **Customer.credit_enabled**: Boolean flag
- **Customer.credit_limit**: Decimal field
- **Customer.payment_terms_days**: Integer (15, 30, 60, 90)
- **Customer.credit_status**: CharField (active, suspended, closed)
- **Sale.due_date**: DateTimeField (for credit sales)
- **Sale.amount_paid**: DecimalField (tracking payments)
- **Sale.payment_status**: CharField (unpaid, partially_paid, paid, overdue)
- **CreditPayment**: Records individual payments

## 📊 Development Status

### ✅ Phase 1: Core System (Complete)
- Multi-tenant architecture
- Authentication & authorization
- Product management
- Basic inventory tracking
- Sales processing
- Customer management

### ✅ Phase 2: Advanced Inventory (Complete)
- Stock adjustments (bulk)
- Stock transfers (bulk)
- Stock taking with progress tracking
- Stock receiving (bulk)
- Movement history

### ✅ Phase 3: Credit System (Complete)
- Credit customer management
- Credit sales processing
- Payment collection
- Outstanding balance tracking
- Overdue detection
- Credit reports

### 🚧 Phase 4: Enhanced Features (In Progress)
- Shift management (backend ready, frontend needs work)
- Advanced reporting (UI ready, needs data integration)
- Receipt printing (UI ready, needs printer integration)
- Email notifications (planned)
- SMS notifications (planned)

## 🎯 Remaining Features & Functions

### High Priority

1. **Shift Management**
   - [ ] Complete shift start/close flow
   - [ ] Shift history page with analytics
   - [ ] Shift reports (sales per shift, cash reconciliation)
   - [ ] Till management integration

2. **POS Enhancements**
   - [ ] Receipt printing (thermal printer integration)
   - [ ] Barcode scanning support
   - [ ] Keyboard shortcuts for faster operations
   - [ ] Hold/recall sales functionality
   - [ ] Split payments (multiple payment methods per sale)

3. **Reporting System**
   - [ ] Complete data integration for all reports
   - [ ] Interactive charts (Recharts integration)
   - [ ] Export to PDF with proper formatting
   - [ ] Scheduled report generation
   - [ ] Email report delivery

4. **Credit System Enhancements**
   - [ ] Aging analysis report (0-30, 31-60, 61-90, 90+ days)
   - [ ] Payment reminders (email/SMS)
   - [ ] Credit score/rating system
   - [ ] Bad debt write-off functionality
   - [ ] Payment plan support

### Medium Priority

5. **Customer Features**
   - [ ] Customer portal (view invoices, make payments)
   - [ ] Loyalty program enhancements
   - [ ] Customer segmentation
   - [ ] Marketing campaigns

6. **Inventory Enhancements**
   - [ ] Reorder point automation
   - [ ] Purchase order generation
   - [ ] Supplier price comparison
   - [ ] Cost tracking and analysis

7. **Staff Features**
   - [ ] Attendance tracking (check-in/check-out)
   - [ ] Performance metrics
   - [ ] Commission calculation
   - [ ] Schedule management

8. **Settings & Configuration**
   - [ ] Receipt template customization
   - [ ] Tax configuration (multiple tax rates)
   - [ ] Payment gateway integration
   - [ ] Printer configuration
   - [ ] Email/SMS provider setup

### Low Priority / Future Enhancements

9. **Advanced Features**
   - [ ] Multi-currency support
   - [ ] Multi-language support
   - [ ] Mobile app (React Native)
   - [ ] Offline mode support
   - [ ] Data synchronization

10. **Integrations**
    - [ ] Accounting software (QuickBooks, Xero)
    - [ ] Payment gateways (Stripe, PayPal)
    - [ ] E-commerce platforms
    - [ ] Shipping providers
    - [ ] Tax compliance systems

11. **Analytics & AI**
    - [ ] Predictive analytics
    - [ ] Sales forecasting
    - [ ] Inventory optimization
    - [ ] Customer behavior analysis
    - [ ] Automated recommendations

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Tenant Isolation**: Automatic data filtering by tenant
- **Role-Based Access Control**: Granular permission system
- **Password Hashing**: Django's built-in password hashing
- **CORS Protection**: Configured CORS for API security
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Django ORM prevents SQL injection
- **XSS Protection**: React automatically escapes content

## 🧪 Testing

### Backend Testing
```bash
cd backend
python manage.py test
```

### Frontend Testing
```bash
cd frontend
npm run test
```

## 📝 Code Structure

### Backend Structure
```
backend/
├── apps/
│   ├── accounts/        # User authentication
│   ├── tenants/         # Multi-tenant management
│   ├── outlets/         # Outlet management
│   ├── products/        # Product & category management
│   ├── sales/           # Sales & transactions
│   ├── customers/       # CRM & credit system
│   ├── inventory/       # Inventory management
│   ├── staff/           # Staff & roles
│   ├── suppliers/       # Supplier management
│   └── shifts/          # Shift management
├── primepos/
│   ├── settings/        # Django settings
│   └── urls.py          # URL routing
└── manage.py
```

### Frontend Structure
```
frontend/
├── app/
│   ├── auth/            # Authentication pages
│   ├── onboarding/      # Onboarding flow
│   ├── dashboard/       # Main application
│   │   ├── products/    # Product management
│   │   ├── inventory/   # Inventory management
│   │   ├── office/      # Office management
│   │   │   ├── crm/     # CRM & credit
│   │   │   │   ├── credits/    # Credit management
│   │   │   │   └── payments/  # Payment collection
│   │   │   ├── staff/   # Staff management
│   │   │   ├── suppliers/ # Supplier management
│   │   │   └── accounts/  # User accounts
│   │   └── ...
│   └── ...
├── components/
│   ├── modals/          # Modal components
│   ├── ui/              # UI components
│   └── ...
├── lib/
│   ├── services/        # API service functions
│   ├── utils/           # Utility functions
│   └── ...
└── stores/              # Zustand state management
```

## 🤝 Contributing

This is a private project. For contributions, please contact the project maintainer.

## 📄 License

Copyright © 2024 PrimePOS. All rights reserved.

## 📞 Support

For support and questions, please contact the development team.

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Active Development

