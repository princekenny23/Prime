from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
import logging
from .models import StockMovement, StockTake, StockTakeItem
from .serializers import StockMovementSerializer, StockTakeSerializer, StockTakeItemSerializer
from apps.products.models import Product
from apps.tenants.permissions import TenantFilterMixin

logger = logging.getLogger(__name__)


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet, TenantFilterMixin):
    """Stock movement ViewSet (read-only)"""
    queryset = StockMovement.objects.select_related('product', 'outlet', 'user')
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tenant', 'product', 'outlet', 'movement_type']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def list(self, request, *args, **kwargs):
        """Override list to add logging"""
        logger.info(f"Listing stock movements - User: {request.user.email}, Tenant: {getattr(request.user, 'tenant', None)}")
        logger.info(f"Query params: {request.query_params}")
        response = super().list(request, *args, **kwargs)
        logger.info(f"Stock movements response count: {len(response.data.get('results', [])) if isinstance(response.data, dict) else len(response.data)}")
        return response


class StockTakeItemViewSet(viewsets.ModelViewSet):
    """Stock take item ViewSet"""
    queryset = StockTakeItem.objects.select_related('product', 'stock_take')
    serializer_class = StockTakeItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        stock_take_id = self.kwargs.get('stock_take_pk')
        if stock_take_id:
            return self.queryset.filter(stock_take_id=stock_take_id)
        return self.queryset.none()
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def update(self, request, *args, **kwargs):
        """Override update to add logging and error handling"""
        item_id = kwargs.get('pk')
        logger.info(f"Updating stock take item {item_id} with data: {request.data}")
        logger.info(f"Request method: {request.method}, User: {request.user.email}")
        
        try:
            serializer = self.get_serializer(self.get_object(), data=request.data, partial=True)
            if not serializer.is_valid():
                logger.error(f"Stock take item validation errors: {serializer.errors}")
                from rest_framework.response import Response
                from rest_framework import status
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            serializer.save()
            logger.info(f"Stock take item {item_id} updated successfully: {serializer.data}")
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating stock take item {item_id}: {e}", exc_info=True)
            from rest_framework.response import Response
            from rest_framework import status
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StockTakeViewSet(viewsets.ModelViewSet, TenantFilterMixin):
    """Stock take ViewSet"""
    queryset = StockTake.objects.select_related('tenant', 'outlet', 'user').prefetch_related('items')
    serializer_class = StockTakeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tenant', 'outlet', 'status', 'operating_date']
    ordering_fields = ['created_at', 'operating_date']
    ordering = ['-created_at']
    
    def get_serializer_context(self):
        """Add request to serializer context"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Override create to add logging and better error handling"""
        logger.info(f"Creating stock take with data: {request.data}")
        logger.info(f"User: {request.user}, Tenant: {getattr(request.user, 'tenant', None)}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Stock take validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Error creating stock take: {e}", exc_info=True)
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def perform_create(self, serializer):
        tenant = getattr(self.request, 'tenant', None) or self.request.user.tenant
        if not tenant:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("User must have a tenant")
        
        # Validate outlet belongs to tenant
        outlet_id = self.request.data.get('outlet')
        if not outlet_id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"outlet": "Outlet is required"})
        
        from apps.outlets.models import Outlet
        try:
            # Convert outlet_id to int if it's a string
            outlet_id_int = int(outlet_id) if isinstance(outlet_id, str) else outlet_id
            outlet = Outlet.objects.get(id=outlet_id_int, tenant=tenant)
            logger.info(f"Found outlet: {outlet.id} ({outlet.name}) for tenant: {tenant.id}")
        except Outlet.DoesNotExist:
            logger.error(f"Outlet {outlet_id} not found for tenant {tenant.id}")
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"outlet": "Outlet not found or does not belong to your tenant"})
        except ValueError:
            logger.error(f"Invalid outlet ID format: {outlet_id}")
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"outlet": "Invalid outlet ID format"})
        
        stock_take = serializer.save(
            tenant=tenant,
            outlet=outlet,
            user=self.request.user, 
            status='running'
        )
        
        # Auto-create stock take items for all active products
        with transaction.atomic():
            products = Product.objects.filter(tenant=tenant, is_active=True)
            for product in products:
                StockTakeItem.objects.create(
                    stock_take=stock_take,
                    product=product,
                    expected_quantity=product.stock,
                    counted_quantity=0,
                    notes=''
                )
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete stock take and apply adjustments"""
        stock_take = self.get_object()
        
        if stock_take.status != 'running':
            return Response(
                {"detail": "Stock take is not running"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Apply adjustments
            for item in stock_take.items.all():
                if item.difference != 0:
                    product = item.product
                    product.stock += item.difference
                    product.save()
                    
                    # Record movement
                    StockMovement.objects.create(
                        tenant=stock_take.tenant,
                        product=product,
                        outlet=stock_take.outlet,
                        user=request.user,
                        movement_type='adjustment',
                        quantity=abs(item.difference),
                        reason=f"Stock take adjustment: {item.difference}",
                        reference_id=str(stock_take.id)
                    )
            
            stock_take.status = 'completed'
            stock_take.completed_at = timezone.now()
            stock_take.save()
        
        serializer = self.get_serializer(stock_take)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def adjust(request):
    """Manual stock adjustment"""
    logger.info(f"Stock adjustment request: {request.data}")
    
    product_id = request.data.get('product_id')
    outlet_id = request.data.get('outlet_id')
    quantity = request.data.get('quantity')
    reason = request.data.get('reason', '')
    movement_type = request.data.get('type', 'adjustment')
    
    if not all([product_id, outlet_id, quantity]):
        logger.error(f"Missing required fields: product_id={product_id}, outlet_id={outlet_id}, quantity={quantity}")
        return Response(
            {"detail": "product_id, outlet_id, and quantity are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    tenant = getattr(request, 'tenant', None) or request.user.tenant
    if not tenant:
        logger.error("User must have a tenant")
        return Response({"detail": "User must have a tenant"}, status=status.HTTP_400_BAD_REQUEST)
    
    logger.info(f"Processing adjustment for tenant={tenant.id}, product={product_id}, outlet={outlet_id}, quantity={quantity}")
    
    with transaction.atomic():
        try:
            # select_for_update must be inside the transaction
            product = Product.objects.select_for_update().get(id=product_id, tenant=tenant)
            logger.info(f"Found product: {product.name}, current stock: {product.stock}")
        except Product.DoesNotExist:
            logger.error(f"Product {product_id} not found for tenant {tenant.id}")
            return Response({"detail": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Adjust stock
        old_stock = product.stock
        product.stock += quantity
        if product.stock < 0:
            logger.error(f"Stock would be negative: {product.stock}")
            return Response(
                {"detail": "Stock cannot be negative"},
                status=status.HTTP_400_BAD_REQUEST
            )
        product.save()
        logger.info(f"Product stock updated: {old_stock} -> {product.stock}")
        
        # Record movement
        try:
            movement = StockMovement.objects.create(
                tenant=tenant,
                product=product,
                outlet_id=outlet_id,
                user=request.user,
                movement_type=movement_type,
                quantity=abs(quantity),
                reason=reason
            )
            logger.info(f"StockMovement created: id={movement.id}, type={movement_type}, quantity={movement.quantity}")
        except Exception as e:
            logger.error(f"Failed to create StockMovement: {e}", exc_info=True)
            raise
    
    serializer = StockMovementSerializer(movement)
    logger.info(f"Returning movement data: {serializer.data}")
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def transfer(request):
    """Transfer stock between outlets"""
    product_id = request.data.get('product_id')
    from_outlet_id = request.data.get('from_outlet_id')
    to_outlet_id = request.data.get('to_outlet_id')
    quantity = request.data.get('quantity')
    reason = request.data.get('reason', '')
    
    if not all([product_id, from_outlet_id, to_outlet_id, quantity]):
        return Response(
            {"detail": "product_id, from_outlet_id, to_outlet_id, and quantity are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if from_outlet_id == to_outlet_id:
        return Response(
            {"detail": "Source and destination outlets must be different"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    tenant = getattr(request, 'tenant', None) or request.user.tenant
    if not tenant:
        return Response({"detail": "User must have a tenant"}, status=status.HTTP_400_BAD_REQUEST)
    
    with transaction.atomic():
        try:
            # select_for_update must be inside the transaction
            product = Product.objects.select_for_update().get(id=product_id, tenant=tenant)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        # Note: In a real system, you'd track stock per outlet
        # For now, we just record the movement
        StockMovement.objects.create(
            tenant=tenant,
            product=product,
            outlet_id=from_outlet_id,
            user=request.user,
            movement_type='transfer_out',
            quantity=quantity,
            reason=reason,
            reference_id=to_outlet_id
        )
        
        StockMovement.objects.create(
            tenant=tenant,
            product=product,
            outlet_id=to_outlet_id,
            user=request.user,
            movement_type='transfer_in',
            quantity=quantity,
            reason=reason,
            reference_id=from_outlet_id
        )
    
    return Response({"message": "Stock transfer recorded"}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def receive(request):
    """Receive inventory from suppliers (purchase)"""
    logger.info(f"Receiving request: {request.data}")
    
    outlet_id = request.data.get('outlet_id')
    supplier = request.data.get('supplier', '')
    items = request.data.get('items', [])
    reason = request.data.get('reason', '')
    
    if not outlet_id:
        logger.error("Missing outlet_id")
        return Response(
            {"detail": "outlet_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not items or not isinstance(items, list) or len(items) == 0:
        logger.error("Missing or empty items list")
        return Response(
            {"detail": "items list is required and must not be empty"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    tenant = getattr(request, 'tenant', None) or request.user.tenant
    if not tenant:
        logger.error("User must have a tenant")
        return Response({"detail": "User must have a tenant"}, status=status.HTTP_400_BAD_REQUEST)
    
    logger.info(f"Processing receiving for tenant={tenant.id} (name: {tenant.name}), outlet={outlet_id}, items={len(items)}, supplier={supplier}")
    
    results = []
    errors = []
    
    with transaction.atomic():
        for item in items:
            product_id = item.get('product_id')
            quantity = item.get('quantity')
            cost = item.get('cost')  # Optional: update product cost
            
            if not all([product_id, quantity]):
                errors.append({
                    "product_id": product_id,
                    "error": "product_id and quantity are required"
                })
                continue
            
            try:
                quantity = int(quantity)
                if quantity <= 0:
                    errors.append({
                        "product_id": product_id,
                        "error": "quantity must be positive"
                    })
                    continue
            except (ValueError, TypeError):
                errors.append({
                    "product_id": product_id,
                    "error": "quantity must be a valid integer"
                })
                continue
            
            try:
                # select_for_update must be inside the transaction
                product = Product.objects.select_for_update().get(id=product_id, tenant=tenant)
                logger.info(f"Found product: {product.name}, current stock: {product.stock}")
            except Product.DoesNotExist:
                logger.error(f"Product {product_id} not found for tenant {tenant.id}")
                errors.append({
                    "product_id": product_id,
                    "error": "Product not found"
                })
                continue
            
            # Update stock (increase)
            old_stock = product.stock
            product.stock += quantity
            product.save()
            logger.info(f"Product stock updated: {old_stock} -> {product.stock}")
            
            # Update cost if provided
            if cost is not None:
                try:
                    cost_decimal = Decimal(str(cost))
                    if cost_decimal >= 0:
                        product.cost = cost_decimal
                        product.save()
                        logger.info(f"Product cost updated: {product.cost}")
                except (ValueError, TypeError):
                    logger.warning(f"Invalid cost value: {cost}, skipping cost update")
            
            # Record movement
            try:
                movement_reason = reason or (f"Purchase from {supplier}" if supplier else "Purchase")
                movement = StockMovement.objects.create(
                    tenant=tenant,
                    product=product,
                    outlet_id=outlet_id,
                    user=request.user,
                    movement_type='purchase',
                    quantity=quantity,
                    reason=movement_reason,
                    reference_id=supplier if supplier else ''
                )
                logger.info(f"StockMovement created successfully: id={movement.id}, type=purchase, product={product.name}, quantity={movement.quantity}, tenant={tenant.id}, outlet={outlet_id}, supplier={supplier}")
                
                # Verify the record was created
                verify_movement = StockMovement.objects.get(id=movement.id)
                logger.info(f"Verified StockMovement exists: id={verify_movement.id}, movement_type={verify_movement.movement_type}, tenant={verify_movement.tenant.id}")
                
                serializer = StockMovementSerializer(movement)
                results.append(serializer.data)
            except Exception as e:
                logger.error(f"Failed to create StockMovement: {e}", exc_info=True)
                errors.append({
                    "product_id": product_id,
                    "error": str(e)
                })
    
    # Log final summary
    logger.info(f"Receiving completed: {len(results)} successful, {len(errors)} failed")
    logger.info(f"Total StockMovement records for tenant {tenant.id} with type 'purchase': {StockMovement.objects.filter(tenant=tenant, movement_type='purchase').count()}")
    
    if errors and not results:
        return Response(
            {"detail": "All items failed", "errors": errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    response_data = {
        "message": f"Received {len(results)} product(s)",
        "results": results,
    }
    
    if errors:
        response_data["errors"] = errors
        response_data["message"] += f", {len(errors)} failed"
    
    return Response(response_data, status=status.HTTP_201_CREATED)
