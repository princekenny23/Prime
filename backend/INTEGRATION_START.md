# Integration Start - Complete Checklist

## ✅ Issues Fixed

1. **Admin App Conflict** - Fixed duplicate "admin" label
2. **All ViewSet Actions Verified:**
   - ✅ ProductViewSet.low_stock() - EXISTS
   - ✅ CustomerViewSet.adjust_points() - EXISTS
   - ✅ SaleViewSet.refund() - EXISTS
   - ✅ OutletViewSet.tills() - EXISTS
   - ✅ ShiftViewSet.start(), active(), history(), check(), close() - ALL EXIST

## 🔧 Next Steps - Run These Commands

### Step 1: Fix Admin App (Already Done)
✅ Changed admin app label to avoid conflict

### Step 2: Create Migrations
```bash
cd backend
python manage.py makemigrations
```

**Expected:** Should create migrations for all apps

### Step 3: Run Migrations
```bash
python manage.py migrate
```

**Expected:** All tables created in database

### Step 4: Create Superuser
```bash
python manage.py createsuperuser
```

**Enter:**
- Email: (your email)
- Username: (your username)
- Password: (strong password)

### Step 5: Make User SaaS Admin
```bash
python manage.py shell
```

Then:
```python
from apps.accounts.models import User
user = User.objects.get(email='your-email@example.com')
user.is_saas_admin = True
user.role = 'saas_admin'
user.is_staff = True
user.is_superuser = True
user.save()
print(f"✅ {user.email} is now SaaS Admin")
exit()
```

### Step 6: Start Backend Server
```bash
python manage.py runserver
```

**Test:**
- Visit: http://localhost:8000/admin/
- Login with your superuser
- Should see Django admin

### Step 7: Test API Endpoints

**Test Authentication:**
```bash
# Test login (use Postman or curl)
POST http://localhost:8000/api/v1/auth/login/
Body: {"email": "your-email@example.com", "password": "your-password"}
```

**Test API Root:**
- Visit: http://localhost:8000/api/v1/
- Should see API info or 404 (both OK)

### Step 8: Configure Frontend

**Create `frontend/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_USE_REAL_API=false
NEXT_PUBLIC_APP_NAME=PrimePOS
```

### Step 9: Test Frontend Connection

1. Start frontend: `npm run dev`
2. Try to login
3. Check browser console for errors
4. Check Network tab for API calls

---

## 📋 API Endpoint Verification

### ✅ All Endpoints Match:

**Authentication:**
- ✅ POST /api/v1/auth/login/
- ✅ POST /api/v1/auth/register/
- ✅ POST /api/v1/auth/refresh/
- ✅ POST /api/v1/auth/logout/
- ✅ GET /api/v1/auth/me/

**Tenants:**
- ✅ GET /api/v1/tenants/
- ✅ GET /api/v1/tenants/{id}/
- ✅ GET /api/v1/tenants/current/
- ✅ POST /api/v1/tenants/ (admin only)

**Outlets:**
- ✅ GET /api/v1/outlets/
- ✅ GET /api/v1/outlets/{id}/
- ✅ GET /api/v1/outlets/{id}/tills/
- ✅ POST /api/v1/outlets/

**Products:**
- ✅ GET /api/v1/products/
- ✅ GET /api/v1/products/{id}/
- ✅ GET /api/v1/products/low_stock/
- ✅ POST /api/v1/products/

**Sales:**
- ✅ GET /api/v1/sales/
- ✅ POST /api/v1/sales/
- ✅ POST /api/v1/sales/{id}/refund/

**Shifts:**
- ✅ POST /api/v1/shifts/start/
- ✅ GET /api/v1/shifts/active/
- ✅ GET /api/v1/shifts/history/
- ✅ GET /api/v1/shifts/check/
- ✅ POST /api/v1/shifts/{id}/close/

**Customers:**
- ✅ GET /api/v1/customers/
- ✅ POST /api/v1/customers/{id}/adjust_points/

**Inventory:**
- ✅ POST /api/v1/inventory/adjust/
- ✅ POST /api/v1/inventory/transfer/
- ✅ GET /api/v1/inventory/movements/

**Reports:**
- ✅ GET /api/v1/reports/sales/
- ✅ GET /api/v1/reports/products/
- ✅ GET /api/v1/reports/customers/
- ✅ GET /api/v1/reports/profit-loss/
- ✅ GET /api/v1/reports/stock-movement/

---

## 🚨 Potential Issues to Watch For

### 1. Pagination Format
**Issue:** Backend returns `{results: [], count: 0, next: null, previous: null}`
**Frontend:** Some services expect array directly
**Fix:** Update services to handle `response.results || response`

### 2. Field Name Mismatches
- Backend: `date_joined` vs Frontend: `created_at`
- Backend: `loyalty_points` vs Frontend: `points`
- **Fix:** Update serializers or frontend types

### 3. Nested Relationships
- Backend may return IDs only
- Frontend expects full objects
- **Fix:** Use `select_related` in views (already done)

### 4. Date Formats
- Backend: ISO format strings
- Frontend: May expect Date objects
- **Fix:** Parse dates in frontend

---

## 🎯 Integration Priority

1. **Phase 1:** Migrations + Superuser ✅ (Do this first)
2. **Phase 2:** Authentication (Test login/logout)
3. **Phase 3:** Products (Test CRUD)
4. **Phase 4:** Sales (Test transaction)
5. **Phase 5:** Everything else

---

## 📝 What to Report

After running migrations, tell me:
1. ✅ Did migrations create successfully?
2. ✅ How many migrations per app?
3. ✅ Any errors?
4. ✅ Database tables created?
5. ✅ Ready for superuser creation?

Let's start! 🚀

