from django.contrib import admin
from .models import Sale, SaleItem, Receipt


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


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'sale', 'tenant', 'format', 'is_sent', 'sent_via', 'access_count', 'generated_at')
    list_filter = ('tenant', 'format', 'is_sent', 'sent_via', 'generated_at')
    search_fields = ('receipt_number', 'sale__receipt_number')
    readonly_fields = ('receipt_number', 'generated_at', 'access_count', 'last_accessed_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('tenant', 'sale', 'receipt_number', 'format')
        }),
        ('Content', {
            'fields': ('content', 'pdf_file')
        }),
        ('Metadata', {
            'fields': ('generated_at', 'generated_by')
        }),
        ('Delivery', {
            'fields': ('is_sent', 'sent_at', 'sent_via')
        }),
        ('Access Tracking', {
            'fields': ('access_count', 'last_accessed_at')
        }),
    )

