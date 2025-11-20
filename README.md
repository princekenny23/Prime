# PrimePOS - Multi-Business Point of Sale Platform

A modern, scalable SaaS frontend for a multi-tenant Point-of-Sale platform that can serve any business type (retail, restaurant, pharmacy, wholesale, bar, etc.).

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Icons**: Lucide React
- **Charts**: Recharts

## Project Structure

```
primepos/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── verify-email/
│   ├── onboarding/        # Onboarding flow
│   │   ├── setup-business/
│   │   ├── setup-outlet/
│   │   └── add-first-user/
│   ├── dashboard/         # Dashboard and module pages
│   │   ├── pos/           # POS Terminal (Sales Screen)
│   │   ├── sales/
│   │   ├── products/      # Products management
│   │   │   ├── categories/
│   │   │   └── [id]/      # Product detail page
│   │   ├── inventory/     # Inventory management
│   │   │   ├── stock-adjustments/
│   │   │   ├── transfers/
│   │   │   └── receiving/
│   │   ├── suppliers/     # Supplier management
│   │   ├── customers/     # Customers (CRM)
│   │   │   └── [id]/      # Customer detail page
│   │   ├── staff/         # Staff management
│   │   ├── roles/          # Roles & permissions
│   │   ├── attendance/     # Attendance tracking
│   │   ├── outlets/       # Outlet management
│   │   │   ├── [id]/      # Dynamic outlet pages
│   │   │   │   ├── settings/
│   │   │   │   └── analytics/
│   │   │   └── page.tsx    # Outlet list
│   │   ├── reports/        # Reports & Analytics
│   │   │   ├── sales/
│   │   │   ├── products/
│   │   │   ├── customers/
│   │   │   ├── expenses/
│   │   │   ├── profit-loss/
│   │   │   └── stock-movement/
│   │   ├── notifications/  # Notifications page
│   │   ├── activity-log/   # Activity log page
│   │   ├── retail/        # Retail Store Module (Industry-Specific)
│   │   │   ├── returns/
│   │   │   ├── discounts/
│   │   │   └── loyalty/
│   │   ├── restaurant/   # Restaurant Module (Industry-Specific)
│   │   │   ├── tables/
│   │   │   ├── orders/
│   │   │   ├── kitchen/
│   │   │   ├── menu/
│   │   │   └── recipes/
│   │   ├── bar/          # Bar Module (Industry-Specific)
│   │   │   ├── drinks/
│   │   │   ├── tabs/
│   │   │   └── expenses/
│   │   ├── crm/
│   ├── admin/            # System Admin / Super Admin (SaaS Owner)
│   │   ├── tenants/
│   │   ├── billing/
│   │   ├── support-tickets/
│   │   ├── analytics/
│   │   ├── plans/
│   │   └── users/
│   ├── crm/
│   │   └── settings/
│   ├── providers.tsx      # Context providers wrapper
│   ├── pricing/           # Public marketing pages
│   ├── about/
│   ├── contact/
│   ├── layout.tsx         # Root layout with Toaster
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles with design tokens
├── components/
│   ├── layouts/           # Layout components
│   │   ├── auth-layout.tsx
│   │   ├── dashboard-layout.tsx
│   │   └── public-layout.tsx
│   ├── outlets/          # Outlet-specific components
│   │   └── outlet-list.tsx
│   ├── modals/           # Reusable modal components
│   │   ├── terms-conditions-modal.tsx
│   │   ├── invite-staff-modal.tsx
│   │   ├── success-modal.tsx
│   │   ├── view-sale-details-modal.tsx
│   │   ├── quick-add-sale-modal.tsx
│   │   ├── customize-dashboard-modal.tsx
│   │   ├── add-edit-product-modal.tsx
│   │   ├── import-products-modal.tsx
│   │   ├── add-category-modal.tsx
│   │   ├── add-supplier-modal.tsx
│   │   ├── stock-adjustment-modal.tsx
│   │   ├── transfer-stock-modal.tsx
│   │   ├── view-product-history-modal.tsx
│   │   └── low-stock-confirmation-modal.tsx
│   ├── dashboard/        # Dashboard-specific components
│   │   ├── kpi-cards.tsx
│   │   ├── sales-chart.tsx
│   │   ├── recent-activity.tsx
│   │   ├── low-stock-alerts.tsx
│   │   ├── top-selling-items.tsx
│   │   └── date-range-filter.tsx
│   ├── reports/          # Reports components
│   │   └── report-filters.tsx
│   ├── settings/        # Settings tab components
│   │   ├── business-info-tab.tsx
│   │   ├── outlet-management-tab.tsx
│   │   ├── tax-pricing-tab.tsx
│   │   ├── payment-methods-tab.tsx
│   │   ├── receipt-template-tab.tsx
│   │   ├── subscription-billing-tab.tsx
│   │   ├── integrations-tab.tsx
│   │   └── notifications-tab.tsx
│   ├── pos/              # POS Terminal components
│   │   ├── product-grid.tsx
│   │   ├── cart-panel.tsx
│   │   ├── payment-section.tsx
│   │   ├── receipt-preview.tsx
│   │   └── shortcut-keys-legend.tsx
│   └── ui/                # Reusable UI components (shadcn/ui)
├── contexts/             # React Context providers
│   └── tenant-context.tsx # Multi-tenant and outlet context
├── lib/
│   └── utils.ts          # Utility functions (cn helper)
└── package.json
```

## Features

### Layouts
- **Authentication Layout**: Clean, centered layout for login, registration, and password recovery
- **Dashboard Layout**: Sidebar navigation with topbar header for authenticated users
- **Public Layout**: Marketing pages layout with header and footer

### Modules
- **Auth & Onboarding**: 
  - **Authentication Pages**: Login, registration, forgot password, reset password, verify email
  - **Onboarding Flow**: 3-step setup process (Business Setup → Outlet Setup → Add First User)
  - **Form Validation**: Client-side validation with required fields and error handling
  - **Navigation Flow**: Registration → Onboarding → Dashboard
- **Dashboard**: 
  - **KPI Cards**: Today's Sales, Customers, Products in Stock, Expenses, Profit with trend indicators
  - **Sales Chart**: Interactive sales and profit trends using Recharts (area/line charts)
  - **Recent Activity Feed**: Real-time activity stream with timestamps and icons
  - **Low Stock Alerts**: Alert cards for products needing restocking
  - **Top Selling Items**: Table showing best performing products with revenue and change metrics
  - **Date Range Filter**: Preset ranges (Today, Last 7/30 Days, This Month, etc.) and custom date picker
  - **Outlet Switch**: Dropdown in topbar (already in layout)
  - **Modals**: View Sale Details, Quick Add Sale, Customize Dashboard Widgets
- **POS Terminal**: 
  - **Main POS Screen**: Full-screen sales interface with product grid, cart, payment, and receipt preview
  - **Product Grid**: Tile-based product display with quick add to cart
  - **Cart Panel**: Item management with quantity controls, discounts, and removal
  - **Payment Section**: Total calculation and payment processing
  - **Receipt Preview**: Real-time receipt preview sidebar
  - **Search Bar**: Search by barcode, name, or SKU
  - **Tabs**: New Sale, Pending Sales, Completed Sales
  - **Shortcut Keys**: Keyboard shortcuts legend for quick operations
  - **Modals**: Payment (Cash, Card, Mobile Money, Split), Discount, Hold/Recall Sale, Add Customer, Print Receipt, Refund/Return, Custom Item, Clear Cart Confirmation
- **Sales**: Transaction management with searchable table, transaction details (outlet-scoped)
- **Customers (CRM)**: 
  - **Customers Page**: Customer table with Name, Phone, Loyalty Points, Last Visit, Total Spent
  - **Customer Detail Page**: Tabbed interface with Customer Details and Purchase History
  - **Search & Filters**: Search by name, email, phone; Filter by loyalty points (High/Medium/Low) and outlet
  - **Stats Cards**: Total Customers, Total Points, Total Spent, Average Points
  - **Modals**: Add/Edit Customer, Loyalty Points Adjust, Merge Customer, Delete Confirmation
- **Staff & Roles**: 
  - **Staff Page**: Staff table with Name, Contact, Role, Outlet, Status, Last Login
  - **Roles Page**: Role management with permission matrix and staff count
  - **Attendance Page**: Attendance tracking with check-in/check-out times and status
  - **Search & Filters**: Search by name, email, phone; Filter by role and status
  - **Stats Cards**: Total Staff, Active Staff, Roles, Inactive Staff (Staff page); Present/Absent/Late counts (Attendance page)
  - **Modals**: Add/Edit Staff, Assign Role & Outlet, Add Role (with permission matrix), Reset Password, Deactivate Staff Confirmation
- **Reports & Analytics**: 
  - **Sales Reports**: Sales performance, trends, top products, transaction analysis
  - **Product Reports**: Product performance, category breakdown, stock status
  - **Customer Reports**: Customer segments, top customers, loyalty analysis
  - **Expense Reports**: Expense tracking, category breakdown, vendor analysis
  - **Profit & Loss Reports**: P&L statements, revenue vs expenses, profit margins
  - **Stock Movement Reports**: Inventory movements, stock in/out, movement summary
  - **Common Filters**: Date range, Outlet, Staff, Category, Payment method (shared across all reports)
  - **Modals**: Export Report (PDF/CSV), Print Report, Report Settings
- **Settings**: 
  - **Business Info Tab**: Business name, logo, currency, timezone, contact information
  - **Outlet Management Tab**: Add/edit outlets with address and contact details
  - **Tax & Pricing Tab**: VAT, service charge, tax-inclusive/exclusive pricing
  - **Payment Methods Tab**: Manage payment methods (Cash, Card, Mobile Money, Custom)
  - **Receipt Template Tab**: Customize receipt layout, logo, footer notes
  - **Subscription & Billing Tab**: View current plan, upgrade options, billing information
  - **Integrations Tab**: Printer setup, API keys, WhatsApp, SMS, MRA EIS configuration
  - **Notifications Tab**: Email and push notification preferences
  - **Modals**: Add/Edit Outlet, Add Payment Method, Preview Receipt, Confirm Subscription Upgrade
- **Notifications & Activity Log**: 
  - **Notifications Page**: Notification list with unread/read status, filters, and priority badges
  - **Activity Log Page**: Complete activity history with search, filters, and user tracking
  - **Stats Cards**: Total notifications, unread count, read count (Notifications); Total activities, today/week counts, users (Activity Log)
  - **Filters**: Filter by read/unread status, activity type, user, date range
  - **Modals**: View Notification Details, Mark All as Read Confirmation
- **Retail Store Module** (Industry-Specific):
  - **Returns Page**: Return history with search, stats, and refund processing
  - **Discounts Page**: Discount code management with active/upcoming/expired tabs
  - **Loyalty Page**: Loyalty program management with tiers, points, and member tracking
  - **Stats Cards**: Total returns, total refunded, pending returns (Returns); Active discounts, total, expired (Discounts); Active members, total points, redemption rate (Loyalty)
  - **Modals**: New Return (with sale selection), Create Discount (percentage/fixed with expiry), Adjust Loyalty Points, Refund Confirmation
- **Restaurant Module** (Industry-Specific):
  - **Tables Page**: Table layout view (grid/list) with status indicators, capacity, and occupancy tracking
  - **Orders Page**: Order management with active/completed tabs, table assignment, and server tracking
  - **Kitchen Page**: Kitchen Order Tickets (KOT) display with item status (Pending/Preparing/Ready) and print functionality
  - **Menu Page**: Menu item management with categories, pricing, and availability status
  - **Recipes Page**: Recipe management with ingredients, portions, and cost tracking
  - **Stats Cards**: Table occupancy, order counts, revenue (Tables/Orders); Pending/ready orders, prep time (Kitchen); Menu items, categories (Menu); Recipes, ingredients, costs (Recipes)
  - **Modals**: Add/Edit Table, Merge/Split Tables, Transfer Table, Add Order, Kitchen Order Ticket (print view), Add/Edit Menu Item, Add/Edit Recipe
- **Bar Module** (Industry-Specific):
  - **Drinks Page**: Drink inventory with bottle-to-shot ratios, categories, and stock tracking
  - **Tabs Page**: Bar tab management with open/closed status, customer tracking, and payment settlement
  - **Expenses Page**: Bar-specific expense tracking with categories and vendor management
  - **Tables Page**: Shared with restaurant module for table management
  - **Stats Cards**: Total drinks, low stock, inventory value (Drinks); Open tabs, total open amount (Tabs); Total expenses, categories (Expenses)
  - **Modals**: New Drink (with bottle-to-shot ratio), Open Tab, Close Tab (settle payment), Add Expense, Happy Hour Setup, Cost Breakdown
- **System Admin / Super Admin** (SaaS Owner):
  - **Tenants Page**: List of all registered businesses with search, filters, and tenant management
  - **Billing Page**: Subscription billing records with payment tracking and invoice management
  - **Support Tickets Page**: Customer support ticket management with status tracking and priority levels
  - **Analytics Page**: Platform-wide analytics with revenue trends, tenant growth, and plan distribution
  - **Plans Page**: Subscription plan management with pricing, features, and tenant counts
  - **Users Page**: System administrator user management with roles and permissions
  - **Stats Cards**: Total/active tenants, revenue, users (Tenants); Revenue, pending payments, invoices (Billing); Open/in-progress/resolved tickets (Support); Total tenants, MRR, churn rate (Analytics); Total/active plans, tenants (Plans); Total/active admins, super admins (Users)
  - **Modals**: Suspend Tenant (with reason), View Tenant Details (comprehensive tenant info), Edit Plan (pricing and features), Reply to Support Ticket (conversation thread)
- **Products & Inventory**: 
  - **Products Page**: Product catalog with search, filters, and status indicators
  - **Product Detail Page**: Tabbed interface with Details, Stock History, Sales History, and Supplier Info
  - **Categories Page**: Category management with product counts
  - **Stock Adjustments**: Manual inventory adjustments with reason tracking
  - **Stock Transfers**: Transfer inventory between outlets
  - **Receiving**: Manage incoming inventory from suppliers
  - **Suppliers**: Supplier management with contact information
  - **Modals**: Add/Edit Product, Import Products (CSV), Add Category, Add Supplier, Stock Adjustment, Transfer Stock, View Product History, Low Stock Confirmation
- **Outlets**: 
  - **List Page**: View all outlets with management options, switch between outlets
  - **Settings Page**: Configure outlet-specific preferences (printer setup, POS mode, receipt templates)
  - **Analytics Page**: Outlet-level performance metrics (sales trends, product movement, staff productivity)
- **Reports**: Analytics dashboard with custom report generation, date picker integration (tenant/outlet-scoped)
- **CRM**: Customer relationship management with customer database table (tenant-scoped)
- **Settings**: Account settings with tabbed interface (Profile, Business, Security, Notifications)

### Public Pages
- **Home**: Landing page with hero section, features, and CTA
- **Pricing**: Pricing plans with feature comparison
- **About**: Company information and mission
- **Contact**: Contact form and business information

### UI Components (shadcn/ui)
All components are built on Radix UI primitives for accessibility and customization:

- **Button**: Multiple variants (default, destructive, outline, secondary, ghost, link) and sizes
- **Card**: Container with header, title, description, content, and footer sections
- **Input**: Text input with focus states and validation styling
- **Label**: Form labels with proper accessibility
- **Table**: Full table component with header, body, footer, and row styling
- **Dialog**: Modal component with overlay, close button, and animations
- **Toast**: Notification system with variants and auto-dismiss
- **Select**: Dropdown select with search and keyboard navigation
- **Date Picker**: Calendar-based date selection with date-fns integration
- **Calendar**: Full calendar component for date selection
- **Popover**: Floating content container
- **Tabs**: Tabbed interface for organizing content
- **Alert**: Alert component with variants (default, destructive, success, warning, info) and icons
- **Scroll Area**: Scrollable content container for modals and long content
- **Alert Dialog**: Confirmation dialog component for destructive actions
- **Badge**: Status badge component with variants (default, secondary, destructive, outline)
- **Checkbox**: Checkbox component with Radix UI integration
- **Textarea**: Multi-line text input component

### Modal Components
- **Terms & Conditions Modal**: Scrollable modal for displaying terms with accept/decline actions
- **Invite Staff Member Modal**: Form modal for inviting staff with role and outlet assignment
- **Success Modal**: Success confirmation modal with customizable title and description
- **View Sale Details Modal**: Detailed sale information with items table, totals, and print/download options
- **Quick Add Sale Modal**: Fast sale processing with product selection, cart management, and payment method
- **Customize Dashboard Modal**: Widget visibility toggle for personalizing dashboard layout
- **Add/Edit Product Modal**: Comprehensive product form with all fields (Name, SKU, Category, Cost, Price, Tax, Barcode, Unit, Stock, etc.)
- **Import Products Modal**: CSV file upload for bulk product import with template download
- **Add Category Modal**: Simple category creation form
- **Add Supplier Modal**: Complete supplier information form with contact details
- **Stock Adjustment Modal**: Manual stock adjustment with type (increase/decrease), quantity, and reason
- **Transfer Stock Modal**: Transfer inventory between outlets with quantity and notes
- **View Product History Modal**: Complete transaction history for a product (sales, purchases, adjustments, transfers)
- **Low Stock Confirmation Modal**: Alert confirmation with option to create purchase order
- **Payment Modal**: Multi-method payment processing (Cash, Card, Mobile Money, Split) with change calculation
- **Discount Modal**: Apply percentage or fixed amount discounts to cart items
- **Hold/Recall Sale Modal**: Hold current sale or recall previously held sales
- **Add New Customer Modal**: Quick customer creation during sale
- **Print Receipt Modal**: Receipt printing and PDF download options
- **Refund/Return Modal**: Process refunds and returns with reason tracking
- **Custom Item Modal**: Manual item entry for quick sales
- **Confirm Clear Cart Dialog**: Confirmation dialog before clearing cart
- **Add/Edit Customer Modal**: Complete customer form with contact info, address, outlet, and loyalty points
- **Loyalty Points Adjust Modal**: Add, subtract, or set loyalty points with reason tracking
- **Merge Customer Modal**: Merge duplicate customer records with search and selection
- **Add/Edit Staff Modal**: Complete staff form with contact info, role, outlet, and password setup
- **Assign Role & Outlet Modal**: Assign or change staff role and outlet assignment
- **Add Role Modal**: Create/edit roles with checkbox permission matrix (Sales, Inventory, Products, Customers, Reports, Staff, Settings)
- **Reset Password Modal**: Reset staff password with confirmation and validation
- **Export Report Modal**: Export reports as PDF or CSV with format selection
- **Print Report Modal**: Print reports with options (include summary, charts, tables)
- **Report Settings Modal**: Configure default report settings (title, date format, currency, decimal places)
- **Add/Edit Outlet Modal**: Complete outlet form with address, contact info, and status
- **Add Payment Method Modal**: Add mobile money, card, or custom payment methods with configuration
- **Preview Receipt Modal**: Live preview of receipt template with sample data
- **Confirm Subscription Upgrade Modal**: Subscription upgrade confirmation with pricing details
- **View Notification Details Modal**: Detailed notification view with message, timestamp, status, and actions
- **Mark All as Read Confirmation**: Confirmation dialog for marking all notifications as read
- **New Return Modal**: Process returns by selecting original sale and items with reason selection
- **Create Discount Modal**: Create discount codes (percentage or fixed) with expiry dates, usage limits, and conditions
- **Adjust Loyalty Points Modal**: Add, subtract, or set loyalty points for customers with reason tracking
- **Refund Confirmation Modal**: Confirm and process refunds with method selection (Cash, Card, Store Credit, Bank Transfer)
- **Add/Edit Table Modal**: Table creation/editing with number, capacity, status, and location
- **Merge/Split Tables Modal**: Combine multiple tables or split a table into separate orders
- **Transfer Table Modal**: Transfer orders from one table to another
- **Add Order Modal**: Create restaurant orders with table selection, menu items, and server assignment
- **Kitchen Order Ticket Modal**: Print preview for KOT with items, notes, and status
- **Add/Edit Menu Item Modal**: Menu item management with name, category, price, description, and availability
- **Add/Edit Recipe Modal**: Recipe creation with ingredients list, portions, and cost calculation
- **New Drink Modal**: Add drinks with bottle-to-shot ratio, size, cost, and price configuration
- **Open Tab Modal**: Open new bar tabs with customer information and bartender assignment
- **Close Tab Modal**: Settle payment and close tabs with multiple payment methods (Cash, Card, Keep Tab)
- **Add Expense Modal**: Record bar expenses with category, vendor, receipt, and date
- **Happy Hour Setup Modal**: Configure happy hour discounts with time slots, days of week, and discount percentage
- **Cost Breakdown Modal**: Detailed cost analysis showing bottle cost, per-shot cost, profit margins, and total profit
- **Suspend Tenant Modal**: Suspend tenant access with reason logging and warning confirmation
- **View Tenant Details Modal**: Comprehensive tenant information including business details, subscription, outlets, and users
- **Edit Plan Modal**: Create/edit subscription plans with pricing, billing cycle, and feature management
- **Reply to Support Ticket Modal**: Reply to support tickets with conversation history, status updates, and message threading
- **Error/Validation Alert**: Alert component for displaying errors and validation messages

### Dashboard Components
- **KPI Cards**: Reusable KPI card component with icons, values, and trend indicators
- **Sales Chart**: Recharts-based chart component supporting line and area chart types
- **Recent Activity**: Activity feed component with icons, timestamps, and scrollable list
- **Low Stock Alerts**: Alert cards for inventory management with restock actions
- **Top Selling Items**: Table component for displaying best performing products
- **Date Range Filter**: Preset date ranges and custom date picker integration

### POS Components
- **Product Grid**: Tile-based product display with stock indicators and quick add buttons
- **Cart Panel**: Scrollable cart with quantity controls, discount application, and item removal
- **Payment Section**: Total calculation display with payment processing button
- **Receipt Preview**: Real-time receipt preview with formatted layout
- **Shortcut Keys Legend**: Popover showing keyboard shortcuts for POS operations

### Reports Components
- **Report Filters**: Common filter component with date range, outlet, staff, category, and payment method selection
- **Export/Print Actions**: Integrated export and print buttons in filter component

## Design System

### Color Scheme
- **Primary**: Navy blue (#3B82F6)
- **Secondary**: Gray tones
- **Accent**: Light blue/gray
- Full dark mode support

### Typography
- Font: Inter (Google Fonts)
- Consistent sizing and weights

### Spacing
- Consistent spacing scale using Tailwind's default scale
- Responsive padding and margins

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Multi-Tenant Architecture

PrimePOS is built with a multi-tenant architecture supporting businesses (tenants) that operate across multiple outlets or branches.

### Tenant & Outlet Context

- **Tenant Context Provider**: Manages current tenant and outlet state globally using React Context
- **Outlet Switching**: Seamless switching between outlets without page reload
- **Context-Aware UI**: All dashboard pages automatically scope data to current tenant/outlet
- **Visual Indicators**: Current tenant and outlet displayed in sidebar and topbar

### Key Features

- **Tenant-Aware Dashboard**: All analytics and data scoped to current tenant
- **Outlet Selector**: Dropdown in topbar for quick outlet switching
- **Outlet Management**: 
  - List all outlets with status and details
  - Configure outlet-specific settings (printer, POS mode, receipts)
  - View outlet-level analytics and performance metrics
- **Context Persistence**: Tenant and outlet context maintained across navigation
- **Dynamic Routing**: Outlet-specific pages with dynamic routes (`/outlets/[id]/settings`, `/outlets/[id]/analytics`)

### Implementation

- **Context Provider**: `contexts/tenant-context.tsx` - Centralized state management
- **Provider Wrapper**: `app/providers.tsx` - Wraps app with context providers
- **Outlet Components**: `components/outlets/` - Reusable outlet management components
- **Dashboard Integration**: All dashboard pages use `useTenant()` hook to access current context

## Development Status

**Current Phase**: Frontend Development

### Completed ✅
- Project setup and configuration
- Design system implementation
- All layout components (Auth, Dashboard, Public)
- Core UI component library
- All module pages with example content
- Public marketing pages
- Responsive design implementation
- Navigation and routing structure
- **Multi-tenant architecture with tenant/outlet context**
- **Outlet management pages (list, settings, analytics)**
- **Outlet selector and switching functionality**
- **Tenant-aware dashboard and navigation**
- **Complete authentication flow (login, register, password reset, email verification)**
- **3-step onboarding process (business, outlet, first user)**
- **Modal components (Terms & Conditions, Invite Staff, Success, Sale Details, Quick Sale, Customize Dashboard)**
- **Alert/Validation components for error handling**
- **Enhanced Dashboard with KPI cards, charts, activity feed, and widgets**
- **Recharts integration for data visualization**
- **Date range filtering with preset and custom options**
- **Complete Products & Inventory module with all pages and modals**
- **Product detail page with tabbed interface (Details, Stock History, Sales History, Supplier Info)**
- **Inventory management (Stock Adjustments, Transfers, Receiving)**
- **Supplier management system**
- **CSV import functionality for bulk product upload**
- **Complete POS Terminal with full sales screen interface**
- **Product grid with tile-based layout for quick product selection**
- **Cart management with quantity controls and discount application**
- **Multi-method payment processing (Cash, Card, Mobile Money, Split)**
- **Receipt preview and printing functionality**
- **Hold/Recall sales functionality**
- **Refund and return processing**
- **Complete Customers (CRM) module with customer management**
- **Customer detail pages with purchase history and loyalty tracking**
- **Loyalty points management with adjustment capabilities**
- **Customer merge functionality for duplicate records**
- **Complete Staff & Roles module with staff management**
- **Role-based permission system with checkbox matrix**
- **Attendance tracking with check-in/check-out functionality**
- **Staff assignment to roles and outlets**
- **Complete Reports & Analytics module with 6 report types**
- **Common filter component with date range, outlet, staff, category, and payment method**
- **Export functionality (PDF/CSV) for all reports**
- **Print functionality with customizable options**
- **Report settings configuration**
- **Complete Settings module with 8 configuration tabs**
- **Business information management (name, logo, currency, timezone)**
- **Outlet management with add/edit functionality**
- **Tax and pricing configuration (VAT, service charge)**
- **Payment methods management**
- **Receipt template customization**
- **Subscription and billing management**
- **Integrations configuration (Printer, API, WhatsApp, SMS, MRA EIS)**
- **Notification preferences (Email and Push)**
- **Complete Notifications & Activity Log module**
- **Notification management with read/unread status**
- **Activity tracking with comprehensive filters**
- **Real-time activity logging and notification system**
- **Retail Store Module (Industry-Specific)**:
  - **Returns Management**: Complete return processing with sale selection and item picking
  - **Discount Management**: Create and manage discount codes with percentage/fixed amounts, expiry dates, and usage limits
  - **Loyalty Program**: Multi-tier loyalty system with points tracking, tier management, and member benefits
  - **Refund Processing**: Multiple refund methods (Cash, Card, Store Credit, Bank Transfer)
  - **Return History**: Track all returns with search, filters, and status management
  - **Discount Analytics**: View active, upcoming, and expired discounts with usage tracking
  - **Loyalty Analytics**: Member statistics, tier distribution, and points management
- **Restaurant Module (Industry-Specific)**:
  - **Table Management**: Visual table layout (grid/list view) with real-time status tracking
  - **Order Management**: Complete order lifecycle from creation to completion with server tracking
  - **Kitchen Display System**: KOT management with item status updates (Pending → Preparing → Ready)
  - **Menu Management**: Menu items with categories, pricing, and availability controls
  - **Recipe Management**: Recipe tracking with ingredients, portions, and cost calculations
  - **Table Operations**: Merge, split, and transfer tables for flexible seating management
  - **Kitchen Workflow**: Item status tracking with start/prepare/ready actions
- **Bar Module (Industry-Specific)**:
  - **Drink Inventory**: Bar drink management with bottle-to-shot ratio calculations
  - **Tab Management**: Open/close tabs with customer tracking and payment settlement
  - **Expense Tracking**: Bar-specific expense categories (Inventory, Equipment, Supplies, Utilities)
  - **Happy Hour**: Automated discount system with time-based pricing
  - **Cost Analysis**: Detailed profit margins and cost breakdowns per drink
  - **Bottle Management**: Track bottles, shots, and calculate profitability
  - **Tab Settlement**: Multiple payment methods for closing tabs (Cash, Card, Keep Tab)
- **System Admin / Super Admin (SaaS Owner)**:
  - **Tenant Management**: Complete tenant lifecycle management (view, suspend, track)
  - **Billing Management**: Subscription billing, payment tracking, and invoice management
  - **Support System**: Ticket management with priority levels, status tracking, and conversation threads
  - **Platform Analytics**: Revenue trends, tenant growth, MRR, churn rate, and plan distribution
  - **Plan Management**: Create and manage subscription plans with pricing tiers and features
  - **Admin User Management**: System administrator accounts with role-based permissions
  - **Multi-tenant Oversight**: Complete visibility and control over all platform tenants

### Role-Based Access Control (RBAC)
- **Role Context**: Centralized role management with `RoleProvider` and `useRole` hook
- **Role Types**: Admin, Manager, Cashier, Staff
- **Permission System**: Granular permission checking for each route/feature
- **Navigation Filtering**: Sidebar navigation automatically filters based on user role
- **Route Protection**: Middleware for server-side route protection (ready for API integration)
- **Role Permissions**:
  - **Admin**: Full access to all features (Dashboard, Sales, POS, Products, Inventory, Outlets, Reports, CRM, Staff, Settings)
  - **Manager**: Most features except Staff and Settings management
  - **Cashier**: Limited to Sales, POS, Customers, Reports, and Notifications
  - **Staff**: Access to Sales, POS, Products, Inventory, and Notifications

### Breadcrumb Navigation
- **Breadcrumb Component**: Reusable breadcrumb component with home icon
- **Auto-Generated Breadcrumbs**: Automatically generates breadcrumbs from route path
- **Breadcrumb Mapping**: Comprehensive mapping for all routes with human-readable labels
- **Page Integration**: Breadcrumbs appear on all dashboard pages (except home)
- **Navigation Support**: Clickable breadcrumb items for easy navigation

### In Progress 🚧
- Frontend development continues
- Additional UI components as needed
- Page refinements and enhancements

### Local Development

See **[LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)** for detailed instructions on:
- Setting up the development environment
- Running the application locally
- Testing different features and user roles
- Navigation guide
- Troubleshooting common issues

**Quick Start:**
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables

The application uses environment variables for configuration. See `.env.example` for available options:

- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3001/api)
- `NEXT_PUBLIC_API_BASE_URL`: Base API URL
- `NEXT_PUBLIC_APP_NAME`: Application name
- `NEXT_PUBLIC_APP_URL`: Application URL

**Note**: All `NEXT_PUBLIC_*` variables are exposed to the browser. Never put sensitive data in these variables.

### API Integration

The application includes API helper utilities in `lib/api.ts`:
- `ApiClient` class for making HTTP requests
- Pre-configured API endpoints
- Ready for backend integration
- Token-based authentication support

### Future Backend Integration 🔜
The frontend is designed with backend integration in mind:

- API routes can be added in `app/api/`
- Environment variables for API endpoints
- Ready for authentication integration (NextAuth.js, etc.)
- Module structure supports API integration per feature
- API client utilities ready in `lib/api.ts`
- Type-safe API calls with TypeScript

## Responsive Design

The platform is fully responsive and optimized for:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## Development Notes

- All components are client-side ready (use "use client" where needed)
- Dashboard layout includes mobile-responsive sidebar with hamburger menu
- Toast notifications are integrated in root layout
- All forms are UI-ready but need backend integration for functionality
- Search and filter UI is implemented, ready for API integration
- **Multi-tenant context uses mock data - ready for API integration**
- **Outlet switching updates context immediately - data refresh can be added on switch**
- **All dashboard pages can access tenant/outlet context via `useTenant()` hook**
- **Tenant and outlet information displayed in sidebar and topbar for context awareness**
- **Navigation Flow**: "Get Started" → Registration → Onboarding (3 steps) → Dashboard
- **Auth Pages**: Login redirects to dashboard, Register redirects to onboarding flow
- **Onboarding Flow**: Sequential 3-step process with back navigation and progress indicators
- **Modal Integration**: Terms & Conditions modal integrated in business setup, Success modal on completion
- **Form Validation**: All forms include client-side validation with required fields
- **Error Handling**: Alert components ready for displaying validation errors and API errors
- **Dashboard Features**: 
  - KPI cards with real-time metrics and trend indicators
  - Interactive sales charts using Recharts library
  - Activity feed with real-time updates
  - Low stock alerts with quick restock actions
  - Top selling items with revenue tracking
  - Date range filtering for custom time periods
  - Quick sale processing modal
  - Dashboard customization for widget management
- **Products & Inventory Features**:
  - Product catalog with search and category filtering
  - Product detail pages with comprehensive information tabs
  - Stock management (adjustments, transfers, receiving)
  - Supplier relationship management
  - CSV bulk import for products
  - Low stock alerts and confirmations
  - Complete transaction history tracking
- **Customers (CRM) Features**:
  - Customer database with comprehensive information
  - Loyalty points tracking and management
  - Purchase history with transaction details
  - Search and filter by multiple criteria (name, email, phone, points, outlet)
  - Customer merge for duplicate records
  - Points adjustment (add, subtract, set) with reason tracking
  - Customer lifetime value tracking
  - Stats dashboard with total customers, points, and spending
- **Staff & Roles Features**:
  - Staff database with comprehensive information
  - Role-based access control with permission matrix
  - Attendance tracking with check-in/check-out times
  - Staff assignment to roles and outlets
  - Password reset functionality
  - Staff activation/deactivation
  - Permission categories: Sales, Inventory, Products, Customers, Reports, Staff, Settings
  - Stats dashboard with staff counts and attendance metrics
- **Reports & Analytics Features**:
  - 6 comprehensive report types (Sales, Products, Customers, Expenses, Profit & Loss, Stock Movement)
  - Common filtering system (date range, outlet, staff, category, payment method)
  - Interactive charts and data visualizations
  - Export to PDF and CSV formats
  - Print functionality with customizable options
  - Report settings for default configurations
  - Stats cards and summary tables for each report type
  - Real-time data analysis and insights
- **Settings Features**:
  - 8 comprehensive settings tabs (Business, Outlets, Tax & Pricing, Payment, Receipt, Billing, Integrations, Notifications)
  - Business information management with logo upload
  - Outlet management with full CRUD operations
  - Tax configuration (VAT, service charge, tax-inclusive/exclusive)
  - Payment methods management (Cash, Card, Mobile Money, Custom)
  - Receipt template customization with preview
  - Subscription management with upgrade options
  - Integration setup (Printer, API Keys, WhatsApp, SMS, MRA EIS)
  - Notification preferences for email and push notifications
  - All settings with save functionality and validation
- **Notifications & Activity Log Features**:
  - Notification center with unread/read management
  - Activity log with comprehensive tracking
  - Filter by type, user, date range, and read status
  - Priority badges and notification icons
  - Mark as read functionality (individual and bulk)
  - Detailed notification view with actions
  - Activity history with timestamps and user attribution
  - Search functionality across notifications and activities
  - Stats dashboard with counts and metrics
- **Retail Store Module Features**:
  - Returns processing with sale lookup and item selection
  - Discount code creation with flexible options (percentage/fixed, expiry, limits)
  - Multi-tier loyalty program (Bronze, Silver, Gold, Platinum)
  - Points per dollar and redemption rate configuration
  - Refund processing with multiple payment methods
  - Return history tracking with search and filters
  - Discount management with status tracking (Active, Upcoming, Expired)
  - Loyalty member management with tier assignments
  - Comprehensive stats and analytics for all retail features

## License

Copyright © 2024 PrimePOS. All rights reserved.

