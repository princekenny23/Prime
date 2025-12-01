from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from .models import Role, Staff, Attendance
from .serializers import RoleSerializer, StaffSerializer, AttendanceSerializer
from apps.tenants.permissions import TenantFilterMixin


class RoleViewSet(viewsets.ModelViewSet, TenantFilterMixin):
    """Role ViewSet"""
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tenant', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class StaffViewSet(viewsets.ModelViewSet, TenantFilterMixin):
    """Staff ViewSet"""
    queryset = Staff.objects.select_related('user', 'tenant', 'role').prefetch_related('outlets')
    serializer_class = StaffSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tenant', 'role', 'is_active']
    search_fields = ['user__name', 'user__email']
    ordering_fields = ['created_at']
    ordering = ['-created_at']


class AttendanceViewSet(viewsets.ModelViewSet):
    """Attendance ViewSet"""
    queryset = Attendance.objects.select_related('staff', 'outlet')
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['staff', 'outlet']
    ordering_fields = ['check_in']
    ordering = ['-check_in']
    
    @action(detail=False, methods=['post'])
    def check_in(self, request):
        """Check in staff member"""
        staff_id = request.data.get('staff_id')
        outlet_id = request.data.get('outlet_id')
        
        if not all([staff_id, outlet_id]):
            return Response(
                {"detail": "staff_id and outlet_id are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        attendance = Attendance.objects.create(
            staff_id=staff_id,
            outlet_id=outlet_id,
            check_in=timezone.now()
        )
        
        serializer = self.get_serializer(attendance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def check_out(self, request, pk=None):
        """Check out staff member"""
        attendance = self.get_object()
        
        if attendance.check_out:
            return Response(
                {"detail": "Already checked out"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        attendance.check_out = timezone.now()
        attendance.save()
        
        serializer = self.get_serializer(attendance)
        return Response(serializer.data)

