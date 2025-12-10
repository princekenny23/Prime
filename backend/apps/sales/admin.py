from django.contrib import admin
from .models import Sale, SaleItem, Delivery, DeliveryItem, DeliveryStatusHistory


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


class DeliveryItemInline(admin.TabularInline):
    model = DeliveryItem
    extra = 0
    readonly_fields = ('sale_item', 'quantity', 'is_delivered', 'delivered_quantity')


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ('delivery_number', 'sale', 'customer', 'status', 'delivery_method', 'scheduled_date', 'created_at')
    list_filter = ('tenant', 'status', 'delivery_method', 'scheduled_date', 'created_at')
    search_fields = ('delivery_number', 'sale__receipt_number', 'delivery_address', 'tracking_number', 'customer__name')
    readonly_fields = ('delivery_number', 'created_at', 'updated_at', 'confirmed_at', 'dispatched_at', 'completed_at')
    inlines = [DeliveryItemInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('tenant', 'sale', 'outlet', 'customer', 'delivery_number', 'status', 'delivery_method')
        }),
        ('Delivery Address', {
            'fields': ('delivery_address', 'delivery_city', 'delivery_state', 'delivery_postal_code', 'delivery_country',
                      'delivery_contact_name', 'delivery_contact_phone')
        }),
        ('Scheduling', {
            'fields': ('scheduled_date', 'scheduled_time_start', 'scheduled_time_end', 'actual_delivery_date')
        }),
        ('Shipping Information', {
            'fields': ('courier_name', 'tracking_number', 'driver_name', 'vehicle_number')
        }),
        ('Financial', {
            'fields': ('delivery_fee', 'shipping_cost')
        }),
        ('Notes', {
            'fields': ('notes', 'customer_notes', 'delivery_instructions')
        }),
        ('User Tracking', {
            'fields': ('created_by', 'assigned_to', 'delivered_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'confirmed_at', 'dispatched_at', 'completed_at')
        }),
    )


@admin.register(DeliveryItem)
class DeliveryItemAdmin(admin.ModelAdmin):
    list_display = ('delivery', 'sale_item', 'quantity', 'is_delivered', 'delivered_quantity')
    list_filter = ('delivery__status', 'is_delivered', 'delivery__created_at')
    search_fields = ('delivery__delivery_number', 'sale_item__product_name')


@admin.register(DeliveryStatusHistory)
class DeliveryStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('delivery', 'status', 'previous_status', 'changed_by', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('delivery__delivery_number', 'notes')
    readonly_fields = ('created_at',)

