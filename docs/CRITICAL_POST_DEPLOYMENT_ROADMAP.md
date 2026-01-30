# 🚀 PrimePOS Critical Post-Deployment Roadmap

**Document Version**: 1.0  
**Last Updated**: January 29, 2026  
**Status**: Production Deployment Imminent  
**Target**: Ready for first paying customers in 4 weeks

---

## 📋 Executive Summary

PrimePOS is **production-ready for MVP deployment** with core features complete. However, **20 critical features** must be implemented post-launch to enable monetization, ensure security, and improve UX.

### **Investment Required**
- **Week 1**: 165 hours (4-5 developers) - BLOCKING items
- **Week 2-3**: 305 hours (critical revenue & security features)
- **Week 4+**: 170 hours (nice-to-have enhancements)
- **Total**: ~640 hours over 4 weeks = **1 FTE + 3-4 contractors**

### **Success Metric**
All **P0 & P1 items completed within Week 1-2** before accepting paying customers.

---

## 🔴 WEEK 1: CRITICAL LAUNCH BLOCKERS (40-50 hours minimum)

These items **block monetization and security**. Must be done before first paying customer.

### **1. Payment Processing Modal (40 hours)**

**Priority**: 🔴 **P0 - Blocking**  
**Impact**: Can't accept payments → No revenue  
**Owner**: Backend + Frontend team

#### **Current State**
- ✅ Cash payments fully implemented
- ✅ Payment models exist (Payment, PaymentMethod, PaymentSplit)
- ❌ Card/Mobile money APIs not integrated
- ❌ Payment gateway SDKs not installed

#### **Implementation Tasks**

**Backend (20 hours)**
```python
# backend/apps/payments/services.py - ADD:

1. Stripe Integration (8 hours)
   - Install: pip install stripe
   - Models: StripeCustomer, StripePaymentIntent
   - Service: process_stripe_payment(amount, token)
   - Webhook: handle stripe.payment_intent.succeeded
   - Test: Card tokens (4242 4242 4242 4242)

2. M-Pesa Integration (8 hours)
   - Install: pip install daraja (Safaricom M-Pesa)
   - Service: initiate_mpesa_payment(phone, amount)
   - Callback: handle mpesa_payment_webhook
   - Test: Mock M-Pesa responses

3. Payment Routing Logic (4 hours)
   - Router: payment_method → correct provider
   - Error handling: declined cards, network timeouts
   - Retry logic: exponential backoff for failed payments
```

**Frontend (20 hours)**
```typescript
// frontend/components/modals/payment-modal.tsx - UPDATE:

1. Stripe Card Element (8 hours)
   - Install: npm install @stripe/react-stripe-js
   - Component: <CardElement />
   - Handle: card validation, errors
   - Submit: send token to backend

2. M-Pesa UI (6 hours)
   - Phone input field: +265 XXX XXX XXX
   - Amount confirmation
   - Status tracking (pending → paid)

3. Payment State Management (6 hours)
   - usePaymentStore hook
   - Handle: processing, success, error states
   - Redirect: to receipt after payment

// frontend/lib/services/paymentService.ts - ADD:
export async function processCardPayment(token, amount) {
  return api.post('/payments/', {
    payment_method: 'card',
    token,
    amount
  });
}

export async function processMobileMoneyPayment(phone, amount) {
  return api.post('/payments/', {
    payment_method: 'mobile_money',
    phone,
    amount
  });
}
```

#### **Testing Checklist**
- [ ] Test card payment with Stripe test card (4242 4242 4242 4242)
- [ ] Test failed card (4000 0000 0000 0002)
- [ ] Test M-Pesa with mock responses
- [ ] Test offline scenario (show retry button)
- [ ] Test receipt generated after payment
- [ ] Test refund flow

#### **Dependencies**
- Stripe account (setup: 30 mins)
- M-Pesa Daraja account (setup: 2 hours)
- API keys in .env

#### **Success Criteria**
- ✅ Both payment methods working end-to-end
- ✅ Receipts generated immediately after payment
- ✅ No failed payments without user notification
- ✅ Refund system operational

---

### **2. Receipt Printing/PDF Export (30 hours)**

**Priority**: 🔴 **P0 - Blocking**  
**Impact**: Customers can't get receipts → Compliance issue, UX failure  
**Owner**: Backend + Frontend

#### **Current State**
- ✅ Receipt preview modal exists
- ✅ Receipt data structure complete
- ❌ PDF generation not implemented
- ❌ Thermal printer integration missing
- ❌ Email receipts not implemented

#### **Implementation Tasks**

**Backend (12 hours)**
```python
# backend/apps/sales/receipts.py - CREATE:

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO

class ReceiptGenerator:
    def generate_pdf(self, sale):
        """Generate receipt PDF from sale"""
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        
        # Add business header
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, 750, sale.tenant.name)
        
        # Add receipt items
        y = 700
        for item in sale.items.all():
            c.drawString(50, y, f"{item.product.name} x{item.quantity}")
            c.drawString(450, y, f"${item.subtotal}")
            y -= 20
        
        # Add totals
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y-40, f"TOTAL: ${sale.total}")
        
        c.save()
        buffer.seek(0)
        return buffer

# backend/apps/sales/views.py - ADD:

@api_view(['GET'])
def receipt_pdf(request, sale_id):
    """Generate and download receipt PDF"""
    sale = Sale.objects.get(id=sale_id, tenant=request.tenant)
    
    generator = ReceiptGenerator()
    pdf = generator.generate_pdf(sale)
    
    return FileResponse(
        pdf,
        as_attachment=True,
        filename=f"receipt-{sale.receipt_number}.pdf",
        content_type='application/pdf'
    )

# backend/apps/sales/urls.py - ADD:
path('receipts/<int:sale_id>/pdf/', receipt_pdf, name='receipt-pdf'),
```

**Frontend (12 hours)**
```typescript
// frontend/components/modals/receipt-preview-modal.tsx - UPDATE:

import { useState } from 'react';

export function ReceiptPreviewModal({ sale }) {
  const [loading, setLoading] = useState(false);

  // Download PDF
  async function downloadReceipt() {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/sales/${sale.id}/receipt/pdf/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${sale.receipt_number}.pdf`;
      link.click();
    } finally {
      setLoading(false);
    }
  }

  // Print receipt (thermal printer via QZ-Tray)
  async function printReceipt() {
    try {
      const qz = window.qz; // QZ-Tray library
      const config = qz.configs.create("POS_Printer");
      
      await qz.printers.find("POS_Printer");
      await qz.print(config, [receiptHTML()]);
    } catch (err) {
      alert("Printer not connected: " + err.message);
    }
  }

  // Email receipt
  async function emailReceipt() {
    const response = await fetch(`/api/v1/sales/${sale.id}/send-receipt-email/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    alert('Receipt emailed to ' + sale.customer.email);
  }

  return (
    <div className="modal">
      <div className="receipt-preview">
        {/* Receipt content here */}
      </div>
      
      <div className="actions">
        <button onClick={downloadReceipt} disabled={loading}>
          📥 Download PDF
        </button>
        <button onClick={printReceipt}>
          🖨️ Print
        </button>
        <button onClick={emailReceipt}>
          📧 Email
        </button>
      </div>
    </div>
  );
}

// Install QZ-Tray for printing
// npm install qz-tray
// Add <script src="https://qz.io/api/2.2.5/qz-tray.js"></script> to layout
```

#### **Dependencies**
- reportlab: `pip install reportlab`
- QZ-Tray: `npm install qz-tray` (for thermal printer)
- Email service: SendGrid/SMTP configured

#### **Testing Checklist**
- [ ] PDF downloads correctly
- [ ] PDF contains all sale items
- [ ] PDF prints to thermal printer
- [ ] Email receipt sent with PDF attachment
- [ ] Receipt shows tax correctly
- [ ] Receipt shows payment method

---

### **3. API Rate Limiting (20 hours)**

**Priority**: 🔴 **P0 - Security**  
**Impact**: DDoS vulnerability, spam abuse  
**Owner**: Backend

#### **Implementation Tasks**

**Backend (20 hours)**
```python
# backend/requirements.txt - ADD:
django-ratelimit==4.1.0

# backend/primepos/settings/base.py - ADD:
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',        # Unauthenticated users
        'user': '1000/hour',       # Authenticated users
        'login': '5/minute',       # Login attempts
        'password_reset': '3/hour',
    }
}

# backend/apps/accounts/views.py - ADD:
from rest_framework.throttling import SimpleRateThrottle

class LoginRateThrottle(SimpleRateThrottle):
    scope = 'login'
    THROTTLE_RATES = {'login': '5/minute'}
    
    def get_cache_key(self):
        return self.request.META.get('REMOTE_ADDR')

class LoginView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]
    # ... rest of view

# backend/apps/sales/views.py - ADD:
class SaleViewSet(viewsets.ModelViewSet):
    throttle_classes = [UserRateThrottle]
    throttle_scope = 'user'
```

#### **Testing Checklist**
- [ ] Unauthenticated users limited to 100 requests/hour
- [ ] Authenticated users limited to 1000/hour
- [ ] Login limited to 5 attempts/minute
- [ ] 429 status returned when limit exceeded
- [ ] Retry-After header included in response

---

### **4. Backend RBAC Enforcement (35 hours)**

**Priority**: 🟠 **P1 - Security**  
**Impact**: Users can bypass permission checks → Data breach  
**Owner**: Backend

#### **Current State**
- ✅ Role/Permission models exist
- ✅ Permission checking logic written
- ❌ Not enforced on all ViewSets
- ❌ Inconsistent across apps

#### **Implementation Tasks**

```python
# backend/apps/tenants/permissions.py - CREATE:
from rest_framework.permissions import BasePermission

class RequiresPermission(BasePermission):
    """Check if user has specific permission"""
    permission_name = None
    
    def has_permission(self, request, view):
        if not request.user:
            return False
        return request.user.has_permission(self.permission_name)

# backend/apps/sales/views.py - UPDATE ALL VIEWSETS:
from apps.tenants.permissions import RequiresPermission

class SaleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, RequiresPermission]
    permission_name = 'can_sales'
    
    def get_queryset(self):
        return Sale.objects.filter(tenant=request.tenant)
    
    def perform_create(self, serializer):
        if not self.request.user.has_permission('can_sales'):
            raise PermissionDenied('No permission to create sales')
        serializer.save(tenant=self.request.tenant)

# Repeat for all viewsets:
class ProductViewSet:
    permission_name = 'can_products'

class InventoryViewSet:
    permission_name = 'can_inventory'

class CustomerViewSet:
    permission_name = 'can_customers'

class ReportViewSet:
    permission_name = 'can_reports'

# etc.
```

#### **All Apps Requiring RBAC Enforcement** (4-5 hours each)
- accounts (users, roles)
- products (product management)
- inventory (stock control)
- sales (transactions)
- customers (customer data)
- staff (employee management)
- reports (analytics)
- expenses (expense tracking)
- outlets (location management)

---

### **5. Centralized Exception Handler (25 hours)**

**Priority**: 🟠 **P1 - Stability**  
**Impact**: Inconsistent error responses, hard debugging  
**Owner**: Backend

#### **Implementation Tasks**

```python
# backend/primepos/exceptions.py - CREATE:
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework import status

class PrimePOSException(APIException):
    """Base exception for PrimePOS"""
    default_detail = "An error occurred"
    default_code = 'error'

class InsufficientStockError(PrimePOSException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Insufficient stock for this product'
    default_code = 'insufficient_stock'

class InvalidTenantError(PrimePOSException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'Tenant mismatch'
    default_code = 'invalid_tenant'

class PaymentError(PrimePOSException):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_detail = 'Payment processing failed'
    default_code = 'payment_error'

# backend/primepos/exceptions_handler.py - CREATE:
from rest_framework.views import exception_handler
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """Unified exception response format"""
    response = exception_handler(exc, context)
    
    if response is None:
        # Unhandled exception
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return Response({
            'error': {
                'code': 'internal_server_error',
                'message': 'An unexpected error occurred',
                'detail': str(exc) if settings.DEBUG else None,
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Format response
    if isinstance(exc, PrimePOSException):
        response.data = {
            'error': {
                'code': exc.default_code,
                'message': exc.default_detail,
            }
        }
    else:
        response.data = {
            'error': {
                'code': response.data.get('detail', ''),
                'message': str(response.data),
            }
        }
    
    return response

# backend/primepos/settings/base.py - ADD:
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'primepos.exceptions_handler.custom_exception_handler',
}
```

#### **Testing Checklist**
- [ ] All errors return consistent JSON format
- [ ] 400 errors include validation details
- [ ] 403 errors show permission denied
- [ ] 500 errors logged to Sentry
- [ ] Client-friendly error messages

---

### **6. Error Tracking (Sentry) (15 hours)**

**Priority**: 🟠 **P1 - Observability**  
**Impact**: Can't diagnose production failures  
**Owner**: Backend DevOps

#### **Implementation Tasks**

```bash
# 1. Create Sentry account at https://sentry.io
# 2. Create project: Django + Next.js

# backend/requirements.txt - ADD:
sentry-sdk==1.45.0

# backend/primepos/settings/base.py - ADD:
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration

sentry_sdk.init(
    dsn=config('SENTRY_DSN'),
    integrations=[
        DjangoIntegration(),
        CeleryIntegration(),
    ],
    traces_sample_rate=1.0 if DEBUG else 0.1,
    environment='development' if DEBUG else 'production',
    send_default_pii=False,
)

# backend/.env.example - ADD:
SENTRY_DSN=https://[key]@sentry.io/[project-id]

# frontend/lib/api.ts - ADD:
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### **Success Criteria**
- ✅ All errors automatically captured in Sentry
- ✅ Full stack traces available
- ✅ User context included (tenant, user ID)
- ✅ Performance monitoring enabled

---

## 📊 WEEK 1 SUMMARY

| Task | Hours | Team | Status |
|------|-------|------|--------|
| Payment Processing | 40 | Backend (2) + Frontend (2) | 🔴 Blocking |
| Receipt Printing/PDF | 30 | Backend (1) + Frontend (1) | 🔴 Blocking |
| Rate Limiting | 20 | Backend (1) | 🔴 Blocking |
| RBAC Enforcement | 35 | Backend (2) | 🟠 Critical |
| Exception Handler | 25 | Backend (1) | 🟠 Critical |
| Sentry Setup | 15 | DevOps (1) | 🟠 Critical |
| **TOTAL** | **165** | **4-5 devs** | **Week 1** |

**Goal**: Ship Week 1 items before accepting first paying customer.

---

## 🟠 WEEK 2-3: HIGH PRIORITY FEATURES (305 hours)

### **1. Async Tasks with Celery + Redis (45 hours)**

**Priority**: 🟠 **P1**  
**Impact**: Long-running operations (reports, bulk imports) block UI  
**Owner**: Backend + DevOps

#### **Why Needed**
- Reports with 100K transactions take 30+ seconds
- Bulk product import blocks entire POS
- Email sending slows down checkout

#### **Implementation**
```python
# backend/requirements.txt - ADD:
celery==5.3.4
redis==5.0.1

# backend/primepos/celery.py - CREATE:
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'primepos.settings.production')

app = Celery('primepos')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# backend/primepos/settings/base.py - ADD:
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://localhost:6379')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'

# backend/apps/reports/tasks.py - CREATE:
from celery import shared_task

@shared_task
def generate_sales_report(tenant_id, start_date, end_date):
    """Generate sales report asynchronously"""
    from apps.tenants.models import Tenant
    tenant = Tenant.objects.get(id=tenant_id)
    
    # Heavy computation here
    report_data = compute_sales_report(tenant, start_date, end_date)
    
    # Save to cache or database
    return report_data

# backend/apps/reports/views.py - UPDATE:
@api_view(['POST'])
def start_report_generation(request):
    """Trigger async report generation"""
    from .tasks import generate_sales_report
    
    task = generate_sales_report.delay(
        tenant_id=request.tenant.id,
        start_date=request.data['start_date'],
        end_date=request.data['end_date']
    )
    
    return Response({
        'task_id': task.id,
        'status': 'processing'
    })

@api_view(['GET'])
def report_status(request, task_id):
    """Check report generation progress"""
    from celery.result import AsyncResult
    task = AsyncResult(task_id)
    
    return Response({
        'status': task.status,
        'data': task.result if task.ready() else None
    })
```

#### **Frontend Integration**
```typescript
// frontend/lib/services/reportService.ts - UPDATE:
export async function generateSalesReport(startDate, endDate) {
  // Start async task
  const response = await api.post('/reports/sales/generate/', {
    start_date: startDate,
    end_date: endDate
  });
  
  const taskId = response.task_id;
  
  // Poll for completion
  return new Promise((resolve) => {
    const pollInterval = setInterval(async () => {
      const status = await api.get(`/reports/status/${taskId}/`);
      
      if (status.status === 'SUCCESS') {
        clearInterval(pollInterval);
        resolve(status.data);
      }
    }, 1000); // Check every second
  });
}

// Usage in component:
function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  
  async function generateReport() {
    setGenerating(true);
    const data = await generateSalesReport(startDate, endDate);
    setGenerating(false);
    displayReport(data);
  }
}
```

---

### **2. Email Notifications System (30 hours)**

**Priority**: 🟠 **P1**  
**Impact**: Users can't receive password resets, order updates, invoices  
**Owner**: Backend

#### **Use Cases**
- Password reset links
- Order confirmation emails
- Invoice delivery
- Low stock alerts
- Trial expiring soon

#### **Implementation**
```python
# backend/requirements.txt - ADD:
django-anymail==10.0
sendgrid==6.11.0

# backend/primepos/settings/base.py - ADD:
EMAIL_BACKEND = 'anymail.backends.sendgrid.EmailBackend'
ANYMAIL = {
    'SENDGRID_API_KEY': config('SENDGRID_API_KEY'),
}

# backend/apps/notifications/email_service.py - CREATE:
from django.core.mail import send_mail
from django.template.loader import render_to_string

class EmailService:
    @staticmethod
    def send_password_reset(user, reset_link):
        """Send password reset email"""
        context = {
            'user_name': user.name,
            'reset_link': reset_link,
        }
        html_message = render_to_string('emails/password_reset.html', context)
        
        send_mail(
            subject='Reset Your Password',
            message='',
            from_email='noreply@primepos.com',
            recipient_list=[user.email],
            html_message=html_message,
        )
    
    @staticmethod
    def send_order_confirmation(order, customer_email):
        """Send order confirmation email"""
        context = {'order': order}
        html_message = render_to_string('emails/order_confirmation.html', context)
        
        send_mail(
            subject=f'Order #{order.receipt_number} Confirmed',
            message='',
            from_email='orders@primepos.com',
            recipient_list=[customer_email],
            html_message=html_message,
        )
    
    @staticmethod
    def send_invoice(invoice, customer_email):
        """Send invoice with PDF attachment"""
        from django.core.mail import EmailMessage
        
        email = EmailMessage(
            subject=f'Invoice {invoice.number}',
            body='Please find your invoice attached.',
            from_email='invoices@primepos.com',
            to=[customer_email],
        )
        
        # Attach PDF
        email.attach(
            f'invoice-{invoice.number}.pdf',
            invoice.pdf_content,
            'application/pdf'
        )
        email.send()

# backend/apps/accounts/signals.py - ADD:
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import PasswordReset
from apps.notifications.email_service import EmailService

@receiver(post_save, sender=PasswordReset)
def send_password_reset_email(sender, instance, created, **kwargs):
    if created:
        reset_link = f"https://yourdomain.com/reset-password/{instance.token}"
        EmailService.send_password_reset(instance.user, reset_link)
```

---

### **3. Invoice/Billing System with PDF (35 hours)**

**Priority**: 🟠 **P1**  
**Impact**: Can't send formal invoices to customers  
**Owner**: Backend

#### **Implementation**
```python
# backend/apps/invoices/models.py - CREATE:
class Invoice(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    sale = models.OneToOneField(Sale, on_delete=models.CASCADE)
    
    invoice_number = models.CharField(max_length=50, unique=True)
    issued_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    status = models.CharField(
        max_length=20,
        choices=[('draft', 'Draft'), ('sent', 'Sent'), ('paid', 'Paid')],
        default='draft'
    )

# backend/apps/invoices/services.py - CREATE:
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

class InvoiceService:
    @staticmethod
    def generate_invoice_pdf(invoice):
        """Generate invoice PDF"""
        from io import BytesIO
        
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        
        # Header
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, 750, "INVOICE")
        
        # Business info
        c.setFont("Helvetica", 10)
        c.drawString(50, 720, invoice.tenant.name)
        c.drawString(50, 705, invoice.tenant.address)
        
        # Invoice details
        c.drawString(400, 720, f"Invoice #: {invoice.invoice_number}")
        c.drawString(400, 705, f"Date: {invoice.issued_date}")
        c.drawString(400, 690, f"Due: {invoice.due_date}")
        
        # Items
        y = 650
        c.setFont("Helvetica-Bold", 11)
        c.drawString(50, y, "Description")
        c.drawString(350, y, "Amount")
        
        y -= 20
        c.setFont("Helvetica", 10)
        for item in invoice.sale.items.all():
            c.drawString(50, y, f"{item.product.name} x{item.quantity}")
            c.drawString(350, y, f"${item.subtotal}")
            y -= 15
        
        # Totals
        y -= 10
        c.setFont("Helvetica-Bold", 11)
        c.drawString(50, y, "TOTAL")
        c.drawString(350, y, f"${invoice.total}")
        
        c.save()
        buffer.seek(0)
        return buffer

    @staticmethod
    def send_invoice_email(invoice):
        """Send invoice via email"""
        from apps.notifications.email_service import EmailService
        
        pdf = InvoiceService.generate_invoice_pdf(invoice)
        
        EmailService.send_invoice(
            invoice=invoice,
            customer_email=invoice.sale.customer.email,
            pdf_content=pdf.getvalue()
        )
        
        invoice.status = 'sent'
        invoice.save()
```

---

## 📊 WEEK 2-3 SUMMARY

| Task | Hours | Week |
|------|-------|------|
| Async Tasks (Celery) | 45 | Wk2 |
| Email Notifications | 30 | Wk2 |
| Invoice/Billing System | 35 | Wk2 |
| Advanced Analytics | 50 | Wk2-3 |
| Barcode Scanner | 25 | Wk2-3 |
| Other P2 items | 120 | Wk3 |
| **TOTAL** | **305** | **Wk2-3** |

---

## 🟡 WEEK 4+: MEDIUM PRIORITY FEATURES (170+ hours)

### **Features**

| Priority | Feature | Hours | Rationale |
|----------|---------|-------|-----------|
| 🟡 P2 | Loyalty Programs | 40 | Revenue enhancement |
| 🟡 P2 | Advanced Analytics | 50 | Business insights |
| 🟡 P2 | Multi-Language | 30 | Market expansion |
| 🟡 P2 | Credit Management UI | 35 | UX completion |
| 🟡 P2 | Inventory Audit Trail | 20 | Compliance |
| 🟢 P3 | Mobile App (React Native) | 80 | Future platform |
| 🟢 P3 | Price List Management | 30 | Enterprise feature |
| 🟢 P3 | Barcode Scanner | 25 | Efficiency |

---

## 🎯 DEPENDENCIES & PREREQUISITES

### **External Services Required**

| Service | Status | Cost | Setup Time |
|---------|--------|------|-----------|
| **Stripe** | Must have | 2.9% + $0.30/txn | 30 mins |
| **M-Pesa/Daraja** | Must have | Variable | 2 hours |
| **SendGrid** | Must have | $0 (100 emails/day free) | 30 mins |
| **Sentry** | Must have | $29/month | 15 mins |
| **Redis** | Must have | Free (self-hosted) or $15/mo | 1 hour |
| **QZ-Tray** | Must have | Free | 15 mins |

### **GitHub Branches for PR Management**

```bash
# Create feature branches for Week 1 items
git checkout -b feature/payments-gateway
git checkout -b feature/receipt-pdf
git checkout -b feature/rate-limiting
git checkout -b feature/rbac-enforcement
git checkout -b feature/exception-handler
git checkout -b feature/sentry-integration

# Merge after testing
git push origin feature/[name]
# Create PR, review, merge to main
```

---

## ✅ SUCCESS CRITERIA

### **Week 1 (Before First Paying Customer)**
- [ ] All payment methods working (card, mobile money)
- [ ] Receipts print/download/email correctly
- [ ] API rate limiting prevents abuse
- [ ] RBAC enforced on all endpoints
- [ ] Exceptions return consistent format
- [ ] Errors tracked in Sentry dashboard

### **Week 2-3 (First Month)**
- [ ] Celery tasks running for reports/imports
- [ ] Customers receiving email notifications
- [ ] Invoices generated and emailed automatically
- [ ] Advanced analytics dashboard live
- [ ] Barcode scanner working

### **Week 4+ (Ongoing)**
- [ ] Loyalty program operational
- [ ] Multi-language support active
- [ ] Credit management UI complete
- [ ] Inventory audit trail functional

---

## 💰 RESOURCE PLANNING

### **Team Composition**

**Week 1: 4-5 Developers**
- 2x Backend engineers (payments, receipts, RBAC, exceptions)
- 2x Frontend engineers (payment UI, receipt UI, rate limiting)
- 1x DevOps/QA (Sentry, testing)

**Week 2-3: 3-4 Developers**
- 2x Backend (Celery, emails, invoicing)
- 1x Frontend (report UI, async status)
- 1x QA (testing, documentation)

**Week 4+: 2-3 Developers**
- 1x Backend (loyalty, multi-lang)
- 1x Frontend (UI enhancements)
- 1x QA (ongoing testing)

### **Budget Estimate**
- Developer cost: ~$150/hour
- Week 1: 165 hours × 4 devs = **$99,000**
- Week 2-3: 305 hours × 3 devs = **$137,250**
- Week 4: 85 hours × 2 devs = **$25,500**
- **Total 4 weeks: ~$262,000** (adjust for your region/rates)

### **External Services Cost**
- Stripe: 2.9% of revenue (no setup cost)
- SendGrid: $29/month
- Sentry: $29/month
- Redis: $15/month (or free self-hosted)
- **Monthly**: ~$75/month once at scale

---

## 📋 DEPLOYMENT CHECKLIST

### **Pre-Week 1**
- [ ] All Week 1 PRs merged to main
- [ ] Full regression testing completed
- [ ] Staging environment matches production
- [ ] Database backup strategy documented
- [ ] Monitoring/alerting configured

### **Day 1 (Launch)**
- [ ] Deploy Week 1 code to production
- [ ] Monitor Sentry for errors
- [ ] Have support team on standby
- [ ] Document any issues/hotfixes

### **Week 1 Post-Launch**
- [ ] Monitor payment success rate
- [ ] Track receipt issues
- [ ] Review RBAC permission errors
- [ ] Iterate on feedback

---

## 🚨 RISKS & MITIGATION

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Payment gateway delays | Revenue loss | Start Stripe integration by day 2 of Week 1 |
| Rate limiting breaks legitimate users | Customer frustration | Test thresholds thoroughly before launch |
| Email delivery failures | Lost notifications | Set up SendGrid bounce handling |
| Celery task queue overload | Reports fail | Monitor queue depth, scale Redis if needed |
| RBAC too restrictive | Feature locked | Comprehensive permission testing in QA |

---

## 📞 ESCALATION CONTACTS

- **Payments**: Stripe support (stripe.com/support)
- **Email**: SendGrid support (sendgrid.com/support)
- **Hosting**: Render support (render.com/support)
- **Monitoring**: Sentry support (sentry.io/support)

---

## 📖 ADDITIONAL RESOURCES

- [Stripe Payment Integration Guide](https://stripe.com/docs/payments/accept-a-payment)
- [M-Pesa Daraja API](https://developer.safaricom.co.ke/)
- [ReportLab PDF Documentation](https://www.reportlab.com/docs/reportlab-userguide.pdf)
- [Celery Task Queue Guide](https://docs.celeryproject.io/)
- [Sentry Error Tracking](https://docs.sentry.io/)
- [QZ-Tray Printer Integration](https://qz.io/support/)

---

**Last Updated**: January 29, 2026  
**Next Review**: After Week 1 completion  
**Owner**: Engineering Lead / Product Manager
