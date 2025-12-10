from rest_framework import serializers
from .models import Notification, NotificationPreference
from apps.accounts.serializers import UserSerializer

class NotificationSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'tenant', 'tenant_name', 'user', 'user_details', 'type', 'priority',
            'title', 'message', 'resource_type', 'resource_id', 'link', 'metadata',
            'read', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'tenant', 'tenant_name', 'user_details', 'created_at', 'updated_at')

    def get_user_details(self, obj):
        if obj.user:
            return {
                'id': obj.user.id,
                'email': obj.user.email,
                'name': obj.user.name or obj.user.username,
            }
        return None


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)

    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'user', 'user_details', 'tenant', 'tenant_name',
            'enable_sale_notifications', 'enable_stock_notifications',
            'enable_staff_notifications', 'enable_system_notifications',
            'enable_payment_notifications', 'enable_customer_notifications',
            'enable_report_notifications',
            'enable_low_priority', 'enable_normal_priority',
            'enable_high_priority', 'enable_urgent_priority',
            'email_enabled', 'sms_enabled', 'push_enabled',
            'quiet_hours_start', 'quiet_hours_end',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'user_details', 'tenant_name', 'created_at', 'updated_at')

    def get_user_details(self, obj):
        if obj.user:
            return {
                'id': obj.user.id,
                'email': obj.user.email,
                'name': obj.user.name or obj.user.username,
            }
        return None
