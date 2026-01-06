from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
from apps.tenants.models import Tenant
from apps.outlets.models import Outlet
from apps.products.models import Product
from apps.accounts.models import User


class Quotation(models.Model):
    """Quotation model for customer quotes"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('accepted', 'Accepted'),
        ('converted', 'Converted to Sale'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='quotations')
    outlet = models.ForeignKey(Outlet, on_delete=models.CASCADE, related_name='quotations')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='quotations')
    customer = models.ForeignKey('customers.Customer', on_delete=models.SET_NULL, null=True, blank=True, related_name='quotations')
    customer_name = models.CharField(max_length=255, blank=True, help_text="Walk-in customer name")
    
    quotation_number = models.CharField(max_length=50, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0'))])
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'), validators=[MinValueValidator(Decimal('0'))])
    total = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    
    valid_until = models.DateField(help_text="Quotation validity date")
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'quotations_quotation'
        verbose_name = 'Quotation'
        verbose_name_plural = 'Quotations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['outlet']),
            models.Index(fields=['status']),
            models.Index(fields=['quotation_number']),
            models.Index(fields=['valid_until']),
        ]

    def __str__(self):
        return f"{self.quotation_number} - {self.customer_name or (self.customer.name if self.customer else 'Unknown')}"

    def save(self, *args, **kwargs):
        if not self.quotation_number:
            # Generate quotation number: QTN-YYYYMMDD-XXXX
            date_str = timezone.now().strftime('%Y%m%d')
            last_quote = Quotation.objects.filter(quotation_number__startswith=f'QTN-{date_str}').order_by('-quotation_number').first()
            if last_quote:
                try:
                    seq = int(last_quote.quotation_number.split('-')[-1]) + 1
                except (ValueError, IndexError):
                    seq = 1
            else:
                seq = 1
            self.quotation_number = f'QTN-{date_str}-{seq:04d}'
        
        # Check if expired
        if self.valid_until and timezone.now().date() > self.valid_until:
            if self.status not in ['expired', 'converted', 'cancelled']:
                self.status = 'expired'
        
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        """Check if quotation is expired"""
        if not self.valid_until:
            return False
        return timezone.now().date() > self.valid_until


class QuotationItem(models.Model):
    """Quotation item model"""
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='quotation_items')
    product_name = models.CharField(max_length=255, help_text="Product name snapshot")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    total = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])

    class Meta:
        db_table = 'quotations_quotationitem'
        verbose_name = 'Quotation Item'
        verbose_name_plural = 'Quotation Items'
        ordering = ['id']

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"

    def save(self, *args, **kwargs):
        # Auto-calculate total
        self.total = Decimal(str(self.price)) * Decimal(str(self.quantity))
        super().save(*args, **kwargs)

