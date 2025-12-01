# Create Superuser - Step by Step

## ✅ Database Ready!
All tables created successfully!

## 🔐 Step 1: Create Superuser

Run this command:
```bash
python manage.py createsuperuser
```

**You'll be prompted for:**
1. **Email:** (Enter your email - this will be your login email)
2. **Username:** (Enter a username)
3. **Password:** (Enter a strong password - you'll type it twice)

**Example:**
```
Email: admin@primepos.com
Username: admin
Password: ******** (enter twice)
```

---

## 👑 Step 2: Make User SaaS Admin

After creating superuser, run:
```bash
python manage.py shell
```

Then copy and paste this (replace EMAIL with your email):
```python
from apps.accounts.models import User
user = User.objects.get(email='YOUR-EMAIL-HERE')
user.is_saas_admin = True
user.role = 'saas_admin'
user.is_staff = True
user.is_superuser = True
user.save()
print(f"✅ {user.email} is now SaaS Admin")
exit()
```

---

## 🚀 Step 3: Test Server

Start the server:
```bash
python manage.py runserver
```

Then visit:
- **Django Admin:** http://localhost:8000/admin/
- **API Root:** http://localhost:8000/api/v1/

---

## 📝 What to Report

After Step 1, tell me:
1. ✅ Superuser created?
2. What email did you use?
3. Ready for Step 2?

Then I'll help you with the SaaS admin setup! 🎯

