from django.contrib import admin
from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'type', 'priority', 'tenant', 'user', 'read', 'created_at']
    list_filter = ['type', 'priority', 'read', 'created_at']
    search_fields = ['title', 'message', 'tenant__name']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'tenant', 'push_enabled', 'email_enabled', 'updated_at')
    list_filter = ('tenant', 'push_enabled', 'email_enabled', 'sms_enabled')
    search_fields = ('user__email', 'user__name')
    raw_id_fields = ('user', 'tenant')
