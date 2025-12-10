from django.contrib import admin
from .models import Table, KitchenOrderTicket


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ('number', 'tenant', 'outlet', 'capacity', 'status', 'location', 'is_active', 'created_at')
    list_filter = ('tenant', 'outlet', 'status', 'is_active', 'created_at')
    search_fields = ('number', 'location', 'notes')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(KitchenOrderTicket)
class KitchenOrderTicketAdmin(admin.ModelAdmin):
    list_display = ('kot_number', 'table', 'status', 'priority', 'sent_to_kitchen_at', 'created_at')
    list_filter = ('status', 'priority', 'outlet', 'created_at')
    search_fields = ('kot_number', 'sale__receipt_number', 'table__number')
    readonly_fields = ('kot_number', 'sent_to_kitchen_at', 'started_at', 'ready_at', 'served_at', 'created_at', 'updated_at')

