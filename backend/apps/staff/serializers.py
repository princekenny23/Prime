from rest_framework import serializers
from .models import Role, Staff, Attendance
from apps.accounts.serializers import UserSerializer


class RoleSerializer(serializers.ModelSerializer):
    """Role serializer"""
    
    class Meta:
        model = Role
        fields = ('id', 'tenant', 'name', 'description', 'can_sales', 'can_inventory',
                  'can_products', 'can_customers', 'can_reports', 'can_staff',
                  'can_settings', 'can_dashboard', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class StaffSerializer(serializers.ModelSerializer):
    """Staff serializer"""
    user = UserSerializer(read_only=True)
    outlets = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    
    class Meta:
        model = Staff
        fields = ('id', 'user', 'tenant', 'outlets', 'role', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class AttendanceSerializer(serializers.ModelSerializer):
    """Attendance serializer"""
    staff = StaffSerializer(read_only=True)
    
    class Meta:
        model = Attendance
        fields = ('id', 'staff', 'outlet', 'check_in', 'check_out', 'notes', 'created_at')
        read_only_fields = ('id', 'created_at')

