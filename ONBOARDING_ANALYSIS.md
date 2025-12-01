# Onboarding System Analysis

## 🔍 Issues Found

### Issue #1: **Permission Problem - SaaS Admin Required**
**Location:** `backend/apps/tenants/views.py:25-26`
- `TenantViewSet.create()` requires `IsSaaSAdmin` permission
- **Problem:** Regular users can't create their own tenant during onboarding
- **Fix Needed:** Allow authenticated users to create their own tenant

### Issue #2: **Data Structure Mismatch**
**Frontend sends:**
```typescript
{
  currencySymbol: "MK",  // camelCase
  settings: { ... }
}
```

**Backend expects:**
```python
{
  currency_symbol: "MK",  # snake_case
  settings: { ... }  # JSONField
}
```

### Issue #3: **Outlet Creation Issue**
**Frontend sends:**
```typescript
{
  tenant: business.id,  # String ID
  isActive: true  # camelCase
}
```

**Backend expects:**
```python
{
  tenant: <Tenant object>,  # ForeignKey
  is_active: True  # snake_case
}
```

### Issue #4: **useRealAPI() Check**
**Location:** `frontend/app/onboarding/page.tsx:68`
- Uses `useRealAPI()` which requires token
- During onboarding, user might not have proper token yet
- **Fix:** Always use real API for onboarding

---

## 🔧 Fixes Needed

1. **Backend:** Allow regular users to create their own tenant
2. **Frontend:** Transform data to match backend format
3. **Frontend:** Always use real API for onboarding
4. **Services:** Fix data transformation

---

## ✅ Backend Models Exist

- ✅ `Tenant` model exists (Business = Tenant)
- ✅ `Outlet` model exists
- ✅ Serializers exist
- ✅ ViewSets exist
- ⚠️ **Permission issue:** Only SaaS admins can create tenants

---

Let me fix these issues now!

