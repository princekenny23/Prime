from django.db import models  # pyright: ignore[reportMissingImports]
from django.core.validators import MinValueValidator  # pyright: ignore[reportMissingImports]
from decimal import Decimal
from apps.tenants.models import Tenant
from apps.outlets.models import Outlet
from apps.products.models import Product
from apps.accounts.models import User


class Supplier(models.Model):
    """Supplier/Vendor model"""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='suppliers')
    outlet = models.ForeignKey(Outlet, on_delete=models.SET_NULL, null=True, blank=True, related_name='suppliers')
    
    name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)  # State/Province
    zip_code = models.CharField(max_length=20, blank=True)  # ZIP/Postal Code
    country = models.CharField(max_length=100, blank=True)
    tax_id = models.CharField(max_length=50, blank=True)
    
    payment_terms = models.CharField(max_length=100, blank=True)  # e.g., "Net 30", "COD"
    notes = models.TextField(blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'suppliers_supplier'
        verbose_name = 'Supplier'
        verbose_name_plural = 'Suppliers'
        ordering = ['name']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['outlet']),
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
        ]

    def __str__(self):
        return self.name


class PurchaseOrder(models.Model):
    """Purchase Order model - Supports supplier-optional auto-reordering"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_supplier', 'Pending Supplier'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('ready_to_order', 'Ready to Order'),
        ('ordered', 'Ordered'),
        ('received', 'Received'),
        ('partial', 'Partially Received'),
        ('cancelled', 'Cancelled'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='purchase_orders')
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchase_orders', help_text="Optional: Can be assigned later. Item-level suppliers take precedence.")
    outlet = models.ForeignKey(Outlet, on_delete=models.CASCADE, related_name='purchase_orders')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_purchase_orders')
    
    po_number = models.CharField(max_length=50, unique=True, db_index=True)
    order_date = models.DateField()
    expected_delivery_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    
    notes = models.TextField(blank=True)
    terms = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'suppliers_purchaseorder'
        verbose_name = 'Purchase Order'
        verbose_name_plural = 'Purchase Orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['supplier']),
            models.Index(fields=['outlet']),
            models.Index(fields=['status']),
            models.Index(fields=['po_number']),
            models.Index(fields=['order_date']),
        ]

    def __str__(self):
        supplier_name = self.supplier.name if self.supplier else "No Supplier"
        return f"PO-{self.po_number} - {supplier_name}"
    
    def clean(self):
        """Validate that supplier is required for certain statuses"""
        from django.core.exceptions import ValidationError
        # Supplier is optional for draft and pending_supplier statuses
        if self.status not in ['draft', 'pending_supplier', 'cancelled']:
            if not self.supplier and not self.items.filter(supplier__isnull=False).exists():
                raise ValidationError(
                    "Supplier is required for purchase orders beyond draft/pending_supplier status. "
                    "Either assign a PO-level supplier or ensure all items have suppliers."
                )
    
    def calculate_totals(self):
        """Calculate subtotal, tax, and total from items"""
        items = self.items.all()
        self.subtotal = sum(item.total for item in items)
        # Tax calculation can be customized
        self.total = self.subtotal + self.tax - self.discount
        self.save(update_fields=['subtotal', 'total'])


class PurchaseOrderItem(models.Model):
    """Purchase Order line item - Supports item-level supplier assignment"""
    SUPPLIER_STATUS_CHOICES = [
        ('no_supplier', 'No Supplier'),
        ('supplier_assigned', 'Supplier Assigned'),
    ]
    
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='purchase_order_items', null=True, blank=True, help_text="Deprecated: Use variation instead. Kept for backward compatibility.")
    variation = models.ForeignKey('products.ItemVariation', on_delete=models.CASCADE, related_name='purchase_order_items', null=True, blank=True, help_text="Item variation for this PO item (preferred)")
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchase_order_items', help_text="Optional: Supplier for this specific item. Takes precedence over PO-level supplier.")
    
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    total = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0'))])
    
    received_quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    supplier_status = models.CharField(max_length=20, choices=SUPPLIER_STATUS_CHOICES, default='no_supplier', help_text="Status of supplier assignment for this item")
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'suppliers_purchaseorderitem'
        verbose_name = 'Purchase Order Item'
        verbose_name_plural = 'Purchase Order Items'
        # Note: For backward compatibility, we allow either variation or product
        # Updated: Allow same product/variation if supplier differs (supports multiple suppliers per product)
        constraints = [
            models.UniqueConstraint(
                fields=['purchase_order', 'variation', 'supplier'], 
                condition=models.Q(variation__isnull=False),
                name='unique_po_variation_supplier'
            ),
            models.UniqueConstraint(
                fields=['purchase_order', 'product', 'supplier'], 
                condition=models.Q(variation__isnull=True, product__isnull=False),
                name='unique_po_product_supplier'
            ),
            # Also allow one item per product/variation without supplier (for auto-PO)
            models.UniqueConstraint(
                fields=['purchase_order', 'variation'], 
                condition=models.Q(variation__isnull=False, supplier__isnull=True),
                name='unique_po_variation_no_supplier'
            ),
            models.UniqueConstraint(
                fields=['purchase_order', 'product'], 
                condition=models.Q(variation__isnull=True, product__isnull=False, supplier__isnull=True),
                name='unique_po_product_no_supplier'
            ),
        ]
        indexes = [
            models.Index(fields=['purchase_order']),
            models.Index(fields=['product']),
            models.Index(fields=['variation']),
            models.Index(fields=['supplier']),
            models.Index(fields=['supplier_status']),
        ]

    def clean(self):
        """Ensure either product or variation is set, and update supplier_status"""
        from django.core.exceptions import ValidationError
        if not self.product and not self.variation:
            raise ValidationError("Either product or variation must be set")
        
        # Update supplier_status based on supplier field
        if self.supplier:
            self.supplier_status = 'supplier_assigned'
        else:
            self.supplier_status = 'no_supplier'
    
    def save(self, *args, **kwargs):
        """Calculate total before saving and auto-set product from variation"""
        if self.variation and not self.product:
            self.product = self.variation.product
        
        # Update supplier_status
        if self.supplier:
            self.supplier_status = 'supplier_assigned'
        else:
            self.supplier_status = 'no_supplier'
        
        self.clean()
        self.total = Decimal(str(self.quantity)) * self.unit_price
        super().save(*args, **kwargs)
        
        # Update PO status if needed
        if self.purchase_order:
            self.purchase_order.calculate_totals()
            # Auto-update PO status based on item supplier status
            self._update_po_status()
    
    def _update_po_status(self):
        """Update PO status based on item supplier assignments"""
        po = self.purchase_order
        items = po.items.all()
        
        if not items.exists():
            return
        
        # Check if all items have suppliers
        items_with_suppliers = items.filter(supplier__isnull=False).count()
        total_items = items.count()
        
        # If all items have suppliers and PO is in pending_supplier, move to ready_to_order
        if items_with_suppliers == total_items and po.status == 'pending_supplier':
            po.status = 'ready_to_order'
            po.save(update_fields=['status'])
        # If no items have suppliers and PO has supplier, move to pending_supplier
        elif items_with_suppliers == 0 and po.supplier is None and po.status == 'draft':
            po.status = 'pending_supplier'
            po.save(update_fields=['status'])

    def __str__(self):
        product_name = self.variation.product.name if self.variation else (self.product.name if self.product else "Unknown")
        variation_name = f" - {self.variation.name}" if self.variation else ""
        return f"{product_name}{variation_name} - Qty: {self.quantity} @ {self.unit_price}"


class SupplierInvoice(models.Model):
    """Supplier Invoice model"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Payment'),
        ('partial', 'Partially Paid'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='supplier_invoices')
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='invoices')
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    outlet = models.ForeignKey(Outlet, on_delete=models.CASCADE, related_name='supplier_invoices')
    
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    supplier_invoice_number = models.CharField(max_length=100, blank=True, help_text="Invoice number from supplier")
    invoice_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0'))])
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    total = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    
    notes = models.TextField(blank=True)
    payment_terms = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'suppliers_supplierinvoice'
        verbose_name = 'Supplier Invoice'
        verbose_name_plural = 'Supplier Invoices'
        ordering = ['-invoice_date']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['supplier']),
            models.Index(fields=['purchase_order']),
            models.Index(fields=['outlet']),
            models.Index(fields=['status']),
            models.Index(fields=['invoice_number']),
            models.Index(fields=['due_date']),
        ]

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.supplier.name}"
    
    @property
    def balance(self):
        """Calculate remaining balance"""
        return self.total - self.amount_paid
    
    def update_status(self):
        """Update invoice status based on payment"""
        if self.amount_paid >= self.total:
            self.status = 'paid'
            if not self.paid_at:
                from django.utils import timezone
                self.paid_at = timezone.now()
        elif self.amount_paid > 0:
            self.status = 'partial'
        else:
            from django.utils import timezone
            if timezone.now().date() > self.due_date:
                self.status = 'overdue'
            else:
                self.status = 'pending'
        self.save(update_fields=['status', 'paid_at'])


class PurchaseReturn(models.Model):
    """Purchase Return model"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('returned', 'Returned'),
        ('cancelled', 'Cancelled'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='purchase_returns')
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchase_returns')
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name='returns')
    outlet = models.ForeignKey(Outlet, on_delete=models.CASCADE, related_name='purchase_returns')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_purchase_returns')
    
    return_number = models.CharField(max_length=50, unique=True, db_index=True)
    return_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    reason = models.TextField(help_text="Reason for return")
    total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    returned_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'suppliers_purchasereturn'
        verbose_name = 'Purchase Return'
        verbose_name_plural = 'Purchase Returns'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['supplier']),
            models.Index(fields=['purchase_order']),
            models.Index(fields=['outlet']),
            models.Index(fields=['status']),
            models.Index(fields=['return_number']),
        ]

    def __str__(self):
        return f"Return {self.return_number} - {self.supplier.name}"
    
    def calculate_total(self):
        """Calculate total from items"""
        items = self.items.all()
        self.total = sum(item.total for item in items)
        self.save(update_fields=['total'])


class PurchaseReturnItem(models.Model):
    """Purchase Return line item"""
    purchase_return = models.ForeignKey(PurchaseReturn, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='purchase_return_items')
    purchase_order_item = models.ForeignKey(PurchaseOrderItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='return_items')
    
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    total = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0'))])
    
    reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'suppliers_purchasereturnitem'
        verbose_name = 'Purchase Return Item'
        verbose_name_plural = 'Purchase Return Items'
        unique_together = ['purchase_return', 'product']
        indexes = [
            models.Index(fields=['purchase_return']),
            models.Index(fields=['product']),
        ]

    def save(self, *args, **kwargs):
        """Calculate total before saving"""
        self.total = Decimal(str(self.quantity)) * self.unit_price
        super().save(*args, **kwargs)
        # Recalculate return total
        if self.purchase_return:
            self.purchase_return.calculate_total()

    def __str__(self):
        return f"{self.product.name} - Qty: {self.quantity} @ {self.unit_price}"


class ProductSupplier(models.Model):
    """
    Product-Supplier relationship model
    Links products to suppliers with reorder settings for auto-PO creation
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='product_suppliers')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_suppliers')
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='product_suppliers')
    
    # Reorder settings
    reorder_quantity = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Quantity to reorder when low stock is detected"
    )
    reorder_point = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Stock level at which to trigger reorder (if 0, uses product's low_stock_threshold)"
    )
    unit_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))],
        help_text="Cost per unit from this supplier (if different from product cost)"
    )
    is_preferred = models.BooleanField(
        default=False,
        help_text="Preferred supplier for this product (used for auto-PO creation)"
    )
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'suppliers_productsupplier'
        verbose_name = 'Product Supplier'
        verbose_name_plural = 'Product Suppliers'
        unique_together = [['product', 'supplier']]
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['product']),
            models.Index(fields=['supplier']),
            models.Index(fields=['is_preferred']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.supplier.name}"


class AutoPurchaseOrderSettings(models.Model):
    """
    Global settings for automatic purchase order creation
    """
    tenant = models.OneToOneField(
        Tenant,
        on_delete=models.CASCADE,
        related_name='auto_po_settings',
        help_text="One settings record per tenant"
    )
    
    # Auto-PO feature toggle
    auto_po_enabled = models.BooleanField(
        default=False,
        help_text="Enable automatic purchase order creation when low stock is detected"
    )
    
    # Default reorder settings
    default_reorder_quantity = models.IntegerField(
        default=10,
        validators=[MinValueValidator(1)],
        help_text="Default quantity to reorder if not specified in ProductSupplier"
    )
    
    # Auto-approval settings
    auto_approve_po = models.BooleanField(
        default=False,
        help_text="Automatically approve auto-generated purchase orders"
    )
    
    # Notification settings
    notify_on_auto_po = models.BooleanField(
        default=True,
        help_text="Send notifications when auto-POs are created"
    )
    notification_emails = models.TextField(
        blank=True,
        help_text="Comma-separated email addresses to notify (optional)"
    )
    
    # Minimum order value
    minimum_order_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))],
        help_text="Minimum order value to create PO (0 = no minimum)"
    )
    
    # Grouping settings
    group_by_supplier = models.BooleanField(
        default=True,
        help_text="Group low stock items by supplier when creating auto-POs"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'suppliers_autopurchaseordersettings'
        verbose_name = 'Auto Purchase Order Settings'
        verbose_name_plural = 'Auto Purchase Order Settings'

    def __str__(self):
        return f"Auto-PO Settings for {self.tenant.name}"


class AutoPOAuditLog(models.Model):
    """
    Audit log for automatic purchase order actions
    Tracks all auto-PO creation, updates, and related events for full auditability
    """
    ACTION_TYPES = [
        ('draft_created', 'Draft PO Created'),
        ('draft_updated', 'Draft PO Updated'),
        ('item_added', 'Item Added to Draft'),
        ('item_updated', 'Item Updated in Draft'),
        ('quantity_recalculated', 'Quantity Recalculated'),
        ('duplicate_prevented', 'Duplicate Draft Prevented'),
        ('low_stock_detected', 'Low Stock Detected'),
        ('sales_velocity_calculated', 'Sales Velocity Calculated'),
        ('check_triggered', 'Low Stock Check Triggered'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='auto_po_audit_logs')
    purchase_order = models.ForeignKey(
        'PurchaseOrder', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='audit_logs',
        help_text="Related purchase order (if applicable)"
    )
    product = models.ForeignKey(
        'products.Product', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='auto_po_audit_logs',
        help_text="Related product (if applicable)"
    )
    variation = models.ForeignKey(
        'products.ItemVariation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='auto_po_audit_logs',
        help_text="Related variation (if applicable)"
    )
    supplier = models.ForeignKey(
        'Supplier',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='auto_po_audit_logs',
        help_text="Related supplier (if applicable)"
    )
    
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    description = models.TextField(help_text="Detailed description of the action")
    
    # Context data (JSON field for flexible data storage)
    context_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional context data (stock levels, quantities, velocities, etc.)"
    )
    
    # User who triggered (if manual) or system
    triggered_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='auto_po_audit_logs',
        help_text="User who triggered the action (null for automatic)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'suppliers_autopoauditlog'
        verbose_name = 'Auto-PO Audit Log'
        verbose_name_plural = 'Auto-PO Audit Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['purchase_order']),
            models.Index(fields=['product']),
            models.Index(fields=['variation']),
            models.Index(fields=['supplier']),
            models.Index(fields=['action_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_action_type_display()} - {self.created_at}"