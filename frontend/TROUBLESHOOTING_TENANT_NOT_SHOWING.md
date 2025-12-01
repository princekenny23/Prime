# Troubleshooting: Tenant Not Showing in Frontend

## Common Issues & Solutions

### Issue 1: `NEXT_PUBLIC_USE_REAL_API` Not Set
**Symptom:** Frontend uses mock data instead of real API

**Solution:**
Create or update `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_USE_REAL_API=true
NEXT_PUBLIC_APP_NAME=PrimePOS
```

**Then restart your Next.js dev server:**
```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

---

### Issue 2: Not Logged In
**Symptom:** No auth token, API calls fail

**Solution:**
1. Make sure you're logged in to the frontend
2. Check browser console for errors
3. Check Network tab - are API calls being made?
4. Verify token exists: Open browser console → `localStorage.getItem("authToken")`

---

### Issue 3: API Response Format
**Symptom:** Data exists but not showing

**Check:**
1. Open browser DevTools → Network tab
2. Look for `/api/v1/tenants/` or `/api/v1/admin/tenants/` request
3. Check the response format:
   - If it's `{results: [...], count: X}` → Paginated (handled now)
   - If it's `[...]` → Array (handled now)

---

### Issue 4: CORS Issues
**Symptom:** Network errors in console

**Solution:**
Backend CORS is already configured, but verify:
- Backend server is running on `http://localhost:8000`
- Frontend is running on `http://localhost:3000` (or configured port)

---

### Issue 5: Permissions
**Symptom:** 403 Forbidden errors

**Solution:**
- Make sure you're logged in as SaaS Admin
- Check user has `is_saas_admin = True` in Django admin
- Verify JWT token includes admin permissions

---

## Quick Debug Steps

### Step 1: Check Environment Variables
```bash
# In frontend directory
cat .env.local
# Should show:
# NEXT_PUBLIC_USE_REAL_API=true
# NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Step 2: Check Authentication
Open browser console:
```javascript
localStorage.getItem("authToken")
// Should return a JWT token string
```

### Step 3: Test API Directly
Open browser console:
```javascript
fetch('http://localhost:8000/api/v1/tenants/', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem("authToken")}`
  }
})
.then(r => r.json())
.then(console.log)
```

### Step 4: Check Backend
1. Visit Django Admin: http://localhost:8000/admin/
2. Go to Tenants → Tenants
3. Verify your tenant exists
4. Check tenant fields (name, email, is_active, etc.)

### Step 5: Check Network Tab
1. Open DevTools → Network
2. Refresh admin page
3. Look for:
   - `/api/v1/tenants/` request
   - `/api/v1/admin/tenants/` request
   - Check status code (should be 200)
   - Check response body

---

## Expected Behavior

### When Working Correctly:
1. **Admin Dashboard:**
   - Shows tenant count
   - Lists all tenants in cards
   - Stats update

2. **Tenants Page:**
   - Shows all tenants in table
   - Search works
   - Filter by status works

3. **Network Tab:**
   - API calls return 200 OK
   - Response contains tenant data
   - No CORS errors

---

## Still Not Working?

1. **Check Backend Logs:**
   - Look at Django server console
   - Any errors when API is called?

2. **Check Frontend Console:**
   - Any JavaScript errors?
   - Any API errors?

3. **Verify Tenant Data:**
   - In Django Admin, check tenant has:
     - `name` field
     - `email` field
     - `is_active = True` (if you want it visible)

4. **Test with curl:**
```bash
# Get your token from browser localStorage first
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     http://localhost:8000/api/v1/tenants/
```

---

**Most Common Fix:** Set `NEXT_PUBLIC_USE_REAL_API=true` in `.env.local` and restart dev server! 🎯

