from rest_framework import serializers
from .models import Supplier
from apps.outlets.serializers import OutletSerializer


class SupplierSerializer(serializers.ModelSerializer):
    """Supplier serializer"""
    outlet = OutletSerializer(read_only=True)
    outlet_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Supplier
        fields = (
            'id', 'tenant', 'outlet', 'outlet_id', 'name', 'contact_name',
            'email', 'phone', 'address', 'city', 'state', 'zip_code', 'country', 'tax_id',
            'payment_terms', 'notes', 'is_active', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at')
    
    def validate_outlet_id(self, value):
        """Validate that outlet belongs to tenant"""
        # Convert empty string to None
        if value == '' or value is None:
            return None
        
        request = self.context.get('request')
        if request:
            tenant = getattr(request, 'tenant', None) or request.user.tenant
            if tenant:
                from apps.outlets.models import Outlet
                try:
                    # Convert to int if it's a string
                    outlet_id = int(value) if isinstance(value, str) else value
                    outlet = Outlet.objects.get(id=outlet_id, tenant=tenant)
                    return outlet_id
                except Outlet.DoesNotExist:
                    raise serializers.ValidationError("Outlet does not belong to your tenant")
                except (ValueError, TypeError):
                    raise serializers.ValidationError("Invalid outlet ID format")
        return None
    
    def create(self, validated_data):
        """Override create to handle outlet_id properly"""
        outlet_id = validated_data.pop('outlet_id', None)
        outlet = None
        if outlet_id:
            from apps.outlets.models import Outlet
            outlet = Outlet.objects.get(id=outlet_id)
        
        supplier = Supplier.objects.create(**validated_data, outlet=outlet)
        return supplier
    
    def update(self, instance, validated_data):
        """Override update to handle outlet_id properly"""
        outlet_id = validated_data.pop('outlet_id', None)
        if outlet_id is not None:
            if outlet_id:
                from apps.outlets.models import Outlet
                instance.outlet = Outlet.objects.get(id=outlet_id)
            else:
                instance.outlet = None
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

