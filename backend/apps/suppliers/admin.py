from django.contrib import admin
from .models import (
    Supplier, PurchaseOrder, PurchaseOrderItem,
    SupplierInvoice, PurchaseReturn, PurchaseReturnItem,
    ProductSupplier, AutoPurchaseOrderSettings, AutoPOAuditLog
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


@admin.register(PurchaseOrderItem)
class PurchaseOrderItemAdmin(admin.ModelAdmin):
    list_display = ('purchase_order', 'product', 'quantity', 'unit_price', 'total', 'received_quantity')
    list_filter = ('purchase_order__status', 'purchase_order__tenant')
    search_fields = ('product__name', 'purchase_order__po_number')


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


@admin.register(PurchaseReturnItem)
class PurchaseReturnItemAdmin(admin.ModelAdmin):
    list_display = ('purchase_return', 'product', 'quantity', 'unit_price', 'total')
    list_filter = ('purchase_return__status', 'purchase_return__tenant')
    search_fields = ('product__name', 'purchase_return__return_number')


@admin.register(ProductSupplier)
class ProductSupplierAdmin(admin.ModelAdmin):
    list_display = ('product', 'supplier', 'reorder_quantity', 'reorder_point', 'is_preferred', 'is_active')
    list_filter = ('is_preferred', 'is_active', 'tenant')
    search_fields = ('product__name', 'supplier__name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(AutoPurchaseOrderSettings)
class AutoPurchaseOrderSettingsAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'auto_po_enabled', 'default_reorder_quantity', 'auto_approve_po', 'group_by_supplier')
    list_filter = ('auto_po_enabled', 'auto_approve_po', 'group_by_supplier')
    search_fields = ('tenant__name',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(AutoPOAuditLog)
class AutoPOAuditLogAdmin(admin.ModelAdmin):
    list_display = ('action_type', 'purchase_order', 'product', 'supplier', 'triggered_by', 'created_at')
    list_filter = ('action_type', 'tenant', 'created_at')
    search_fields = ('description', 'purchase_order__po_number', 'product__name', 'supplier__name')
    readonly_fields = ('created_at',)
    date_hierarchy = 'created_at'
    raw_id_fields = ('purchase_order', 'product', 'variation', 'supplier', 'triggered_by')

