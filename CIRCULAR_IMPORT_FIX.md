# Circular Import Fix ✅

## 🐛 Problem

The system was getting 500 errors when trying to view tenants because of a **circular import** between serializers:

1. `UserSerializer` imported `TenantSerializer` at the top level
2. `TenantSerializer.get_users()` imported `UserSerializer` inside the method
3. This created a circular dependency that caused serialization errors

## ✅ Fix Applied

### 1. **UserSerializer** - Fixed circular import
- Changed `tenant` field from `TenantSerializer(read_only=True)` to `SerializerMethodField()`
- Moved `TenantSerializer` import inside `get_tenant()` method to avoid circular dependency

### 2. **TenantSerializer** - Simplified user serialization
- Changed `get_users()` to use a simplified inline serializer instead of importing `UserSerializer`
- This avoids the circular dependency completely

## 📋 Changes Made

**`backend/apps/accounts/serializers.py`:**
```python
# Before:
tenant = TenantSerializer(read_only=True)

# After:
tenant = serializers.SerializerMethodField()

def get_tenant(self, obj):
    if not obj.tenant:
        return None
    from apps.tenants.serializers import TenantSerializer
    return TenantSerializer(obj.tenant).data
```

**`backend/apps/tenants/serializers.py`:**
```python
# Before:
def get_users(self, obj):
    from apps.accounts.serializers import UserSerializer
    return UserSerializer(obj.users.all(), many=True).data

# After:
def get_users(self, obj):
    # Use inline serialization to avoid circular dependency
    users = obj.users.all()
    return [{
        'id': user.id,
        'email': user.email,
        # ... other fields
    } for user in users]
```

## ✅ Result

- No more circular imports
- Serializers work correctly
- Tenants can be viewed without 500 errors
- Users are properly serialized in tenant responses


