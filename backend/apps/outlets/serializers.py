from rest_framework import serializers
from .models import Outlet, Till


class TillSerializer(serializers.ModelSerializer):
    """Till serializer"""
    
    class Meta:
        model = Till
        fields = ('id', 'name', 'outlet', 'is_active', 'is_in_use', 'created_at')
        read_only_fields = ('id', 'created_at')


class OutletSerializer(serializers.ModelSerializer):
    """Outlet serializer"""
    tills = TillSerializer(many=True, read_only=True)
    
    class Meta:
        model = Outlet
        fields = ('id', 'tenant', 'name', 'address', 'phone', 'email', 'is_active', 
                  'created_at', 'updated_at', 'tills')
        read_only_fields = ('id', 'created_at', 'updated_at')

