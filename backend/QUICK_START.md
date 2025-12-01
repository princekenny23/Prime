# Quick Start - Integration Commands

## Prerequisites Check

1. **PostgreSQL Running?**
   ```bash
   # Check service (Windows)
   # Services → PostgreSQL
   
   # Or test
   psql -U postgres
   ```

2. **Virtual Environment Activated?**
   ```bash
   # Should see (env) in prompt
   backend\env\Scripts\activate
   ```

---

## Complete Setup Commands (Run in Order)

### 1. Create Database
```bash
createdb -U postgres primepos_db
```

### 2. Create Migrations
```bash
cd backend
python manage.py makemigrations
```

### 3. Run Migrations
```bash
python manage.py migrate
```

### 4. Create Superuser
```bash
python manage.py createsuperuser
# Enter: email, username, password
```

### 5. Make SaaS Admin (in Django shell)
```bash
python manage.py shell
```
```python
from apps.accounts.models import User
u = User.objects.get(email='YOUR-EMAIL')
u.is_saas_admin = True
u.role = 'saas_admin'
u.is_staff = True
u.is_superuser = True
u.save()
exit()
```

### 6. Start Server
```bash
python manage.py runserver
```

### 7. Test
- Visit: http://localhost:8000/admin/
- Login with your credentials

---

## Frontend Setup

### Create `.env.local` in frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_USE_REAL_API=false
NEXT_PUBLIC_APP_NAME=PrimePOS
```

---

## What to Report

After each step, tell me:
1. ✅ Success or ❌ Error
2. Output/error message
3. Ready for next step

Let's go! 🚀

