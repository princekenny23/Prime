# Quick Fix: Tenant Not Showing

## Most Likely Issue: Environment Variable Not Set

### ✅ Fix This First:

1. **Create/Update `frontend/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_USE_REAL_API=true
NEXT_PUBLIC_APP_NAME=PrimePOS
```

2. **Restart Next.js Dev Server:**
```bash
# Stop server (Ctrl+C in terminal)
# Then restart
npm run dev
```

3. **Make Sure You're Logged In:**
   - Login to frontend with your credentials
   - Check browser console: `localStorage.getItem("authToken")` should return a token

---

## Verify It's Working

### Check Browser Console:
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh admin page
4. Look for:
   - `/api/v1/tenants/` request
   - Status: 200 OK
   - Response should contain your tenant

### Test API Directly:
Open browser console and run:
```javascript
fetch('http://localhost:8000/api/v1/tenants/', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem("authToken")}`
  }
})
.then(r => r.json())
.then(data => {
  console.log("Tenants:", data)
  // Should show your tenant(s)
})
```

---

## If Still Not Working

### Check These:

1. **Backend Running?**
   - Visit: http://localhost:8000/admin/
   - Should see Django admin

2. **Tenant Exists in Database?**
   - Django Admin → Tenants → Tenants
   - Your tenant should be listed

3. **Authentication Working?**
   - Check Network tab for 401/403 errors
   - Make sure token is valid

4. **CORS Issues?**
   - Check console for CORS errors
   - Backend CORS should be configured

---

**99% of the time, it's the `.env.local` file missing or `NEXT_PUBLIC_USE_REAL_API` not set to `true`!** 🎯

