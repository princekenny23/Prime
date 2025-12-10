from django.contrib import admin
from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    """Admin interface for ActivityLog - Read-only"""
    list_display = [
        'id',
        'tenant',
        'user',
        'action',
        'module',
        'resource_type',
        'description',
        'created_at',
    ]
    list_filter = [
        'action',
        'module',
        'tenant',
        'created_at',
    ]
    search_fields = [
        'description',
        'user__email',
        'user__name',
        'resource_id',
        'ip_address',
    ]
    readonly_fields = [
        'tenant',
        'user',
        'action',
        'module',
        'resource_type',
        'resource_id',
        'description',
        'metadata',
        'ip_address',
        'user_agent',
        'request_path',
        'request_method',
        'created_at',
    ]
    date_hierarchy = 'created_at'
    
    def has_add_permission(self, request):
        """Prevent manual creation of activity logs"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Activity logs are immutable"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Only SaaS admins can delete logs"""
        return request.user.is_saas_admin

