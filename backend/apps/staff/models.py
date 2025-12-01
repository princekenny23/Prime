from django.db import models
from apps.tenants.models import Tenant
from apps.outlets.models import Outlet
from apps.accounts.models import User


class Role(models.Model):
    """Role/Permission model"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='roles')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Permissions
    can_sales = models.BooleanField(default=False)
    can_inventory = models.BooleanField(default=False)
    can_products = models.BooleanField(default=False)
    can_customers = models.BooleanField(default=False)
    can_reports = models.BooleanField(default=False)
    can_staff = models.BooleanField(default=False)
    can_settings = models.BooleanField(default=False)
    can_dashboard = models.BooleanField(default=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'staff_role'
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'
        ordering = ['name']
        unique_together = ['tenant', 'name']
        indexes = [
            models.Index(fields=['tenant']),
        ]

    def __str__(self):
        return f"{self.tenant.name} - {self.name}"


class Staff(models.Model):
    """Staff member model (links User to Tenant/Outlet)"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='staff_members')
    outlets = models.ManyToManyField(Outlet, related_name='staff_members', blank=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'staff_staff'
        verbose_name = 'Staff'
        verbose_name_plural = 'Staff'
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['role']),
        ]

    def __str__(self):
        return f"{self.user.name} - {self.tenant.name}"


class Attendance(models.Model):
    """Staff attendance tracking"""
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='attendance_records')
    outlet = models.ForeignKey(Outlet, on_delete=models.CASCADE, related_name='attendance_records')
    check_in = models.DateTimeField()
    check_out = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'staff_attendance'
        verbose_name = 'Attendance'
        verbose_name_plural = 'Attendance Records'
        ordering = ['-check_in']
        indexes = [
            models.Index(fields=['staff']),
            models.Index(fields=['outlet']),
            models.Index(fields=['check_in']),
        ]

    def __str__(self):
        return f"{self.staff.user.name} - {self.check_in}"

