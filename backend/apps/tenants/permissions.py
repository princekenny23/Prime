from rest_framework import permissions


class IsSaaSAdmin(permissions.BasePermission):
    """Permission check for SaaS admin users"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_saas_admin


class IsTenantMember(permissions.BasePermission):
    """Permission check for tenant members"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.tenant is not None


class TenantFilterMixin:
    """Mixin to filter queryset by tenant"""
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # SaaS admins can see all tenants
        if self.request.user.is_saas_admin:
            return queryset
        # Regular users only see their tenant
        if hasattr(self.request, 'tenant') and self.request.tenant:
            return queryset.filter(tenant=self.request.tenant)
        # If no tenant in request, filter by user's tenant
        if self.request.user.tenant:
            return queryset.filter(tenant=self.request.user.tenant)
        return queryset.none()

