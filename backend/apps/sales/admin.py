from django.contrib import admin
from .models import Sale, SaleItem


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ('product_name', 'price', 'total')


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'tenant', 'outlet', 'user', 'total', 'payment_method', 'status', 'created_at')
    list_filter = ('tenant', 'outlet', 'payment_method', 'status', 'created_at')
    search_fields = ('receipt_number',)
    readonly_fields = ('receipt_number', 'created_at', 'updated_at')
    inlines = [SaleItemInline]


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = ('sale', 'product_name', 'quantity', 'price', 'total')
    list_filter = ('sale__tenant', 'sale__created_at')
    search_fields = ('product_name', 'sale__receipt_number')

