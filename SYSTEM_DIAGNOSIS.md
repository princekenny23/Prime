# 🔍 System Diagnosis - Tenant Not Showing

## Root Cause Analysis

### Problem Summary
Tenant created in Django Admin is not visible in frontend admin dashboard/tenants page.

---

## 🔴 IDENTIFIED ISSUES

### Issue #1: **Permission Check - SaaS Admin Required**
**Location:** `backend/apps/admin/views.py:22`
- `AdminTenantViewSet` requires `IsSaaSAdmin` permission
- If user is NOT a SaaS admin → 403 Forbidden
- **Check:** Is your logged-in user a SaaS admin?

**Verification:**
```python
# In Django shell
from apps.accounts.models import User
user = User.objects.get(email='your-email@example.com')
print(f"Is SaaS Admin: {user.is_saas_admin}")
```

---

### Issue #2: **Two Different Endpoints Being Used**
**Admin Dashboard** (`app/admin/page.tsx:63`):
- Uses: `tenantService.list()` → `/api/v1/tenants/`
- Uses `TenantViewSet` with `TenantFilterMixin`
- SaaS admins should see all, but might have filtering issues

**Admin Tenants Page** (`app/admin/tenants/page.tsx:55`):
- Uses: `adminService.getTenants()` → `/api/v1/admin/tenants/`
- Uses `AdminTenantViewSet` (requires SaaS admin)
- More restrictive

---

### Issue #3: **Data Structure Mismatch**
**Backend Returns** (`TenantSerializer`):
```python
{
  'id', 'name', 'type', 'currency', 'currency_symbol', 
  'phone', 'email', 'address', 'settings', 
  'is_active', 'created_at', 'updated_at'
}
```

**Frontend Expects** (`Business` type):
```typescript
{
  id, name, type, email, phone, address,
  currency, currencySymbol, createdAt, ...
}
```

**Mismatch:**
- Backend: `created_at` (snake_case)
- Frontend: `createdAt` (camelCase)
- Backend: `currency_symbol`
- Frontend: `currencySymbol`

---

### Issue #4: **Authentication Token Missing/Invalid**
**Location:** `frontend/app/admin/page.tsx:55-60`
- Code checks for token
- If no token → shows error
- **Check:** Is user logged in? Token valid?

---

### Issue #5: **TenantFilterMixin Behavior**
**Location:** `backend/apps/tenants/permissions.py:18-32`
- For SaaS admins: Should return all tenants
- But if user is NOT SaaS admin: Returns empty queryset
- **Problem:** Even if tenant exists, non-admin users won't see it

---

## 🎯 MOST LIKELY ROOT CAUSES (Priority Order)

### 1. **User Not SaaS Admin** (90% likely)
- User logged in but `is_saas_admin = False`
- Can't access `/api/v1/admin/tenants/` endpoint
- Gets 403 Forbidden

### 2. **Not Logged In** (5% likely)
- No auth token in localStorage
- API calls fail with 401

### 3. **Data Structure Mismatch** (3% likely)
- Backend returns `created_at` but frontend expects `createdAt`
- Data exists but doesn't render properly

### 4. **CORS/Network Issues** (2% likely)
- API calls blocked
- Check browser console for errors

---

## 🔧 VERIFICATION STEPS

### Step 1: Check User Permissions
```python
# Django shell
python manage.py shell
from apps.accounts.models import User
user = User.objects.get(email='kwitondakenny@gmail.com')
print(f"Email: {user.email}")
print(f"Is SaaS Admin: {user.is_saas_admin}")
print(f"Is Staff: {user.is_staff}")
print(f"Is Superuser: {user.is_superuser}")
```

### Step 2: Check Tenant Exists
```python
# Django shell
from apps.tenants.models import Tenant
tenants = Tenant.objects.all()
for t in tenants:
    print(f"ID: {t.id}, Name: {t.name}, Active: {t.is_active}")
```

### Step 3: Test API Directly
```bash
# Get token from browser localStorage first
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/v1/tenants/

# Should return tenant data
```

### Step 4: Check Browser Console
1. Open DevTools (F12)
2. Network tab
3. Refresh admin page
4. Look for:
   - `/api/v1/tenants/` request
   - Status code (200, 401, 403?)
   - Response body

---

## 📋 WHAT TO CHECK RIGHT NOW

1. **Are you logged in?**
   - Browser console: `localStorage.getItem("authToken")`
   - Should return a JWT token

2. **Is your user a SaaS admin?**
   - Django Admin → Users → Your user
   - Check `is_saas_admin` checkbox

3. **Does tenant exist?**
   - Django Admin → Tenants → Tenants
   - Your tenant should be listed

4. **What's the API response?**
   - Browser Network tab
   - Check `/api/v1/tenants/` response
   - What status code? What data?

---

## 🚨 MOST COMMON FIX

**99% of the time, it's:**
- User is NOT a SaaS admin
- Or user is not logged in

**Quick Fix:**
```python
# Make user SaaS admin
python manage.py shell
from apps.accounts.models import User
u = User.objects.get(email='kwitondakenny@gmail.com')
u.is_saas_admin = True
u.save()
```

---

**Tell me what you find in the browser console Network tab!** 🎯

