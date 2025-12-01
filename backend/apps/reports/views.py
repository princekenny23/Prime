from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta
from apps.sales.models import Sale, SaleItem
from apps.products.models import Product
from apps.customers.models import Customer
from apps.inventory.models import StockMovement


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
    outlet_id = request.query_params.get('outlet_id')
    payment_method = request.query_params.get('payment_method')
    
    queryset = Sale.objects.filter(tenant=tenant, status='completed')
    
    if start_date:
        queryset = queryset.filter(created_at__gte=start_date)
    if end_date:
        queryset = queryset.filter(created_at__lte=end_date)
    if outlet_id:
        queryset = queryset.filter(outlet_id=outlet_id)
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
    """Products performance report"""
    tenant = getattr(request, 'tenant', None) or request.user.tenant
    if not tenant:
        return Response({"detail": "User must have a tenant"}, status=400)
    
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    queryset = Product.objects.filter(tenant=tenant)
    sales_queryset = Sale.objects.filter(tenant=tenant, status='completed')
    
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
    outlet_id = request.query_params.get('outlet_id')
    
    sales_queryset = Sale.objects.filter(tenant=tenant, status='completed')
    
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
    outlet_id = request.query_params.get('outlet_id')
    movement_type = request.query_params.get('movement_type')
    
    queryset = StockMovement.objects.filter(tenant=tenant)
    
    if start_date:
        queryset = queryset.filter(created_at__gte=start_date)
    if end_date:
        queryset = queryset.filter(created_at__lte=end_date)
    if outlet_id:
        queryset = queryset.filter(outlet_id=outlet_id)
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

