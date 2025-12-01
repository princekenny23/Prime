from rest_framework import serializers
from .models import Product, Category


class CategorySerializer(serializers.ModelSerializer):
    """Category serializer"""
    product_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Category
        fields = ('id', 'tenant', 'name', 'description', 'created_at', 'product_count')
        read_only_fields = ('id', 'tenant', 'created_at')
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['product_count'] = instance.products.count()
        return representation


class ProductSerializer(serializers.ModelSerializer):
    """Product serializer"""
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(
        source='category',
        write_only=True,
        required=False,
        allow_null=True
    )
    is_low_stock = serializers.BooleanField(read_only=True)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make tenant read-only (set automatically from request context)
        if 'tenant' in self.fields:
            self.fields['tenant'].read_only = True
    
    class Meta:
        model = Product
        fields = ('id', 'tenant', 'category', 'category_id', 'name', 'description', 'sku', 
                  'barcode', 'price', 'cost', 'stock', 'low_stock_threshold', 'unit', 
                  'image', 'is_active', 'is_low_stock', 'created_at', 'updated_at')
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at')
        extra_kwargs = {
            'sku': {'required': False, 'allow_blank': True}
        }
    
    def validate_sku(self, value):
        """Ensure SKU is unique per tenant (if provided)"""
        if not value or value.strip() == "":
            # SKU is optional, will be auto-generated
            return value
            
        if self.instance:
            # Update: check if SKU exists for other products in same tenant
            if Product.objects.filter(tenant=self.instance.tenant, sku=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("SKU already exists for this tenant")
        else:
            # Create: check if SKU exists
            request = self.context.get('request')
            if request:
                tenant = getattr(request, 'tenant', None) or (request.user.tenant if hasattr(request, 'user') and request.user.is_authenticated else None)
                if tenant and Product.objects.filter(tenant=tenant, sku=value).exists():
                    raise serializers.ValidationError("SKU already exists for this tenant")
        return value
    
    def generate_sku(self, tenant):
        """Generate a unique SKU for the tenant"""
        import re
        
        # Get tenant code - use first 3-5 uppercase letters/numbers from name
        tenant_name = tenant.name.upper()
        # Remove special characters and spaces, take first 3-5 chars
        tenant_code = re.sub(r'[^A-Z0-9]', '', tenant_name)[:5]
        if not tenant_code:
            # Fallback to tenant ID if name has no valid characters
            tenant_code = f"T{tenant.id}"
        
        # Get the last product number for this tenant
        last_product = Product.objects.filter(tenant=tenant, sku__isnull=False).exclude(sku='').order_by('-id').first()
        if last_product and last_product.sku:
            # Try to extract number from existing SKU
            try:
                # Format: TENANT-PROD-0001 or TENANT-0001
                parts = last_product.sku.split('-')
                if len(parts) > 1:
                    # Get the last part which should be the number
                    last_num_str = parts[-1]
                    last_num = int(last_num_str)
                    next_num = last_num + 1
                else:
                    # If no dash, try to extract number from end
                    match = re.search(r'(\d+)$', last_product.sku)
                    if match:
                        next_num = int(match.group(1)) + 1
                    else:
                        next_num = Product.objects.filter(tenant=tenant, sku__isnull=False).exclude(sku='').count() + 1
            except (ValueError, IndexError, AttributeError):
                next_num = Product.objects.filter(tenant=tenant, sku__isnull=False).exclude(sku='').count() + 1
        else:
            next_num = Product.objects.filter(tenant=tenant, sku__isnull=False).exclude(sku='').count() + 1
        
        # Generate SKU: TENANT-PROD-0001
        sku = f"{tenant_code}-PROD-{next_num:04d}"
        
        # Ensure uniqueness
        max_attempts = 1000
        attempts = 0
        while Product.objects.filter(tenant=tenant, sku=sku).exists() and attempts < max_attempts:
            next_num += 1
            sku = f"{tenant_code}-PROD-{next_num:04d}"
            attempts += 1
        
        if attempts >= max_attempts:
            # Fallback: use timestamp-based SKU
            import time
            sku = f"{tenant_code}-PROD-{int(time.time())}"
        
        return sku
    
    def validate_category_id(self, value):
        """Ensure category exists and belongs to the same tenant"""
        if value is None:
            return value
        
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError("Request context is missing.")
        
        tenant = getattr(request, 'tenant', None) or (request.user.tenant if hasattr(request, 'user') and request.user.is_authenticated else None)
        if not tenant:
            raise serializers.ValidationError("Unable to determine tenant. Please ensure you are authenticated.")
        
        # Try to get the category
        try:
            category = Category.objects.get(pk=value)
        except Category.DoesNotExist:
            raise serializers.ValidationError(f"Category with ID {value} does not exist.")
        
        # Verify the category belongs to the tenant
        if category.tenant != tenant:
            raise serializers.ValidationError("Category does not belong to your tenant")
        
        return category  # Return the category object, not the ID
    
    def validate(self, attrs):
        """Auto-generate SKU if not provided and ensure uniqueness"""
        # Only auto-generate on create (not update)
        if not self.instance:
            # Handle SKU - can be None, empty string, or actual value
            sku_value = attrs.get('sku')
            if sku_value is None:
                sku = ''
            elif isinstance(sku_value, str):
                sku = sku_value.strip()
            else:
                sku = str(sku_value).strip()
            
            request = self.context.get('request')
            if not request:
                raise serializers.ValidationError("Request context is missing for SKU generation.")
            
            tenant = getattr(request, 'tenant', None) or (request.user.tenant if hasattr(request, 'user') and request.user.is_authenticated else None)
            if not tenant:
                raise serializers.ValidationError("Unable to determine tenant for SKU generation.")
            
            if not sku:
                # Auto-generate SKU
                attrs['sku'] = self.generate_sku(tenant)
            else:
                # SKU provided - ensure it's unique per tenant
                if Product.objects.filter(tenant=tenant, sku=sku).exists():
                    raise serializers.ValidationError({'sku': 'SKU already exists for this tenant.'})
                attrs['sku'] = sku  # Ensure it's set
        return attrs

