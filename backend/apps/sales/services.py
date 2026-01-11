"""
Receipt generation service
Handles creation and formatting of digital receipts
"""
import logging
from django.template.loader import render_to_string
from django.template import engines, TemplateSyntaxError
import json
from django.utils import timezone
from decimal import Decimal
from .models import Sale, Receipt
from apps.tenants.models import Tenant
from apps.accounts.models import User

logger = logging.getLogger(__name__)


class ReceiptService:
    """Service for generating and managing digital receipts"""
    
    @staticmethod
    def generate_receipt(sale: Sale, format: str = 'json', user: User = None) -> Receipt:
        """
        Generate and save a receipt for a sale
        
        Args:
            sale: The Sale instance
            format: Receipt format ('html', 'pdf', 'json')
            user: User who generated the receipt (defaults to sale.user)
        
        Returns:
            Receipt instance
        """
        try:
            # If a current receipt with the requested format already exists, return it.
            existing_same_format = Receipt.objects.filter(sale=sale, format=format, is_current=True, voided=False).first()
            if existing_same_format:
                logger.info(f"Found current receipt for sale {sale.id} format={format} -> receipt={existing_same_format.id}")
                return existing_same_format

            # Get user
            if not user:
                user = sale.user

            # Prefer tenant's default receipt template when available
            from .models import ReceiptTemplate
            from .serializers import SaleSerializer

            template = None
            try:
                template = ReceiptTemplate.objects.filter(tenant=sale.tenant, is_default=True).first()
            except Exception:
                template = None

            # Build a safe context using serialized sale data
            sale_data = SaleSerializer(sale).data
            context = {
                'sale': sale_data,
                'items': sale_data.get('items', []),
                'outlet': sale_data.get('outlet_detail') or {},
                'tenant': {'id': str(sale.tenant.id), 'name': getattr(sale.tenant, 'name', '')},
            }

            if template and template.content:
                # Render template according to its stored format
                try:
                    engine = engines['django']
                    tpl = engine.from_string(template.content or '')
                    rendered = tpl.render(context)
                except TemplateSyntaxError as e:
                    logger.error(f"Template syntax error for tenant {sale.tenant.id}: {str(e)}")
                    # Fall back to programmatic generators
                    rendered = None

                if rendered is not None:
                    # If caller asked for escpos, convert rendered text to escpos bytes
                    if format == 'escpos':
                        # Ensure we have a text representation
                        text_to_convert = rendered
                        # If template.format is json, dump to pretty text
                        if template.format == 'json':
                            try:
                                parsed = json.loads(rendered)
                                text_to_convert = json.dumps(parsed, indent=2)
                            except Exception:
                                # leave as-is
                                pass
                        content = ReceiptService._text_to_escpos(sale, text_to_convert)
                    else:
                        # Respect requested format when possible; otherwise store template's format
                        if format == 'html' or template.format == 'html' or template.format == 'text':
                            content = rendered
                            # if requested format explicitly json, try to convert
                            if format == 'json':
                                try:
                                    content = json.dumps(json.loads(rendered), indent=2)
                                except Exception:
                                    # if rendered is not valid JSON, keep as string
                                    pass
                        elif template.format == 'json' or format == 'json':
                            # Ensure valid JSON string
                            try:
                                parsed = json.loads(rendered)
                                content = json.dumps(parsed, indent=2)
                            except Exception:
                                # Fallback to putting rendered string in content
                                content = rendered
                        else:
                            content = rendered
                else:
                    # Template failed to render; fall back to programmatic generation
                    template = None

            if not template or not template.content:
                # Generate receipt content based on format (fallbacks)
                if format == 'html':
                    # HTML kept for previewing, but not intended for direct printing in POS flow
                    content = ReceiptService._generate_html_receipt(sale)
                elif format == 'json':
                    content = ReceiptService._generate_json_receipt(sale)
                elif format == 'escpos':
                    # Return base64-encoded ESC/POS bytes as text payload
                    content = ReceiptService._generate_escpos_receipt(sale)
                else:
                    # Fallback to structured JSON
                    content = ReceiptService._generate_json_receipt(sale)
            
            # Create a new Receipt record (immutable once created). For versioning,
            # mark any existing current receipts for this sale+format as not current
            # and void them.
            # Note: receipt_number is intentionally left as the sale.receipt_number to
            # maintain human-friendly numbering; if a new unique number is required we
            # could append a suffix or generate a new token here.
            previous = Receipt.objects.filter(sale=sale, format=format, is_current=True, voided=False)
            if previous.exists():
                previous.update(is_current=False, voided=True)

            receipt = Receipt.objects.create(
                tenant=sale.tenant,
                sale=sale,
                receipt_number=sale.receipt_number,
                format=format,
                content=content,
                generated_by=user,
            )

            logger.info(f"Receipt generated for sale {sale.id}: {receipt.id} format={format} by user={getattr(user, 'id', None)}")
            return receipt
            
        except Exception as e:
            logger.error(f"Error generating receipt for sale {sale.id}: {str(e)}", exc_info=True)
            raise
    
    @staticmethod
    def _generate_html_receipt(sale: Sale) -> str:
        """Generate HTML receipt content"""
        # Get business/outlet information
        business_name = sale.tenant.name if sale.tenant else "Business"
        outlet = sale.outlet
        outlet_name = outlet.name if outlet else ""
        outlet_address = outlet.address if outlet and outlet.address else ""
        outlet_phone = outlet.phone if outlet and outlet.phone else ""
        outlet_email = outlet.email if outlet and outlet.email else ""
        
        # Get currency
        currency = sale.tenant.currency if sale.tenant and sale.tenant.currency else "MWK"
        
        # Format currency
        def format_currency(amount):
            return f"{currency} {amount:,.2f}"
        
        # Receipt header
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Receipt {sale.receipt_number}</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    max-width: 400px;
                    margin: 0 auto;
                    padding: 20px;
                    background: white;
                }}
                .receipt-header {{
                    text-align: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 15px;
                    margin-bottom: 15px;
                }}
                .receipt-header h1 {{
                    margin: 0;
                    font-size: 24px;
                    font-weight: bold;
                }}
                .receipt-header p {{
                    margin: 5px 0;
                    font-size: 12px;
                }}
                .receipt-info {{
                    margin: 15px 0;
                    font-size: 12px;
                }}
                .receipt-info p {{
                    margin: 3px 0;
                }}
                .customer-info {{
                    margin: 15px 0;
                    padding: 10px;
                    background: #f5f5f5;
                    font-size: 12px;
                }}
                .receipt-items {{
                    margin: 15px 0;
                }}
                .receipt-items table {{
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                }}
                .receipt-items th {{
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                    padding: 8px 0;
                    font-weight: bold;
                }}
                .receipt-items td {{
                    padding: 5px 0;
                    border-bottom: 1px dotted #ddd;
                }}
                .receipt-items .item-name {{
                    width: 60%;
                }}
                .receipt-items .item-qty {{
                    width: 15%;
                    text-align: center;
                }}
                .receipt-items .item-price {{
                    width: 25%;
                    text-align: right;
                }}
                .receipt-totals {{
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 2px solid #000;
                }}
                .receipt-totals p {{
                    margin: 5px 0;
                    font-size: 12px;
                }}
                .receipt-totals .total-row {{
                    font-weight: bold;
                    font-size: 14px;
                    margin-top: 10px;
                }}
                .receipt-footer {{
                    margin-top: 20px;
                    text-align: center;
                    font-size: 11px;
                    color: #666;
                    border-top: 1px solid #ddd;
                    padding-top: 15px;
                }}
            </style>
        </head>
        <body>
            <div class="receipt">
                <div class="receipt-header">
                    <h1>{business_name}</h1>
                    {f'<p>{outlet_name}</p>' if outlet_name else ''}
                    {f'<p>{outlet_address}</p>' if outlet_address else ''}
                    {f'<p>{outlet_phone}</p>' if outlet_phone else ''}
                    {f'<p>{outlet_email}</p>' if outlet_email else ''}
                </div>
                
                <div class="receipt-info">
                    <p><strong>Receipt #:</strong> {sale.receipt_number}</p>
                    <p><strong>Date:</strong> {sale.created_at.strftime('%Y-%m-%d %H:%M:%S')}</p>
                    {f'<p><strong>Cashier:</strong> {sale.user.get_full_name() if sale.user and sale.user.get_full_name() else (sale.user.email if sale.user else "System")}</p>' if sale.user else ''}
                </div>
        """
        
        # Customer info if applicable
        if sale.customer:
            html += f"""
                <div class="customer-info">
                    <p><strong>Customer:</strong> {sale.customer.name}</p>
                    {f'<p><strong>Phone:</strong> {sale.customer.phone}</p>' if sale.customer.phone else ''}
                    {f'<p><strong>Email:</strong> {sale.customer.email}</p>' if sale.customer.email else ''}
                </div>
            """
        
        # Items
        html += """
                <div class="receipt-items">
                    <table>
                        <thead>
                            <tr>
                                <th class="item-name">Item</th>
                                <th class="item-qty">Qty</th>
                                <th class="item-price">Price</th>
                            </tr>
                        </thead>
                        <tbody>
        """
        
        # Add sale items
        for item in sale.items.all():
            item_name = item.product_name
            if item.variation_name:
                item_name += f" - {item.variation_name}"
            if item.unit_name:
                item_name += f" ({item.unit_name})"
            
            html += f"""
                            <tr>
                                <td class="item-name">{item_name}</td>
                                <td class="item-qty">{item.quantity}</td>
                                <td class="item-price">{format_currency(item.total)}</td>
                            </tr>
            """
        
        html += """
                        </tbody>
                    </table>
                </div>
        """
        
        # Totals
        html += f"""
                <div class="receipt-totals">
                    <p>Subtotal: {format_currency(sale.subtotal)}</p>
                    {f'<p>Tax: {format_currency(sale.tax)}</p>' if sale.tax > 0 else ''}
                    {f'<p>Discount: -{format_currency(sale.discount)}</p>' if sale.discount > 0 else ''}
                    <p class="total-row">Total: {format_currency(sale.total)}</p>
                    <p>Payment Method: {sale.get_payment_method_display()}</p>
                    {f'<p>Cash Received: {format_currency(sale.cash_received)}</p>' if sale.cash_received else ''}
                    {f'<p>Change: {format_currency(sale.change_given)}</p>' if sale.change_given and sale.change_given > 0 else ''}
                </div>
        """
        
        # Footer
        html += """
                <div class="receipt-footer">
                    <p>Thank you for your business!</p>
                    <p>Powered by PRIMEPOS +265 997575865</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    @staticmethod
    def _generate_json_receipt(sale: Sale) -> str:
        """Generate JSON receipt content"""
        import json
        
        receipt_data = {
            'receipt_number': sale.receipt_number,
            'date': sale.created_at.isoformat(),
            'business': {
                'name': sale.tenant.name if sale.tenant else None,
                'outlet': {
                    'name': sale.outlet.name if sale.outlet else None,
                    'address': sale.outlet.address if sale.outlet and sale.outlet.address else None,
                    'phone': sale.outlet.phone if sale.outlet and sale.outlet.phone else None,
                    'email': sale.outlet.email if sale.outlet and sale.outlet.email else None,
                } if sale.outlet else None,
            },
            'cashier': {
                'id': str(sale.user.id) if sale.user else None,
                'name': sale.user.get_full_name() if sale.user and sale.user.get_full_name() else None,
                'email': sale.user.email if sale.user else None,
            } if sale.user else None,
            'customer': {
                'id': str(sale.customer.id) if sale.customer else None,
                'name': sale.customer.name if sale.customer else None,
                'phone': sale.customer.phone if sale.customer and sale.customer.phone else None,
                'email': sale.customer.email if sale.customer and sale.customer.email else None,
            } if sale.customer else None,
            'items': [
                {
                    'product_name': item.product_name,
                    'variation_name': item.variation_name if item.variation_name else None,
                    'unit_name': item.unit_name if item.unit_name else None,
                    'quantity': item.quantity,
                    'price': str(item.price),
                    'total': str(item.total),
                }
                for item in sale.items.all()
            ],
            'totals': {
                'subtotal': str(sale.subtotal),
                'tax': str(sale.tax),
                'discount': str(sale.discount),
                'total': str(sale.total),
            },
            'payment': {
                'method': sale.payment_method,
                'cash_received': str(sale.cash_received) if sale.cash_received else None,
                'change_given': str(sale.change_given) if sale.change_given else None,
            },
            'currency': sale.tenant.currency if sale.tenant and sale.tenant.currency else 'MWK',
        }
        
        return json.dumps(receipt_data, indent=2)

    @staticmethod
    def _generate_escpos_receipt(sale: Sale) -> str:
        """Build a minimal ESC/POS byte payload for thermal printers and return base64-encoded string.

        The backend does NOT send this to any printer. The frontend should request a receipt
        with format='escpos', decode the base64 payload and forward the bytes to QZ Tray.
        """
        import base64

        def b(text: str = ""):
            return (text + "\n").encode('utf-8')

        # ESC/POS init
        payload = bytearray()
        payload.extend(b"\x1b@")  # initialize (note: kept as literal for clarity)

        # Header: business/outlet
        business = sale.tenant.name if sale.tenant else "Business"
        outlet = sale.outlet.name if sale.outlet else ""
        currency = sale.tenant.currency if sale.tenant and sale.tenant.currency else "MWK"
        payload.extend(b(business.upper()))
        if outlet:
            payload.extend(b(outlet))

        payload.extend(b(f"Receipt #: {sale.receipt_number}"))
        payload.extend(b(f"Date: {sale.created_at.strftime('%Y-%m-%d %H:%M:%S')}"))

        # Items
        payload.extend(b("-----------------------------"))
        for item in sale.items.all():
            name = item.product_name
            qty = item.quantity
            price = f"{currency} {item.total:,.2f}"
            line = f"{name} x{qty}  {price}"
            payload.extend(b(line))

        payload.extend(b("-----------------------------"))
        payload.extend(b(f"Subtotal: {currency} {sale.subtotal:,.2f}"))
        if sale.tax and sale.tax > 0:
            payload.extend(b(f"Tax: {currency} {sale.tax:,.2f}"))
        if sale.discount and sale.discount > 0:
            payload.extend(b(f"Discount: -{currency} {sale.discount:,.2f}"))
        payload.extend(b(f"Total: {currency} {sale.total:,.2f}"))
        payload.extend(b(f"Payment: {sale.get_payment_method_display()}"))

        payload.extend(b("\nThank you for your business!"))
        payload.extend(b("Powered by PRIMEPOS +265 997575865"))

        # Paper cut (may not be supported by all printers; frontend may choose to append)
        try:
            # GS V 0 -> b'\x1dV\x00'
            payload.extend(b("\x1dV\x00"))
        except Exception:
            pass

        # Return base64-encoded bytes so they can safely be stored/transferred as text
        return base64.b64encode(bytes(payload)).decode('ascii')

    @staticmethod
    def _text_to_escpos(sale: Sale, text: str) -> str:
        """Convert a rendered text receipt into a minimal ESC/POS base64 payload."""
        import base64

        def b(text_line: str = ""):
            return (text_line + "\n").encode('utf-8')

        payload = bytearray()
        # Initialize
        payload.extend(b"\x1b@")
        # Add text
        # Ensure text is str
        if text:
            # Split into lines to avoid enormous single writes
            for line in str(text).splitlines():
                payload.extend(b(line))
        # Footer
        payload.extend(b("\nThank you for your business!"))
        payload.extend(b("Powered by PRIMEPOS +265 997575865"))
        try:
            payload.extend(b("\x1dV\x00"))
        except Exception:
            pass

        return base64.b64encode(bytes(payload)).decode('ascii')
    
    @staticmethod
    def get_receipt_by_number(receipt_number: str) -> Receipt:
        """Retrieve the most recent non-voided receipt matching `receipt_number`"""
        try:
            receipt = Receipt.objects.select_related('sale', 'tenant', 'generated_by').filter(
                receipt_number=receipt_number,
                voided=False,
            ).order_by('-generated_at').first()
            if not receipt:
                raise Receipt.DoesNotExist()
            receipt.increment_access()
            return receipt
        except Receipt.DoesNotExist:
            raise Receipt.DoesNotExist(f"Receipt with number {receipt_number} not found")
    
    @staticmethod
    def get_receipt_by_sale(sale_id: int) -> Receipt:
        """Retrieve the current receipt for a sale (by sale ID)"""
        try:
            receipt = Receipt.objects.select_related('sale', 'tenant', 'generated_by').get(
                sale_id=sale_id,
                is_current=True,
                voided=False,
            )
            return receipt
        except Receipt.DoesNotExist:
            raise Receipt.DoesNotExist(f"Active receipt for sale {sale_id} not found")
    
    @staticmethod
    def regenerate_receipt(receipt_id: int, format: str = 'html', user: User = None) -> Receipt:
        """Regenerate a receipt by creating a new version and voiding the previous one.

        This preserves immutability by creating a new Receipt row rather than
        mutating the existing record.
        """
        try:
            old = Receipt.objects.get(id=receipt_id)
            sale = old.sale

            if not user:
                user = old.generated_by

            # Generate new content according to requested format
            if format == 'html':
                content = ReceiptService._generate_html_receipt(sale)
            elif format == 'json':
                content = ReceiptService._generate_json_receipt(sale)
            elif format == 'escpos':
                content = ReceiptService._generate_escpos_receipt(sale)
            else:
                content = ReceiptService._generate_html_receipt(sale)

            # Mark old as voided and not current
            old.voided = True
            old.is_current = False
            old.save(update_fields=['voided', 'is_current'])

            # Create new receipt (new immutable record)
            new_receipt = Receipt.objects.create(
                tenant=old.tenant,
                sale=sale,
                receipt_number=sale.receipt_number,
                format=format,
                content=content,
                generated_by=user,
                superseded_by=None
            )

            # Link predecessor
            old.superseded_by = new_receipt
            old.save(update_fields=['superseded_by'])

            logger.info(f"Receipt {old.id} regenerated -> new receipt {new_receipt.id} by user={getattr(user, 'id', None)}")
            return new_receipt
        except Receipt.DoesNotExist:
            raise Receipt.DoesNotExist(f"Receipt {receipt_id} not found")

