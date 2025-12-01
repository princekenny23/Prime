from django.contrib import admin
from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_name', 'email', 'phone', 'tenant', 'is_active', 'created_at')
    list_filter = ('is_active', 'tenant', 'created_at')
    search_fields = ('name', 'contact_name', 'email', 'phone')
    readonly_fields = ('created_at', 'updated_at')

