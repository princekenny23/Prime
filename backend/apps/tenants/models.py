from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class Tenant(models.Model):
    """Multi-tenant Business model"""
    BUSINESS_TYPES = [
        ('retail', 'Wholesale and Retail'),
        ('restaurant', 'Restaurant'),
        ('bar', 'Bar'),
    ]

    POS_TYPES = [
        ('standard', 'Standard POS'),
        ('single_product', 'Single-Product POS'),
    ]

    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=BUSINESS_TYPES, default='retail')
    pos_type = models.CharField(max_length=20, choices=POS_TYPES, default='standard')
    currency = models.CharField(max_length=3, default='MWK')
    currency_symbol = models.CharField(max_length=10, default='MK')  # MWK symbol
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    logo = models.ImageField(upload_to='tenants/logos/', blank=True, null=True, help_text='Business logo')
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


# Signal to create default roles when a tenant is created
@receiver(post_save, sender=Tenant)
def create_default_tenant_roles(sender, instance, created, **kwargs):
    """Automatically create default roles for a new tenant"""
    if created:
        from apps.accounts.models import create_default_roles_for_tenant
        try:
            create_default_roles_for_tenant(instance)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to create default roles for tenant {instance.id}: {str(e)}")
