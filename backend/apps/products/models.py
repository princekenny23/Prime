from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from apps.tenants.models import Tenant


class Category(models.Model):
    """Product category model"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'products_category'
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']
        unique_together = ['tenant', 'name']
        indexes = [
            models.Index(fields=['tenant']),
        ]

    def __str__(self):
        return self.name


class Product(models.Model):
    """Product model - outlet-specific"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='products')
    outlet = models.ForeignKey('outlets.Outlet', on_delete=models.CASCADE, related_name='products', help_text="Outlet this product belongs to")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    sku = models.CharField(max_length=100, db_index=True, blank=True, null=True)
    barcode = models.CharField(max_length=100, blank=True, db_index=True)
    retail_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], help_text="Retail price")
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(Decimal('0'))], help_text="Cost price")
    
    @property
    def cost_price(self):
        """Alias for cost field for backward compatibility"""
        return self.cost
    
    @property
    def price(self):
        """Backward compatibility: return retail_price"""
        return self.retail_price
    # Wholesale pricing fields
    wholesale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(Decimal('0.01'))], help_text="Wholesale price")
    wholesale_enabled = models.BooleanField(default=False, help_text="Whether this product is available for wholesale")
    minimum_wholesale_quantity = models.IntegerField(default=1, validators=[MinValueValidator(1)], help_text="Minimum quantity required for wholesale pricing")
    stock = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    low_stock_threshold = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    unit = models.CharField(max_length=50, default='pcs')
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products_product'
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['name']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['outlet']),
            models.Index(fields=['tenant', 'outlet']),
            models.Index(fields=['category']),
            models.Index(fields=['sku']),
            models.Index(fields=['barcode']),
        ]
        # Note: unique_together doesn't work well with blank values
        # SKU uniqueness is enforced in the serializer

    def __str__(self):
        return self.name

    def get_total_stock(self, outlet=None):
        """Get total stock from all variations using batch-aware calculation"""
        from apps.inventory.stock_helpers import get_available_stock
        from apps.outlets.models import Outlet
        
        # Get all active variations that track inventory
        variations = self.variations.filter(is_active=True, track_inventory=True)
        
        if not variations.exists():
            # Fallback to legacy stock field if no variations
            return self.stock
        
        # Sum stock from all variations using batch-aware calculation
        if outlet:
            # Get stock for specific outlet from non-expired batches
            return sum(get_available_stock(variation, outlet) for variation in variations)
        else:
            # Sum across all outlets
            total = 0
            outlets = Outlet.objects.filter(tenant=self.tenant)
            for variation in variations:
                for outlet_obj in outlets:
                    total += get_available_stock(variation, outlet_obj)
            return total
    
    @property
    def is_low_stock(self):
        """Check if product is low on stock by checking all variations (computed from batches)"""
        # Check if any variation is low stock
        variations = self.variations.filter(is_active=True, track_inventory=True)
        
        if not variations.exists():
            # Fallback to legacy check if no variations
            return self.low_stock_threshold > 0 and self.stock <= self.low_stock_threshold
        
        # Check each variation for low stock using batch-aware calculation
        for variation in variations:
            from apps.inventory.stock_helpers import get_available_stock
            from apps.outlets.models import Outlet
            
            # Check stock across all outlets for this variation
            outlets = Outlet.objects.filter(tenant=self.tenant)
            for outlet in outlets:
                available_stock = get_available_stock(variation, outlet)
                if variation.low_stock_threshold > 0 and available_stock <= variation.low_stock_threshold:
                    return True
        
        # Also check product-level threshold if set (sum of all variations)
        if self.low_stock_threshold > 0:
            total_stock = self.get_total_stock()
            if total_stock <= self.low_stock_threshold:
                return True
        
        return False
    
    @property
    def default_variation(self):
        """Get the default variation (first active variation or first variation)"""
        variation = self.variations.filter(is_active=True).order_by('sort_order', 'id').first()
        if not variation:
            variation = self.variations.order_by('sort_order', 'id').first()
        return variation
    
    def get_price(self):
        """Get price from default variation or fallback to retail_price"""
        variation = self.default_variation
        if variation:
            return variation.price
        return self.retail_price
    
    def get_cost(self):
        """Get cost from default variation or fallback to cost"""
        variation = self.default_variation
        if variation and variation.cost is not None:
            return variation.cost
        return self.cost
    
    def get_sku(self):
        """Get SKU from default variation or fallback to sku"""
        variation = self.default_variation
        if variation and variation.sku:
            return variation.sku
        return self.sku
    
    def get_barcode(self):
        """Get barcode from default variation or fallback to barcode"""
        variation = self.default_variation
        if variation and variation.barcode:
            return variation.barcode
        return self.barcode


class ItemVariation(models.Model):
    """
    Item Variation model - Square POS compatible
    Represents sellable units of a product (e.g., sizes, colors, pack sizes, volumes)
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variations')
    name = models.CharField(max_length=255, help_text="Variation name (e.g., 'Bottle', 'Shot', '500ml', 'Large')")
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Selling price for this variation"
    )
    cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(Decimal('0'))],
        help_text="Cost price for this variation (optional)"
    )
    sku = models.CharField(
        max_length=100, 
        db_index=True, 
        blank=True,
        null=True,
        help_text="SKU for this variation (unique per product)"
    )
    barcode = models.CharField(
        max_length=100, 
        blank=True, 
        db_index=True,
        help_text="Barcode for this variation"
    )
    track_inventory = models.BooleanField(
        default=True,
        help_text="Whether to track inventory for this variation"
    )
    unit = models.CharField(
        max_length=50, 
        default='pcs',
        help_text="Unit of measurement (pcs, ml, kg, l, g, box, pack)"
    )
    low_stock_threshold = models.IntegerField(
        default=0, 
        validators=[MinValueValidator(0)],
        help_text="Low stock alert threshold for this variation"
    )
    is_active = models.BooleanField(default=True, help_text="Whether this variation is active")
    sort_order = models.IntegerField(default=0, help_text="Sort order for display")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products_itemvariation'
        verbose_name = 'Item Variation'
        verbose_name_plural = 'Item Variations'
        ordering = ['sort_order', 'name', 'id']
        unique_together = [['product', 'sku']]  # SKU unique per product (if provided)
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['product', 'is_active']),
            models.Index(fields=['sku']),
            models.Index(fields=['barcode']),
            models.Index(fields=['track_inventory']),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.name}"
    
    @property
    def is_low_stock(self):
        """Check if variation is low on stock (batch-aware calculation)"""
        if not self.track_inventory:
            return False
        if self.low_stock_threshold <= 0:
            return False
        
        # Use batch-aware calculation
        from apps.inventory.stock_helpers import get_available_stock
        from apps.outlets.models import Outlet
        
        # Check across all outlets
        outlets = Outlet.objects.filter(tenant=self.product.tenant)
        for outlet in outlets:
            available_stock = get_available_stock(self, outlet)
            if available_stock <= self.low_stock_threshold:
                return True
        
        return False
    
    def get_total_stock(self, outlet=None):
        """Get total stock for this variation (batch-aware, excluding expired)"""
        from apps.inventory.stock_helpers import get_available_stock
        from apps.outlets.models import Outlet
        
        if outlet:
            return get_available_stock(self, outlet)
        
        # Sum across all outlets
        outlets = Outlet.objects.filter(tenant=self.product.tenant)
        return sum(get_available_stock(self, outlet) for outlet in outlets)


class ProductUnit(models.Model):
    """
    Product Unit model for multi-unit selling
    Allows products to be sold in different units (piece, half-dozen, dozen, box, etc.)
    with different prices for retail and wholesale
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='selling_units', help_text="Product this unit belongs to")
    unit_name = models.CharField(max_length=50, help_text="Unit name (e.g., 'piece', 'half-dozen', 'dozen', 'box')")
    conversion_factor = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        validators=[MinValueValidator(Decimal('0.0001'))],
        help_text="How many base units this unit equals (e.g., 12 for dozen if base is piece)"
    )
    retail_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Retail price for this unit"
    )
    wholesale_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Wholesale price for this unit (optional)"
    )
    is_active = models.BooleanField(default=True, help_text="Whether this unit is available for sale")
    sort_order = models.IntegerField(default=0, help_text="Sort order for display")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products_productunit'
        verbose_name = 'Product Unit'
        verbose_name_plural = 'Product Units'
        ordering = ['sort_order', 'unit_name', 'id']
        unique_together = [['product', 'unit_name']]  # Unit name unique per product
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['product', 'is_active']),
            models.Index(fields=['unit_name']),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.unit_name}"
    
    def get_price(self, sale_type='retail'):
        """Get price based on sale type (retail or wholesale)"""
        if sale_type == 'wholesale' and self.wholesale_price:
            return self.wholesale_price
        return self.retail_price
    
    def convert_to_base_units(self, quantity):
        """Convert quantity in this unit to base units"""
        return int(quantity * self.conversion_factor)
    
    def convert_from_base_units(self, base_quantity):
        """Convert quantity from base units to this unit"""
        if self.conversion_factor == 0:
            return 0
        return base_quantity / self.conversion_factor

