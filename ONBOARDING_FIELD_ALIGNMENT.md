# Onboarding Field Alignment - Frontend vs Backend

## 🔍 Issues Found

### 1. **Currency Symbol Default Mismatch** ⚠️
- **Backend Default:** `currency_symbol = "K"` (models.py line 16)
- **Frontend Default:** `currencySymbol: "MK"` (onboarding/page.tsx line 32)
- **Fix:** Align to use "MK" for MWK (Malawian Kwacha)

### 2. **User Creation Missing** ❌
- **Problem:** No API endpoint to create users for a business during onboarding
- **Current:** Register endpoint exists but doesn't associate tenant
- **Fix Needed:** Create user creation endpoint or enhance register to accept tenant

### 3. **Business Type Options** ✅
- **Backend:** `('retail', 'restaurant', 'bar')` - MATCHES
- **Frontend:** `"retail" | "restaurant" | "bar"` - MATCHES

### 4. **Currency Options** ✅
- **Backend:** No validation, accepts any 3-char code - FLEXIBLE
- **Frontend:** MWK, USD, EUR, GBP - VALID

### 5. **User Role Options** ⚠️
- **Backend:** `('admin', 'manager', 'cashier', 'staff', 'saas_admin')`
- **Frontend:** `"admin" | "manager" | "cashier" | "staff"` (missing saas_admin)
- **Note:** saas_admin shouldn't be selectable in frontend anyway

---

## 🔧 Fixes Needed

1. Fix currency symbol default to "MK"
2. Create user creation API endpoint
3. Create userService for frontend
4. Update onboarding to create user if owner info provided
5. Verify all field mappings

