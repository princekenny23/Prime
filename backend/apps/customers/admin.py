from django.contrib import admin
from .models import Customer, LoyaltyTransaction


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'tenant', 'loyalty_points', 'total_spent', 'last_visit', 'is_active')
    list_filter = ('tenant', 'is_active', 'created_at')
    search_fields = ('name', 'email', 'phone')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(LoyaltyTransaction)
class LoyaltyTransactionAdmin(admin.ModelAdmin):
    list_display = ('customer', 'transaction_type', 'points', 'created_at')
    list_filter = ('transaction_type', 'created_at')
    search_fields = ('customer__name', 'reason')

