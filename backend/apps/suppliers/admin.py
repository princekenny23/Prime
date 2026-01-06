from django.contrib import admin
from .models import (
    Supplier, PurchaseOrder,
    SupplierInvoice, PurchaseReturn,
    ProductSupplier
)


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_name', 'email', 'phone', 'tenant', 'is_active', 'created_at')
    list_filter = ('is_active', 'tenant', 'created_at')
    search_fields = ('name', 'contact_name', 'email', 'phone')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('po_number', 'supplier', 'outlet', 'order_date', 'status', 'total', 'created_at')
    list_filter = ('status', 'tenant', 'order_date', 'created_at')
    search_fields = ('po_number', 'supplier__name', 'notes')
    readonly_fields = ('po_number', 'created_at', 'updated_at', 'approved_at', 'received_at')
    date_hierarchy = 'order_date'


@admin.register(SupplierInvoice)
class SupplierInvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'supplier', 'invoice_date', 'due_date', 'total', 'amount_paid', 'status')
    list_filter = ('status', 'tenant', 'invoice_date', 'due_date')
    search_fields = ('invoice_number', 'supplier_invoice_number', 'supplier__name')
    readonly_fields = ('invoice_number', 'created_at', 'updated_at', 'paid_at')
    date_hierarchy = 'invoice_date'


@admin.register(PurchaseReturn)
class PurchaseReturnAdmin(admin.ModelAdmin):
    list_display = ('return_number', 'supplier', 'return_date', 'status', 'total', 'created_at')
    list_filter = ('status', 'tenant', 'return_date', 'created_at')
    search_fields = ('return_number', 'supplier__name', 'reason')
    readonly_fields = ('return_number', 'created_at', 'updated_at', 'returned_at')
    date_hierarchy = 'return_date'


@admin.register(ProductSupplier)
class ProductSupplierAdmin(admin.ModelAdmin):
    list_display = ('product', 'supplier', 'unit_cost', 'is_preferred', 'is_active')
    list_filter = ('is_preferred', 'is_active', 'tenant')
    search_fields = ('product__name', 'supplier__name')
    readonly_fields = ('created_at', 'updated_at')



