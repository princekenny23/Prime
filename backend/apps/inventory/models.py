from django.db import models  # pyright: ignore[reportMissingImports]
from django.core.validators import MinValueValidator  # pyright: ignore[reportMissingImports]  # pyright: ignore[reportMissingImports]  # pyright: ignore[reportMissingImports]
from django.utils import timezone
from django.db.models import Sum, Q
from decimal import Decimal
from apps.tenants.models import Tenant
from apps.outlets.models import Outlet
from apps.products.models import Product
from apps.accounts.models import User

# Import ItemVariation with lazy loading to avoid circular import
def get_item_variation_model():
    from apps.products.models import ItemVariation
    return ItemVariation


class Batch(models.Model):
    """
    Stock batch/lot tracking with expiry dates
    Single source of truth for inventory quantities
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='batches')
    variation = models.ForeignKey('products.ItemVariation', on_delete=models.CASCADE, related_name='batches')
    outlet = models.ForeignKey(Outlet, on_delete=models.CASCADE, related_name='batches')
    batch_number = models.CharField(max_length=100, help_text="Unique batch/lot number")
    expiry_date = models.DateField(help_text="Date when this batch expires")
    quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)], help_text="Current quantity in this batch")
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Cost per unit for this batch")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventory_batch'
        verbose_name = 'Batch'
        verbose_name_plural = 'Batches'
        unique_together = [['variation', 'outlet', 'batch_number']]
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['variation', 'outlet']),
            models.Index(fields=['expiry_date']),
            models.Index(fields=['variation', 'outlet', 'expiry_date']),
        ]
        ordering = ['expiry_date', 'created_at']

    def __str__(self):
        return f"{self.variation.product.name} - {self.variation.name} - Batch {self.batch_number} @ {self.outlet.name}"

    def is_expired(self):
        """Check if batch is expired"""
        return self.expiry_date < timezone.now().date()

    def sellable_quantity(self):
        """Return quantity available for sale (0 if expired)"""
        return 0 if self.is_expired() else self.quantity
    
    @property
    def days_until_expiry(self):
        """Calculate days until expiry (negative if expired)"""
        delta = self.expiry_date - timezone.now().date()
        return delta.days


class StockMovement(models.Model):
    """Stock movement tracking model - immutable ledger"""
    MOVEMENT_TYPES = [
        ('sale', 'Sale'),
        ('purchase', 'Purchase'),
        ('adjustment', 'Adjustment'),
        ('transfer_in', 'Transfer In'),
        ('transfer_out', 'Transfer Out'),
        ('return', 'Return'),
        ('damage', 'Damage'),
        ('expiry', 'Expiry'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='stock_movements')
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name='movements', help_text="Batch this movement belongs to")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_movements', null=True, blank=True, help_text="Deprecated: Use variation instead. Kept for backward compatibility.")
    variation = models.ForeignKey('products.ItemVariation', on_delete=models.CASCADE, related_name='stock_movements', null=True, blank=True, help_text="Item variation for this movement (preferred)")
    outlet = models.ForeignKey(Outlet, on_delete=models.CASCADE, related_name='stock_movements')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='stock_movements')
    
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    reason = models.TextField(blank=True)
    reference_id = models.CharField(max_length=100, blank=True)  # Reference to sale, transfer, etc.
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'inventory_stockmovement'
        verbose_name = 'Stock Movement'
        verbose_name_plural = 'Stock Movements'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['product']),
            models.Index(fields=['variation']),
            models.Index(fields=['outlet']),
            models.Index(fields=['movement_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        product_name = self.variation.product.name if self.variation else (self.product.name if self.product else "Unknown")
        return f"{product_name} - {self.movement_type} - {self.quantity}"
    
    def clean(self):
        """Ensure either product or variation is set, and batch matches variation if provided"""
        from django.core.exceptions import ValidationError
        
        # Auto-set product from variation before validation
        if self.variation and not self.product:
            self.product = self.variation.product
        
        if not self.product and not self.variation:
            raise ValidationError("Either product or variation must be set")
        if self.product and self.variation and self.product != self.variation.product:
            raise ValidationError("Product must match variation's product")
        
        # Validate batch belongs to variation
        if self.batch and self.variation and self.batch.variation != self.variation:
            raise ValidationError("Batch must belong to the specified variation")
    
    def save(self, *args, **kwargs):
        """Auto-set product from variation if needed for backward compatibility"""
        if self.variation and not self.product:
            self.product = self.variation.product
        self.clean()
        super().save(*args, **kwargs)


class StockTake(models.Model):
    """Stock taking/audit session model"""
    STATUS_CHOICES = [
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='stock_takes')
    outlet = models.ForeignKey(Outlet, on_delete=models.CASCADE, related_name='stock_takes')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='stock_takes')
    
    operating_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='running')
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'inventory_stocktake'
        verbose_name = 'Stock Take'
        verbose_name_plural = 'Stock Takes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['outlet']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.outlet.name} - {self.operating_date}"


class LocationStock(models.Model):
    """
    Stock level per location/variation - Square POS compatible
    Tracks inventory quantity for each variation at each outlet
    NOTE: quantity is kept for backward compatibility but should be computed from batches
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='location_stocks')
    variation = models.ForeignKey('products.ItemVariation', on_delete=models.CASCADE, related_name='location_stocks')
    outlet = models.ForeignKey(Outlet, on_delete=models.CASCADE, related_name='location_stocks')
    quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)], help_text="Current stock quantity at this location (legacy - prefer using get_available_quantity())")
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'inventory_locationstock'
        verbose_name = 'Location Stock'
        verbose_name_plural = 'Location Stocks'
        unique_together = [['variation', 'outlet']]
        indexes = [
            models.Index(fields=['variation', 'outlet']),
            models.Index(fields=['outlet']),
            models.Index(fields=['variation']),
            models.Index(fields=['tenant']),
        ]

    def __str__(self):
        return f"{self.variation.product.name} - {self.variation.name} @ {self.outlet.name}: {self.quantity}"
    
    def get_available_quantity(self):
        """
        Get available quantity from non-expired batches
        This is the AUTHORITATIVE quantity for inventory checks
        """
        today = timezone.now().date()
        batches = Batch.objects.filter(
            variation=self.variation,
            outlet=self.outlet,
            expiry_date__gt=today,
            quantity__gt=0
        )
        return sum(batch.quantity for batch in batches)
    
    def get_total_quantity_including_expired(self):
        """Get total quantity including expired batches"""
        batches = Batch.objects.filter(
            variation=self.variation,
            outlet=self.outlet,
            quantity__gt=0
        )
        return sum(batch.quantity for batch in batches)
    
    def get_expiring_soon(self, days=30):
        """Get batches expiring within specified days"""
        from datetime import timedelta
        today = timezone.now().date()
        threshold = today + timedelta(days=days)
        return Batch.objects.filter(
            variation=self.variation,
            outlet=self.outlet,
            expiry_date__gt=today,
            expiry_date__lte=threshold,
            quantity__gt=0
        ).order_by('expiry_date')
    
    def sync_quantity_from_batches(self):
        """
        Sync the quantity field from batches (for backward compatibility)
        Call this after any batch updates
        """
        self.quantity = self.get_available_quantity()
        self.save(update_fields=['quantity', 'updated_at'])


class StockTakeItem(models.Model):
    """Stock take line item"""
    stock_take = models.ForeignKey(StockTake, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_take_items', null=True, blank=True, help_text="Deprecated: Use variation instead. Kept for backward compatibility.")
    variation = models.ForeignKey('products.ItemVariation', on_delete=models.CASCADE, related_name='stock_take_items', null=True, blank=True, help_text="Item variation for this stock take (preferred)")
    expected_quantity = models.IntegerField(validators=[MinValueValidator(0)])
    counted_quantity = models.IntegerField(validators=[MinValueValidator(0)])
    difference = models.IntegerField(default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventory_stocktakeitem'
        verbose_name = 'Stock Take Item'
        verbose_name_plural = 'Stock Take Items'
        # Note: For backward compatibility, we allow either variation or product
        # Variation uniqueness is enforced via unique_together
        # Product uniqueness is enforced in save() method for old data
        constraints = [
            models.UniqueConstraint(fields=['stock_take', 'variation'], condition=models.Q(variation__isnull=False), name='unique_stocktake_variation'),
            models.UniqueConstraint(fields=['stock_take', 'product'], condition=models.Q(variation__isnull=True, product__isnull=False), name='unique_stocktake_product'),
        ]
        indexes = [
            models.Index(fields=['stock_take']),
            models.Index(fields=['product']),
            models.Index(fields=['variation']),
        ]

    def clean(self):
        """Ensure either product or variation is set"""
        from django.core.exceptions import ValidationError
        if not self.product and not self.variation:
            raise ValidationError("Either product or variation must be set")
    
    def save(self, *args, **kwargs):
        self.difference = self.counted_quantity - self.expected_quantity
        # Auto-set product from variation if needed
        if self.variation and not self.product:
            self.product = self.variation.product
        # Validate uniqueness for product (backward compat)
        if self.product and not self.variation:
            existing = StockTakeItem.objects.filter(
                stock_take=self.stock_take,
                product=self.product
            ).exclude(pk=self.pk if self.pk else None)
            if existing.exists():
                from django.core.exceptions import ValidationError
                raise ValidationError("Product already exists in this stock take")
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        product_name = self.variation.product.name if self.variation else (self.product.name if self.product else "Unknown")
        return f"{product_name} - Expected: {self.expected_quantity}, Counted: {self.counted_quantity}"

