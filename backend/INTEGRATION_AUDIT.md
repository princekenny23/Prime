# Integration Audit & Missing Components

## ✅ What's Already Set Up

### Backend Structure
- ✅ Django project structure
- ✅ All apps created (accounts, tenants, outlets, products, sales, inventory, customers, staff, shifts, reports, admin)
- ✅ Models defined
- ✅ Views/ViewSets created
- ✅ Serializers created
- ✅ URL routing configured
- ✅ JWT authentication configured
- ✅ Multi-tenancy middleware
- ✅ CORS configured

### Frontend Structure
- ✅ Service layer created
- ✅ API client with token refresh
- ✅ Zustand stores
- ✅ All pages updated to use services
- ✅ Environment configuration ready

---

## ❌ Critical Missing Components

### 1. Database Migrations (CRITICAL)
**Status:** NO MIGRATIONS FOUND
**Impact:** Cannot create database tables
**Action Required:**
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

**Apps needing migrations:**
- accounts (User model)
- tenants (Tenant model)
- outlets (Outlet, Till models)
- products (Product, Category models)
- sales (Sale, SaleItem models)
- inventory (StockMovement, StockTake models)
- customers (Customer model)
- staff (Staff, Role models)
- shifts (Shift model)
- reports (if any models)

---

### 2. API Endpoint Mismatches

#### Frontend expects but Backend missing:
1. **Categories endpoint:**
   - Frontend: `/categories/`
   - Backend: ✅ Has `/categories/` (via router)

2. **Low stock products:**
   - Frontend: `/products/low_stock/`
   - Backend: ❌ Need to add `@action` to ProductViewSet

3. **Outlets tills:**
   - Frontend: `/outlets/{id}/tills/`
   - Backend: ✅ Has `/tills/` but need nested route

4. **Inventory movements:**
   - Frontend: `/inventory/movements`
   - Backend: ❌ Need to check if exists

5. **Stock taking:**
   - Frontend: `/inventory/stock-take/`
   - Backend: ❌ Need to verify

6. **Customer adjust points:**
   - Frontend: `/customers/{id}/adjust_points/`
   - Backend: ❌ Need to add `@action` to CustomerViewSet

7. **Sale refund:**
   - Frontend: `/sales/{id}/refund/`
   - Backend: ❌ Need to add `@action` to SaleViewSet

8. **Shift endpoints:**
   - Frontend: `/shifts/start/`, `/shifts/active/`, `/shifts/history/`, `/shifts/check/`
   - Backend: ❌ Need to verify all exist

9. **Reports endpoints:**
   - Frontend: `/reports/sales/`, `/reports/products/`, etc.
   - Backend: ❌ Need to verify all exist

---

### 3. Serializer Field Mismatches

**Potential Issues:**
1. **User Serializer:**
   - Backend returns: `date_joined`
   - Frontend might expect: `created_at`
   - Need to verify User model fields match

2. **Product Serializer:**
   - Frontend expects: `low_stock_threshold`
   - Backend model: Need to verify field name

3. **Sale Serializer:**
   - Frontend expects: `receipt_number`
   - Backend: Need to verify field exists

4. **Customer Serializer:**
   - Frontend expects: `loyalty_points`, `total_spent`
   - Backend: Need to verify field names

---

### 4. Missing ViewSet Actions

**Need to add `@action` decorators:**

1. **ProductViewSet:**
   ```python
   @action(detail=False, methods=['get'])
   def low_stock(self, request):
       # Return products with stock <= low_stock_threshold
   ```

2. **CustomerViewSet:**
   ```python
   @action(detail=True, methods=['post'])
   def adjust_points(self, request, pk=None):
       # Adjust customer loyalty points
   ```

3. **SaleViewSet:**
   ```python
   @action(detail=True, methods=['post'])
   def refund(self, request, pk=None):
       # Process refund
   ```

4. **OutletViewSet:**
   ```python
   @action(detail=True, methods=['get'])
   def tills(self, request, pk=None):
       # Get tills for outlet
   ```

---

### 5. Missing Environment Files

**Backend:**
- ❌ `.env` file (user said created, need to verify)
- Need: SECRET_KEY, DB credentials, CORS settings

**Frontend:**
- ❌ `.env.local` file
- Need: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_USE_REAL_API

---

### 6. Missing Initial Data

**Need to create:**
1. Superuser (SaaS Admin)
2. Sample tenant (for testing)
3. Sample outlet
4. Sample products (optional, for testing)

---

### 7. API Response Format Issues

**Potential mismatches:**
1. **Pagination:**
   - Backend: Uses DRF pagination (returns `results`, `count`, `next`, `previous`)
   - Frontend: Some services expect array directly
   - **Fix:** Update frontend services to handle paginated responses

2. **Error Format:**
   - Backend: `{"detail": "error message"}`
   - Frontend: Expects `error.message`
   - **Fix:** Already handled in API client

3. **Nested Relationships:**
   - Backend: May return IDs only
   - Frontend: Expects full objects
   - **Fix:** Use `select_related` and `prefetch_related` in views

---

## 🔧 Integration Steps (Priority Order)

### Step 1: Create Migrations (CRITICAL)
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### Step 2: Verify Database Connection
- Test PostgreSQL connection
- Verify all tables created

### Step 3: Add Missing ViewSet Actions
- Add low_stock to ProductViewSet
- Add adjust_points to CustomerViewSet
- Add refund to SaleViewSet
- Add tills to OutletViewSet

### Step 4: Fix API Endpoint Mismatches
- Verify all URL patterns match
- Add missing endpoints
- Test each endpoint

### Step 5: Test Authentication Flow
- Test login endpoint
- Verify JWT tokens
- Test token refresh
- Test /auth/me endpoint

### Step 6: Test Core CRUD Operations
- Products CRUD
- Customers CRUD
- Sales creation
- Inventory operations

### Step 7: Test Multi-Tenancy
- Verify data isolation
- Test tenant switching
- Test SaaS admin access

---

## 📋 Quick Fix Checklist

### Backend Fixes Needed:
- [ ] Create migrations for all apps
- [ ] Add `low_stock` action to ProductViewSet
- [ ] Add `adjust_points` action to CustomerViewSet
- [ ] Add `refund` action to SaleViewSet
- [ ] Add `tills` action to OutletViewSet
- [ ] Verify all shift endpoints exist
- [ ] Verify all report endpoints exist
- [ ] Test all serializers return correct fields
- [ ] Add proper error handling
- [ ] Add pagination to all list views

### Frontend Fixes Needed:
- [ ] Update services to handle paginated responses
- [ ] Fix field name mismatches (date_joined vs created_at)
- [ ] Add proper error handling in all services
- [ ] Test all API calls with real backend
- [ ] Update types to match backend responses

---

## 🚀 Starting Integration

**Let's start with the most critical:**

1. **First:** Create migrations
2. **Second:** Run migrations
3. **Third:** Create superuser
4. **Fourth:** Test authentication
5. **Fifth:** Fix missing endpoints
6. **Sixth:** Test each module

Let's begin! 🎯

