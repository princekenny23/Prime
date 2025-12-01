# Debug Login Issues

## What to Check

### 1. Browser Console
Open DevTools (F12) → Console tab
Look for:
- "Attempting login to: /auth/login/"
- "Login response received"
- "Tokens stored in localStorage"
- Any error messages

### 2. Network Tab
Open DevTools (F12) → Network tab
Look for:
- `/api/v1/auth/login/` request
- Status code (200, 400, 401, 500?)
- Response body

### 3. Check Backend
- Is backend server running? http://localhost:8000
- Check Django console for errors

### 4. Check Credentials
- Email matches your superuser email?
- Password correct?
- User exists in database?

---

## Common Errors

### Error: "Network request failed"
**Cause:** Backend not running or CORS issue
**Fix:** 
1. Start backend: `python manage.py runserver`
2. Check CORS settings

### Error: "401 Unauthorized"
**Cause:** Wrong email/password
**Fix:** Check credentials in Django admin

### Error: "500 Internal Server Error"
**Cause:** Backend error
**Fix:** Check Django console for error details

### Error: "CORS policy"
**Cause:** CORS not configured
**Fix:** Backend CORS should already be configured

---

## Test API Directly

Open browser console and run:
```javascript
fetch('http://localhost:8000/api/v1/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'YOUR_EMAIL',
    password: 'YOUR_PASSWORD'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

**Share the console output and I'll help fix it!** 🎯

