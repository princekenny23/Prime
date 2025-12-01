# Remaining Pages with Mock Data

This document tracks all pages that still contain mock data and need to be updated to use real API services.

## Status: In Progress

### ✅ Completed (Updated to use real API services)
- `app/dashboard/page.tsx` - Main dashboard
- `app/dashboard/bar/expenses/page.tsx` - Bar expenses
- `app/dashboard/bar/tabs/page.tsx` - Bar tabs
- `app/dashboard/bar/drinks/page.tsx` - Bar drinks
- `app/dashboard/products/page.tsx` - Products (in progress)
- `contexts/shift-context.tsx` - Shift management
- `contexts/tenant-context.tsx` - Tenant/outlet management
- `components/pos/retail-pos.tsx` - Retail POS
- `components/pos/restaurant-pos.tsx` - Restaurant POS
- `components/pos/bar-pos.tsx` - Bar POS

### ⏳ Pending Updates

#### Products & Inventory
- [ ] `app/dashboard/products/[id]/page.tsx` - Product detail page
- [ ] `app/dashboard/products/items/page.tsx` - Product items
- [ ] `app/dashboard/products/categories/page.tsx` - Categories
- [ ] `app/dashboard/inventory/page.tsx` - Inventory overview
- [ ] `app/dashboard/inventory/stock-taking/page.tsx` - Stock taking
- [ ] `app/dashboard/inventory/stock-taking/[id]/page.tsx` - Stock take detail
- [ ] `app/dashboard/inventory/receiving/page.tsx` - Receiving
- [ ] `app/dashboard/inventory/transfers/page.tsx` - Transfers
- [ ] `app/dashboard/inventory/stock-adjustments/page.tsx` - Stock adjustments

#### Customers
- [ ] `app/dashboard/customers/page.tsx` - Customers list
- [ ] `app/dashboard/customers/[id]/page.tsx` - Customer detail
- [ ] `app/dashboard/retail/loyalty/page.tsx` - Loyalty program

#### Reports
- [ ] `app/dashboard/reports/sales/page.tsx` - Sales reports
- [ ] `app/dashboard/reports/products/page.tsx` - Product reports
- [ ] `app/dashboard/reports/customers/page.tsx` - Customer reports
- [ ] `app/dashboard/reports/expenses/page.tsx` - Expense reports
- [ ] `app/dashboard/reports/profit-loss/page.tsx` - Profit & Loss
- [ ] `app/dashboard/reports/stock-movement/page.tsx` - Stock movement
- [ ] `app/dashboard/office/reports/sales/page.tsx` - Office sales reports
- [ ] `app/dashboard/office/reports/products/page.tsx` - Office product reports
- [ ] `app/dashboard/office/reports/customers/page.tsx` - Office customer reports
- [ ] `app/dashboard/office/reports/expenses/page.tsx` - Office expense reports
- [ ] `app/dashboard/office/reports/profit-loss/page.tsx` - Office P&L
- [ ] `app/dashboard/office/reports/stock-movement/page.tsx` - Office stock movement

#### Restaurant
- [ ] `app/dashboard/restaurant/orders/page.tsx` - Restaurant orders
- [ ] `app/dashboard/restaurant/kitchen/page.tsx` - Kitchen orders (KOT)
- [ ] `app/dashboard/restaurant/tables/page.tsx` - Table management
- [ ] `app/dashboard/restaurant/menu/page.tsx` - Menu builder
- [ ] `app/dashboard/restaurant/recipes/page.tsx` - Recipes

#### Retail
- [ ] `app/dashboard/retail/returns/page.tsx` - Returns
- [ ] `app/dashboard/retail/discounts/page.tsx` - Discounts
- [ ] `app/dashboard/suppliers/page.tsx` - Suppliers
- [ ] `app/dashboard/office/suppliers/page.tsx` - Office suppliers

#### Admin
- [ ] `app/admin/tenants/page.tsx` - Tenant management
- [ ] `app/admin/analytics/page.tsx` - Admin analytics
- [ ] `app/admin/billing/page.tsx` - Billing
- [ ] `app/admin/plans/page.tsx` - Plans
- [ ] `app/admin/users/page.tsx` - Admin users
- [ ] `app/admin/support-tickets/page.tsx` - Support tickets

#### Other
- [ ] `app/dashboard/outlets/[id]/analytics/page.tsx` - Outlet analytics
- [ ] `app/dashboard/activity-log/page.tsx` - Activity log
- [ ] `app/dashboard/notifications/page.tsx` - Notifications
- [ ] `app/dashboard/staff/page.tsx` - Staff management
- [ ] `app/dashboard/roles/page.tsx` - Roles
- [ ] `app/dashboard/attendance/page.tsx` - Attendance
- [ ] `app/dashboard/office/staff/page.tsx` - Office staff

#### Modals (Components)
- [ ] `components/modals/quick-add-sale-modal.tsx` - Quick add sale
- [ ] `components/modals/view-tenant-details-modal.tsx` - Tenant details
- [ ] `components/modals/cost-breakdown-modal.tsx` - Cost breakdown
- [ ] `components/modals/close-tab-modal.tsx` - Close tab
- [ ] `components/modals/add-order-modal.tsx` - Add order
- [ ] `components/modals/transfer-table-modal.tsx` - Transfer table
- [ ] `components/modals/merge-split-tables-modal.tsx` - Merge/split tables
- [ ] `components/modals/new-return-modal.tsx` - New return
- [ ] `components/modals/reply-to-support-ticket-modal.tsx` - Reply to ticket
- [ ] `components/dashboard/activity-log-sidebar.tsx` - Activity log sidebar

## Services Available

The following services are already created and ready to use:
- ✅ `authService` - Authentication
- ✅ `tenantService` - Business/tenant management
- ✅ `outletService` - Outlet management
- ✅ `productService` - Product and category management
- ✅ `saleService` - Sales operations
- ✅ `shiftService` - Shift management
- ✅ `customerService` - Customer management
- ✅ `inventoryService` - Inventory operations
- ✅ `expenseService` - Expense management (NEW)
- ✅ `tabService` - Tab management (NEW)

## Services Needed

The following services may need to be created:
- ⏳ `reportService` - For all report pages
- ⏳ `staffService` - For staff management (may already exist)
- ⏳ `tableService` - For restaurant table management
- ⏳ `orderService` - For restaurant orders/KOT
- ⏳ `supplierService` - For supplier management

## Update Pattern

For each page, follow this pattern:

1. **Remove mock data arrays**
2. **Add imports:**
   ```typescript
   import { useState, useEffect } from "react"
   import { useBusinessStore } from "@/stores/businessStore"
   import { useRealAPI } from "@/lib/utils/api-config"
   import { [serviceName] } from "@/lib/services/[serviceName]"
   import { get[Data] } from "@/lib/mockApi" // For fallback
   ```

3. **Add state:**
   ```typescript
   const [data, setData] = useState([])
   const [isLoading, setIsLoading] = useState(true)
   const { currentBusiness, currentOutlet } = useBusinessStore()
   const useReal = useRealAPI()
   ```

4. **Add useEffect to load data:**
   ```typescript
   useEffect(() => {
     const loadData = async () => {
       if (!currentBusiness) return
       setIsLoading(true)
       try {
         if (useReal) {
           const response = await serviceName.list({ tenant: currentBusiness.id })
           setData(response.results || [])
         } else {
           // Fallback to mockApi
           setData(getData(currentBusiness.id))
         }
       } catch (error) {
         console.error("Failed to load data:", error)
         setData([])
       } finally {
         setIsLoading(false)
       }
     }
     loadData()
   }, [currentBusiness, currentOutlet, useReal])
   ```

5. **Update UI to show loading/empty states**

## Priority Order

1. **High Priority** (Core functionality):
   - Products pages
   - Customers pages
   - Sales/Reports pages
   - Inventory pages

2. **Medium Priority** (Industry-specific):
   - Restaurant pages
   - Retail pages
   - Bar pages (partially done)

3. **Low Priority** (Admin/Support):
   - Admin pages
   - Support tickets
   - Activity logs

