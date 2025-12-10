from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.auth import get_user_model
import logging
from .models import Tenant
from .serializers import TenantSerializer
from .permissions import IsSaaSAdmin, TenantFilterMixin

User = get_user_model()
logger = logging.getLogger(__name__)


class TenantViewSet(viewsets.ModelViewSet, TenantFilterMixin):
    """Tenant ViewSet"""
    queryset = Tenant.objects.prefetch_related('outlets', 'users').all()
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['type', 'is_active']
    search_fields = ['name', 'email', 'phone']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']
    
    def get_permissions(self):
        """SaaS admins can manage all tenants, regular users can create their own tenant"""
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsSaaSAdmin()]
        # Allow authenticated users to create their own tenant (for onboarding)
        if self.action == 'create':
            return [IsAuthenticated()]
        return [IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        """Override create to log validation errors"""
        logger.info(f"Creating tenant with data: {request.data}")
        logger.info(f"User: {request.user}, Is SaaS Admin: {getattr(request.user, 'is_saas_admin', False)}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Tenant validation errors: {serializer.errors}")
            # Return detailed error message
            error_detail = serializer.errors
            if isinstance(error_detail, dict):
                # Format errors nicely
                error_messages = []
                for field, errors in error_detail.items():
                    if isinstance(errors, list):
                        error_messages.extend([f"{field}: {error}" for error in errors])
                    else:
                        error_messages.append(f"{field}: {errors}")
                error_detail = {'detail': '; '.join(error_messages), 'errors': serializer.errors}
            return Response(error_detail, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        """Set tenant for regular users during creation"""
        # If user is not SaaS admin, they're creating their own tenant
        # The tenant will be automatically associated with them
        tenant = serializer.save()
        
        # If user doesn't have a tenant yet, associate this one
        if not self.request.user.is_saas_admin and not self.request.user.tenant:
            # Refresh user from database to ensure we have the latest instance
            user = User.objects.get(pk=self.request.user.pk)
            user.tenant = tenant
            user.save(update_fields=['tenant'])
            # Update request.user to reflect the change
            self.request.user.tenant = tenant
        
        return tenant
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current user's tenant"""
        if request.user.is_saas_admin:
            return Response({"detail": "SaaS admins don't have a tenant"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not request.user.tenant:
            return Response({"detail": "User has no tenant"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(request.user.tenant)
        return Response(serializer.data)

