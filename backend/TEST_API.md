# 🧪 API Testing Guide

## ✅ Server Status
**Backend Running:** http://localhost:8000

The 404 errors for `/` and `/favicon.ico` are **NORMAL** - we don't have a root URL configured. The API is working perfectly!

---

## 🎯 Test These Endpoints

### 1. API Root (Lists All Endpoints)
**URL:** http://localhost:8000/api/v1/

**Method:** GET

**Expected Response:**
```json
{
  "message": "PrimePOS API v1",
  "version": "1.0.0",
  "endpoints": {
    "authentication": {...},
    "tenants": {...},
    ...
  }
}
```

---

### 2. Test Login
**URL:** http://localhost:8000/api/v1/auth/login/

**Method:** POST

**Body (JSON):**
```json
{
  "email": "kwitondakenny@gmail.com",
  "password": "your-password"
}
```

**Expected Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "kwitondakenny@gmail.com",
    "username": "kenny",
    "is_saas_admin": true,
    ...
  }
}
```

---

### 3. Test Get Current User (Requires Token)
**URL:** http://localhost:8000/api/v1/auth/me/

**Method:** GET

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
```

**Expected Response:**
```json
{
  "id": 1,
  "email": "kwitondakenny@gmail.com",
  "username": "kenny",
  "name": "...",
  "is_saas_admin": true,
  ...
}
```

---

## 🛠️ How to Test

### Option 1: Browser
1. Visit: http://localhost:8000/api/v1/
2. Should see JSON with all endpoints

### Option 2: Postman
1. Create new request
2. Set method (GET/POST)
3. Enter URL
4. For POST: Add JSON body
5. For authenticated: Add Authorization header

### Option 3: curl (Command Line)
```bash
# Test API root
curl http://localhost:8000/api/v1/

# Test login
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"kwitondakenny@gmail.com","password":"your-password"}'
```

### Option 4: Python Requests
```python
import requests

# Test login
response = requests.post(
    'http://localhost:8000/api/v1/auth/login/',
    json={
        'email': 'kwitondakenny@gmail.com',
        'password': 'your-password'
    }
)
print(response.json())
```

---

## ✅ What's Working

- ✅ Server running
- ✅ Database connected
- ✅ API root endpoint working
- ✅ All URL routes configured
- ✅ Authentication endpoints ready

---

## 🚀 Next Steps

1. **Test Login** - Verify authentication works
2. **Create Frontend .env.local** - Configure API URL
3. **Test Frontend Connection** - Connect frontend to backend
4. **Test Full Flow** - Login → Get Data → Create Records

---

## 📝 Test Checklist

- [ ] API root returns endpoint list
- [ ] Login returns JWT tokens
- [ ] /auth/me/ returns user data (with token)
- [ ] Frontend can connect to backend
- [ ] Frontend login works

**Tell me what you want to test next!** 🎯

