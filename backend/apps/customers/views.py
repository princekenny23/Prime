from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from .models import Customer, LoyaltyTransaction, CreditPayment
from .serializers import CustomerSerializer, LoyaltyTransactionSerializer, CreditPaymentSerializer
from apps.tenants.permissions import TenantFilterMixin
from apps.sales.models import Sale


class CustomerViewSet(viewsets.ModelViewSet, TenantFilterMixin):
    """Customer ViewSet"""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tenant', 'outlet', 'is_active']
    search_fields = ['name', 'email', 'phone']
    ordering_fields = ['name', 'created_at', 'total_spent']
    ordering = ['name']
    
    def perform_create(self, serializer):
        tenant = getattr(self.request, 'tenant', None) or self.request.user.tenant
        if not serializer.validated_data.get('tenant'):
            serializer.save(tenant=tenant)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'])
    def adjust_points(self, request, pk=None):
        """Adjust customer loyalty points"""
        customer = self.get_object()
        points = request.data.get('points')
        transaction_type = request.data.get('type', 'adjusted')
        reason = request.data.get('reason', '')
        
        if points is None:
            return Response(
                {"detail": "points is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Adjust points
            if transaction_type == 'earned':
                customer.loyalty_points += abs(points)
            elif transaction_type == 'redeemed':
                customer.loyalty_points = max(0, customer.loyalty_points - abs(points))
            else:  # adjusted
                customer.loyalty_points = max(0, points)
            
            customer.save()
            
            # Record transaction
            LoyaltyTransaction.objects.create(
                customer=customer,
                transaction_type=transaction_type,
                points=abs(points) if transaction_type != 'adjusted' else points,
                reason=reason
            )
        
        serializer = self.get_serializer(customer)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def credit_summary(self, request, pk=None):
        """Get customer credit summary including outstanding balance and unpaid invoices"""
        customer = self.get_object()
        tenant = getattr(request, 'tenant', None) or request.user.tenant
        
        # Get unpaid credit sales
        unpaid_sales = Sale.objects.filter(
            customer=customer,
            tenant=tenant,
            payment_method='credit',
            payment_status__in=['unpaid', 'partially_paid', 'overdue']
        ).order_by('created_at')
        
        # Calculate totals
        total_outstanding = customer.outstanding_balance
        overdue_amount = Decimal('0')
        overdue_count = 0
        
        unpaid_invoices = []
        for sale in unpaid_sales:
            remaining = sale.remaining_balance
            is_overdue = sale.payment_status == 'overdue' or (sale.due_date and sale.due_date < timezone.now())
            
            if is_overdue:
                overdue_amount += remaining
                overdue_count += 1
            
            unpaid_invoices.append({
                'id': sale.id,
                'receipt_number': sale.receipt_number,
                'date': sale.created_at,
                'due_date': sale.due_date,
                'total': float(sale.total),
                'amount_paid': float(sale.amount_paid),
                'remaining': float(remaining),
                'payment_status': sale.payment_status,
                'is_overdue': is_overdue,
                'days_overdue': (timezone.now() - sale.due_date).days if (sale.due_date and sale.due_date < timezone.now()) else 0,
            })
        
        return Response({
            'customer_id': customer.id,
            'customer_name': customer.name,
            'credit_enabled': customer.credit_enabled,
            'credit_limit': float(customer.credit_limit),
            'outstanding_balance': float(total_outstanding),
            'available_credit': float(customer.available_credit),
            'payment_terms_days': customer.payment_terms_days,
            'credit_status': customer.credit_status,
            'overdue_amount': float(overdue_amount),
            'overdue_count': overdue_count,
            'unpaid_invoices': unpaid_invoices,
            'unpaid_count': len(unpaid_invoices),
        })
    
    @action(detail=True, methods=['patch'])
    def adjust_credit(self, request, pk=None):
        """Adjust customer credit limit or payment terms"""
        customer = self.get_object()
        credit_limit = request.data.get('credit_limit')
        payment_terms_days = request.data.get('payment_terms_days')
        credit_enabled = request.data.get('credit_enabled')
        credit_status = request.data.get('credit_status')
        credit_notes = request.data.get('credit_notes')
        
        if credit_limit is not None:
            customer.credit_limit = Decimal(str(credit_limit))
        if payment_terms_days is not None:
            customer.payment_terms_days = int(payment_terms_days)
        if credit_enabled is not None:
            customer.credit_enabled = bool(credit_enabled)
        if credit_status is not None:
            customer.credit_status = credit_status
        if credit_notes is not None:
            customer.credit_notes = credit_notes
        
        customer.save()
        serializer = self.get_serializer(customer)
        return Response(serializer.data)


class CreditPaymentViewSet(viewsets.ModelViewSet, TenantFilterMixin):
    """Credit Payment ViewSet"""
    queryset = CreditPayment.objects.select_related('customer', 'sale', 'user')
    serializer_class = CreditPaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tenant', 'customer', 'sale', 'payment_method']
    search_fields = ['reference_number', 'notes']
    ordering_fields = ['payment_date', 'created_at', 'amount']
    ordering = ['-payment_date', '-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by tenant
        if self.request.user.is_saas_admin:
            return queryset
        if hasattr(self.request, 'tenant') and self.request.tenant:
            return queryset.filter(tenant=self.request.tenant)
        if self.request.user.tenant:
            return queryset.filter(tenant=self.request.user.tenant)
        return queryset.none()
    
    def perform_create(self, serializer):
        tenant = getattr(self.request, 'tenant', None) or self.request.user.tenant
        serializer.save(tenant=tenant, user=self.request.user)
        
        # Update sale payment status and amount_paid
        sale = serializer.instance.sale
        sale.amount_paid += serializer.instance.amount
        sale.update_payment_status()
        
        # Update customer if needed (outstanding balance is calculated property)

