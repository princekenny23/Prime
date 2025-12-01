from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction
from django.utils import timezone
from datetime import datetime
from .models import Sale, SaleItem
from .serializers import SaleSerializer, SaleItemSerializer
from apps.products.models import Product
from apps.inventory.models import StockMovement
from apps.tenants.permissions import TenantFilterMixin


class SaleViewSet(viewsets.ModelViewSet, TenantFilterMixin):
    """Sale ViewSet with atomic transactions"""
    queryset = Sale.objects.select_related('tenant', 'outlet', 'user', 'shift', 'customer').prefetch_related('items')
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tenant', 'outlet', 'user', 'status', 'payment_method']
    search_fields = ['receipt_number', 'notes']
    ordering_fields = ['created_at', 'total']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        return queryset
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create sale with atomic stock deduction"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set tenant and user
        tenant = getattr(request, 'tenant', None) or request.user.tenant
        if not tenant:
            return Response({"detail": "User must have a tenant"}, status=status.HTTP_400_BAD_REQUEST)
        
        items_data = serializer.validated_data.pop('items_data')
        
        # Generate receipt number
        receipt_number = self._generate_receipt_number(tenant)
        
        # Create sale
        sale = Sale.objects.create(
            receipt_number=receipt_number,
            user=request.user,
            tenant=tenant,
            **serializer.validated_data
        )
        
        # Process items and deduct stock
        total_subtotal = 0
        for item_data in items_data:
            product_id = item_data.get('product_id')
            quantity = item_data.get('quantity', 1)
            price = item_data.get('price')
            
            if not product_id or not price:
                raise serializers.ValidationError("Each item must have product_id and price")
            
            try:
                product = Product.objects.select_for_update().get(id=product_id, tenant=tenant)
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Product {product_id} not found")
            
            # Check stock
            if product.stock < quantity:
                raise serializers.ValidationError(f"Insufficient stock for {product.name}. Available: {product.stock}")
            
            # Calculate item total
            item_total = price * quantity
            total_subtotal += item_total
            
            # Create sale item
            SaleItem.objects.create(
                sale=sale,
                product=product,
                product_name=product.name,
                quantity=quantity,
                price=price,
                total=item_total
            )
            
            # Deduct stock
            product.stock -= quantity
            product.save()
            
            # Record stock movement
            StockMovement.objects.create(
                tenant=tenant,
                product=product,
                outlet=sale.outlet,
                user=request.user,
                movement_type='sale',
                quantity=quantity,
                reference_id=str(sale.id)
            )
        
        # Calculate totals
        tax = sale.tax or 0
        discount = sale.discount or 0
        sale.subtotal = total_subtotal
        sale.total = total_subtotal + tax - discount
        
        # Handle credit sales
        if sale.payment_method == 'credit':
            if not sale.customer:
                return Response(
                    {"detail": "Customer is required for credit sales"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate credit
            can_sell, error_message = sale.customer.can_make_credit_sale(sale.total)
            if not can_sell:
                return Response(
                    {"detail": error_message},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set due date and payment status
            from datetime import timedelta
            sale.due_date = timezone.now() + timedelta(days=sale.customer.payment_terms_days)
            sale.amount_paid = Decimal('0')
            sale.payment_status = 'unpaid'
            sale.status = 'completed'  # Credit sales are completed but unpaid
        
        sale.save()
        
        # Update customer if provided
        if sale.customer:
            sale.customer.total_spent += sale.total
            sale.customer.last_visit = timezone.now()
            sale.customer.save()
        
        response_serializer = SaleSerializer(sale)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    def _generate_receipt_number(self, tenant):
        """Generate unique receipt number"""
        prefix = tenant.name[:3].upper().replace(' ', '')
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        return f"{prefix}-{timestamp}"
    
    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """Process refund for a sale"""
        sale = self.get_object()
        
        if sale.status == 'refunded':
            return Response(
                {"detail": "Sale is already refunded"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        refund_reason = request.data.get('reason', '')
        
        with transaction.atomic():
            # Restore stock for all items
            for item in sale.items.all():
                if item.product:
                    product = Product.objects.select_for_update().get(id=item.product.id)
                    product.stock += item.quantity
                    product.save()
                    
                    # Record stock movement
                    StockMovement.objects.create(
                        tenant=sale.tenant,
                        product=product,
                        outlet=sale.outlet,
                        user=request.user,
                        movement_type='return',
                        quantity=item.quantity,
                        reason=f"Refund for sale {sale.receipt_number}: {refund_reason}",
                        reference_id=str(sale.id)
                    )
            
            # Update sale status
            sale.status = 'refunded'
            sale.save()
            
            # Update customer if exists
            if sale.customer:
                sale.customer.total_spent = max(0, sale.customer.total_spent - sale.total)
                sale.customer.save()
        
        serializer = self.get_serializer(sale)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get sales statistics"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Date range filters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        total_sales = queryset.count()
        total_revenue = sum(sale.total for sale in queryset)
        today_sales = queryset.filter(created_at__date=timezone.now().date()).count()
        today_revenue = sum(sale.total for sale in queryset.filter(created_at__date=timezone.now().date()))
        
        return Response({
            'total_sales': total_sales,
            'total_revenue': float(total_revenue),
            'today_sales': today_sales,
            'today_revenue': float(today_revenue),
        })

