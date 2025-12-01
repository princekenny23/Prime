# ✅ Onboarding System - Ready for Testing

## 🎯 Summary

The onboarding system has been fully integrated with the backend. Users can now create a business (tenant) and outlet through the frontend onboarding flow, and it will be saved to the PostgreSQL database.

---

## 🔧 Changes Made

### 1. **Backend Permission Fix** ✅
**File:** `backend/apps/tenants/views.py`

**Problem:** Only SaaS admins could create tenants, blocking regular users from onboarding.

**Solution:**
- Modified `get_permissions()` to allow authenticated users to create tenants
- Added `perform_create()` to automatically associate the tenant with the user who created it

```python
def get_permissions(self):
    """SaaS admins can manage all tenants, regular users can create their own tenant"""
    if self.action in ['update', 'partial_update', 'destroy']:
        return [IsSaaSAdmin()]
    # Allow authenticated users to create their own tenant (for onboarding)
    if self.action == 'create':
        return [IsAuthenticated()]
    return [IsAuthenticated()]

def perform_create(self, serializer):
    """Set tenant for regular users during creation"""
    tenant = serializer.save()
    
    # If user doesn't have a tenant yet, associate this one
    if not self.request.user.is_saas_admin and not self.request.user.tenant:
        self.request.user.tenant = tenant
        self.request.user.save()
    
    return tenant
```

---

### 2. **Data Transformation** ✅
**Files:**
- `frontend/lib/services/tenantService.ts`
- `frontend/lib/services/outletService.ts`

**Problem:** Frontend uses camelCase, backend uses snake_case.

**Solution:** Added bidirectional transformation in service layer:

**Tenant Service:**
- Request: `currencySymbol` → `currency_symbol`
- Response: `currency_symbol` → `currencySymbol`

**Outlet Service:**
- Request: `businessId` → `tenant` (FK)
- Request: `isActive` → `is_active`
- Response: `tenant` → `businessId`
- Response: `is_active` → `isActive`

---

### 3. **Removed Mock API Dependencies** ✅
**Files:**
- `frontend/app/onboarding/page.tsx`
- `frontend/components/modals/create-business-modal.tsx`

**Changes:**
- Removed all `mockApi` imports
- Removed `useRealAPI()` check - always uses real API for onboarding
- Removed mock data fallback logic

---

### 4. **User Data Refresh** ✅
**File:** `frontend/app/onboarding/page.tsx`

After creating the tenant, the frontend now refreshes the user data to get the updated tenant association from the backend.

---

## 📋 Onboarding Flow

1. **User logs in** → Gets JWT token
2. **User navigates to `/onboarding`** → 4-step form
   - Step 1: Business Name
   - Step 2: Business Type (retail/restaurant/bar)
   - Step 3: Contact Details (currency, phone, email, address)
   - Step 4: First Outlet (name, address, phone)
3. **User submits** → 
   - Creates tenant via `POST /api/v1/tenants/`
   - Backend automatically associates tenant with user
   - Creates outlet via `POST /api/v1/outlets/`
   - Refreshes user data to get tenant info
4. **Redirect** → Goes to industry-specific dashboard (`/dashboard/{type}`)

---

## 🧪 Testing Steps

### Prerequisites:
1. ✅ Backend server running (`python manage.py runserver`)
2. ✅ PostgreSQL database running
3. ✅ User logged in (has JWT token)

### Test Flow:
1. **Login** as a regular user (not SaaS admin)
2. **Navigate** to `/onboarding`
3. **Fill the form:**
   - Business Name: "Test Business"
   - Business Type: "Retail"
   - Currency: "MWK"
   - Phone: "+265 123 456 789"
   - Email: "test@example.com"
   - Outlet Name: "Main Store"
4. **Submit** the form
5. **Verify:**
   - ✅ No errors in console
   - ✅ Redirected to `/dashboard/retail`
   - ✅ Tenant created in database (check Django Admin)
   - ✅ Outlet created in database
   - ✅ User's `tenant` field is set in database

---

## 🔍 Backend Models Verified

✅ **Tenant Model** (`backend/apps/tenants/models.py`)
- Fields: `name`, `type`, `currency`, `currency_symbol`, `phone`, `email`, `address`, `settings`
- Business types: `retail`, `restaurant`, `bar`

✅ **Outlet Model** (`backend/apps/outlets/models.py`)
- Fields: `tenant` (FK to Tenant), `name`, `address`, `phone`, `email`, `is_active`

✅ **User Model** (`backend/apps/accounts/models.py`)
- Has `tenant` ForeignKey for association

---

## 🐛 Troubleshooting

### Issue: "Permission denied" when creating tenant
**Solution:** Make sure the user is authenticated (has valid JWT token)

### Issue: "Tenant not associated with user"
**Solution:** Check that `perform_create()` in `TenantViewSet` is working. The backend should automatically associate the tenant.

### Issue: "Outlet creation fails"
**Solution:** 
- Check that tenant was created first
- Verify tenant ID is being passed correctly
- Check backend logs for errors

### Issue: "Data format mismatch"
**Solution:** The service layer should handle transformation automatically. Check browser console for API errors.

---

## 📝 Notes

- The backend automatically associates the tenant with the user who created it
- If a user already has a tenant, they should not be able to create another (validation can be added later)
- Owner account creation in the admin modal is still TODO (requires userService/staffService)

---

## 🚀 Next Steps

1. **Test the onboarding flow** with a real user account
2. **Verify data** in Django Admin after creation
3. **Test different business types** (retail, restaurant, bar)
4. **Test error handling** (invalid data, network errors)
5. **Add validation** to prevent users from creating multiple tenants

---

## ✅ Status: READY FOR TESTING

The onboarding system is now fully integrated with the backend and ready for testing!

