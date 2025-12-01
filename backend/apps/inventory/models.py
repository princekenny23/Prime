from django.db import models
from django.core.validators import MinValueValidator
from apps.tenants.models import Tenant
from apps.outlets.models import Outlet
from apps.products.models import Product
from apps.accounts.models import User


class StockMovement(models.Model):
    """Stock movement tracking model"""
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
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_movements')
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
            models.Index(fields=['outlet']),
            models.Index(fields=['movement_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.movement_type} - {self.quantity}"


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


class StockTakeItem(models.Model):
    """Stock take line item"""
    stock_take = models.ForeignKey(StockTake, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_take_items')
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
        unique_together = ['stock_take', 'product']
        indexes = [
            models.Index(fields=['stock_take']),
            models.Index(fields=['product']),
        ]

    def save(self, *args, **kwargs):
        self.difference = self.counted_quantity - self.expected_quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} - Expected: {self.expected_quantity}, Counted: {self.counted_quantity}"

