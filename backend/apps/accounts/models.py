from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model extending Django's AbstractUser"""
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    role = models.CharField(
        max_length=50, choices=[
            ('admin', 'Admin'),
            ('manager', 'Manager'),
            ('cashier', 'Cashier'),
            ('staff', 'Staff'),
            ('saas_admin', 'SaaS Admin'),
        ],
        default='staff'
    )
    is_saas_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def save(self, *args, **kwargs):
        if not self.name and self.username:
            self.name = self.username
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'accounts_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email

