from django.contrib import admin
from .models import Role, Staff, Attendance


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant', 'is_active', 'created_at')
    list_filter = ('tenant', 'is_active')
    search_fields = ('name', 'description')


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ('user', 'tenant', 'role', 'is_active', 'created_at')
    list_filter = ('tenant', 'role', 'is_active')
    search_fields = ('user__name', 'user__email')
    filter_horizontal = ('outlets',)


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('staff', 'outlet', 'check_in', 'check_out', 'created_at')
    list_filter = ('outlet', 'check_in')
    search_fields = ('staff__user__name',)

