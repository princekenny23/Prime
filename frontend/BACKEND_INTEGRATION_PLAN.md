# Backend Integration Plan - PrimePOS Professional POS System

## Overview

This is a comprehensive, phased approach to integrate the Next.js frontend with the Django REST Framework backend for a production-ready, multi-tenant SaaS POS platform.

**Current Status:**
- ✅ Frontend: 30+ pages ready, all using service layer pattern
- ✅ Backend: Django REST Framework with multi-tenancy, JWT auth, PostgreSQL
- ✅ Service Layer: All services created and ready
- ⏳ Integration: Ready to begin

---

## Phase 1: Foundation & Infrastructure Setup (Days 1-2)

### 1.1 Environment Configuration

**Backend (.env):**
```env
SECRET_KEY=<generate-secure-key>
DEBUG=True
DB_NAME=primepos_db
DB_USER=postgres
DB_PASSWORD=<secure-password>
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
JWT_SECRET_KEY=<generate-secure-key>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_LIFETIME=3600  # 1 hour
REFRESH_TOKEN_LIFETIME=604800  # 7 days
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_USE_REAL_API=false  # Start with false, enable per phase
NEXT_PUBLIC_APP_NAME=PrimePOS
```

### 1.2 Database Setup

1. **Create PostgreSQL database:**
   ```bash
   createdb primepos_db
   ```

2. **Run migrations:**
   ```bash
   cd backend
   python manage.py migrate
   ```

3. **Create superuser (SaaS Admin):**
   ```bash
   python manage.py createsuperuser
   ```

4. **Verify database schema:**
   - Check all tables created
   - Verify foreign key relationships
   - Confirm indexes are in place

### 1.3 Backend Server Verification

1. **Start backend:**
   ```bash
   python manage.py runserver
   ```

2. **Test endpoints:**
   - `GET http://localhost:8000/api/v1/` - Should return API info
   - `GET http://localhost:8000/admin/` - Django admin access
   - Verify CORS headers in response

3. **Check API documentation:**
   - Visit any endpoint to see DRF browsable API
   - Verify authentication requirements

### 1.4 Frontend API Client Verification

1. **Test API client:**
   - Check `lib/api.ts` has correct base URL
   - Verify token storage/retrieval
   - Test error handling

2. **Verify service layer:**
   - All services import correctly
   - API endpoints match backend routes
   - Error handling is in place

---

## Phase 2: Authentication & User Management (Days 2-3)

### 2.1 Authentication Flow

**Priority: CRITICAL** - Everything depends on this

**Steps:**

1. **Test Login Endpoint:**
   - Backend: `POST /api/v1/auth/login/`
   - Frontend: `authService.login()`
   - Verify JWT tokens returned
   - Check token storage in localStorage

2. **Test Token Refresh:**
   - Backend: `POST /api/v1/auth/refresh/`
   - Frontend: Auto-refresh on 401
   - Verify refresh token rotation

3. **Test Current User:**
   - Backend: `GET /api/v1/auth/me/`
   - Frontend: `authStore.me()`
   - Verify user data structure matches

4. **Test Logout:**
   - Backend: `POST /api/v1/auth/logout/`
   - Frontend: `authStore.logout()`
   - Verify token cleanup

**Testing Checklist:**
- [ ] Login with valid credentials works
- [ ] Login with invalid credentials shows error
- [ ] Token stored in localStorage
- [ ] Token included in subsequent requests
- [ ] Token refresh works automatically
- [ ] Logout clears tokens
- [ ] Protected routes redirect if not authenticated

**Enable Real API:**
```env
NEXT_PUBLIC_USE_REAL_API=true  # Only for auth
```

### 2.2 User Registration & Onboarding

1. **Test Registration:**
   - Backend: `POST /api/v1/auth/register/`
   - Frontend: `app/onboarding/page.tsx`
   - Verify tenant creation
   - Check outlet creation
   - Confirm user assignment

2. **Test Multi-Tenant Isolation:**
   - Create two users with different tenants
   - Verify data isolation
   - Test SaaS admin access to all tenants

---

## Phase 3: Core Business Data (Days 3-5)

### 3.1 Tenant & Outlet Management

**Priority: HIGH** - Required for all other features

**Steps:**

1. **Tenant Service:**
   - `GET /api/v1/tenants/` - List tenants
   - `GET /api/v1/tenants/{id}/` - Get tenant
   - `POST /api/v1/tenants/` - Create tenant (admin)
   - Verify tenant switching works

2. **Outlet Service:**
   - `GET /api/v1/outlets/` - List outlets
   - `POST /api/v1/outlets/` - Create outlet
   - `GET /api/v1/outlets/{id}/tills/` - Get tills
   - Test outlet filtering by tenant

**Testing:**
- [ ] Create tenant via admin dashboard
- [ ] Create outlet for tenant
- [ ] Switch between outlets
- [ ] Verify data filtered by outlet
- [ ] Test multi-outlet scenarios

### 3.2 Product Management

**Priority: HIGH** - Core POS functionality

**Steps:**

1. **Product CRUD:**
   - `GET /api/v1/products/` - List with filters
   - `POST /api/v1/products/` - Create product
   - `PUT /api/v1/products/{id}/` - Update product
   - `DELETE /api/v1/products/{id}/` - Delete product
   - `GET /api/v1/products/low_stock/` - Low stock alert

2. **Category Management:**
   - `GET /api/v1/categories/` - List categories
   - `POST /api/v1/categories/` - Create category
   - Test category filtering

3. **Product Images:**
   - Test image upload
   - Verify image URLs
   - Test image display in frontend

**Testing:**
- [ ] Create product with all fields
- [ ] Update product stock
- [ ] Filter products by category
- [ ] Search products
- [ ] Low stock alerts work
- [ ] Product images display correctly

**Enable Real API:**
```env
NEXT_PUBLIC_USE_REAL_API=true  # For products
```

---

## Phase 4: Inventory Management (Days 5-6)

### 4.1 Stock Operations

**Steps:**

1. **Stock Adjustments:**
   - `POST /api/v1/inventory/adjust/` - Adjust stock
   - Verify stock movements recorded
   - Test positive/negative adjustments

2. **Stock Transfers:**
   - `POST /api/v1/inventory/transfer/` - Transfer between outlets
   - Verify atomic operations
   - Test transfer history

3. **Stock Movements:**
   - `GET /api/v1/inventory/movements/` - Movement history
   - Filter by product, outlet, date
   - Verify audit trail

4. **Stock Taking:**
   - `POST /api/v1/inventory/stock-take/` - Start stock take
   - `POST /api/v1/inventory/stock-take/{id}/complete/` - Complete
   - Test multi-user stock taking
   - Verify reconciliation

**Testing:**
- [ ] Adjust stock up/down
- [ ] Transfer stock between outlets
- [ ] View movement history
- [ ] Start and complete stock take
- [ ] Verify stock accuracy

---

## Phase 5: Sales & Transactions (Days 6-8)

### 5.1 Shift Management

**Priority: CRITICAL** - POS requires active shift

**Steps:**

1. **Start Shift:**
   - `POST /api/v1/shifts/start/` - Start shift
   - Verify till assignment
   - Check opening balance

2. **Active Shift:**
   - `GET /api/v1/shifts/active/` - Get active shift
   - Verify shift context works
   - Test shift switching

3. **Close Shift:**
   - `POST /api/v1/shifts/{id}/close/` - Close shift
   - Verify closing balance
   - Test shift summary

4. **Shift History:**
   - `GET /api/v1/shifts/history/` - List shifts
   - Filter by date, outlet
   - Test shift reports

**Testing:**
- [ ] Start shift with till
- [ ] Verify register closed screen
- [ ] Complete shift workflow
- [ ] View shift history
- [ ] Test shift reconciliation

### 5.2 Sales Processing

**Priority: CRITICAL** - Core POS functionality

**Steps:**

1. **Create Sale:**
   - `POST /api/v1/sales/` - Create sale
   - Verify atomic transaction
   - Test stock deduction
   - Check payment processing

2. **Sale Items:**
   - Verify line items saved
   - Test discounts applied
   - Check tax calculations
   - Verify receipt generation

3. **Sale List:**
   - `GET /api/v1/sales/` - List sales
   - Filter by date, outlet, customer
   - Test pagination
   - Verify performance

4. **Refunds:**
   - `POST /api/v1/sales/{id}/refund/` - Process refund
   - Verify stock restoration
   - Test partial refunds
   - Check refund history

**Testing:**
- [ ] Create sale with multiple items
- [ ] Apply discounts
- [ ] Process different payment methods
- [ ] Generate receipt
- [ ] Process refund
- [ ] Verify stock updates
- [ ] Test concurrent sales

**Enable Real API:**
```env
NEXT_PUBLIC_USE_REAL_API=true  # For sales
```

---

## Phase 6: Customer Management (Days 8-9)

### 6.1 Customer CRUD

**Steps:**

1. **Customer Operations:**
   - `GET /api/v1/customers/` - List customers
   - `POST /api/v1/customers/` - Create customer
   - `PUT /api/v1/customers/{id}/` - Update customer
   - Test customer search

2. **Loyalty Points:**
   - `POST /api/v1/customers/{id}/adjust_points/` - Adjust points
   - Verify points calculation on sales
   - Test points redemption

3. **Customer History:**
   - View purchase history
   - Test customer analytics
   - Verify lifetime value

**Testing:**
- [ ] Create customer
- [ ] Update customer info
- [ ] Adjust loyalty points
- [ ] View purchase history
- [ ] Test customer search

---

## Phase 7: Reports & Analytics (Days 9-10)

### 7.1 Report Endpoints

**Steps:**

1. **Sales Reports:**
   - `GET /api/v1/reports/sales/` - Sales data
   - Test date filtering
   - Verify aggregation

2. **Product Reports:**
   - `GET /api/v1/reports/products/` - Product performance
   - Test top-selling products
   - Verify revenue calculations

3. **Customer Reports:**
   - `GET /api/v1/reports/customers/` - Customer analytics
   - Test segmentation
   - Verify metrics

4. **Profit & Loss:**
   - `GET /api/v1/reports/profit-loss/` - P&L statement
   - Verify calculations
   - Test period filtering

5. **Stock Movement:**
   - `GET /api/v1/reports/stock-movement/` - Stock reports
   - Test movement tracking
   - Verify accuracy

**Testing:**
- [ ] Generate all report types
- [ ] Test date range filtering
- [ ] Verify calculations
- [ ] Test export functionality
- [ ] Check performance with large datasets

---

## Phase 8: Advanced Features (Days 10-12)

### 8.1 Restaurant Features

**Steps:**

1. **Table Management:**
   - Create table service
   - Test table status updates
   - Verify order-table linking

2. **Kitchen Orders (KOT):**
   - Test order status workflow
   - Verify kitchen display
   - Test order completion

3. **Menu Builder:**
   - Test menu structure
   - Verify category organization
   - Test menu display

### 8.2 Bar Features

**Steps:**

1. **Bar Tabs:**
   - Test tab creation
   - Verify tab management
   - Test tab closing

2. **Expenses:**
   - Test expense tracking
   - Verify category management
   - Test expense reports

### 8.3 Retail Features

**Steps:**

1. **Returns:**
   - Test return processing
   - Verify refund workflow
   - Test return history

2. **Discounts:**
   - Test discount creation
   - Verify discount application
   - Test discount rules

3. **Loyalty Program:**
   - Test tier management
   - Verify point calculations
   - Test rewards redemption

---

## Phase 9: Admin & Platform Features (Days 12-13)

### 9.1 SaaS Admin Features

**Steps:**

1. **Tenant Management:**
   - `GET /api/v1/admin/tenants/` - List all tenants
   - Test tenant suspension
   - Verify tenant activation

2. **Platform Analytics:**
   - `GET /api/v1/admin/analytics/` - Platform stats
   - Test aggregation
   - Verify multi-tenant data

3. **User Management:**
   - Test user creation
   - Verify role assignment
   - Test permission checks

### 9.2 Staff Management

**Steps:**

1. **Staff CRUD:**
   - `GET /api/v1/staff/` - List staff
   - Test staff creation
   - Verify role management

2. **Attendance:**
   - Test attendance tracking
   - Verify shift assignment
   - Test attendance reports

---

## Phase 10: Testing & Optimization (Days 13-14)

### 10.1 Integration Testing

**Test Scenarios:**

1. **End-to-End Workflows:**
   - Complete sale from start to finish
   - Shift open → sales → shift close
   - Product creation → inventory → sale
   - Customer creation → sale → loyalty points

2. **Multi-User Scenarios:**
   - Multiple users same tenant
   - Multiple users different tenants
   - Concurrent sales
   - Concurrent stock operations

3. **Error Handling:**
   - Network failures
   - Invalid data
   - Permission errors
   - Token expiration

4. **Performance:**
   - Large product catalogs
   - High transaction volumes
   - Complex reports
   - Real-time updates

### 10.2 Data Migration

**Steps:**

1. **Export Mock Data:**
   - Use simulation export feature
   - Verify data structure
   - Check data integrity

2. **Import to Backend:**
   - Create migration scripts
   - Import products
   - Import customers
   - Import historical sales (if needed)

3. **Verify Migration:**
   - Check data accuracy
   - Verify relationships
   - Test with migrated data

### 10.3 Performance Optimization

**Optimizations:**

1. **Backend:**
   - Database indexing
   - Query optimization
   - Caching (Redis)
   - Pagination

2. **Frontend:**
   - API response caching
   - Optimistic updates
   - Lazy loading
   - Code splitting

3. **Network:**
   - Request batching
   - Compression
   - CDN for static assets

---

## Phase 11: Security & Production Prep (Days 14-15)

### 11.1 Security Hardening

**Checklist:**

1. **Authentication:**
   - [ ] JWT token security
   - [ ] Token expiration
   - [ ] Refresh token rotation
   - [ ] Password requirements

2. **Authorization:**
   - [ ] Role-based access control
   - [ ] Tenant isolation
   - [ ] Permission checks
   - [ ] API rate limiting

3. **Data Security:**
   - [ ] SQL injection prevention
   - [ ] XSS protection
   - [ ] CSRF protection
   - [ ] Data encryption

4. **API Security:**
   - [ ] HTTPS only
   - [ ] CORS configuration
   - [ ] Input validation
   - [ ] Error message sanitization

### 11.2 Production Configuration

**Backend (.env.production):**
```env
DEBUG=False
SECRET_KEY=<production-secret>
DB_NAME=primepos_prod
DB_USER=primepos_user
DB_PASSWORD=<secure-password>
DB_HOST=<production-host>
CORS_ALLOWED_ORIGINS=https://yourdomain.com
ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com
```

**Frontend (.env.production):**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_USE_REAL_API=true
NEXT_PUBLIC_APP_NAME=PrimePOS
```

### 11.3 Monitoring & Logging

**Setup:**

1. **Error Tracking:**
   - Sentry or similar
   - Error logging
   - Performance monitoring

2. **Analytics:**
   - User activity tracking
   - API usage metrics
   - Performance metrics

3. **Logging:**
   - Application logs
   - API request logs
   - Error logs
   - Audit trails

---

## Integration Guide Updates

### What to Update in INTEGRATION_GUIDE.md:

1. **Add Phase-by-Phase Section:**
   - Document each phase
   - Add testing checklists
   - Include troubleshooting

2. **Update API Endpoints:**
   - Verify all endpoints match
   - Add new endpoints as created
   - Document request/response formats

3. **Add Common Issues:**
   - Document issues found during integration
   - Add solutions
   - Include workarounds

4. **Update Service Examples:**
   - Add real-world examples
   - Include error handling
   - Show best practices

5. **Add Performance Tips:**
   - Optimization strategies
   - Caching guidelines
   - Query optimization

---

## Rollback Strategy

### If Issues Arise:

1. **Immediate Rollback:**
   ```env
   NEXT_PUBLIC_USE_REAL_API=false
   ```
   - System returns to mock API
   - No data loss
   - Continue development

2. **Partial Rollback:**
   - Disable specific features
   - Keep working features on real API
   - Fix issues incrementally

3. **Database Rollback:**
   - Keep database backups
   - Use migrations to rollback
   - Restore from backup if needed

---

## Success Criteria

### Phase Completion:

Each phase is complete when:
- [ ] All endpoints tested and working
- [ ] Frontend displays data correctly
- [ ] Error handling works
- [ ] Loading states implemented
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security verified

### Final Integration Complete:

- [ ] All features working with real API
- [ ] No mock data dependencies
- [ ] All tests passing
- [ ] Performance optimized
- [ ] Security hardened
- [ ] Documentation updated
- [ ] Production ready

---

## Timeline Summary

- **Days 1-2:** Foundation & Infrastructure
- **Days 2-3:** Authentication
- **Days 3-5:** Core Business Data
- **Days 5-6:** Inventory
- **Days 6-8:** Sales & Transactions
- **Days 8-9:** Customers
- **Days 9-10:** Reports
- **Days 10-12:** Advanced Features
- **Days 12-13:** Admin Features
- **Days 13-14:** Testing & Optimization
- **Days 14-15:** Security & Production

**Total: ~15 days for complete integration**

---

## Next Steps

1. **Start with Phase 1** - Set up environments
2. **Test each phase thoroughly** before moving on
3. **Document issues** as you go
4. **Update integration guide** after each phase
5. **Keep mock API as fallback** until fully tested

This phased approach ensures a stable, professional integration with minimal risk.

