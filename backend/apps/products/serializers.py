from rest_framework import serializers  # pyright: ignore[reportMissingImports]
from .models import Product, Category, ItemVariation, ProductUnit


class CategorySerializer(serializers.ModelSerializer):
    """Category serializer"""
    product_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Category
        fields = ('id', 'tenant', 'name', 'description', 'created_at', 'product_count')
        read_only_fields = ('id', 'tenant', 'created_at')
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Use prefetched count if available to avoid N+1 query
        if hasattr(instance, '_products_count'):
            representation['product_count'] = instance._products_count
        else:
            representation['product_count'] = instance.products.count()
        return representation


class ItemVariationSerializer(serializers.ModelSerializer):
    """Item Variation serializer"""
    total_stock = serializers.SerializerMethodField()
    is_low_stock = serializers.SerializerMethodField()
    
    class Meta:
        model = ItemVariation
        fields = (
            'id', 'product', 'name', 'price', 'cost', 'sku', 'barcode',
            'track_inventory', 'unit', 'low_stock_threshold', 'is_active',
            'sort_order', 'total_stock', 'is_low_stock', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
        extra_kwargs = {
            'sku': {'required': False, 'allow_blank': True},
            'barcode': {'required': False, 'allow_blank': True},
            'cost': {'required': False, 'allow_null': True},
        }
    
    def get_total_stock(self, obj):
        """Get total stock across all outlets"""
        outlet = self.context.get('outlet')
        return obj.get_total_stock(outlet=outlet)
    
    def get_is_low_stock(self, obj):
        """Check if variation is low on stock"""
        if not obj.track_inventory:
            return False
        outlet = self.context.get('outlet')
        total_stock = obj.get_total_stock(outlet=outlet)
        return obj.low_stock_threshold > 0 and total_stock <= obj.low_stock_threshold
    
    def validate_sku(self, value):
        """Ensure SKU is unique per product (if provided)"""
        if not value or (isinstance(value, str) and value.strip() == ""):
            return None  # Return None instead of empty string
        
        product = self.initial_data.get('product') or (self.instance.product if self.instance else None)
        if not product:
            return value
        
        # Check if SKU exists for other variations of the same product
        existing = ItemVariation.objects.filter(product=product, sku=value)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        
        if existing.exists():
            raise serializers.ValidationError("SKU already exists for another variation of this product")
        
        return value


class ProductUnitSerializer(serializers.ModelSerializer):
    """Product Unit serializer for multi-unit selling"""
    stock_in_unit = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductUnit
        fields = (
            'id', 'product', 'unit_name', 'conversion_factor', 'retail_price', 
            'wholesale_price', 'is_active', 'sort_order', 'stock_in_unit', 
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_stock_in_unit(self, obj):
        """Get stock converted to this unit"""
        outlet = self.context.get('outlet')
        if outlet:
            # Get stock from LocationStock if variation exists, else from product
            if obj.product.variations.exists():
                from apps.inventory.models import LocationStock
                from django.db.models import Sum
                variations = obj.product.variations.filter(is_active=True, track_inventory=True)
                location_stocks = LocationStock.objects.filter(
                    variation__in=variations,
                    outlet=outlet
                )
                total_base_units = location_stocks.aggregate(total=Sum('quantity'))['total'] or 0
            else:
                total_base_units = obj.product.stock
            
            # Convert to this unit
            if obj.conversion_factor > 0:
                return float(total_base_units / obj.conversion_factor)
            return 0
        return None


class ProductSerializer(serializers.ModelSerializer):
    """Product serializer with variation support"""
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(
        source='category',
        write_only=True,
        required=False,
        allow_null=True
    )
    is_low_stock = serializers.SerializerMethodField()
    # stock is writable for create/update, but calculated from LocationStock when reading
    stock = serializers.IntegerField(required=False, allow_null=True, min_value=0, default=0)
    variations = ItemVariationSerializer(many=True, read_only=True)
    default_variation = ItemVariationSerializer(read_only=True)
    selling_units = ProductUnitSerializer(many=True, read_only=True)
    
    # Backward compatibility fields
    price = serializers.SerializerMethodField()
    cost_price = serializers.SerializerMethodField()
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make tenant and outlet read-only (set automatically from request context)
        if 'tenant' in self.fields:
            self.fields['tenant'].read_only = True
        if 'outlet' in self.fields:
            self.fields['outlet'].read_only = True
    
    class Meta:
        model = Product
        fields = (
            'id', 'tenant', 'outlet', 'category', 'category_id', 'name', 'description', 
            'sku', 'barcode', 'retail_price', 'price', 'cost', 'cost_price', 
            'wholesale_price', 'wholesale_enabled', 'minimum_wholesale_quantity', 
            'stock', 'low_stock_threshold', 'unit', 'image', 'is_active', 
            'is_low_stock', 'variations', 'default_variation', 'selling_units', 
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'tenant', 'outlet', 'created_at', 'updated_at', 'price', 'variations', 'default_variation', 'selling_units')
        extra_kwargs = {
            'sku': {'required': False, 'allow_blank': True},
            'wholesale_price': {'required': False, 'allow_null': True},
            'minimum_wholesale_quantity': {'required': False},
        }
    
    def get_price(self, obj):
        """Backward compat: return default variation price or retail_price"""
        return obj.get_price()
    
    def get_cost_price(self, obj):
        """Backward compat: return default variation cost or cost"""
        return obj.get_cost()
    
    def to_representation(self, instance):
        """Override to show calculated stock from LocationStock in response"""
        representation = super().to_representation(instance)
        # Replace stock with calculated value from LocationStock when reading
        outlet = self.context.get('outlet')
        representation['stock'] = instance.get_total_stock(outlet=outlet)
        return representation
    
    def get_is_low_stock(self, obj):
        """Check if product is low stock by checking variations"""
        outlet = self.context.get('outlet')
        
        # Check product-level threshold
        if obj.low_stock_threshold > 0:
            total_stock = obj.get_total_stock(outlet=outlet)
            if total_stock <= obj.low_stock_threshold:
                return True
        
        # Check variation-level thresholds
        variations = obj.variations.filter(is_active=True, track_inventory=True)
        for variation in variations:
            if variation.low_stock_threshold > 0:
                var_stock = variation.get_total_stock(outlet=outlet)
                if var_stock <= variation.low_stock_threshold:
                    return True
        
        return False
    
    def validate_sku(self, value):
        """Ensure SKU is unique per tenant (if provided)"""
        if not value or (isinstance(value, str) and value.strip() == ""):
            # SKU is optional, return None instead of empty string
            return None
            
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
    
    def validate_wholesale_price(self, value):
        """Validate wholesale price"""
        if value is not None and value != '':
            from decimal import Decimal
            try:
                # Convert to Decimal if it's a string
                if isinstance(value, str):
                    value = Decimal(value)
                elif isinstance(value, (int, float)):
                    value = Decimal(str(value))
                
                if value < Decimal('0.01'):
                    raise serializers.ValidationError("Wholesale price must be greater than 0.01")
            except (ValueError, TypeError):
                raise serializers.ValidationError("Wholesale price must be a valid number")
        elif value == '':
            # Empty string should be converted to None
            return None
        return value
    
    def validate(self, attrs):
        """Auto-generate SKU if not provided and ensure uniqueness. Handle backward compatibility for price field."""
        # Handle backward compatibility: if 'price' is provided, map it to 'retail_price'
        if 'price' in attrs and 'retail_price' not in attrs:
            attrs['retail_price'] = attrs.pop('price')
        
        # Handle backward compatibility: if 'cost_price' is provided, map it to 'cost'
        if 'cost_price' in attrs and 'cost' not in attrs:
            attrs['cost'] = attrs.pop('cost_price')
        
        # Validate wholesale pricing logic
        wholesale_enabled = attrs.get('wholesale_enabled', False)
        # Check instance if updating
        if self.instance:
            wholesale_enabled = attrs.get('wholesale_enabled', self.instance.wholesale_enabled)
        
        # Handle wholesale_price - convert empty strings to None
        wholesale_price = attrs.get('wholesale_price')
        if wholesale_price == '' or wholesale_price is None:
            wholesale_price = None
            attrs['wholesale_price'] = None
        
        if wholesale_enabled:
            # If wholesale is enabled, wholesale_price should be provided
            if wholesale_price is None:
                # On update, check existing value
                if self.instance:
                    wholesale_price = self.instance.wholesale_price
                else:
                    wholesale_price = None
            
            if wholesale_price is None:
                raise serializers.ValidationError({
                    'wholesale_price': 'Wholesale price is required when wholesale is enabled.'
                })
            
            # Ensure minimum_wholesale_quantity is at least 1
            min_qty = attrs.get('minimum_wholesale_quantity', 1)
            if self.instance and 'minimum_wholesale_quantity' not in attrs:
                min_qty = self.instance.minimum_wholesale_quantity
            
            if min_qty < 1:
                attrs['minimum_wholesale_quantity'] = 1
        else:
            # If wholesale is disabled, clear wholesale_price and reset minimum_wholesale_quantity
            attrs['wholesale_enabled'] = False
            attrs['wholesale_price'] = None
            attrs['minimum_wholesale_quantity'] = 1
        
        # Handle SKU - optional, validate uniqueness if provided
        if not self.instance:
            # On create: validate SKU if provided
            sku_value = attrs.get('sku')
            if sku_value:
                # SKU provided - normalize and validate
                if isinstance(sku_value, str):
                    sku = sku_value.strip()
                else:
                    sku = str(sku_value).strip()
                
                # Only validate uniqueness if SKU is not empty
                if sku:
                    request = self.context.get('request')
                    if request:
                        tenant = getattr(request, 'tenant', None) or (request.user.tenant if hasattr(request, 'user') and request.user.is_authenticated else None)
                        if tenant and Product.objects.filter(tenant=tenant, sku=sku).exists():
                            raise serializers.ValidationError({'sku': 'SKU already exists for this tenant.'})
                    attrs['sku'] = sku
                else:
                    # Empty string - set to None (NULL in database)
                    attrs['sku'] = None
            else:
                # No SKU provided - set to None (NULL in database)
                attrs['sku'] = None
        else:
            # On update: validate SKU if provided
            if 'sku' in attrs:
                sku_value = attrs.get('sku')
                if sku_value:
                    if isinstance(sku_value, str):
                        sku = sku_value.strip()
                    else:
                        sku = str(sku_value).strip()
                    
                    # Only validate uniqueness if SKU is not empty
                    if sku:
                        if Product.objects.filter(tenant=self.instance.tenant, sku=sku).exclude(pk=self.instance.pk).exists():
                            raise serializers.ValidationError({'sku': 'SKU already exists for this tenant.'})
                        attrs['sku'] = sku
                    else:
                        attrs['sku'] = None
        return attrs
