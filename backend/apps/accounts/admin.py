from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'tenant', 'role', 'is_saas_admin', 'is_active', 'date_joined')
    list_filter = ('role', 'is_saas_admin', 'is_active', 'tenant')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('PrimePOS Info', {'fields': ('tenant', 'role', 'phone', 'is_saas_admin')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('PrimePOS Info', {'fields': ('email', 'tenant', 'role', 'phone', 'is_saas_admin')}),
    )

