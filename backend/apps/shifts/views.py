from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction
from django.utils import timezone
from datetime import date
from .models import Shift
from .serializers import ShiftSerializer
from apps.outlets.models import Till
from apps.tenants.permissions import TenantFilterMixin


class ShiftViewSet(viewsets.ModelViewSet, TenantFilterMixin):
    """Shift ViewSet"""
    queryset = Shift.objects.select_related('outlet', 'till', 'user')
    serializer_class = ShiftSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['outlet', 'till', 'status', 'operating_date']
    ordering_fields = ['start_time', 'operating_date']
    ordering = ['-start_time']
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def start(self, request):
        """Start a new shift"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        outlet_id = serializer.validated_data.get('outlet_id')
        till_id = serializer.validated_data.get('till_id')
        operating_date = serializer.validated_data.get('operating_date', date.today())
        
        # Check if shift already exists
        existing_shift = Shift.objects.filter(
            outlet_id=outlet_id,
            till_id=till_id,
            operating_date=operating_date,
            status='OPEN'
        ).first()
        
        if existing_shift:
            return Response(
                {"detail": "A shift already exists for this outlet, date, and till combination."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if till is in use
        try:
            till = Till.objects.get(id=till_id)
            if till.is_in_use:
                return Response(
                    {"detail": "This till is currently in use. Please select another till."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Mark till as in use
            till.is_in_use = True
            till.save()
        except Till.DoesNotExist:
            return Response(
                {"detail": "Till not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create shift
        shift = serializer.save(user=request.user, status='OPEN')
        response_serializer = ShiftSerializer(shift)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close a shift"""
        shift = self.get_object()
        
        if shift.status == 'CLOSED':
            return Response(
                {"detail": "Shift is already closed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        closing_cash_balance = request.data.get('closing_cash_balance')
        if closing_cash_balance is None:
            return Response(
                {"detail": "closing_cash_balance is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            shift.closing_cash_balance = closing_cash_balance
            shift.status = 'CLOSED'
            shift.end_time = timezone.now()
            shift.save()
            
            # Mark till as available
            shift.till.is_in_use = False
            shift.till.save()
        
        response_serializer = ShiftSerializer(shift)
        return Response(response_serializer.data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active shift for current user"""
        tenant = getattr(request, 'tenant', None) or request.user.tenant
        if not tenant:
            return Response({"detail": "User must have a tenant"}, status=status.HTTP_400_BAD_REQUEST)
        
        outlet_id = request.query_params.get('outlet_id')
        if not outlet_id:
            return Response({"detail": "outlet_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        shift = Shift.objects.filter(
            outlet_id=outlet_id,
            user=request.user,
            status='OPEN'
        ).first()
        
        if not shift:
            return Response({"detail": "No active shift found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(shift)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get shift history"""
        queryset = self.filter_queryset(self.get_queryset())
        queryset = queryset.filter(status='CLOSED')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def check(self, request):
        """Check if shift exists"""
        outlet_id = request.query_params.get('outlet_id')
        till_id = request.query_params.get('till_id')
        date_str = request.query_params.get('date')
        
        if not all([outlet_id, till_id, date_str]):
            return Response({"exists": False})
        
        try:
            operating_date = date.fromisoformat(date_str)
        except ValueError:
            return Response({"exists": False})
        
        exists = Shift.objects.filter(
            outlet_id=outlet_id,
            till_id=till_id,
            operating_date=operating_date,
            status='OPEN'
        ).exists()
        
        return Response({"exists": exists})

