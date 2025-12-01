from rest_framework import serializers
from .models import StockMovement, StockTake, StockTakeItem
from apps.products.serializers import ProductSerializer


class StockMovementSerializer(serializers.ModelSerializer):
    """Stock movement serializer"""
    product = ProductSerializer(read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True, allow_null=True)
    user_name = serializers.SerializerMethodField()
    outlet_name = serializers.SerializerMethodField()
    
    def get_user_name(self, obj):
        """Get user name safely, handling null users"""
        if obj.user:
            return obj.user.name if hasattr(obj.user, 'name') else (obj.user.email if hasattr(obj.user, 'email') else "System")
        return "System"
    
    def get_outlet_name(self, obj):
        """Get outlet name safely"""
        if obj.outlet:
            return obj.outlet.name if hasattr(obj.outlet, 'name') else str(obj.outlet.id)
        return "N/A"
    
    class Meta:
        model = StockMovement
        fields = ('id', 'tenant', 'product', 'product_name', 'outlet', 'outlet_name', 'user', 'user_name', 'movement_type',
                  'quantity', 'reason', 'reference_id', 'created_at')
        read_only_fields = ('id', 'created_at', 'product_name', 'user_name', 'outlet_name')


class StockTakeItemSerializer(serializers.ModelSerializer):
    """Stock take item serializer"""
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = StockTakeItem
        fields = ('id', 'stock_take', 'product', 'expected_quantity', 'counted_quantity',
                  'difference', 'notes', 'created_at', 'updated_at')
        read_only_fields = ('id', 'difference', 'created_at', 'updated_at')


class StockTakeSerializer(serializers.ModelSerializer):
    """Stock take serializer"""
    items = StockTakeItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = StockTake
        fields = ('id', 'tenant', 'outlet', 'user', 'operating_date', 'status',
                  'description', 'items', 'created_at', 'completed_at')
        read_only_fields = ('id', 'tenant', 'user', 'status', 'created_at', 'completed_at')
    
    def validate_outlet(self, value):
        """Validate that outlet belongs to the tenant"""
        request = self.context.get('request')
        if request:
            tenant = getattr(request, 'tenant', None) or request.user.tenant
            if tenant and value.tenant != tenant:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("Outlet does not belong to your tenant")
        return value

