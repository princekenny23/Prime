from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class ActivityLog(models.Model):
    """
    Centralized activity log for all system actions.
    Immutable records that capture user actions across the platform.
    """
    
    # Action types
    ACTION_LOGIN = 'login'
    ACTION_LOGOUT = 'logout'
    ACTION_CREATE = 'create'
    ACTION_UPDATE = 'update'
    ACTION_DELETE = 'delete'
    ACTION_VIEW = 'view'
    ACTION_REFUND = 'refund'
    ACTION_DISCOUNT = 'discount'
    ACTION_CASH_MOVEMENT = 'cash_movement'
    ACTION_INVENTORY_ADJUSTMENT = 'inventory_adjustment'
    ACTION_SHIFT_OPEN = 'shift_open'
    ACTION_SHIFT_CLOSE = 'shift_close'
    ACTION_SETTINGS_CHANGE = 'settings_change'
    ACTION_SECURITY = 'security'
    ACTION_EXPORT = 'export'
    ACTION_IMPORT = 'import'
    
    ACTION_CHOICES = [
        (ACTION_LOGIN, 'Login'),
        (ACTION_LOGOUT, 'Logout'),
        (ACTION_CREATE, 'Create'),
        (ACTION_UPDATE, 'Update'),
        (ACTION_DELETE, 'Delete'),
        (ACTION_VIEW, 'View'),
        (ACTION_REFUND, 'Refund'),
        (ACTION_DISCOUNT, 'Discount'),
        (ACTION_CASH_MOVEMENT, 'Cash Movement'),
        (ACTION_INVENTORY_ADJUSTMENT, 'Inventory Adjustment'),
        (ACTION_SHIFT_OPEN, 'Shift Open'),
        (ACTION_SHIFT_CLOSE, 'Shift Close'),
        (ACTION_SETTINGS_CHANGE, 'Settings Change'),
        (ACTION_SECURITY, 'Security Event'),
        (ACTION_EXPORT, 'Export'),
        (ACTION_IMPORT, 'Import'),
    ]
    
    # Module types
    MODULE_SALES = 'sales'
    MODULE_INVENTORY = 'inventory'
    MODULE_PRODUCTS = 'products'
    MODULE_CUSTOMERS = 'customers'
    MODULE_PAYMENTS = 'payments'
    MODULE_SHIFTS = 'shifts'
    MODULE_CASH = 'cash'
    MODULE_SETTINGS = 'settings'
    MODULE_USERS = 'users'
    MODULE_AUTH = 'auth'
    MODULE_REPORTS = 'reports'
    MODULE_SUPPLIERS = 'suppliers'
    MODULE_RESTAURANT = 'restaurant'
    
    MODULE_CHOICES = [
        (MODULE_SALES, 'Sales'),
        (MODULE_INVENTORY, 'Inventory'),
        (MODULE_PRODUCTS, 'Products'),
        (MODULE_CUSTOMERS, 'Customers'),
        (MODULE_PAYMENTS, 'Payments'),
        (MODULE_SHIFTS, 'Shifts'),
        (MODULE_CASH, 'Cash Management'),
        (MODULE_SETTINGS, 'Settings'),
        (MODULE_USERS, 'Users'),
        (MODULE_AUTH, 'Authentication'),
        (MODULE_REPORTS, 'Reports'),
        (MODULE_SUPPLIERS, 'Suppliers'),
        (MODULE_RESTAURANT, 'Restaurant'),
    ]
    
    # Core fields
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='activity_logs',
        db_index=True
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs',
        db_index=True
    )
    
    # Action details
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, db_index=True)
    module = models.CharField(max_length=50, choices=MODULE_CHOICES, db_index=True)
    
    # Resource information
    resource_type = models.CharField(max_length=100, blank=True)  # e.g., 'Sale', 'Product', 'Customer'
    resource_id = models.CharField(max_length=100, blank=True, db_index=True)  # ID of the resource
    
    # Description and metadata
    description = models.TextField()  # Human-readable description
    metadata = models.JSONField(default=dict, blank=True)  # Additional structured data
    
    # Request information
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    request_path = models.CharField(max_length=500, blank=True)
    request_method = models.CharField(max_length=10, blank=True)
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'activity_logs'
        verbose_name = 'Activity Log'
        verbose_name_plural = 'Activity Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', '-created_at']),
            models.Index(fields=['tenant', 'user', '-created_at']),
            models.Index(fields=['tenant', 'module', '-created_at']),
            models.Index(fields=['tenant', 'action', '-created_at']),
            models.Index(fields=['tenant', 'resource_type', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user or 'System'} - {self.get_action_display()} - {self.get_module_display()} - {self.created_at}"
    
    def save(self, *args, **kwargs):
        """Ensure logs are immutable - prevent updates after creation"""
        if self.pk:
            # If this is an update, raise an error
            raise ValueError("ActivityLog records are immutable and cannot be updated")
        super().save(*args, **kwargs)

