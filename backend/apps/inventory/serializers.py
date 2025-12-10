from rest_framework import serializers  # pyright: ignore[reportMissingImports]
from .models import StockMovement, StockTake, StockTakeItem, LocationStock
from apps.products.serializers import ProductSerializer, ItemVariationSerializer


class StockMovementSerializer(serializers.ModelSerializer):
    """Stock movement serializer with variation support"""
    product = ProductSerializer(read_only=True)
    product_name = serializers.SerializerMethodField()
    variation = ItemVariationSerializer(read_only=True)
    variation_name = serializers.SerializerMethodField()
    product_id = serializers.IntegerField(write_only=True, required=False, allow_null=True, source='product')
    variation_id = serializers.IntegerField(write_only=True, required=False, allow_null=True, source='variation')
    user_name = serializers.SerializerMethodField()
    outlet_name = serializers.SerializerMethodField()
    
    def get_product_name(self, obj):
        """Get product name from variation or product"""
        if obj.variation:
            return obj.variation.product.name
        if obj.product:
            return obj.product.name
        return "Unknown"
    
    def get_variation_name(self, obj):
        """Get variation name if exists"""
        if obj.variation:
            return obj.variation.name
        return None
    
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
    
    def validate(self, attrs):
        """Ensure either product or variation is set"""
        product = attrs.get('product')
        variation = attrs.get('variation')
        
        if not product and not variation:
            raise serializers.ValidationError("Either product or variation must be set")
        if product and variation:
            raise serializers.ValidationError("Cannot set both product and variation. Use variation for new records.")
        
        # Auto-set product from variation if needed
        if variation and not product:
            attrs['product'] = variation.product
        
        return attrs
    
    class Meta:
        model = StockMovement
        fields = ('id', 'tenant', 'product', 'product_id', 'product_name', 'variation', 'variation_id', 
                  'variation_name', 'outlet', 'outlet_name', 'user', 'user_name', 'movement_type',
                  'quantity', 'reason', 'reference_id', 'created_at')
        read_only_fields = ('id', 'created_at', 'product_name', 'variation_name', 'user_name', 'outlet_name')


class StockTakeItemSerializer(serializers.ModelSerializer):
    """Stock take item serializer with variation support"""
    product = ProductSerializer(read_only=True)
    product_name = serializers.SerializerMethodField()
    variation = ItemVariationSerializer(read_only=True)
    variation_name = serializers.SerializerMethodField()
    product_id = serializers.IntegerField(write_only=True, required=False, allow_null=True, source='product')
    variation_id = serializers.IntegerField(write_only=True, required=False, allow_null=True, source='variation')
    
    def get_product_name(self, obj):
        """Get product name from variation or product"""
        if obj.variation:
            return obj.variation.product.name
        if obj.product:
            return obj.product.name
        return "Unknown"
    
    def get_variation_name(self, obj):
        """Get variation name if exists"""
        if obj.variation:
            return obj.variation.name
        return None
    
    def validate(self, attrs):
        """Ensure either product or variation is set"""
        product = attrs.get('product')
        variation = attrs.get('variation')
        
        if not product and not variation:
            raise serializers.ValidationError("Either product or variation must be set")
        if product and variation:
            raise serializers.ValidationError("Cannot set both product and variation. Use variation for new records.")
        
        # Auto-set product from variation if needed
        if variation and not product:
            attrs['product'] = variation.product
        
        return attrs
    
    class Meta:
        model = StockTakeItem
        fields = ('id', 'stock_take', 'product', 'product_id', 'product_name', 'variation', 'variation_id',
                  'variation_name', 'expected_quantity', 'counted_quantity',
                  'difference', 'notes', 'created_at', 'updated_at')
        read_only_fields = ('id', 'difference', 'product_name', 'variation_name', 'created_at', 'updated_at')


class LocationStockSerializer(serializers.ModelSerializer):
    """Location stock serializer"""
    variation = ItemVariationSerializer(read_only=True)
    variation_id = serializers.IntegerField(write_only=True, source='variation')
    outlet_name = serializers.CharField(source='outlet.name', read_only=True)
    product_name = serializers.SerializerMethodField()
    
    def get_product_name(self, obj):
        """Get product name from variation"""
        if obj.variation:
            return obj.variation.product.name
        return "Unknown"
    
    class Meta:
        model = LocationStock
        fields = ('id', 'tenant', 'variation', 'variation_id', 'outlet', 'outlet_name', 
                  'quantity', 'product_name', 'updated_at')
        read_only_fields = ('id', 'tenant', 'updated_at', 'product_name', 'outlet_name')


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
                from rest_framework.exceptions import ValidationError  # pyright: ignore[reportMissingImports]
                raise ValidationError("Outlet does not belong to your tenant")
        return value

