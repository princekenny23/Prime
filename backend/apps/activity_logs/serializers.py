from rest_framework import serializers
from .models import ActivityLog
from apps.accounts.serializers import UserSerializer


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for ActivityLog - Read-only"""
    user_details = serializers.SerializerMethodField()
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = [
            'id',
            'tenant',
            'tenant_name',
            'user',
            'user_details',
            'action',
            'module',
            'resource_type',
            'resource_id',
            'description',
            'metadata',
            'ip_address',
            'user_agent',
            'request_path',
            'request_method',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'tenant',
            'tenant_name',
            'user',
            'user_details',
            'action',
            'module',
            'resource_type',
            'resource_id',
            'description',
            'metadata',
            'ip_address',
            'user_agent',
            'request_path',
            'request_method',
            'created_at',
        ]
    
    def get_user_details(self, obj):
        """Return user details if user exists"""
        if obj.user:
            return {
                'id': obj.user.id,
                'email': obj.user.email,
                'name': obj.user.name or obj.user.username,
                'role': obj.user.role,
            }
        return None

