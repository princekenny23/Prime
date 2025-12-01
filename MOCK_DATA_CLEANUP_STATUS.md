# Mock Data Cleanup Status

## Summary

**Status**: Partially Complete - Core components updated, but some pages still use mockApi directly.

## ✅ Updated Files (Using Service Layer)

### Stores
- ✅ `stores/authStore.ts` - Uses `authService` with fallback to mockApi
- ✅ `stores/businessStore.ts` - Uses `tenantService` and `outletService` with fallback

### POS Components
- ✅ `components/pos/retail-pos.tsx` - Uses `productService` and `categoryService`
- ✅ `components/pos/restaurant-pos.tsx` - Uses `productService`
- ✅ `components/pos/bar-pos.tsx` - Uses `productService`

### Pages
- ✅ `app/admin/page.tsx` - Uses `tenantService`, `outletService`, `saleService`
- ✅ `app/dashboard/retail/page.tsx` - Uses `productService` and async dashboard stats
- ✅ `app/auth/login/page.tsx` - Uses `tenantService`
- ✅ `app/onboarding/page.tsx` - Uses `tenantService` and `outletService`

### Modals
- ✅ `components/modals/create-business-modal.tsx` - Uses `tenantService` and `outletService`

### Utils
- ✅ `lib/utils/dashboard-stats.ts` - Uses `saleService` and `productService` (async functions)
- ⚠️ `lib/utils/admin-stats.ts` - **STILL USES MOCK API** (needs update)

## ⚠️ Files Still Using Mock API Directly

### Pages That Need Updates
1. **`app/dashboard/restaurant/page.tsx`** - Uses `getProducts` from mockApi
2. **`app/dashboard/bar/page.tsx`** - Uses `getProducts` from mockApi
3. **`app/dashboard/page.tsx`** - Has hardcoded mock data constants

### Utils That Need Updates
1. **`lib/utils/admin-stats.ts`** - Uses `getBusinesses`, `getOutlets`, `getUsers`, `getSales` from mockApi
   - Should use `tenantService`, `outletService`, `saleService`

### Contexts That Need Updates
1. **`contexts/shift-context.tsx`** - Uses mock tills data
   - Should use `shiftService` and `outletService.getTills()`

### Other Components
- Various product listing pages may still use `getProducts` directly
- Sales pages may still use `getSales` directly
- Customer pages may still use customer mockApi functions

## Implementation Pattern

All updated files follow this pattern:

```typescript
import { useRealAPI } from "@/lib/utils/api-config"
import { productService } from "@/lib/services/productService"
import { getProducts } from "@/lib/mockApi" // Keep for fallback

// In component/function:
if (useRealAPI()) {
  try {
    const data = await productService.list()
    // Use real API data
  } catch (error) {
    // Fallback to mock
    const data = getProducts(businessId)
  }
} else {
  // Use mock API
  const data = getProducts(businessId)
}
```

## Next Steps

1. Update `lib/utils/admin-stats.ts` to use services
2. Update `app/dashboard/restaurant/page.tsx` and `app/dashboard/bar/page.tsx`
3. Update `contexts/shift-context.tsx` to use `shiftService`
4. Search for remaining `getProducts`, `getSales`, `getCustomers` calls in components
5. Update all product listing pages
6. Update all sales pages
7. Update customer management pages

## Notes

- Mock API is kept as fallback for simulation mode
- All service calls should have try/catch with mock fallback
- `useRealAPI()` utility determines which mode to use
- Environment variable `NEXT_PUBLIC_USE_REAL_API=true` enables real API mode

