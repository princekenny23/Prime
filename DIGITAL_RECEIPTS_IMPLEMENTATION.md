# Digital Receipts Implementation Guide

## Overview
This guide explains how to implement digital receipts that are stored in the database, allowing customers and businesses to retrieve receipts at any time.

## Current State
- ✅ Receipt numbers are generated automatically (`receipt_number` field in Sale model)
- ✅ Receipt preview exists in frontend
- ❌ Receipt content is not stored in database
- ❌ PDF generation not implemented
- ❌ Receipt retrieval API not implemented

---

## Implementation Plan

### Phase 1: Database Model

#### 1. Create Receipt Model

**File: `backend/apps/sales/models.py`**

```python
class Receipt(models.Model):
    """Digital receipt stored in database"""
    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('html', 'HTML'),
        ('json', 'JSON'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='receipts')
    sale = models.OneToOneField(Sale, on_delete=models.CASCADE, related_name='receipt')
    receipt_number = models.CharField(max_length=50, unique=True, db_index=True)
    
    # Receipt content
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default='pdf')
    content = models.TextField(help_text="Receipt content (HTML/JSON)")
    pdf_file = models.FileField(upload_to='receipts/pdf/', null=True, blank=True, help_text="PDF file if format is PDF")
    
    # Metadata
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='generated_receipts')
    is_sent = models.BooleanField(default=False, help_text="Whether receipt was sent to customer")
    sent_at = models.DateTimeField(null=True, blank=True)
    sent_via = models.CharField(max_length=20, choices=[('email', 'Email'), ('sms', 'SMS'), ('print', 'Print')], blank=True)
    
    # Access tracking
    access_count = models.IntegerField(default=0, help_text="Number of times receipt was accessed")
    last_accessed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'sales_receipt'
        verbose_name = 'Receipt'
        verbose_name_plural = 'Receipts'
        ordering = ['-generated_at']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['sale']),
            models.Index(fields=['receipt_number']),
            models.Index(fields=['generated_at']),
        ]
    
    def __str__(self):
        return f"Receipt {self.receipt_number}"
    
    def increment_access(self):
        """Increment access count and update last accessed time"""
        self.access_count += 1
        self.last_accessed_at = timezone.now()
        self.save(update_fields=['access_count', 'last_accessed_at'])
```

#### 2. Create Migration

```bash
cd backend
python manage.py makemigrations sales
python manage.py migrate
```

---

### Phase 2: Receipt Generation Service

#### 1. Create Receipt Service

**File: `backend/apps/sales/services.py`** (create new file)

```python
from django.template.loader import render_to_string
from django.conf import settings
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from decimal import Decimal
import json
from .models import Sale, SaleItem, Receipt
from apps.tenants.models import Tenant
from apps.accounts.models import User


class ReceiptService:
    """Service for generating and managing digital receipts"""
    
    @staticmethod
    def generate_receipt_html(sale: Sale) -> str:
        """Generate HTML receipt content"""
        context = {
            'sale': sale,
            'items': sale.items.all(),
            'business': sale.tenant,
            'outlet': sale.outlet,
            'customer': sale.customer,
        }
        return render_to_string('sales/receipt.html', context)
    
    @staticmethod
    def generate_receipt_pdf(sale: Sale) -> BytesIO:
        """Generate PDF receipt using ReportLab"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
        
        # Container for PDF elements
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=10,
            alignment=TA_CENTER,
        )
        elements.append(Paragraph(sale.tenant.name.upper(), title_style))
        
        # Business info
        business_info = f"{sale.outlet.name}<br/>"
        if sale.outlet.address:
            business_info += f"{sale.outlet.address}<br/>"
        if sale.outlet.phone:
            business_info += f"Phone: {sale.outlet.phone}<br/>"
        if sale.outlet.email:
            business_info += f"Email: {sale.outlet.email}"
        
        elements.append(Paragraph(business_info, styles['Normal']))
        elements.append(Spacer(1, 10))
        
        # Receipt number and date
        receipt_info = f"Receipt #: {sale.receipt_number}<br/>"
        receipt_info += f"Date: {sale.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
        elements.append(Paragraph(receipt_info, styles['Normal']))
        elements.append(Spacer(1, 10))
        
        # Customer info (if exists)
        if sale.customer:
            customer_info = f"Customer: {sale.customer.name}<br/>"
            if sale.customer.email:
                customer_info += f"Email: {sale.customer.email}<br/>"
            if sale.customer.phone:
                customer_info += f"Phone: {sale.customer.phone}"
            elements.append(Paragraph(customer_info, styles['Normal']))
            elements.append(Spacer(1, 10))
        
        # Items table
        items_data = [['Item', 'Qty', 'Price', 'Total']]
        for item in sale.items.all():
            items_data.append([
                item.product_name,
                str(item.quantity),
                f"{sale.tenant.currency_symbol} {item.price:.2f}",
                f"{sale.tenant.currency_symbol} {item.total:.2f}"
            ])
        
        items_table = Table(items_data, colWidths=[200*mm, 30*mm, 50*mm, 50*mm])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 10))
        
        # Totals
        totals_data = [
            ['Subtotal:', f"{sale.tenant.currency_symbol} {sale.subtotal:.2f}"],
            ['Tax:', f"{sale.tenant.currency_symbol} {sale.tax:.2f}"],
            ['Discount:', f"-{sale.tenant.currency_symbol} {sale.discount:.2f}"],
            ['TOTAL:', f"{sale.tenant.currency_symbol} {sale.total:.2f}"],
        ]
        
        if sale.payment_method == 'cash' and sale.cash_received:
            totals_data.append(['Cash Received:', f"{sale.tenant.currency_symbol} {sale.cash_received:.2f}"])
            if sale.change_given:
                totals_data.append(['Change:', f"{sale.tenant.currency_symbol} {sale.change_given:.2f}"])
        
        totals_table = Table(totals_data, colWidths=[150*mm, 100*mm])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 12),
            ('LINEBELOW', (0, -2), (-1, -2), 1, colors.black),
        ]))
        elements.append(totals_table)
        elements.append(Spacer(1, 20))
        
        # Footer
        footer = "Thank you for your business!"
        elements.append(Paragraph(footer, styles['Normal']))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def generate_receipt_json(sale: Sale) -> dict:
        """Generate JSON receipt data"""
        return {
            'receipt_number': sale.receipt_number,
            'date': sale.created_at.isoformat(),
            'business': {
                'name': sale.tenant.name,
                'address': sale.outlet.address if sale.outlet else None,
                'phone': sale.outlet.phone if sale.outlet else None,
                'email': sale.outlet.email if sale.outlet else None,
            },
            'customer': {
                'name': sale.customer.name if sale.customer else None,
                'email': sale.customer.email if sale.customer else None,
                'phone': sale.customer.phone if sale.customer else None,
            } if sale.customer else None,
            'items': [
                {
                    'product_name': item.product_name,
                    'quantity': item.quantity,
                    'price': float(item.price),
                    'total': float(item.total),
                }
                for item in sale.items.all()
            ],
            'totals': {
                'subtotal': float(sale.subtotal),
                'tax': float(sale.tax),
                'discount': float(sale.discount),
                'total': float(sale.total),
            },
            'payment': {
                'method': sale.payment_method,
                'cash_received': float(sale.cash_received) if sale.cash_received else None,
                'change_given': float(sale.change_given) if sale.change_given else None,
            },
        }
    
    @staticmethod
    @transaction.atomic
    def create_receipt(sale: Sale, format: str = 'pdf', user: User = None) -> Receipt:
        """Create and store receipt in database"""
        from django.db import transaction
        from django.core.files.base import ContentFile
        
        # Generate receipt content based on format
        if format == 'html':
            content = ReceiptService.generate_receipt_html(sale)
            pdf_file = None
        elif format == 'json':
            content = json.dumps(ReceiptService.generate_receipt_json(sale), indent=2)
            pdf_file = None
        else:  # pdf
            pdf_buffer = ReceiptService.generate_receipt_pdf(sale)
            content = None  # PDF content stored in file
            pdf_file = ContentFile(pdf_buffer.read(), name=f"receipt_{sale.receipt_number}.pdf")
            pdf_buffer.close()
        
        # Create receipt record
        receipt = Receipt.objects.create(
            tenant=sale.tenant,
            sale=sale,
            receipt_number=sale.receipt_number,
            format=format,
            content=content,
            pdf_file=pdf_file,
            generated_by=user,
        )
        
        return receipt
```

---

### Phase 3: API Endpoints

#### 1. Add Receipt Serializer

**File: `backend/apps/sales/serializers.py`**

```python
class ReceiptSerializer(serializers.ModelSerializer):
    """Receipt serializer"""
    sale = SaleSerializer(read_only=True)
    pdf_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Receipt
        fields = (
            'id', 'tenant', 'sale', 'receipt_number', 'format',
            'content', 'pdf_url', 'generated_at', 'generated_by',
            'is_sent', 'sent_at', 'sent_via', 'access_count', 'last_accessed_at'
        )
        read_only_fields = ('id', 'tenant', 'sale', 'receipt_number', 'generated_at', 'generated_by', 'access_count', 'last_accessed_at')
    
    def get_pdf_url(self, obj):
        """Get PDF file URL"""
        if obj.pdf_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.pdf_file.url)
        return None
```

#### 2. Add Receipt ViewSet

**File: `backend/apps/sales/views.py`**

```python
from .models import Receipt
from .serializers import ReceiptSerializer
from .services import ReceiptService

class ReceiptViewSet(viewsets.ReadOnlyModelViewSet, TenantFilterMixin):
    """Receipt ViewSet - Read-only for retrieving receipts"""
    queryset = Receipt.objects.select_related('sale', 'tenant', 'generated_by')
    serializer_class = ReceiptSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['sale', 'format', 'is_sent']
    search_fields = ['receipt_number']
    ordering_fields = ['generated_at']
    ordering = ['-generated_at']
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve receipt and increment access count"""
        instance = self.get_object()
        instance.increment_access()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='by-number/(?P<receipt_number>[^/.]+)')
    def by_number(self, request, receipt_number=None):
        """Get receipt by receipt number"""
        tenant = getattr(request, 'tenant', None) or request.user.tenant
        if not tenant:
            return Response(
                {"detail": "User must have a tenant"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            receipt = Receipt.objects.get(receipt_number=receipt_number, tenant=tenant)
            receipt.increment_access()
            serializer = self.get_serializer(receipt)
            return Response(serializer.data)
        except Receipt.DoesNotExist:
            return Response(
                {"detail": "Receipt not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """Regenerate receipt"""
        receipt = self.get_object()
        tenant = getattr(request, 'tenant', None) or request.user.tenant
        
        # Verify tenant matches
        if not request.user.is_saas_admin and tenant and receipt.tenant != tenant:
            return Response(
                {"detail": "You do not have permission to regenerate this receipt."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        format = request.data.get('format', receipt.format)
        
        # Regenerate receipt
        new_receipt = ReceiptService.create_receipt(
            sale=receipt.sale,
            format=format,
            user=request.user
        )
        
        # Delete old receipt
        receipt.delete()
        
        serializer = self.get_serializer(new_receipt)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
```

#### 3. Update Sale ViewSet to Auto-Generate Receipts

**File: `backend/apps/sales/views.py`** (in `create` method)

```python
# After sale is created successfully, generate receipt
from .services import ReceiptService
receipt = ReceiptService.create_receipt(sale=sale, format='pdf', user=request.user)
```

#### 4. Add URL Route

**File: `backend/apps/sales/urls.py`**

```python
from .views import SaleViewSet, ReceiptViewSet

router = DefaultRouter()
router.register(r'sales', SaleViewSet, basename='sale')
router.register(r'receipts', ReceiptViewSet, basename='receipt')
```

---

### Phase 4: Frontend Integration

#### 1. Create Receipt Service

**File: `frontend/lib/services/receiptService.ts`**

```typescript
import { api, apiEndpoints } from "@/lib/api"

export interface Receipt {
  id: string
  receipt_number: string
  format: 'pdf' | 'html' | 'json'
  content?: string
  pdf_url?: string
  generated_at: string
  is_sent: boolean
  sent_at?: string
  sent_via?: 'email' | 'sms' | 'print'
  access_count: number
  last_accessed_at?: string
  sale: any
}

export const receiptService = {
  async getByNumber(receiptNumber: string): Promise<Receipt> {
    const response = await api.get<Receipt>(
      `/api/v1/receipts/by-number/${receiptNumber}/`
    )
    return response
  },

  async getById(id: string): Promise<Receipt> {
    const response = await api.get<Receipt>(`/api/v1/receipts/${id}/`)
    return response
  },

  async list(filters?: { sale?: string; format?: string }): Promise<Receipt[]> {
    const params = new URLSearchParams()
    if (filters?.sale) params.append('sale', filters.sale)
    if (filters?.format) params.append('format', filters.format)
    
    const query = params.toString()
    const response = await api.get<any>(
      `/api/v1/receipts/${query ? `?${query}` : ""}`
    )
    
    return Array.isArray(response) ? response : (response.results || [])
  },

  async downloadPDF(receipt: Receipt): Promise<void> {
    if (receipt.pdf_url) {
      window.open(receipt.pdf_url, '_blank')
    } else {
      throw new Error('PDF not available for this receipt')
    }
  },

  async regenerate(id: string, format: 'pdf' | 'html' | 'json' = 'pdf'): Promise<Receipt> {
    const response = await api.post<Receipt>(
      `/api/v1/receipts/${id}/regenerate/`,
      { format }
    )
    return response
  },
}
```

#### 2. Update Payment Modal to Generate Receipt

**File: `frontend/components/modals/payment-modal.tsx`**

After sale is created:
```typescript
// Generate receipt
try {
  const receipt = await receiptService.getByNumber(sale.receipt_number)
  // Store receipt ID for later retrieval
  console.log("Receipt generated:", receipt.id)
} catch (error) {
  console.error("Failed to generate receipt:", error)
}
```

---

### Phase 5: Dependencies

#### 1. Install Required Packages

**File: `backend/requirements.txt`**

```txt
reportlab>=4.0.0  # PDF generation
Pillow>=10.0.0    # Image processing (already installed)
```

#### 2. Install Frontend Dependencies (if needed)

No additional frontend dependencies required.

---

## Usage Examples

### 1. Retrieve Receipt by Number

```typescript
const receipt = await receiptService.getByNumber('ABC-20240101120000')
console.log('Receipt PDF URL:', receipt.pdf_url)
```

### 2. Download Receipt PDF

```typescript
await receiptService.downloadPDF(receipt)
```

### 3. Regenerate Receipt

```typescript
const newReceipt = await receiptService.regenerate(receipt.id, 'pdf')
```

### 4. List All Receipts for a Sale

```typescript
const receipts = await receiptService.list({ sale: saleId })
```

---

## Database Storage

### Receipt Table Schema

```sql
CREATE TABLE sales_receipt (
    id BIGSERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants_tenant(id),
    sale_id INTEGER NOT NULL UNIQUE REFERENCES sales_sale(id),
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    format VARCHAR(10) NOT NULL DEFAULT 'pdf',
    content TEXT,
    pdf_file VARCHAR(100),
    generated_at TIMESTAMP NOT NULL,
    generated_by_id INTEGER REFERENCES accounts_user(id),
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    sent_via VARCHAR(20),
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP
);
```

---

## Benefits

1. **Permanent Storage**: Receipts are stored in database, never lost
2. **Access Tracking**: Know how many times a receipt was accessed
3. **Multiple Formats**: Support PDF, HTML, and JSON formats
4. **Regeneration**: Can regenerate receipts if needed
5. **Customer Retrieval**: Customers can retrieve receipts by receipt number
6. **Audit Trail**: Complete history of receipt generation and access

---

## Next Steps

1. Create Receipt model and migration
2. Install ReportLab for PDF generation
3. Create ReceiptService
4. Add ReceiptViewSet to API
5. Update Sale creation to auto-generate receipts
6. Create frontend receipt service
7. Update payment modal to generate receipts
8. Add receipt retrieval UI

