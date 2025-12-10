from django.contrib import admin
from .models import Shift


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ('outlet', 'till', 'user', 'operating_date', 'status', 'opening_cash_balance', 'closing_cash_balance', 'start_time')
    list_filter = ('outlet', 'status', 'operating_date', 'start_time')
    search_fields = ('outlet__name', 'till__name', 'user__email')
    readonly_fields = ('start_time', 'end_time', 'device_id', 'sync_status')

