from django.db import models
from django.contrib.postgres.fields import JSONField


class Tenant(models.Model):
    """Multi-tenant Business model"""
    BUSINESS_TYPES = [
        ('retail', 'Retail'),
        ('restaurant', 'Restaurant'),
        ('bar', 'Bar'),
    ]

    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=BUSINESS_TYPES, default='retail')
    currency = models.CharField(max_length=3, default='MWK')
    currency_symbol = models.CharField(max_length=10, default='MK')  # MWK symbol
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    settings = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenants_tenant'
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

