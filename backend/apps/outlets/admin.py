from django.contrib import admin
from .models import Outlet, Till


@admin.register(Outlet)
class OutletAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant', 'phone', 'is_active', 'created_at')
    list_filter = ('tenant', 'is_active', 'created_at')
    search_fields = ('name', 'phone', 'email')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Till)
class TillAdmin(admin.ModelAdmin):
    list_display = ('name', 'outlet', 'is_active', 'is_in_use', 'created_at')
    list_filter = ('outlet', 'is_active', 'is_in_use')
    search_fields = ('name',)

