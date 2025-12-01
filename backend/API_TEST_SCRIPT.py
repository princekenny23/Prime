#!/usr/bin/env python
"""
Quick API Test Script
Tests login and basic endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_api_root():
    """Test API root endpoint"""
    print("🧪 Testing API Root...")
    response = requests.get(f"{BASE_URL}/")
    if response.status_code == 200:
        print("✅ API Root: OK")
        data = response.json()
        print(f"   Message: {data.get('message')}")
        print(f"   Version: {data.get('version')}")
        return True
    else:
        print(f"❌ API Root: Failed ({response.status_code})")
        return False

def test_login(email, password):
    """Test login endpoint"""
    print(f"\n🧪 Testing Login for {email}...")
    response = requests.post(
        f"{BASE_URL}/auth/login/",
        json={"email": email, "password": password}
    )
    if response.status_code == 200:
        data = response.json()
        print("✅ Login: OK")
        print(f"   Access Token: {data.get('access')[:50]}...")
        print(f"   User: {data.get('user', {}).get('email')}")
        print(f"   Is SaaS Admin: {data.get('user', {}).get('is_saas_admin')}")
        return data.get('access')
    else:
        print(f"❌ Login: Failed ({response.status_code})")
        print(f"   Response: {response.text}")
        return None

def test_me(token):
    """Test /auth/me/ endpoint"""
    print("\n🧪 Testing /auth/me/...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print("✅ /auth/me/: OK")
        print(f"   User: {data.get('email')}")
        return True
    else:
        print(f"❌ /auth/me/: Failed ({response.status_code})")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("PrimePOS API Test Script")
    print("=" * 50)
    
    # Test API root
    if not test_api_root():
        print("\n❌ API Root test failed. Is server running?")
        exit(1)
    
    # Get credentials
    email = input("\nEnter your email: ").strip()
    password = input("Enter your password: ").strip()
    
    # Test login
    token = test_login(email, password)
    if not token:
        print("\n❌ Login failed. Check credentials.")
        exit(1)
    
    # Test /auth/me/
    test_me(token)
    
    print("\n" + "=" * 50)
    print("✅ All tests passed!")
    print("=" * 50)

