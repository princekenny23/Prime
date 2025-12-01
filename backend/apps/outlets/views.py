from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Outlet, Till
from .serializers import OutletSerializer, TillSerializer
from apps.tenants.permissions import TenantFilterMixin


class OutletViewSet(viewsets.ModelViewSet, TenantFilterMixin):
    """Outlet ViewSet"""
    queryset = Outlet.objects.select_related('tenant').prefetch_related('tills')
    serializer_class = OutletSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'tenant']
    search_fields = ['name', 'phone', 'email', 'address']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def perform_create(self, serializer):
        # Set tenant from request if not provided
        if not serializer.validated_data.get('tenant'):
            if hasattr(self.request, 'tenant') and self.request.tenant:
                serializer.save(tenant=self.request.tenant)
            elif self.request.user.tenant:
                serializer.save(tenant=self.request.user.tenant)
            else:
                serializer.save()
        else:
            serializer.save()
    
    @action(detail=True, methods=['get'])
    def tills(self, request, pk=None):
        """Get tills for an outlet"""
        outlet = self.get_object()
        tills = outlet.tills.filter(is_active=True)
        serializer = TillSerializer(tills, many=True)
        return Response(serializer.data)


class TillViewSet(viewsets.ModelViewSet):
    """Till ViewSet"""
    queryset = Till.objects.select_related('outlet')
    serializer_class = TillSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['outlet', 'is_active', 'is_in_use']
    search_fields = ['name']

