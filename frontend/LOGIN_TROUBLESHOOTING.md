# Login Troubleshooting Guide

## What I've Added

### Debug Logging (Safe - No Credentials)
I've added console logs that will help us debug:
- ✅ "Attempting login to: /auth/login/"
- ✅ "Login response received" (without credentials)
- ✅ "Tokens stored in localStorage"
- ✅ Error messages (without credentials)

### Security
- ❌ **NO credentials are logged**
- ❌ **NO passwords in console**
- ✅ Only error messages and status

---

## What to Check Now

### Step 1: Open Browser Console
1. Press F12
2. Go to Console tab
3. Clear console (right-click → Clear console)
4. Try to login
5. **Copy ALL console messages** and share them

### Step 2: Check Network Tab
1. Press F12
2. Go to Network tab
3. Clear network log
4. Try to login
5. Look for `/api/v1/auth/login/` request
6. Click on it
7. Check:
   - **Status Code** (200, 400, 401, 500?)
   - **Request Payload** (should show email, but password should be hidden)
   - **Response** (what does it say?)

### Step 3: Check Backend Console
1. Look at your Django server terminal
2. Do you see any errors when you try to login?
3. What does it say?

---

## Common Issues

### Issue: "Network request failed"
**Meaning:** Can't reach backend
**Check:**
- Is backend running? http://localhost:8000
- Check backend terminal for errors

### Issue: "401 Unauthorized" or "Invalid credentials"
**Meaning:** Wrong email/password
**Check:**
- Email matches your superuser email exactly?
- Password correct?
- User exists in database?

### Issue: "500 Internal Server Error"
**Meaning:** Backend error
**Check:**
- Django console for error details
- Database connection OK?

### Issue: Console shows credentials
**This shouldn't happen** - but if it does:
- It's likely the browser's Network tab showing the request
- This is normal browser behavior
- The actual code doesn't log credentials

---

## Quick Test

**Test the API directly:**
1. Open browser console
2. Run this (replace with your credentials):
```javascript
fetch('http://localhost:8000/api/v1/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'kwitondakenny@gmail.com',
    password: 'YOUR_PASSWORD'
  })
})
.then(r => {
  console.log('Status:', r.status)
  return r.json()
})
.then(data => {
  console.log('Response:', data)
})
.catch(err => {
  console.error('Error:', err)
})
```

**Share the output and I'll fix it!** 🎯

---

## What I Need From You

1. **Console messages** (copy all of them)
2. **Network tab** - Status code and response
3. **Backend console** - Any errors?
4. **What happens** - Does it show an error? Stay on login page?

This will help me identify the exact problem! 🔍

