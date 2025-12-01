from django.contrib import admin
from .models import StockMovement, StockTake, StockTakeItem


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('product', 'outlet', 'movement_type', 'quantity', 'user', 'created_at')
    list_filter = ('tenant', 'movement_type', 'created_at')
    search_fields = ('product__name', 'reason')
    readonly_fields = ('created_at',)


class StockTakeItemInline(admin.TabularInline):
    model = StockTakeItem
    extra = 0


@admin.register(StockTake)
class StockTakeAdmin(admin.ModelAdmin):
    list_display = ('outlet', 'operating_date', 'status', 'user', 'created_at')
    list_filter = ('tenant', 'outlet', 'status', 'operating_date')
    search_fields = ('description',)
    readonly_fields = ('created_at', 'completed_at')
    inlines = [StockTakeItemInline]

