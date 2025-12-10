from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta, date
from decimal import Decimal
from apps.sales.models import Sale, SaleItem
from apps.products.models import Product
from apps.customers.models import Customer
from apps.inventory.models import StockMovement
from apps.shifts.models import Shift


def get_outlet_id_from_request(request):
    """Helper to get outlet ID from request (header or query param)"""
    # Check header first (X-Outlet-ID)
    outlet_id = request.headers.get('X-Outlet-ID')
    # Fall back to query param
    if not outlet_id:
        outlet_id = request.query_params.get('outlet_id') or request.query_params.get('outlet')
    return outlet_id


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sales_report(request):
    """Sales report with filters"""
    tenant = getattr(request, 'tenant', None) or request.user.tenant
    if not tenant:
        return Response({"detail": "User must have a tenant"}, status=400)
    
    # Filters
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    outlet_id = get_outlet_id_from_request(request)
    payment_method = request.query_params.get('payment_method')
    
    queryset = Sale.objects.filter(tenant=tenant, status='completed')
    
    # Always filter by outlet if provided (required for outlet isolation)
    if outlet_id:
        queryset = queryset.filter(outlet_id=outlet_id)
    else:
        # If no outlet specified, return empty results (reports are outlet-specific)
        queryset = queryset.none()
    
    if start_date:
        queryset = queryset.filter(created_at__gte=start_date)
    if end_date:
        queryset = queryset.filter(created_at__lte=end_date)
    if payment_method:
        queryset = queryset.filter(payment_method=payment_method)
    
    # Aggregations
    total_sales = queryset.count()
    total_revenue = queryset.aggregate(Sum('total'))['total__sum'] or 0
    total_tax = queryset.aggregate(Sum('tax'))['tax__sum'] or 0
    total_discount = queryset.aggregate(Sum('discount'))['discount__sum'] or 0
    
    # Top products
    top_products = SaleItem.objects.filter(sale__in=queryset).values('product_name').annotate(
        total_quantity=Sum('quantity'),
        total_revenue=Sum('total')
    ).order_by('-total_revenue')[:10]
    
    return Response({
        'total_sales': total_sales,
        'total_revenue': float(total_revenue),
        'total_tax': float(total_tax),
        'total_discount': float(total_discount),
        'top_products': list(top_products),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def products_report(request):
    """Products performance report - outlet-specific"""
    tenant = getattr(request, 'tenant', None) or request.user.tenant
    if not tenant:
        return Response({"detail": "User must have a tenant"}, status=400)
    
    outlet_id = get_outlet_id_from_request(request)
    if not outlet_id:
        return Response({"detail": "Outlet is required. Please specify X-Outlet-ID header or ?outlet=id query parameter."}, status=400)
    
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    # Products are now outlet-specific
    queryset = Product.objects.filter(tenant=tenant, outlet_id=outlet_id)
    sales_queryset = Sale.objects.filter(tenant=tenant, outlet_id=outlet_id, status='completed')
    
    if start_date:
        sales_queryset = sales_queryset.filter(created_at__gte=start_date)
    if end_date:
        sales_queryset = sales_queryset.filter(created_at__lte=end_date)
    
    # Product performance
    product_performance = []
    for product in queryset:
        items = SaleItem.objects.filter(
            product=product,
            sale__in=sales_queryset
        )
        total_sold = items.aggregate(Sum('quantity'))['quantity__sum'] or 0
        total_revenue = items.aggregate(Sum('total'))['total__sum'] or 0
        
        product_performance.append({
            'product_id': product.id,
            'product_name': product.name,
            'total_sold': total_sold,
            'total_revenue': float(total_revenue),
            'current_stock': product.stock,
            'is_low_stock': product.is_low_stock,
        })
    
    return Response({
        'products': sorted(product_performance, key=lambda x: x['total_revenue'], reverse=True),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customers_report(request):
    """Customers report"""
    tenant = getattr(request, 'tenant', None) or request.user.tenant
    if not tenant:
        return Response({"detail": "User must have a tenant"}, status=400)
    
    queryset = Customer.objects.filter(tenant=tenant, is_active=True)
    
    total_customers = queryset.count()
    total_points = queryset.aggregate(Sum('loyalty_points'))['loyalty_points__sum'] or 0
    total_spent = queryset.aggregate(Sum('total_spent'))['total_spent__sum'] or 0
    avg_points = queryset.aggregate(Avg('loyalty_points'))['loyalty_points__avg'] or 0
    
    # Top customers
    top_customers = queryset.order_by('-total_spent')[:10].values(
        'id', 'name', 'email', 'phone', 'loyalty_points', 'total_spent', 'last_visit'
    )
    
    return Response({
        'total_customers': total_customers,
        'total_points': total_points,
        'total_spent': float(total_spent),
        'avg_points': float(avg_points),
        'top_customers': list(top_customers),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profit_loss_report(request):
    """Profit & Loss report"""
    tenant = getattr(request, 'tenant', None) or request.user.tenant
    if not tenant:
        return Response({"detail": "User must have a tenant"}, status=400)
    
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    outlet_id = get_outlet_id_from_request(request)
    
    if not outlet_id:
        return Response({"detail": "Outlet is required. Please specify X-Outlet-ID header or ?outlet=id query parameter."}, status=400)
    
    sales_queryset = Sale.objects.filter(tenant=tenant, outlet_id=outlet_id, status='completed')
    
    if start_date:
        sales_queryset = sales_queryset.filter(created_at__gte=start_date)
    if end_date:
        sales_queryset = sales_queryset.filter(created_at__lte=end_date)
    if outlet_id:
        sales_queryset = sales_queryset.filter(outlet_id=outlet_id)
    
    # Revenue
    total_revenue = sales_queryset.aggregate(Sum('total'))['total__sum'] or 0
    
    # Cost of goods sold
    sale_items = SaleItem.objects.filter(sale__in=sales_queryset)
    total_cost = 0
    for item in sale_items:
        if item.product and item.product.cost:
            total_cost += item.product.cost * item.quantity
    
    # Gross profit
    gross_profit = total_revenue - total_cost
    gross_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
    
    return Response({
        'total_revenue': float(total_revenue),
        'total_cost': float(total_cost),
        'gross_profit': float(gross_profit),
        'gross_margin': float(gross_margin),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stock_movement_report(request):
    """Stock movement report"""
    tenant = getattr(request, 'tenant', None) or request.user.tenant
    if not tenant:
        return Response({"detail": "User must have a tenant"}, status=400)
    
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    outlet_id = get_outlet_id_from_request(request)
    movement_type = request.query_params.get('movement_type')
    
    if not outlet_id:
        return Response({"detail": "Outlet is required. Please specify X-Outlet-ID header or ?outlet=id query parameter."}, status=400)
    
    queryset = StockMovement.objects.filter(tenant=tenant, outlet_id=outlet_id)
    
    if start_date:
        queryset = queryset.filter(created_at__gte=start_date)
    if end_date:
        queryset = queryset.filter(created_at__lte=end_date)
    if movement_type:
        queryset = queryset.filter(movement_type=movement_type)
    
    # Group by movement type
    movements_by_type = queryset.values('movement_type').annotate(
        total_quantity=Sum('quantity'),
        count=Count('id')
    )
    
    return Response({
        'movements_by_type': list(movements_by_type),
        'total_movements': queryset.count(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_sales_report(request):
    """Daily sales report filtered by tenant and date"""
    tenant = getattr(request, 'tenant', None) or request.user.tenant
    if not tenant:
        return Response({"detail": "User must have a tenant"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get date filter (default to today)
    date_str = request.query_params.get('date', timezone.now().date().isoformat())
    try:
        report_date = date.fromisoformat(date_str)
    except ValueError:
        return Response({"detail": "Invalid date format. Use YYYY-MM-DD"}, status=status.HTTP_400_BAD_REQUEST)
    
    outlet_id = get_outlet_id_from_request(request)
    
    if not outlet_id:
        return Response({"detail": "Outlet is required. Please specify X-Outlet-ID header or ?outlet=id query parameter."}, status=400)
    
    # Filter sales
    queryset = Sale.objects.filter(
        tenant=tenant,
        outlet_id=outlet_id,
        status='completed',
        created_at__date=report_date
    )
    
    # Aggregations
    total_sales = queryset.count()
    total_revenue = queryset.aggregate(Sum('total'))['total__sum'] or Decimal('0')
    total_tax = queryset.aggregate(Sum('tax'))['tax__sum'] or Decimal('0')
    total_discount = queryset.aggregate(Sum('discount'))['discount__sum'] or Decimal('0')
    
    # By payment method
    by_payment_method = queryset.values('payment_method').annotate(
        count=Count('id'),
        total=Sum('total')
    )
    
    # By shift
    by_shift = queryset.values('shift__id', 'shift__operating_date').annotate(
        count=Count('id'),
        total=Sum('total')
    )
    
    return Response({
        'date': report_date.isoformat(),
        'total_sales': total_sales,
        'total_revenue': float(total_revenue),
        'total_tax': float(total_tax),
        'total_discount': float(total_discount),
        'by_payment_method': list(by_payment_method),
        'by_shift': list(by_shift),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_products_report(request):
    """Top products report filtered by tenant, outlet, and date range"""
    tenant = getattr(request, 'tenant', None) or request.user.tenant
    if not tenant:
        return Response({"detail": "User must have a tenant"}, status=status.HTTP_400_BAD_REQUEST)
    
    outlet_id = get_outlet_id_from_request(request)
    if not outlet_id:
        return Response({"detail": "Outlet is required. Please specify X-Outlet-ID header or ?outlet=id query parameter."}, status=400)
    
    # Get date filters
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    limit = int(request.query_params.get('limit', 10))
    
    # Filter sales by outlet
    sales_queryset = Sale.objects.filter(tenant=tenant, outlet_id=outlet_id, status='completed')
    
    if start_date:
        sales_queryset = sales_queryset.filter(created_at__gte=start_date)
    if end_date:
        sales_queryset = sales_queryset.filter(created_at__lte=end_date)
    
    # Get top products by revenue
    top_products = SaleItem.objects.filter(
        sale__in=sales_queryset
    ).values('product_id', 'product_name').annotate(
        total_quantity=Sum('quantity'),
        total_revenue=Sum('total'),
        sale_count=Count('sale', distinct=True)
    ).order_by('-total_revenue')[:limit]
    
    return Response({
        'top_products': list(top_products),
        'period': {
            'start_date': start_date,
            'end_date': end_date,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cash_summary_report(request):
    """Cash summary report filtered by tenant and date"""
    tenant = getattr(request, 'tenant', None) or request.user.tenant
    if not tenant:
        return Response({"detail": "User must have a tenant"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get date filter (default to today)
    date_str = request.query_params.get('date', timezone.now().date().isoformat())
    try:
        report_date = date.fromisoformat(date_str)
    except ValueError:
        return Response({"detail": "Invalid date format. Use YYYY-MM-DD"}, status=status.HTTP_400_BAD_REQUEST)
    
    outlet_id = get_outlet_id_from_request(request)
    
    # Filter cash sales
    queryset = Sale.objects.filter(
        tenant=tenant,
        payment_method='cash',
        status='completed',
        created_at__date=report_date
    )
    
    if outlet_id:
        queryset = queryset.filter(outlet_id=outlet_id)
    
    # Aggregations
    total_cash_sales = queryset.count()
    total_cash_received = queryset.aggregate(Sum('cash_received'))['cash_received__sum'] or Decimal('0')
    total_change_given = queryset.aggregate(Sum('change_given'))['change_given__sum'] or Decimal('0')
    total_cash_amount = queryset.aggregate(Sum('total'))['total__sum'] or Decimal('0')
    
    # By shift
    shifts = Shift.objects.filter(
        outlet__tenant=tenant,
        outlet_id=outlet_id,
        operating_date=report_date,
        status='CLOSED'
    )
    
    shift_summaries = []
    for shift in shifts:
        shift_sales = queryset.filter(shift=shift)
        shift_summaries.append({
            'shift_id': shift.id,
            'outlet': shift.outlet.name,
            'till': shift.till.name,
            'opening_cash': float(shift.opening_cash_balance),
            'closing_cash': float(shift.closing_cash_balance) if shift.closing_cash_balance else None,
            'system_total': float(shift.system_total) if shift.system_total else None,
            'difference': float(shift.difference) if shift.difference else None,
            'cash_sales_count': shift_sales.count(),
            'cash_sales_total': float(shift_sales.aggregate(Sum('total'))['total__sum'] or Decimal('0')),
        })
    
    return Response({
        'date': report_date.isoformat(),
        'total_cash_sales': total_cash_sales,
        'total_cash_received': float(total_cash_received),
        'total_change_given': float(total_change_given),
        'total_cash_amount': float(total_cash_amount),
        'shifts': shift_summaries,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shift_summary_report(request):
    """Shift summary report filtered by tenant and date range"""
    tenant = getattr(request, 'tenant', None) or request.user.tenant
    if not tenant:
        return Response({"detail": "User must have a tenant"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get date filters
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    outlet_id = get_outlet_id_from_request(request)
    
    if not outlet_id:
        return Response({"detail": "Outlet is required. Please specify X-Outlet-ID header or ?outlet=id query parameter."}, status=400)
    
    # Filter shifts
    queryset = Shift.objects.filter(outlet__tenant=tenant, outlet_id=outlet_id)
    
    if start_date:
        queryset = queryset.filter(operating_date__gte=start_date)
    if end_date:
        queryset = queryset.filter(operating_date__lte=end_date)
    
    # Get closed shifts with summaries
    closed_shifts = queryset.filter(status='CLOSED').select_related('outlet', 'till', 'user')
    
    shift_summaries = []
    for shift in closed_shifts:
        # Get sales for this shift
        shift_sales = Sale.objects.filter(shift=shift, status='completed')
        cash_sales = shift_sales.filter(payment_method='cash')
        
        shift_summaries.append({
            'shift_id': shift.id,
            'outlet': shift.outlet.name,
            'till': shift.till.name,
            'cashier': shift.user.email if shift.user else None,
            'operating_date': shift.operating_date.isoformat(),
            'start_time': shift.start_time.isoformat() if shift.start_time else None,
            'end_time': shift.end_time.isoformat() if shift.end_time else None,
            'opening_cash': float(shift.opening_cash_balance),
            'closing_cash': float(shift.closing_cash_balance) if shift.closing_cash_balance else None,
            'system_total': float(shift.system_total) if shift.system_total else None,
            'difference': float(shift.difference) if shift.difference else None,
            'total_sales': shift_sales.count(),
            'total_revenue': float(shift_sales.aggregate(Sum('total'))['total__sum'] or Decimal('0')),
            'cash_sales_count': cash_sales.count(),
            'cash_sales_total': float(cash_sales.aggregate(Sum('total'))['total__sum'] or Decimal('0')),
        })
    
    return Response({
        'shifts': shift_summaries,
        'total_shifts': len(shift_summaries),
        'period': {
            'start_date': start_date,
            'end_date': end_date,
        }
    })

