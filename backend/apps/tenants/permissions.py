from rest_framework import permissions


class IsSaaSAdmin(permissions.BasePermission):
    """Permission check for SaaS admin users"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_saas_admin


class IsTenantMember(permissions.BasePermission):
    """Permission check for tenant members"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.tenant is not None


class IsTenantAdmin(permissions.BasePermission):
    """Permission check for tenant admin users"""
    
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        # Tenant admin is a user with role='admin' and not a SaaS admin
        return user.role == 'admin' and not user.is_saas_admin


def is_tenant_admin(user):
    """Helper function to check if user is a tenant admin"""
    if not user or not user.is_authenticated:
        return False
    return user.role == 'admin' and not user.is_saas_admin


def is_admin_user(user):
    """Helper function to check if user is SaaS admin or tenant admin"""
    if not user or not user.is_authenticated:
        return False
    return user.is_saas_admin or is_tenant_admin(user)


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
    
    def get_tenant_for_request(self, request):
        """
        Helper method to get tenant for a request with proper validation.
        CRITICAL: Use this in perform_create to ensure tenant isolation.
        SaaS admins can access any tenant by providing tenant_id in request data.
        
        Returns:
            Tenant instance or None
        
        Raises:
            ValidationError if tenant is required but missing (for non-SaaS admins)
        """
        # SaaS admins can access any tenant
        if request.user.is_saas_admin:
            # Check if tenant_id is provided in request data
            tenant_id = None
            if hasattr(request, 'data'):
                tenant_id = request.data.get('tenant') or request.data.get('tenant_id')
            if not tenant_id:
                tenant_id = request.query_params.get('tenant') or request.query_params.get('tenant_id')
            if tenant_id:
                try:
                    from .models import Tenant
                    return Tenant.objects.get(id=int(tenant_id))
                except (Tenant.DoesNotExist, ValueError, TypeError):
                    pass
            # If no tenant_id provided, return None (SaaS admin can work without tenant)
            return None
        
        # Refresh user to ensure tenant is loaded (important during onboarding)
        user = request.user
        if not hasattr(user, '_tenant_loaded'):
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user = User.objects.select_related('tenant').get(pk=user.pk)
                request.user = user
                user._tenant_loaded = True
            except User.DoesNotExist:
                pass
        
        # Get tenant from request context (set by middleware) or user
        tenant = getattr(request, 'tenant', None) or user.tenant
        
        return tenant
    
    def require_tenant(self, request):
        """
        CRITICAL: Get tenant and raise error if missing.
        Use this in perform_create to enforce tenant isolation.
        SaaS admins can provide tenant_id in request data to work with any tenant.
        
        Returns:
            Tenant instance
        
        Raises:
            ValidationError if tenant is missing (for non-SaaS admins)
        """
        from rest_framework.exceptions import ValidationError
        
        # SaaS admins can work without tenant or provide tenant_id in request
        if request.user.is_saas_admin:
            tenant = self.get_tenant_for_request(request)
            if not tenant:
                # SaaS admin can work without tenant, but if tenant_id is provided, it must be valid
                tenant_id = None
                if hasattr(request, 'data'):
                    tenant_id = request.data.get('tenant') or request.data.get('tenant_id')
                if tenant_id:
                    try:
                        from .models import Tenant
                        return Tenant.objects.get(id=int(tenant_id))
                    except (Tenant.DoesNotExist, ValueError, TypeError):
                        raise ValidationError(f"Invalid tenant ID: {tenant_id}")
                # SaaS admin can proceed without tenant
                return None
        
        tenant = self.get_tenant_for_request(request)
        
        if not tenant:
            raise ValidationError(
                "Tenant is required. Please ensure you are authenticated and have a tenant assigned. "
                "If you just created a tenant, please refresh your session or log out and log back in."
            )
        
        return tenant
    
    def get_outlet_for_request(self, request):
        """
        Helper method to get outlet for a request.
        Checks query params, headers, and request data.
        SaaS admins can access outlets from any tenant.
        
        Returns:
            Outlet instance or None
        """
        # Check query params first (most common)
        outlet_id = request.query_params.get('outlet') or request.query_params.get('outlet_id')
        
        # Check headers (X-Outlet-ID)
        if not outlet_id:
            outlet_id = request.headers.get('X-Outlet-ID')
        
        # Check request data (for POST/PUT)
        if not outlet_id and hasattr(request, 'data'):
            outlet_id = request.data.get('outlet') or request.data.get('outlet_id')
        
        if not outlet_id:
            return None
        
        try:
            from apps.outlets.models import Outlet
            # SaaS admins can access outlets from any tenant
            if request.user.is_saas_admin:
                return Outlet.objects.get(id=outlet_id)
            else:
                tenant = self.get_tenant_for_request(request)
                if not tenant:
                    return None
                return Outlet.objects.get(id=outlet_id, tenant=tenant)
        except (Outlet.DoesNotExist, ValueError, TypeError):
            return None
    
    def validate_tenant_id(self, request, tenant_id_from_data):
        """
        CRITICAL: Validate that tenant_id from request data matches authenticated tenant.
        Use this to prevent cross-tenant data leakage.
        SaaS admins can set any tenant_id.
        
        Args:
            request: DRF request object
            tenant_id_from_data: Tenant ID from request data (if provided)
        
        Raises:
            ValidationError if tenant IDs don't match (for non-SaaS admins)
        """
        # SaaS admins can set any tenant_id
        if request.user.is_saas_admin:
            if tenant_id_from_data:
                try:
                    from .models import Tenant
                    tenant_id = int(tenant_id_from_data)
                    Tenant.objects.get(id=tenant_id)  # Validate tenant exists
                except (Tenant.DoesNotExist, ValueError, TypeError):
                    from rest_framework.exceptions import ValidationError
                    raise ValidationError(f"Invalid tenant ID: {tenant_id_from_data}")
            return  # SaaS admin can proceed
        
        if not tenant_id_from_data:
            return  # No tenant ID in data, will be set from authenticated tenant
        
        from rest_framework.exceptions import ValidationError
        
        tenant = self.get_tenant_for_request(request)
        
        if not tenant:
            raise ValidationError("Tenant is required.")
        
        try:
            tenant_id_from_data = int(tenant_id_from_data)
            if tenant.id != tenant_id_from_data:
                raise ValidationError(
                    f"You can only create resources for your own tenant. "
                    f"Requested tenant {tenant_id_from_data} does not match your tenant {tenant.id}."
                )
        except (ValueError, TypeError):
            raise ValidationError("Invalid tenant ID format.")

