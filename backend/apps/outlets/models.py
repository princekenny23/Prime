from django.db import models
from apps.tenants.models import Tenant


class Outlet(models.Model):
    """Outlet/Branch model for multi-location businesses"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='outlets')
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'outlets_outlet'
        verbose_name = 'Outlet'
        verbose_name_plural = 'Outlets'
        ordering = ['name']
        indexes = [
            models.Index(fields=['tenant']),
        ]

    def __str__(self):
        return f"{self.tenant.name} - {self.name}"


class Till(models.Model):
    """Cash register till model"""
    outlet = models.ForeignKey(Outlet, on_delete=models.CASCADE, related_name='tills')
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    is_in_use = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'outlets_till'
        verbose_name = 'Till'
        verbose_name_plural = 'Tills'
        ordering = ['name']
        indexes = [
            models.Index(fields=['outlet']),
        ]

    def __str__(self):
        return f"{self.outlet.name} - {self.name}"

