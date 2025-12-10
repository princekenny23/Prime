from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from .models import Table, KitchenOrderTicket
from .serializers import TableSerializer, KitchenOrderTicketSerializer
from apps.tenants.permissions import TenantFilterMixin


class TableViewSet(viewsets.ModelViewSet, TenantFilterMixin):
    """Restaurant Table ViewSet"""
    queryset = Table.objects.select_related('tenant', 'outlet', 'outlet__tenant')
    serializer_class = TableSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['outlet', 'status', 'is_active']
    search_fields = ['number', 'location']
    ordering_fields = ['number', 'capacity', 'created_at']
    ordering = ['number']
    
    def get_queryset(self):
        """Filter tables by tenant - ensure tenant filtering"""
        import logging
        logger = logging.getLogger(__name__)
        
        # Ensure user.tenant is loaded
        user = self.request.user
        if not hasattr(user, '_tenant_loaded'):
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user = User.objects.select_related('tenant').get(pk=user.pk)
                self.request.user = user
                user._tenant_loaded = True
            except User.DoesNotExist:
                pass
        
        is_saas_admin = getattr(user, 'is_saas_admin', False)
        request_tenant = getattr(self.request, 'tenant', None)
        user_tenant = getattr(user, 'tenant', None)
        tenant = request_tenant or user_tenant
        
        logger.info(f"TableViewSet.get_queryset - User: {user.email}, Tenant: {tenant.id if tenant else None}, SaaS Admin: {is_saas_admin}")
        
        # Get base queryset
        queryset = Table.objects.select_related('tenant', 'outlet', 'outlet__tenant').all()
        
        # Apply tenant filter - CRITICAL for security
        if not is_saas_admin:
            if tenant:
                queryset = queryset.filter(tenant=tenant)
                logger.info(f"Filtered tables by tenant {tenant.id}, count: {queryset.count()}")
            else:
                logger.warning("No tenant found for user, returning empty queryset")
                return queryset.none()
        else:
            logger.info(f"SaaS admin - returning all tables, count: {queryset.count()}")
        
        return queryset
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Set tenant and validate outlet belongs to tenant"""
        tenant = getattr(self.request, 'tenant', None) or self.request.user.tenant
        
        if not tenant:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Tenant is required. Please ensure you are authenticated and have a tenant assigned.")
        
        # Validate outlet belongs to tenant if provided
        outlet_id = serializer.validated_data.get('outlet_id')
        if outlet_id:
            from apps.outlets.models import Outlet
            try:
                outlet = Outlet.objects.get(id=outlet_id, tenant=tenant)
                serializer.save(tenant=tenant, outlet=outlet)
            except Outlet.DoesNotExist:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("Outlet does not belong to your tenant.")
        else:
            serializer.save(tenant=tenant)
    
    def update(self, request, *args, **kwargs):
        """Override update to ensure tenant matches"""
        instance = self.get_object()
        tenant = getattr(request, 'tenant', None) or request.user.tenant
        
        # Verify tenant matches (unless SaaS admin or tenant admin)
        from apps.tenants.permissions import is_admin_user
        if not is_admin_user(request.user) and tenant and instance.tenant != tenant:
            return Response(
                {"detail": "You do not have permission to update this table."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to ensure tenant matches"""
        instance = self.get_object()
        tenant = getattr(request, 'tenant', None) or request.user.tenant
        
        # Verify tenant matches (unless SaaS admin or tenant admin)
        from apps.tenants.permissions import is_admin_user
        if not is_admin_user(request.user) and tenant and instance.tenant != tenant:
            return Response(
                {"detail": "You do not have permission to delete this table."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)


class KitchenOrderTicketViewSet(viewsets.ModelViewSet, TenantFilterMixin):
    """Kitchen Order Ticket ViewSet"""
    queryset = KitchenOrderTicket.objects.select_related('tenant', 'outlet', 'sale', 'table')
    serializer_class = KitchenOrderTicketSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['outlet', 'status', 'priority', 'table']
    ordering_fields = ['sent_to_kitchen_at', 'priority']
    ordering = ['-sent_to_kitchen_at']
    
    def get_queryset(self):
        """Filter KOTs by tenant - ensure tenant filtering"""
        # Ensure user.tenant is loaded
        user = self.request.user
        if not hasattr(user, '_tenant_loaded'):
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user = User.objects.select_related('tenant').get(pk=user.pk)
                self.request.user = user
                user._tenant_loaded = True
            except User.DoesNotExist:
                pass
        
        is_saas_admin = getattr(user, 'is_saas_admin', False)
        request_tenant = getattr(self.request, 'tenant', None)
        user_tenant = getattr(user, 'tenant', None)
        tenant = request_tenant or user_tenant
        
        # Get base queryset
        queryset = KitchenOrderTicket.objects.select_related('tenant', 'outlet', 'sale', 'table').all()
        
        # Apply tenant filter - CRITICAL for security
        if not is_saas_admin:
            if tenant:
                queryset = queryset.filter(tenant=tenant)
            else:
                return queryset.none()
        
        return queryset
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Create KOT from sale"""
        tenant = getattr(self.request, 'tenant', None) or self.request.user.tenant
        if not tenant:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Tenant is required.")
        
        sale_id = serializer.validated_data.get('sale_id')
        from apps.sales.models import Sale
        try:
            sale = Sale.objects.get(id=sale_id, tenant=tenant)
        except Sale.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Sale does not belong to your tenant.")
        
        # Generate KOT number
        import random
        kot_number = f"KOT-{timezone.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
        
        # Get outlet from sale
        outlet = sale.outlet
        
        # Get table from sale or from serializer
        table_id = serializer.validated_data.get('table_id') or (sale.table.id if sale.table else None)
        table = None
        if table_id:
            from .models import Table
            try:
                table = Table.objects.get(id=table_id, tenant=tenant)
            except Table.DoesNotExist:
                pass
        
        serializer.save(
            tenant=tenant,
            outlet=outlet,
            sale=sale,
            table=table,
            kot_number=kot_number
        )
    
    def update(self, request, *args, **kwargs):
        """Override update to ensure tenant matches"""
        instance = self.get_object()
        tenant = getattr(request, 'tenant', None) or request.user.tenant
        
        # Verify tenant matches (unless SaaS admin or tenant admin)
        from apps.tenants.permissions import is_admin_user
        if not is_admin_user(request.user) and tenant and instance.tenant != tenant:
            return Response(
                {"detail": "You do not have permission to update this KOT."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to ensure tenant matches"""
        instance = self.get_object()
        tenant = getattr(request, 'tenant', None) or request.user.tenant
        
        # Verify tenant matches (unless SaaS admin or tenant admin)
        from apps.tenants.permissions import is_admin_user
        if not is_admin_user(request.user) and tenant and instance.tenant != tenant:
            return Response(
                {"detail": "You do not have permission to delete this KOT."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def update_item_status(self, request, pk=None):
        """Update kitchen status of a sale item"""
        kot = self.get_object()
        tenant = getattr(request, 'tenant', None) or request.user.tenant
        
        # CRITICAL: Verify tenant matches (unless SaaS admin or tenant admin)
        from apps.tenants.permissions import is_admin_user
        if not is_admin_user(request.user) and tenant and kot.tenant != tenant:
            return Response(
                {"detail": "You do not have permission to update this KOT."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        item_id = request.data.get('item_id')
        new_status = request.data.get('status')
        
        if not item_id or not new_status:
            return Response(
                {"detail": "item_id and status are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_status not in ['pending', 'preparing', 'ready', 'served', 'cancelled']:
            return Response(
                {"detail": "Invalid status"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from apps.sales.models import SaleItem
            # CRITICAL: Ensure sale item belongs to tenant through sale
            item = SaleItem.objects.get(id=item_id, sale=kot.sale, sale__tenant=tenant)
            item.kitchen_status = new_status
            
            if new_status == 'ready':
                item.prepared_at = timezone.now()
                # Update KOT status if all items are ready
                if kot.sale.items.exclude(kitchen_status='ready').exclude(kitchen_status='served').exclude(kitchen_status='cancelled').count() == 0:
                    kot.status = 'ready'
                    kot.ready_at = timezone.now()
            elif new_status == 'preparing' and kot.status == 'pending':
                kot.status = 'preparing'
                kot.started_at = timezone.now()
            elif new_status == 'served':
                # Update KOT status if all items are served
                if kot.sale.items.exclude(kitchen_status='served').exclude(kitchen_status='cancelled').count() == 0:
                    kot.status = 'served'
                    kot.served_at = timezone.now()
            
            item.save()
            kot.save()
            
            return Response({
                "message": "Item status updated",
                "item": {
                    "id": str(item.id),
                    "product_name": item.product_name,
                    "kitchen_status": item.kitchen_status,
                }
            })
        except SaleItem.DoesNotExist:
            return Response(
                {"detail": "Sale item not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending kitchen orders"""
        queryset = self.get_queryset().filter(status__in=['pending', 'preparing'])
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def ready(self, request):
        """Get ready kitchen orders"""
        queryset = self.get_queryset().filter(status='ready')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

