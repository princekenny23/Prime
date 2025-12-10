from rest_framework import serializers
from .models import Tenant
from apps.outlets.serializers import OutletSerializer


class TenantSerializer(serializers.ModelSerializer):
    """Tenant serializer"""
    outlets = OutletSerializer(many=True, read_only=True)
    # Users will be serialized separately to avoid circular import
    users = serializers.SerializerMethodField()
    
    class Meta:
        model = Tenant
        fields = ('id', 'name', 'type', 'currency', 'currency_symbol', 'phone', 'email', 
                  'address', 'settings', 'is_active', 'created_at', 'updated_at', 
                  'outlets', 'users')
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def validate_name(self, value):
        """Validate name field"""
        if not value or not value.strip():
            raise serializers.ValidationError("Name is required and cannot be empty.")
        return value.strip()
    
    def validate_type(self, value):
        """Validate type field"""
        valid_types = [choice[0] for choice in Tenant.BUSINESS_TYPES]
        if value not in valid_types:
            raise serializers.ValidationError(
                f"Type must be one of: {', '.join(valid_types)}"
            )
        return value
    
    def validate_settings(self, value):
        """Validate settings field"""
        if value is None:
            return {}
        if not isinstance(value, dict):
            raise serializers.ValidationError("Settings must be a valid JSON object.")
        return value
    
    def get_users(self, obj):
        """Get users for this tenant without circular import"""
        # Use a simplified serializer to avoid circular dependency
        users = obj.users.all()
        return [{
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'name': user.name or '',
            'phone': user.phone or '',
            'role': user.role,
            'is_saas_admin': user.is_saas_admin,
            'is_active': user.is_active,
            'date_joined': user.date_joined.isoformat() if user.date_joined else None,
        } for user in users]

