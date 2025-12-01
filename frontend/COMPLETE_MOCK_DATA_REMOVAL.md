# Complete Mock Data Removal - Progress Report

## ✅ COMPLETED PAGES (Updated to use real API services)

### Core Pages
- ✅ `app/dashboard/page.tsx` - Main dashboard
- ✅ `app/dashboard/products/page.tsx` - Products list
- ✅ `app/dashboard/products/[id]/page.tsx` - Product detail
- ✅ `app/dashboard/customers/page.tsx` - Customers list
- ✅ `app/dashboard/reports/sales/page.tsx` - Sales reports

### Bar Pages
- ✅ `app/dashboard/bar/expenses/page.tsx` - Bar expenses
- ✅ `app/dashboard/bar/tabs/page.tsx` - Bar tabs
- ✅ `app/dashboard/bar/drinks/page.tsx` - Bar drinks

### Contexts & Services
- ✅ `contexts/shift-context.tsx` - Shift management
- ✅ `contexts/tenant-context.tsx` - Tenant/outlet management
- ✅ `components/pos/retail-pos.tsx` - Retail POS
- ✅ `components/pos/restaurant-pos.tsx` - Restaurant POS
- ✅ `components/pos/bar-pos.tsx` - Bar POS

### Services Created
- ✅ `lib/services/expenseService.ts` - Expense management
- ✅ `lib/services/tabService.ts` - Tab management
- ✅ `lib/services/reportService.ts` - Report generation

## ⏳ REMAINING PAGES (Still have mock data)

### High Priority - Core Functionality
1. `app/dashboard/customers/[id]/page.tsx` - Customer detail
2. `app/dashboard/inventory/stock-taking/page.tsx` - Stock taking
3. `app/dashboard/inventory/stock-taking/[id]/page.tsx` - Stock take detail
4. `app/dashboard/inventory/receiving/page.tsx` - Receiving
5. `app/dashboard/inventory/transfers/page.tsx` - Transfers
6. `app/dashboard/inventory/stock-adjustments/page.tsx` - Stock adjustments
7. `app/dashboard/products/items/page.tsx` - Product items
8. `app/dashboard/products/categories/page.tsx` - Categories

### Medium Priority - Reports
9. `app/dashboard/reports/products/page.tsx` - Product reports
10. `app/dashboard/reports/customers/page.tsx` - Customer reports
11. `app/dashboard/reports/expenses/page.tsx` - Expense reports
12. `app/dashboard/reports/profit-loss/page.tsx` - Profit & Loss
13. `app/dashboard/reports/stock-movement/page.tsx` - Stock movement
14. `app/dashboard/office/reports/*` - All office report pages (7 pages)

### Medium Priority - Restaurant
15. `app/dashboard/restaurant/tables/page.tsx` - Table management
16. `app/dashboard/restaurant/orders/page.tsx` - Restaurant orders
17. `app/dashboard/restaurant/kitchen/page.tsx` - Kitchen orders (KOT)
18. `app/dashboard/restaurant/menu/page.tsx` - Menu builder
19. `app/dashboard/restaurant/recipes/page.tsx` - Recipes

### Medium Priority - Retail
20. `app/dashboard/retail/returns/page.tsx` - Returns
21. `app/dashboard/retail/discounts/page.tsx` - Discounts
22. `app/dashboard/retail/loyalty/page.tsx` - Loyalty program
23. `app/dashboard/suppliers/page.tsx` - Suppliers

### Low Priority - Admin
24. `app/admin/tenants/page.tsx` - Tenant management
25. `app/admin/analytics/page.tsx` - Admin analytics
26. `app/admin/billing/page.tsx` - Billing
27. `app/admin/plans/page.tsx` - Plans
28. `app/admin/users/page.tsx` - Admin users
29. `app/admin/support-tickets/page.tsx` - Support tickets

### Low Priority - Other
30. `app/dashboard/outlets/[id]/analytics/page.tsx` - Outlet analytics
31. `app/dashboard/activity-log/page.tsx` - Activity log
32. `app/dashboard/notifications/page.tsx` - Notifications
33. `app/dashboard/staff/page.tsx` - Staff management
34. `app/dashboard/roles/page.tsx` - Roles
35. `app/dashboard/attendance/page.tsx` - Attendance

### Components/Modals
36. `components/modals/quick-add-sale-modal.tsx`
37. `components/modals/view-tenant-details-modal.tsx`
38. `components/modals/cost-breakdown-modal.tsx`
39. `components/modals/close-tab-modal.tsx`
40. `components/modals/add-order-modal.tsx`
41. `components/modals/transfer-table-modal.tsx`
42. `components/modals/merge-split-tables-modal.tsx`
43. `components/modals/new-return-modal.tsx`
44. `components/dashboard/activity-log-sidebar.tsx`

## Update Pattern (Use for all remaining pages)

```typescript
// 1. Add imports
import { useState, useEffect } from "react"
import { useBusinessStore } from "@/stores/businessStore"
import { useRealAPI } from "@/lib/utils/api-config"
import { [serviceName] } from "@/lib/services/[serviceName]"
import { get[Data] } from "@/lib/mockApi" // For fallback only

// 2. Add state
const [data, setData] = useState([])
const [isLoading, setIsLoading] = useState(true)
const { currentBusiness, currentOutlet } = useBusinessStore()
const useReal = useRealAPI()

// 3. Load data
useEffect(() => {
  const loadData = async () => {
    if (!currentBusiness) return
    setIsLoading(true)
    try {
      if (useReal) {
        const response = await serviceName.list({ tenant: currentBusiness.id })
        setData(response.results || [])
      } else {
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

// 4. Update UI with loading/empty states
{isLoading ? (
  <div>Loading...</div>
) : data.length === 0 ? (
  <div>No data found</div>
) : (
  // Render data
)}
```

## Next Steps

1. Continue updating remaining pages using the pattern above
2. Create missing services if needed (tableService, orderService, etc.)
3. Test all pages with `NEXT_PUBLIC_USE_REAL_API=true`
4. Remove all mock data fallbacks once backend is fully integrated

## Status: ~30% Complete

- ✅ Completed: 13 pages
- ⏳ Remaining: ~44 pages + modals
- 🎯 Target: 100% completion

