from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from .models import ActivityLog
from .serializers import ActivityLogSerializer
from apps.tenants.permissions import TenantFilterMixin, IsTenantAdmin, IsSaaSAdmin
from rest_framework.permissions import IsAuthenticated


class ActivityLogViewSet(TenantFilterMixin, viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for ActivityLog.
    Only tenant admins and SaaS admins can view activity logs.
    """
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin | IsSaaSAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'module', 'user', 'resource_type']
    search_fields = ['description', 'resource_id', 'user__email', 'user__name']
    ordering_fields = ['created_at', 'action', 'module']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter by tenant and apply additional filters"""
        queryset = super().get_queryset()
        
        # Date range filter
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            try:
                # Handle both date strings (YYYY-MM-DD) and ISO datetime strings
                if 'T' in date_from or '+' in date_from or 'Z' in date_from:
                    # ISO datetime format
                    from datetime import datetime
                    date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                    queryset = queryset.filter(created_at__gte=date_from_obj)
                else:
                    # Date string format (YYYY-MM-DD) - convert to start of day
                    from datetime import datetime
                    date_from_obj = datetime.strptime(date_from, '%Y-%m-%d')
                    queryset = queryset.filter(created_at__gte=date_from_obj)
            except (ValueError, TypeError) as e:
                # If parsing fails, skip date filter
                pass
        
        if date_to:
            try:
                # Handle both date strings (YYYY-MM-DD) and ISO datetime strings
                if 'T' in date_to or '+' in date_to or 'Z' in date_to:
                    # ISO datetime format - add one day to include the entire end date
                    from datetime import datetime
                    date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                    date_to_obj = date_to_obj + timedelta(days=1)
                    queryset = queryset.filter(created_at__lte=date_to_obj)
                else:
                    # Date string format (YYYY-MM-DD) - add one day to include the entire end date
                    from datetime import datetime
                    date_to_obj = datetime.strptime(date_to, '%Y-%m-%d')
                    date_to_obj = date_to_obj + timedelta(days=1)
                    queryset = queryset.filter(created_at__lte=date_to_obj)
            except (ValueError, TypeError) as e:
                # If parsing fails, skip date filter
                pass
        
        return queryset.select_related('user', 'tenant')
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary statistics for activity logs"""
        queryset = self.get_queryset()
        
        # Get date range from query params or default to last 30 days
        days = int(request.query_params.get('days', 30))
        date_from = timezone.now() - timedelta(days=days)
        queryset = queryset.filter(created_at__gte=date_from)
        
        # Count by action
        action_counts = {}
        for action_code, action_label in ActivityLog.ACTION_CHOICES:
            count = queryset.filter(action=action_code).count()
            if count > 0:
                action_counts[action_label] = count
        
        # Count by module
        module_counts = {}
        for module_code, module_label in ActivityLog.MODULE_CHOICES:
            count = queryset.filter(module=module_code).count()
            if count > 0:
                module_counts[module_label] = count
        
        # Top users
        from django.db.models import Count
        top_users = queryset.values('user__email', 'user__name').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        return Response({
            'total_actions': queryset.count(),
            'date_range_days': days,
            'action_counts': action_counts,
            'module_counts': module_counts,
            'top_users': list(top_users),
        })

