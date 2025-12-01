from django.db import models  # pyright: ignore[reportMissingImports]
from apps.tenants.models import Tenant
from apps.outlets.models import Outlet


class Supplier(models.Model):
    """Supplier/Vendor model"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='suppliers')
    outlet = models.ForeignKey(Outlet, on_delete=models.SET_NULL, null=True, blank=True, related_name='suppliers')
    
    name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)  # State/Province
    zip_code = models.CharField(max_length=20, blank=True)  # ZIP/Postal Code
    country = models.CharField(max_length=100, blank=True)
    tax_id = models.CharField(max_length=50, blank=True)
    
    payment_terms = models.CharField(max_length=100, blank=True)  # e.g., "Net 30", "COD"
    notes = models.TextField(blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'suppliers_supplier'
        verbose_name = 'Supplier'
        verbose_name_plural = 'Suppliers'
        ordering = ['name']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['outlet']),
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
        ]

    def __str__(self):
        return self.name

