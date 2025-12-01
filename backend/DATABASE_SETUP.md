# Database Setup Instructions

## ✅ Database Created
You've created the database `primepos` in pgAdmin. Great!

## ⚠️ Next Step: Create .env File

The `.env` file is needed for database connection. **Create it manually** in the `backend` folder:

### Step 1: Create `.env` file
**Location:** `backend/.env`

**Content:**
```env
# Django Settings
SECRET_KEY=django-insecure-change-me-in-production-please-use-strong-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DB_NAME=primepos
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
DB_HOST=localhost
DB_PORT=5432
```

### Step 2: Update Password
**Replace `YOUR_POSTGRES_PASSWORD_HERE` with your actual PostgreSQL password.**

**How to find your password:**
- Check pgAdmin → Right-click server → Properties → Connection
- Or check if you set it during PostgreSQL installation
- Default might be: `postgres` (if you didn't change it)

### Step 3: Test Connection
After creating `.env`, run:
```bash
cd backend
python manage.py makemigrations
```

**Expected:** Should create migrations without password errors

---

## 🔐 If You Don't Know Your Password

### Option 1: Reset PostgreSQL Password
```sql
-- Connect as postgres user
ALTER USER postgres WITH PASSWORD 'newpassword';
```

### Option 2: Check pgAdmin
1. Open pgAdmin
2. Right-click your server
3. Properties → Connection tab
4. Check the password field

---

## ✅ Once .env is Created

Tell me:
1. ✅ `.env` file created?
2. ✅ Password set correctly?
3. Ready to run migrations?

Then we'll proceed! 🚀

