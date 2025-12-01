# Phase 1: Foundation & Infrastructure Setup - Step by Step Guide

## Current Status Check ✅

You've already done:
- ✅ Created backend .env file
- ✅ Installed requirements.txt
- ✅ Backend structure is ready

---

## Step 1: Verify Environment File

**Location:** `backend/.env`

**Required Variables:**
```env
SECRET_KEY=your-secret-key-here-make-it-long-and-random
DEBUG=True
DB_NAME=primepos_db
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Action Items:**
1. Open `backend/.env` file
2. Verify all variables are set
3. Generate a secure SECRET_KEY (you can use: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)

**Tell me:** Do you have the .env file with all these variables? What's your PostgreSQL password?

---

## Step 2: Verify PostgreSQL is Running

**Check if PostgreSQL is installed and running:**

**Windows:**
```bash
# Check if PostgreSQL service is running
# Open Services (services.msc) and look for "postgresql" service
```

**Or test connection:**
```bash
psql -U postgres -h localhost
```

**Action Items:**
1. Verify PostgreSQL is installed
2. Check if service is running
3. Test connection with your credentials

**Tell me:** Is PostgreSQL running? Can you connect to it?

---

## Step 3: Create Database

**Command:**
```bash
cd backend
# Make sure you're in the backend directory

# Create database (if it doesn't exist)
# Option 1: Using psql
psql -U postgres -c "CREATE DATABASE primepos_db;"

# Option 2: Using createdb command
createdb -U postgres primepos_db
```

**Action Items:**
1. Navigate to backend directory
2. Run the database creation command
3. Verify database was created

**Tell me:** Did the database creation succeed? Any errors?

---

## Step 4: Activate Virtual Environment

**Command:**
```bash
# Windows
backend\env\Scripts\activate

# Or if using PowerShell
backend\env\Scripts\Activate.ps1

# Linux/Mac
source backend/env/bin/activate
```

**Verify:**
- Your terminal prompt should show `(env)` at the beginning
- Python should be from the venv: `which python` (should show env path)

**Tell me:** Is your virtual environment activated? Can you see `(env)` in your terminal?

---

## Step 5: Run Migrations

**This is CRITICAL - Must be done before creating superuser**

**Command:**
```bash
# Make sure you're in backend directory with venv activated
python manage.py migrate
```

**What this does:**
- Creates all database tables
- Sets up relationships
- Creates indexes
- Applies all model changes

**Expected Output:**
You should see:
```
Operations to perform:
  Apply all migrations: admin, auth, accounts, tenants, outlets, products, ...
Running migrations:
  Applying accounts.0001_initial... OK
  Applying tenants.0001_initial... OK
  ...
```

**Action Items:**
1. Run the migrate command
2. Check for any errors
3. Verify all migrations applied successfully

**Tell me:** Did migrations run successfully? Any errors? How many migrations were applied?

---

## Step 6: Verify Database Schema

**Check tables were created:**

**Option 1: Using Django shell**
```bash
python manage.py shell
```

Then in shell:
```python
from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
tables = cursor.fetchall()
for table in tables:
    print(table[0])
exit()
```

**Option 2: Using psql**
```bash
psql -U postgres -d primepos_db -c "\dt"
```

**Expected Tables:**
- accounts_user
- tenants_tenant
- outlets_outlet
- products_product
- products_category
- sales_sale
- inventory_stockmovement
- shifts_shift
- customers_customer
- ... and more

**Tell me:** Can you see the tables? How many tables were created?

---

## Step 7: Create Superuser (SaaS Admin) - TOGETHER

**This is where we work together!**

**Command:**
```bash
python manage.py createsuperuser
```

**What you'll be asked:**
1. Email address: (this is the USERNAME_FIELD)
2. Username: (required field)
3. Password: (will ask twice)
4. Name: (optional, can be blank)
5. Phone: (optional, can be blank)

**Important Notes:**
- Email must be unique
- Password should be strong
- This user will be a SaaS Admin (we'll set this after creation)

**Action Items:**
1. Run `python manage.py createsuperuser`
2. Enter the details when prompted
3. Tell me what email/username you used
4. After creation, we'll make this user a SaaS Admin

**Tell me:** What email did you use for the superuser? Did it create successfully?

---

## Step 8: Make User SaaS Admin (After Creation)

**We'll do this together using Django shell:**

```bash
python manage.py shell
```

Then run:
```python
from apps.accounts.models import User

# Get your user (replace email with what you used)
user = User.objects.get(email='your-email@example.com')

# Make them SaaS Admin
user.is_saas_admin = True
user.role = 'saas_admin'
user.is_staff = True  # Allows Django admin access
user.is_superuser = True  # Django superuser
user.save()

# Verify
print(f"User: {user.email}")
print(f"Is SaaS Admin: {user.is_saas_admin}")
print(f"Role: {user.role}")

exit()
```

**Tell me:** Did this work? Can you see the user is now a SaaS Admin?

---

## Step 9: Test Backend Server

**Start the server:**
```bash
python manage.py runserver
```

**Expected Output:**
```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
Django version 4.2.7, using settings 'primepos.settings.development'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

**Test Endpoints:**

1. **Django Admin:**
   - Open browser: `http://localhost:8000/admin/`
   - Login with your superuser credentials
   - Verify you can access admin panel

2. **API Root (if configured):**
   - Try: `http://localhost:8000/api/v1/`
   - Should show API info or 404 (both are OK at this stage)

3. **Check CORS Headers:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Make a request to the API
   - Check Response Headers for CORS headers

**Tell me:** 
- Is the server running?
- Can you access Django admin?
- Any errors in the console?

---

## Step 10: Verify Frontend Environment

**Location:** `frontend/.env.local`

**Required Variables:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_USE_REAL_API=false
NEXT_PUBLIC_APP_NAME=PrimePOS
```

**Action Items:**
1. Create/verify `frontend/.env.local` file
2. Set `NEXT_PUBLIC_USE_REAL_API=false` (we'll enable later)
3. Verify API URL matches backend

**Tell me:** Do you have the frontend .env.local file? Is it configured correctly?

---

## Step 11: Test API Client Connection

**We'll test this in the next phase, but let's verify setup:**

1. **Check `frontend/lib/api.ts`:**
   - Verify base URL is correct
   - Check token storage logic

2. **Check `frontend/lib/utils/api-config.ts`:**
   - Verify `useRealAPI()` function
   - Check environment variable reading

**Tell me:** Are these files configured correctly? Any issues?

---

## Phase 1 Completion Checklist

Before moving to Phase 2, verify:

- [ ] Backend .env file configured
- [ ] PostgreSQL database created
- [ ] Migrations run successfully
- [ ] Database tables created
- [ ] Superuser created
- [ ] Superuser is SaaS Admin
- [ ] Backend server runs without errors
- [ ] Django admin accessible
- [ ] Frontend .env.local configured
- [ ] CORS headers working

---

## Next Steps

Once Phase 1 is complete:
1. We'll move to **Phase 2: Authentication**
2. Test login endpoint
3. Verify JWT tokens
4. Test token refresh

---

## Common Issues & Solutions

### Issue: "django.db.utils.OperationalError: could not connect to server"
**Solution:** 
- Check PostgreSQL is running
- Verify DB credentials in .env
- Check DB_HOST and DB_PORT

### Issue: "ModuleNotFoundError: No module named 'apps'"
**Solution:**
- Make sure you're in the backend directory
- Virtual environment should be activated
- Check PYTHONPATH

### Issue: "django.core.exceptions.ImproperlyConfigured: SECRET_KEY"
**Solution:**
- Check .env file exists
- Verify SECRET_KEY is set
- Check file is in backend/ directory

### Issue: "psycopg2.OperationalError: FATAL: password authentication failed"
**Solution:**
- Verify PostgreSQL password in .env
- Check DB_USER is correct
- Try resetting PostgreSQL password

---

## Let's Start!

**Begin with Step 1** and tell me:
1. What step you're on
2. Any errors you encounter
3. What you see/need help with

I'll guide you through each step! 🚀

