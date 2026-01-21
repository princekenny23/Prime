# Quick Start Guide - For the Next Developer

**Time to first working system**: ~30 minutes  
**Difficulty**: Beginner-friendly

## Step 1: System Check (5 min)

Verify you have:
```bash
# Check Python version
python --version  # Need 3.8+

# Check Node version
node --version    # Need 18+

# Check if Git is available
git --version
```

## Step 2: Backend Setup (10 min)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv env

# Activate it (Windows)
env\Scripts\activate
# OR (Linux/Mac)
source env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
# (Copy from example below)

# Run migrations to set up database
python manage.py migrate

# Create admin user
python manage.py createsuperuser
# Follow prompts - remember username/password!

# Start server
python manage.py runserver
# Should see: "Starting development server at http://127.0.0.1:8000/"
```

**Backend .env file** (create `backend/.env`):
```env
SECRET_KEY=your-dev-secret-key-change-this-in-production
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

✅ **Backend is running at**: http://localhost:8000

## Step 3: Frontend Setup (10 min)

In a **NEW terminal**:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env.local file
# (Copy from example below)

# Start development server
npm run dev
# Should see: "Local: http://localhost:3000"
```

**Frontend .env.local file** (create `frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_USE_REAL_API=true
```

✅ **Frontend is running at**: http://localhost:3000

## Step 4: Create Your First Business (5 min)

### Via Admin Panel:
1. Go to http://localhost:8000/admin/
2. Login with superuser credentials you created
3. Click "Tenants" → "Add Tenant"
4. Fill in:
   - **Name**: "My Test Business"
   - **Type**: "retail"
   - **Currency**: "MWK"
   - **Currency Symbol**: "MK"
5. Save
6. Go to "Outlets" → "Add Outlet"
7. Fill in:
   - **Name**: "Main Store"
   - **Tenant**: Select the tenant you created
8. Save

### Create a User:
1. Go to "Users" → "Add User"
2. Fill in:
   - **Username**: "cashier"
   - **Email**: "cashier@test.com"
   - **Password**: "testpass123"
   - **Tenant**: Select your tenant
3. Save

## Step 5: Test the POS System (5 min)

### Create some products first:
1. In Django admin: "Products" → "Add Product"
2. Fill in:
   - **Name**: "T-Shirt"
   - **Category**: Create new → "Clothing"
   - **Tenant**: Your tenant
3. Save
4. Go to "Item Variations" → "Add Item Variation"
5. Fill in:
   - **Product**: T-Shirt
   - **SKU**: "TSH-001"
   - **Retail Price**: 5000
   - **Quantity On Hand**: 100
6. Save

### Try the POS:
1. Go to http://localhost:3000
2. Login with username: "cashier", password: "testpass123"
3. You should see the dashboard
4. Click "POS" or navigate to the retail checkout
5. You should see your T-Shirt product
6. Click to add to cart
7. Try to complete a sale with cash payment
8. ✅ If it works, you're in business!

## Troubleshooting

### Backend won't start
```
Error: ModuleNotFoundError: No module named 'django'
```
**Solution**: Make sure virtual env is activated
```bash
env\Scripts\activate  # Windows
source env/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### Frontend won't start
```
Error: Cannot find module '@radix-ui/react-dialog'
```
**Solution**: Install dependencies
```bash
cd frontend
npm install
```

### CORS error in browser console
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Check CORS_ALLOWED_ORIGINS in backend/.env
```env
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Can't login to frontend
**Solution**: Make sure:
1. User created in Django admin
2. User assigned to correct tenant
3. Tenant exists in database
4. Backend server is running (http://localhost:8000/api/v1/)

### Can't see products in POS
**Solution**: 
1. Products must have ItemVariations
2. ItemVariation must have quantity > 0
3. ItemVariation must be assigned to correct outlet
4. Check Django admin: Products → Variations

## Next Steps

1. **Read the full README.md** - Everything you need to know
2. **Explore the code structure** - Check out `backend/apps/sales/models.py` and `frontend/lib/services/saleService.ts`
3. **Understand tenant isolation** - Look at `backend/apps/tenants/middleware.py`
4. **Try to add a feature** - Maybe a simple discount system
5. **Check the gaps** - See AUDIT_SUMMARY.md for what's not implemented

## Key Files to Know

| File | Purpose |
|------|---------|
| `backend/primepos/urls.py` | All API routes |
| `backend/apps/sales/models.py` | Sale transaction model |
| `backend/apps/sales/services.py` | Sale creation logic |
| `frontend/app/pos/retail/page.tsx` | POS page |
| `frontend/lib/services/saleService.ts` | API calls for sales |
| `frontend/stores/posStore.ts` | Current order state |
| `README.md` | **MAIN DOCUMENTATION** |
| `AUDIT_SUMMARY.md` | Project status and gaps |

## Common Commands

```bash
# Backend - Run migrations
python manage.py migrate

# Backend - Create admin
python manage.py createsuperuser

# Backend - Check models
python manage.py sqlmigrate sales 0001

# Frontend - Build for production
npm run build
npm run start

# Frontend - Check for lint errors
npm run lint

# Both - Stop servers
Ctrl + C
```

## Database

Current setup uses **SQLite** (file-based, perfect for development).

For production, use PostgreSQL:
```bash
# Install PostgreSQL driver
pip install psycopg2-binary

# In backend/.env:
DATABASE_URL=postgresql://user:password@localhost:5432/primepos

# Then run migrations
python manage.py migrate
```

---

**Ready?** You should now have a working POS system!

If something doesn't work, check README.md or AUDIT_SUMMARY.md before asking for help.

**Good luck!** 🚀
