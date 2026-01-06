from django.contrib import admin
from .models import Quotation, QuotationItem


class QuotationItemInline(admin.TabularInline):
    model = QuotationItem
    extra = 0
    readonly_fields = ['total']


@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = ['quotation_number', 'customer_name', 'customer', 'outlet', 'status', 'total', 'valid_until', 'created_at']
    list_filter = ['status', 'outlet', 'created_at', 'valid_until']
    search_fields = ['quotation_number', 'customer_name']
    readonly_fields = ['quotation_number', 'created_at', 'updated_at']
    inlines = [QuotationItemInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('quotation_number', 'tenant', 'outlet', 'user', 'status')
        }),
        ('Customer', {
            'fields': ('customer', 'customer_name')
        }),
        ('Financial', {
            'fields': ('subtotal', 'discount', 'tax', 'total')
        }),
        ('Details', {
            'fields': ('valid_until', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(QuotationItem)
class QuotationItemAdmin(admin.ModelAdmin):
    list_display = ['quotation', 'product_name', 'quantity', 'price', 'total']
    list_filter = ['quotation__status']
    search_fields = ['product_name', 'quotation__quotation_number']

