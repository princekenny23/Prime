# Wholesale Delivery System Design

## Overview
This document outlines the design for recording and managing wholesale deliveries in PrimePOS. Wholesale businesses often need to deliver products to customers rather than having them pick up at the store.

## Core Concepts

### 1. **Delivery vs. Sale**
- A **Sale** is the transaction (payment, order creation)
- A **Delivery** is the fulfillment/shipping of that sale
- One sale can have multiple deliveries (partial fulfillment)
- One delivery can fulfill multiple sales (consolidated shipping)

### 2. **Delivery Status Workflow**
```
pending → confirmed → preparing → ready → in_transit → delivered → completed
                ↓
            cancelled
```

## Database Schema Design

### **Delivery Model** (`backend/apps/sales/models.py`)

```python
class Delivery(models.Model):
    """Delivery/Fulfillment model for wholesale orders"""
    
    DELIVERY_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready for Dispatch'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('failed', 'Delivery Failed'),
    ]
    
    DELIVERY_METHOD_CHOICES = [
        ('own_vehicle', 'Own Vehicle'),
        ('third_party', 'Third Party Courier'),
        ('customer_pickup', 'Customer Pickup'),
        ('external_shipping', 'External Shipping Company'),
    ]
    
    # Core relationships
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='deliveries')
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='deliveries', help_text="The sale this delivery fulfills")
    outlet = models.ForeignKey(Outlet, on_delete=models.CASCADE, related_name='deliveries', help_text="Outlet dispatching the delivery")
    customer = models.ForeignKey('customers.Customer', on_delete=models.SET_NULL, null=True, related_name='deliveries')
    
    # Delivery identification
    delivery_number = models.CharField(max_length=50, unique=True, db_index=True, help_text="Unique delivery reference number")
    
    # Delivery details
    status = models.CharField(max_length=20, choices=DELIVERY_STATUS_CHOICES, default='pending')
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_METHOD_CHOICES, default='own_vehicle')
    
    # Address information
    delivery_address = models.TextField(help_text="Full delivery address")
    delivery_city = models.CharField(max_length=100, blank=True)
    delivery_state = models.CharField(max_length=100, blank=True)
    delivery_postal_code = models.CharField(max_length=20, blank=True)
    delivery_country = models.CharField(max_length=100, blank=True)
    delivery_contact_name = models.CharField(max_length=255, blank=True, help_text="Contact person at delivery address")
    delivery_contact_phone = models.CharField(max_length=20, blank=True)
    
    # Delivery scheduling
    scheduled_date = models.DateField(null=True, blank=True, help_text="Scheduled delivery date")
    scheduled_time_start = models.TimeField(null=True, blank=True, help_text="Scheduled delivery time window start")
    scheduled_time_end = models.TimeField(null=True, blank=True, help_text="Scheduled delivery time window end")
    actual_delivery_date = models.DateTimeField(null=True, blank=True, help_text="Actual delivery date/time")
    
    # Shipping/Courier information
    courier_name = models.CharField(max_length=255, blank=True, help_text="Name of courier/shipping company")
    tracking_number = models.CharField(max_length=100, blank=True, help_text="Tracking number for third-party shipping")
    driver_name = models.CharField(max_length=255, blank=True, help_text="Driver name for own vehicle deliveries")
    vehicle_number = models.CharField(max_length=50, blank=True, help_text="Vehicle registration number")
    
    # Financial
    delivery_fee = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))],
        help_text="Delivery fee charged to customer"
    )
    shipping_cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))],
        help_text="Actual shipping cost (for cost tracking)"
    )
    
    # Items being delivered
    items = models.ManyToManyField(
        'sales.SaleItem',
        through='DeliveryItem',
        related_name='deliveries',
        help_text="Items included in this delivery"
    )
    
    # Notes and metadata
    notes = models.TextField(blank=True, help_text="Internal notes about delivery")
    customer_notes = models.TextField(blank=True, help_text="Notes visible to customer")
    delivery_instructions = models.TextField(blank=True, help_text="Special delivery instructions")
    
    # User tracking
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_deliveries')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_deliveries', help_text="User responsible for delivery")
    delivered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='completed_deliveries', help_text="User who completed delivery")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'sales_delivery'
        verbose_name = 'Delivery'
        verbose_name_plural = 'Deliveries'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['sale']),
            models.Index(fields=['customer']),
            models.Index(fields=['status']),
            models.Index(fields=['scheduled_date']),
            models.Index(fields=['delivery_number']),
        ]
    
    def __str__(self):
        return f"Delivery {self.delivery_number} - {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        if not self.delivery_number:
            self.delivery_number = self._generate_delivery_number()
        super().save(*args, **kwargs)
    
    def _generate_delivery_number(self):
        """Generate unique delivery number"""
        from django.utils import timezone
        prefix = "DEL"
        timestamp = timezone.now().strftime("%Y%m%d%H%M%S")
        return f"{prefix}-{timestamp}"
    
    @property
    def is_delivered(self):
        """Check if delivery is completed"""
        return self.status in ['delivered', 'completed']
    
    @property
    def can_be_cancelled(self):
        """Check if delivery can be cancelled"""
        return self.status in ['pending', 'confirmed', 'preparing']


class DeliveryItem(models.Model):
    """Many-to-many relationship between Delivery and SaleItem"""
    
    delivery = models.ForeignKey(Delivery, on_delete=models.CASCADE, related_name='delivery_items')
    sale_item = models.ForeignKey('sales.SaleItem', on_delete=models.CASCADE, related_name='delivery_items')
    quantity = models.IntegerField(validators=[MinValueValidator(1)], help_text="Quantity being delivered in this delivery")
    
    # Status tracking
    is_delivered = models.BooleanField(default=False, help_text="Whether this item was successfully delivered")
    delivered_quantity = models.IntegerField(default=0, help_text="Actual quantity delivered (may differ from ordered)")
    notes = models.TextField(blank=True, help_text="Notes specific to this item delivery")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'sales_deliveryitem'
        unique_together = [['delivery', 'sale_item']]
        verbose_name = 'Delivery Item'
        verbose_name_plural = 'Delivery Items'
    
    def __str__(self):
        return f"{self.delivery.delivery_number} - {self.sale_item.product_name} x{self.quantity}"


class DeliveryStatusHistory(models.Model):
    """Track status changes for audit trail"""
    
    delivery = models.ForeignKey(Delivery, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=20)
    previous_status = models.CharField(max_length=20, blank=True)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'sales_deliverystatushistory'
        ordering = ['-created_at']
        verbose_name = 'Delivery Status History'
        verbose_name_plural = 'Delivery Status Histories'
    
    def __str__(self):
        return f"{self.delivery.delivery_number} - {self.status} at {self.created_at}"
```

## API Endpoints

### **DeliveryViewSet** (`backend/apps/sales/views.py`)

```python
class DeliveryViewSet(viewsets.ModelViewSet, TenantFilterMixin):
    """
    ViewSet for managing deliveries
    """
    queryset = Delivery.objects.select_related('tenant', 'sale', 'customer', 'outlet', 'created_by', 'assigned_to')
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['tenant', 'sale', 'customer', 'outlet', 'status', 'delivery_method']
    search_fields = ['delivery_number', 'delivery_address', 'tracking_number', 'customer__name']
    ordering_fields = ['scheduled_date', 'created_at', 'actual_delivery_date']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm delivery (move from pending to confirmed)"""
        delivery = self.get_object()
        if delivery.status != 'pending':
            return Response(
                {"detail": f"Cannot confirm delivery with status '{delivery.status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        delivery.status = 'confirmed'
        delivery.confirmed_at = timezone.now()
        delivery.save()
        # Create status history
        DeliveryStatusHistory.objects.create(
            delivery=delivery,
            status='confirmed',
            previous_status='pending',
            changed_by=request.user
        )
        serializer = self.get_serializer(delivery)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def dispatch(self, request, pk=None):
        """Mark delivery as dispatched (ready or in_transit)"""
        delivery = self.get_object()
        new_status = request.data.get('status', 'in_transit')  # 'ready' or 'in_transit'
        if new_status not in ['ready', 'in_transit']:
            return Response(
                {"detail": "Status must be 'ready' or 'in_transit'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        previous_status = delivery.status
        delivery.status = new_status
        delivery.dispatched_at = timezone.now()
        delivery.save()
        # Create status history
        DeliveryStatusHistory.objects.create(
            delivery=delivery,
            status=new_status,
            previous_status=previous_status,
            changed_by=request.user,
            notes=request.data.get('notes', '')
        )
        serializer = self.get_serializer(delivery)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark delivery as completed"""
        delivery = self.get_object()
        if delivery.status not in ['in_transit', 'delivered']:
            return Response(
                {"detail": f"Cannot complete delivery with status '{delivery.status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        previous_status = delivery.status
        delivery.status = 'completed'
        delivery.actual_delivery_date = timezone.now()
        delivery.completed_at = timezone.now()
        delivery.delivered_by = request.user
        delivery.save()
        
        # Mark delivery items as delivered
        delivery.delivery_items.update(is_delivered=True)
        
        # Create status history
        DeliveryStatusHistory.objects.create(
            delivery=delivery,
            status='completed',
            previous_status=previous_status,
            changed_by=request.user,
            notes=request.data.get('notes', '')
        )
        
        serializer = self.get_serializer(delivery)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel delivery"""
        delivery = self.get_object()
        if not delivery.can_be_cancelled:
            return Response(
                {"detail": f"Cannot cancel delivery with status '{delivery.status}'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        previous_status = delivery.status
        delivery.status = 'cancelled'
        delivery.save()
        # Create status history
        DeliveryStatusHistory.objects.create(
            delivery=delivery,
            status='cancelled',
            previous_status=previous_status,
            changed_by=request.user,
            notes=request.data.get('reason', '')
        )
        serializer = self.get_serializer(delivery)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending deliveries"""
        queryset = self.filter_queryset(self.get_queryset())
        queryset = queryset.filter(status='pending')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def scheduled_today(self, request):
        """Get deliveries scheduled for today"""
        today = timezone.now().date()
        queryset = self.filter_queryset(self.get_queryset())
        queryset = queryset.filter(scheduled_date=today, status__in=['confirmed', 'preparing', 'ready', 'in_transit'])
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
```

## Frontend Integration

### **Delivery Service** (`frontend/lib/services/deliveryService.ts`)

```typescript
export interface Delivery {
  id: string
  delivery_number: string
  sale_id: string
  customer_id?: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'in_transit' | 'delivered' | 'completed' | 'cancelled' | 'failed'
  delivery_method: 'own_vehicle' | 'third_party' | 'customer_pickup' | 'external_shipping'
  delivery_address: string
  delivery_city?: string
  delivery_state?: string
  delivery_postal_code?: string
  delivery_contact_name?: string
  delivery_contact_phone?: string
  scheduled_date?: string
  scheduled_time_start?: string
  scheduled_time_end?: string
  actual_delivery_date?: string
  courier_name?: string
  tracking_number?: string
  driver_name?: string
  vehicle_number?: string
  delivery_fee: number
  shipping_cost: number
  items: Array<{
    id: string
    sale_item_id: string
    product_name: string
    quantity: number
    is_delivered: boolean
  }>
  notes?: string
  customer_notes?: string
  delivery_instructions?: string
  created_at: string
  updated_at: string
}

export const deliveryService = {
  async list(filters?: {
    sale_id?: string
    customer_id?: string
    status?: string
    scheduled_date?: string
  }): Promise<{ results: Delivery[] }> {
    // Implementation
  },
  
  async create(data: Partial<Delivery>): Promise<Delivery> {
    // Implementation
  },
  
  async confirm(id: string): Promise<Delivery> {
    // Implementation
  },
  
  async dispatch(id: string, status: 'ready' | 'in_transit'): Promise<Delivery> {
    // Implementation
  },
  
  async complete(id: string, notes?: string): Promise<Delivery> {
    // Implementation
  },
  
  async cancel(id: string, reason?: string): Promise<Delivery> {
    // Implementation
  },
  
  async getScheduledToday(): Promise<Delivery[]> {
    // Implementation
  }
}
```

### **Delivery Management Page** (`frontend/app/dashboard/sales/deliveries/page.tsx`)

Features:
- List all deliveries with filters (status, date, customer)
- Calendar view for scheduled deliveries
- Map view for delivery routes (optional)
- Delivery detail view with status updates
- Print delivery notes/packing slips
- Track delivery status in real-time
- Assign deliveries to drivers/users

## Integration with POS

### **During Sale Creation** (`frontend/components/pos/unified-pos.tsx`)

When creating a wholesale sale:
1. Check if customer requires delivery
2. If yes, show delivery address form
3. Collect delivery details (address, scheduled date, instructions)
4. Create sale first
5. Then create delivery linked to sale
6. Calculate delivery fee (if applicable)

### **Delivery Workflow**

1. **Sale Created** → Delivery created with status `pending`
2. **Staff Confirms** → Status changes to `confirmed`, scheduled date set
3. **Warehouse Prepares** → Status changes to `preparing`
4. **Ready for Dispatch** → Status changes to `ready`
5. **Dispatched** → Status changes to `in_transit`, tracking number added
6. **Delivered** → Status changes to `delivered`, actual delivery date recorded
7. **Completed** → Status changes to `completed`, all items marked as delivered

## Reporting & Analytics

- Delivery success rate
- Average delivery time
- Delivery cost analysis
- Failed delivery reasons
- Driver/vehicle performance
- Customer delivery preferences
- Delivery fee revenue

## Benefits

1. **Complete Order Fulfillment Tracking** - Know exactly where each order is
2. **Customer Communication** - Send delivery updates via SMS/Email
3. **Route Optimization** - Plan efficient delivery routes
4. **Cost Tracking** - Track actual shipping costs vs. fees charged
5. **Audit Trail** - Complete history of delivery status changes
6. **Multi-Delivery Support** - Handle partial deliveries for large orders
7. **Integration Ready** - Can integrate with third-party shipping APIs

## Next Steps

1. Create database models and migrations
2. Implement API endpoints
3. Create frontend delivery management page
4. Integrate with POS for delivery creation
5. Add delivery status notifications
6. Implement delivery tracking dashboard
7. Add reporting and analytics

