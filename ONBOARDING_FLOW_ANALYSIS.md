'# Onboarding Flow Analysis

## 🔍 Problem Found

There are **TWO separate onboarding flows** that are NOT communicating:

### Flow 1: Single Page (`/onboarding/page.tsx`)
- ✅ **Working** - Uses real API
- 4 steps in one page
- Creates business + outlet
- Redirects to dashboard

### Flow 2: Multi-Page (`/onboarding/setup-business` → `setup-outlet` → `add-first-user`)
- ❌ **NOT Working** - Uses setTimeout mocks
- 3 separate pages
- `setup-business/page.tsx` - No API call
- `setup-outlet/page.tsx` - No API call
- `add-first-user/page.tsx` - ✅ Fixed (uses API)

## 🔧 Issues

1. **setup-business/page.tsx**:
   - Uses `setTimeout` mock
   - No form state management
   - Doesn't create business in database
   - Business types don't match backend (has extra types)

2. **setup-outlet/page.tsx**:
   - Uses `setTimeout` mock
   - No form state management
   - Doesn't create outlet in database
   - Doesn't know which business to create outlet for

3. **Data Sharing**:
   - Pages don't share data
   - No way to pass business ID between pages
   - Should use businessStore or URL params

## ✅ Fix Needed

1. Fix `setup-business/page.tsx` to create business via API
2. Fix `setup-outlet/page.tsx` to create outlet via API
3. Ensure all pages use businessStore to share data
4. Align business types with backend model

