from django.db import models
from apps.tenants.models import Tenant
from apps.outlets.models import Outlet


class Table(models.Model):
    """Restaurant table model for table management"""
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('reserved', 'Reserved'),
        ('out_of_service', 'Out of Service'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='restaurant_tables')
    outlet = models.ForeignKey(Outlet, on_delete=models.CASCADE, related_name='restaurant_tables', null=True, blank=True)
    number = models.CharField(max_length=50)
    capacity = models.PositiveIntegerField(default=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    location = models.CharField(max_length=255, blank=True, help_text="e.g., Main Dining, Patio, VIP")
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'restaurant_table'
        verbose_name = 'Restaurant Table'
        verbose_name_plural = 'Restaurant Tables'
        ordering = ['number']
        unique_together = ['tenant', 'number']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['outlet']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        outlet_name = self.outlet.name if self.outlet else "No Outlet"
        return f"{self.tenant.name} - Table {self.number} ({outlet_name})"


class KitchenOrderTicket(models.Model):
    """Kitchen Order Ticket (KOT) model for tracking orders sent to kitchen"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('served', 'Served'),
        ('cancelled', 'Cancelled'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='kitchen_tickets')
    outlet = models.ForeignKey(Outlet, on_delete=models.CASCADE, related_name='kitchen_tickets', null=True, blank=True)
    sale = models.ForeignKey('sales.Sale', on_delete=models.CASCADE, related_name='kitchen_tickets')
    table = models.ForeignKey(Table, on_delete=models.SET_NULL, null=True, blank=True, related_name='kitchen_orders')
    
    kot_number = models.CharField(max_length=50, unique=True, db_index=True, help_text="Kitchen Order Ticket number")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=20, choices=[('normal', 'Normal'), ('high', 'High'), ('urgent', 'Urgent')], default='normal')
    
    sent_to_kitchen_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ready_at = models.DateTimeField(null=True, blank=True)
    served_at = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'restaurant_kitchenorderticket'
        verbose_name = 'Kitchen Order Ticket'
        verbose_name_plural = 'Kitchen Order Tickets'
        ordering = ['-sent_to_kitchen_at']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['outlet']),
            models.Index(fields=['sale']),
            models.Index(fields=['table']),
            models.Index(fields=['status']),
            models.Index(fields=['sent_to_kitchen_at']),
        ]

    def __str__(self):
        return f"KOT-{self.kot_number} - Table {self.table.number if self.table else 'N/A'}"

