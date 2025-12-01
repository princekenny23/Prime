# Onboarding Fixes - Outlets & Users Display

## 🔧 Issues Fixed

### Issue #1: Outlets Not Showing in Tenant Pages ✅
**Problem:** Outlets were created but not visible in tenant detail pages.

**Root Cause:** 
- `TenantSerializer` didn't include `outlets` field
- Frontend expected `tenant.outlets` but backend wasn't returning it

**Fix:**
1. **Updated `TenantSerializer`** (`backend/apps/tenants/serializers.py`):
   - Added `outlets = OutletSerializer(many=True, read_only=True)`
   - Added `users = SerializerMethodField()` to avoid circular import
   - Used `get_users()` method to lazily load users

2. **Updated ViewSets** to prefetch related data:
   - `TenantViewSet`: Added `.prefetch_related('outlets', 'users')`
   - `AdminTenantViewSet`: Added `.prefetch_related('outlets', 'users')`

**Result:** Tenant API responses now include:
```json
{
  "id": 1,
  "name": "My Business",
  "outlets": [
    {
      "id": 1,
      "name": "Main Store",
      "address": "...",
      "is_active": true
    }
  ],
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe"
    }
  ]
}
```

---

### Issue #2: User Not Saved/Reflected in Frontend ✅
**Problem:** User's tenant association wasn't being saved or reflected after onboarding.

**Root Cause:**
- User save might not have been persisting properly
- Frontend wasn't getting updated user data

**Fix:**
1. **Improved `perform_create()`** (`backend/apps/tenants/views.py`):
   - Refresh user from database before saving
   - Use `update_fields=['tenant']` for efficient save
   - Update `request.user` to reflect the change immediately

2. **Enhanced `me_view()`** (`backend/apps/accounts/views.py`):
   - Refresh user from database with `select_related('tenant')`
   - Ensures latest tenant association is returned

**Result:** 
- User's `tenant` field is properly saved to database
- `/auth/me/` endpoint returns updated user with tenant info
- Frontend can refresh user data after onboarding

---

## 📋 Changes Made

### Backend Files:

1. **`backend/apps/tenants/serializers.py`**
   - Added `outlets` field using `OutletSerializer`
   - Added `users` field using `SerializerMethodField` (avoids circular import)
   - Implemented `get_users()` method

2. **`backend/apps/tenants/views.py`**
   - Added `User = get_user_model()` import
   - Updated queryset to prefetch `outlets` and `users`
   - Improved `perform_create()` to properly save user-tenant association

3. **`backend/apps/admin/views.py`**
   - Updated queryset to prefetch `outlets` and `users`

4. **`backend/apps/accounts/views.py`**
   - Enhanced `me_view()` to refresh user from database
   - Added `select_related('tenant')` for efficient query

---

## 🧪 Testing

### Test Outlets Display:
1. Create a business via onboarding
2. Create an outlet
3. Go to Admin → Tenants
4. Click "View Details" on the tenant
5. **Expected:** Outlets section shows the created outlet

### Test User Association:
1. Create a business via onboarding
2. Check Django Admin → Users
3. Find your user
4. **Expected:** User's `tenant` field is set to the created tenant
5. Check frontend - user should have `businessId` set

---

## 🔍 API Response Examples

### GET /api/v1/tenants/{id}/
```json
{
  "id": 1,
  "name": "My Business",
  "type": "retail",
  "currency": "MWK",
  "currency_symbol": "MK",
  "outlets": [
    {
      "id": 1,
      "name": "Main Store",
      "address": "123 Main St",
      "phone": "+265 123 456 789",
      "is_active": true
    }
  ],
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "tenant": {
        "id": 1,
        "name": "My Business"
      }
    }
  ]
}
```

### GET /api/v1/auth/me/
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "tenant": {
    "id": 1,
    "name": "My Business",
    "type": "retail"
  }
}
```

---

## ✅ Status: FIXED

Both issues are now resolved:
- ✅ Outlets are included in tenant API responses
- ✅ Users are properly saved with tenant association
- ✅ Frontend can display outlets and users in tenant pages

