#!/usr/bin/env python
"""
Script to make a user a SaaS Admin
Usage: python make_saas_admin.py <email>
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'primepos.settings.development')
django.setup()

from apps.accounts.models import User

if len(sys.argv) < 2:
    print("Usage: python make_saas_admin.py <email>")
    print("\nAvailable users:")
    for user in User.objects.all():
        print(f"  - {user.email} (username: {user.username})")
    sys.exit(1)

email = sys.argv[1]

try:
    user = User.objects.get(email=email)
    user.is_saas_admin = True
    user.role = 'saas_admin'
    user.is_staff = True
    user.is_superuser = True
    user.save()
    print(f"✅ SUCCESS!")
    print(f"   User: {user.email}")
    print(f"   Username: {user.username}")
    print(f"   Is SaaS Admin: {user.is_saas_admin}")
    print(f"   Role: {user.role}")
    print(f"   Is Staff: {user.is_staff}")
    print(f"   Is Superuser: {user.is_superuser}")
except User.DoesNotExist:
    print(f"❌ ERROR: User with email '{email}' not found.")
    print("\nAvailable users:")
    for user in User.objects.all():
        print(f"  - {user.email} (username: {user.username})")
    sys.exit(1)

