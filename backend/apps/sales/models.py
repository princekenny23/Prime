from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from apps.tenants.models import Tenant
from apps.outlets.models import Outlet
from apps.products.models import Product
from apps.accounts.models import User
from apps.shifts.models import Shift


class Sale(models.Model):
    """Sale/Transaction model"""
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('mobile', 'Mobile Money'),
        ('tab', 'Tab'),
        ('credit', 'Credit'),
    ]

    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('pending', 'Pending'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('unpaid', 'Unpaid'),
        ('partially_paid', 'Partially Paid'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='sales')
    outlet = models.ForeignKey(Outlet, on_delete=models.CASCADE, related_name='sales')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sales')
    shift = models.ForeignKey('shifts.Shift', on_delete=models.SET_NULL, null=True, blank=True, related_name='sales')
    customer = models.ForeignKey('customers.Customer', on_delete=models.SET_NULL, null=True, blank=True, related_name='purchases')
    
    receipt_number = models.CharField(max_length=50, unique=True, db_index=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0'))])
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    total = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='cash')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    
    # Credit/Accounts Receivable Fields
    due_date = models.DateTimeField(null=True, blank=True, help_text="Payment due date for credit sales")
    amount_paid = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))],
        help_text="Amount paid towards this sale (for credit sales)"
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='paid',
        help_text="Payment status for credit sales"
    )
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'sales_sale'
        verbose_name = 'Sale'
        verbose_name_plural = 'Sales'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['outlet']),
            models.Index(fields=['user']),
            models.Index(fields=['shift']),
            models.Index(fields=['created_at']),
            models.Index(fields=['receipt_number']),
        ]

    def __str__(self):
        return f"{self.receipt_number} - {self.total}"
    
    @property
    def is_credit_sale(self):
        """Check if this is a credit sale"""
        return self.payment_method == 'credit'
    
    @property
    def remaining_balance(self):
        """Calculate remaining balance for credit sales"""
        if not self.is_credit_sale:
            return Decimal('0')
        return max(Decimal('0'), self.total - self.amount_paid)
    
    def update_payment_status(self):
        """Update payment status based on amount_paid"""
        if not self.is_credit_sale:
            self.payment_status = 'paid'
            return
        
        if self.amount_paid >= self.total:
            self.payment_status = 'paid'
        elif self.amount_paid > 0:
            self.payment_status = 'partially_paid'
        else:
            # Check if overdue
            from django.utils import timezone
            if self.due_date and self.due_date < timezone.now():
                self.payment_status = 'overdue'
            else:
                self.payment_status = 'unpaid'
        self.save(update_fields=['payment_status'])


class SaleItem(models.Model):
    """Sale line item model"""
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='sale_items')
    product_name = models.CharField(max_length=255)  # Store name in case product is deleted
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    total = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sales_saleitem'
        verbose_name = 'Sale Item'
        verbose_name_plural = 'Sale Items'
        indexes = [
            models.Index(fields=['sale']),
            models.Index(fields=['product']),
        ]

    def __str__(self):
        return f"{self.product_name} x{self.quantity}"

