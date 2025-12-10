"""
Auto Purchase Order Service
Handles automatic purchase order creation when low stock is detected
Enhanced with sales velocity, draft PO management, and audit logging
"""
import logging
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum, Q, F, Max
from django.utils import timezone
from datetime import timedelta
from .models import (
    Supplier, PurchaseOrder, PurchaseOrderItem, ProductSupplier,
    AutoPurchaseOrderSettings, AutoPOAuditLog
)
from apps.products.models import Product, ItemVariation
from apps.inventory.models import LocationStock, StockMovement
from apps.sales.models import SaleItem
from apps.outlets.models import Outlet
from apps.accounts.models import User

logger = logging.getLogger(__name__)


def get_or_create_auto_po_settings(tenant):
    """Get or create auto-PO settings for a tenant"""
    settings, created = AutoPurchaseOrderSettings.objects.get_or_create(
        tenant=tenant,
        defaults={
            'auto_po_enabled': False,
            'default_reorder_quantity': 10,
            'auto_approve_po': False,
            'notify_on_auto_po': True,
            'group_by_supplier': True,
        }
    )
    return settings


def calculate_sales_velocity(product=None, variation=None, outlet=None, days=30):
    """
    Calculate sales velocity (units sold per day) for a product or variation
    
    Args:
        product: Product instance (optional, for product-level tracking)
        variation: ItemVariation instance (optional, preferred)
        outlet: Outlet instance (optional, if None calculates across all outlets)
        days: Number of days to look back (default 30)
    
    Returns:
        dict: {
            'units_sold': int,
            'days': int,
            'velocity_per_day': float,
            'velocity_per_week': float,
            'velocity_per_month': float,
            'last_sale_date': datetime or None
        }
    """
    end_date = timezone.now()
    start_date = end_date - timedelta(days=days)
    
    # Build query for sales
    sale_items_query = SaleItem.objects.filter(
        sale__status='completed',
        sale__created_at__gte=start_date,
        sale__created_at__lte=end_date
    )
    
    if variation:
        sale_items_query = sale_items_query.filter(variation=variation)
    elif product:
        sale_items_query = sale_items_query.filter(product=product)
    else:
        return {
            'units_sold': 0,
            'days': days,
            'velocity_per_day': 0.0,
            'velocity_per_week': 0.0,
            'velocity_per_month': 0.0,
            'last_sale_date': None
        }
    
    if outlet:
        sale_items_query = sale_items_query.filter(sale__outlet=outlet)
    
    # Aggregate sales
    sales_data = sale_items_query.aggregate(
        total_quantity=Sum('quantity'),
        last_sale=Max('sale__created_at')
    )
    
    units_sold = sales_data['total_quantity'] or 0
    last_sale_date = sales_data['last_sale']
    
    # Calculate velocities
    velocity_per_day = units_sold / days if days > 0 else 0.0
    velocity_per_week = velocity_per_day * 7
    velocity_per_month = velocity_per_day * 30
    
    return {
        'units_sold': units_sold,
        'days': days,
        'velocity_per_day': round(velocity_per_day, 2),
        'velocity_per_week': round(velocity_per_week, 2),
        'velocity_per_month': round(velocity_per_month, 2),
        'last_sale_date': last_sale_date
    }


def calculate_reorder_quantity(product_supplier, current_stock, threshold, sales_velocity=None):
    """
    Calculate optimal reorder quantity based on reorder settings and sales velocity
    
    Args:
        product_supplier: ProductSupplier instance
        current_stock: Current stock level
        threshold: Low stock threshold
        sales_velocity: Optional sales velocity dict from calculate_sales_velocity()
    
    Returns:
        int: Recommended reorder quantity
    """
    # Base reorder quantity from ProductSupplier
    base_quantity = product_supplier.reorder_quantity or 10
    
    # If sales velocity is available, adjust based on demand
    if sales_velocity and sales_velocity['velocity_per_day'] > 0:
        # Calculate days until stock runs out
        stock_deficit = threshold - current_stock
        days_until_threshold = stock_deficit / sales_velocity['velocity_per_day'] if sales_velocity['velocity_per_day'] > 0 else 0
        
        # Order enough to cover lead time (assume 7 days) + safety stock
        lead_time_days = 7
        safety_days = 7  # Additional buffer
        total_days = lead_time_days + safety_days
        
        # Calculate quantity needed based on velocity
        velocity_based_qty = int(sales_velocity['velocity_per_day'] * total_days)
        
        # Use the higher of base quantity or velocity-based quantity
        # But ensure we order at least enough to get above threshold
        min_quantity = max(base_quantity, stock_deficit + 1)
        recommended_qty = max(min_quantity, velocity_based_qty)
        
        return recommended_qty
    
    # Fallback to base quantity or enough to get above threshold
    stock_deficit = threshold - current_stock
    return max(base_quantity, stock_deficit + 1)


def log_auto_po_action(tenant, action_type, description, context_data=None, 
                       purchase_order=None, product=None, variation=None, 
                       supplier=None, user=None):
    """
    Log an auto-PO action for audit trail
    
    Args:
        tenant: Tenant instance
        action_type: Action type from AutoPOAuditLog.ACTION_TYPES
        description: Human-readable description
        context_data: Optional dict with additional context
        purchase_order: Optional PurchaseOrder instance
        product: Optional Product instance
        variation: Optional ItemVariation instance
        supplier: Optional Supplier instance
        user: Optional User instance (who triggered)
    """
    try:
        AutoPOAuditLog.objects.create(
            tenant=tenant,
            purchase_order=purchase_order,
            product=product,
            variation=variation,
            supplier=supplier,
            action_type=action_type,
            description=description,
            context_data=context_data or {},
            triggered_by=user
        )
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}", exc_info=True)


def check_low_stock_and_create_po(tenant, outlet=None, user=None):
    """
    Check for low stock items and automatically create purchase orders
    
    Args:
        tenant: Tenant instance
        outlet: Optional outlet to check (if None, checks all outlets)
        user: Optional user who triggered this (for created_by field)
    
    Returns:
        dict: {
            'purchase_orders_created': int,
            'items_ordered': int,
            'purchase_orders': list of PurchaseOrder instances
        }
    """
    # Get auto-PO settings
    settings = get_or_create_auto_po_settings(tenant)
    
    if not settings.auto_po_enabled:
        logger.info(f"Auto-PO is disabled for tenant {tenant.id}")
        return {
            'purchase_orders_created': 0,
            'items_ordered': 0,
            'purchase_orders': []
        }
    
    # Get all active products with low stock threshold set
    products = Product.objects.filter(
        tenant=tenant,
        is_active=True,
        low_stock_threshold__gt=0
    ).select_related('tenant')
    
    # Also check variations with low stock
    variations = ItemVariation.objects.filter(
        product__tenant=tenant,
        product__is_active=True,
        is_active=True,
        track_inventory=True,
        low_stock_threshold__gt=0
    ).select_related('product', 'product__tenant')
    
    low_stock_items = []
    
    # Check product-level stock (for backward compatibility)
    for product in products:
        if product.stock <= product.low_stock_threshold:
            # Check if there's a pending PO for this product
            if not _has_pending_po_for_product(tenant, product):
                low_stock_items.append({
                    'type': 'product',
                    'product': product,
                    'variation': None,
                    'current_stock': product.stock,
                    'threshold': product.low_stock_threshold,
                    'outlet': outlet,
                })
    
    # Check variation-level stock (preferred method)
    outlets_to_check = [outlet] if outlet else Outlet.objects.filter(tenant=tenant, is_active=True)
    
    for variation in variations:
        for outlet_obj in outlets_to_check:
            location_stock = LocationStock.objects.filter(
                variation=variation,
                outlet=outlet_obj
            ).first()
            
            current_stock = location_stock.quantity if location_stock else 0
            
            if current_stock <= variation.low_stock_threshold:
                # Check if there's a pending PO for this variation
                if not _has_pending_po_for_variation(tenant, variation):
                    low_stock_items.append({
                        'type': 'variation',
                        'product': variation.product,
                        'variation': variation,
                        'current_stock': current_stock,
                        'threshold': variation.low_stock_threshold,
                        'outlet': outlet_obj,
                    })
    
    if not low_stock_items:
        logger.info(f"No low stock items found for tenant {tenant.id}")
        return {
            'purchase_orders_created': 0,
            'items_ordered': 0,
            'purchase_orders': []
        }
    
    # Group items by supplier if enabled
    if settings.group_by_supplier:
        return _create_grouped_purchase_orders(tenant, low_stock_items, settings, user, outlet)
    else:
        return _create_individual_purchase_orders(tenant, low_stock_items, settings, user, outlet)


def _has_pending_po_for_product(tenant, product):
    """Check if there's already a pending/approved/ordered PO for this product"""
    return PurchaseOrder.objects.filter(
        tenant=tenant,
        status__in=['draft', 'pending', 'approved', 'ordered'],
        items__product=product
    ).exists()


def _has_pending_po_for_variation(tenant, variation):
    """Check if there's already a pending/approved/ordered PO for this variation"""
    return PurchaseOrder.objects.filter(
        tenant=tenant,
        status__in=['draft', 'pending', 'approved', 'ordered'],
        items__variation=variation
    ).exists()


def _get_or_create_draft_po(tenant, supplier, outlet, user):
    """
    Get existing draft PO for supplier or create new one
    Ensures no duplicate drafts exist for the same supplier
    Supports supplier=None for auto-POs without supplier
    """
    # Check for existing draft PO for this supplier (or no supplier)
    if supplier:
        existing_draft = PurchaseOrder.objects.filter(
            tenant=tenant,
            supplier=supplier,
            outlet=outlet,
            status__in=['draft', 'pending_supplier']
        ).order_by('-created_at').first()
    else:
        # For no-supplier POs, check for any draft/pending_supplier PO without supplier
        existing_draft = PurchaseOrder.objects.filter(
            tenant=tenant,
            supplier__isnull=True,
            outlet=outlet,
            status__in=['draft', 'pending_supplier']
        ).order_by('-created_at').first()
    
    if existing_draft:
        supplier_name = supplier.name if supplier else "No Supplier"
        log_auto_po_action(
            tenant=tenant,
            action_type='duplicate_prevented',
            description=f"Using existing draft PO {existing_draft.po_number} for supplier {supplier_name}",
            context_data={'po_number': existing_draft.po_number, 'po_id': existing_draft.id},
            purchase_order=existing_draft,
            supplier=supplier,
            user=user
        )
        return existing_draft
    
    # Create new draft PO
    po_number = _generate_po_number(tenant)
    # Determine status: pending_supplier if no supplier, draft if supplier exists
    po_status = 'pending_supplier' if supplier is None else 'draft'
    notes = (
        "Auto-generated draft purchase order for low stock items. "
        if supplier else
        "Auto-generated purchase order for low stock items. Supplier not yet assigned - please assign supplier before ordering. "
    ) + "Review and approve before sending to supplier."
    
    draft_po = PurchaseOrder.objects.create(
        tenant=tenant,
        supplier=supplier,
        outlet=outlet,
        created_by=user,
        po_number=po_number,
        order_date=timezone.now().date(),
        expected_delivery_date=timezone.now().date() + timedelta(days=7),
        status=po_status,
        notes=notes,
    )
    
    supplier_name = supplier.name if supplier else "No Supplier"
    log_auto_po_action(
        tenant=tenant,
        action_type='draft_created',
        description=f"Created draft PO {po_number} for supplier {supplier_name}",
        context_data={'po_number': po_number, 'po_id': draft_po.id, 'status': po_status},
        purchase_order=draft_po,
        supplier=supplier,
        user=user
    )
    
    return draft_po


def _create_grouped_purchase_orders(tenant, low_stock_items, settings, user, outlet):
    """
    Create or update DRAFT purchase orders grouped by supplier
    Enhanced with sales velocity calculation and audit logging
    """
    # Group items by supplier
    supplier_items = {}
    
    for item in low_stock_items:
        product = item['product']
        variation = item.get('variation')
        item_outlet = item['outlet'] or outlet
        
        # Get preferred supplier for this product
        product_supplier = ProductSupplier.objects.filter(
            tenant=tenant,
            product=product,
            is_preferred=True,
            is_active=True,
            supplier__is_active=True
        ).first()
        
        if not product_supplier:
            # Try any active supplier for this product
            product_supplier = ProductSupplier.objects.filter(
                tenant=tenant,
                product=product,
                is_active=True,
                supplier__is_active=True
            ).first()
        
        if not product_supplier:
            # No supplier found - create PO without supplier (Malawi-style informal suppliers)
            logger.info(f"No supplier found for product {product.id} ({product.name}) - creating PO without supplier")
            log_auto_po_action(
                tenant=tenant,
                action_type='low_stock_detected',
                description=f"Low stock detected for {product.name} - creating PO without supplier (supplier can be added later)",
                context_data={
                    'product_id': product.id,
                    'product_name': product.name,
                    'current_stock': item['current_stock'],
                    'threshold': item['threshold'],
                    'supplier_required': False
                },
                product=product,
                variation=variation,
                user=user
            )
            # Add to "no_supplier" group
            no_supplier_key = 'no_supplier'
            if no_supplier_key not in supplier_items:
                supplier_items[no_supplier_key] = {
                    'supplier': None,
                    'outlet': item_outlet,
                    'items': []
                }
            supplier_items[no_supplier_key]['items'].append({
                'item': item,
                'product_supplier': None,
            })
            continue
        
        supplier = product_supplier.supplier
        supplier_key = supplier.id
        
        if supplier_key not in supplier_items:
            supplier_items[supplier_key] = {
                'supplier': supplier,
                'outlet': item_outlet,
                'items': []
            }
        
        supplier_items[supplier_key]['items'].append({
            'item': item,
            'product_supplier': product_supplier,
        })
    
    # Create or update purchase orders for each supplier
    purchase_orders = []
    total_items = 0
    drafts_created = 0
    drafts_updated = 0
    
    with transaction.atomic():
        for supplier_key, supplier_data in supplier_items.items():
            supplier = supplier_data['supplier']  # Can be None for no-supplier items
            po_outlet = supplier_data['outlet'] or outlet or Outlet.objects.filter(tenant=tenant, is_active=True).first()
            
            if not po_outlet:
                logger.error(f"No outlet found for tenant {tenant.id}")
                continue
            
            # Get or create draft PO for this supplier (or no supplier)
            purchase_order = _get_or_create_draft_po(tenant, supplier, po_outlet, user)
            is_new_draft = purchase_order.items.count() == 0
            
            if is_new_draft:
                drafts_created += 1
            else:
                drafts_updated += 1
            
            # Process items for this supplier
            po_subtotal = purchase_order.subtotal or Decimal('0')
            items_added = 0
            items_updated = 0
            
            for item_data in supplier_data['items']:
                item = item_data['item']
                product_supplier = item_data['product_supplier']
                product = item['product']
                variation = item.get('variation')
                current_stock = item['current_stock']
                threshold = item['threshold']
                
                # Calculate sales velocity
                sales_velocity = calculate_sales_velocity(
                    product=product,
                    variation=variation,
                    outlet=po_outlet,
                    days=30
                )
                
                log_auto_po_action(
                    tenant=tenant,
                    action_type='sales_velocity_calculated',
                    description=f"Calculated sales velocity for {product.name}",
                    context_data={
                        'product_id': product.id,
                        'variation_id': variation.id if variation else None,
                        'sales_velocity': sales_velocity
                    },
                    product=product,
                    variation=variation,
                    user=user
                )
                
                # Calculate optimal reorder quantity using sales velocity
                # If no product_supplier, use default reorder quantity from settings
                if product_supplier:
                    reorder_qty = calculate_reorder_quantity(
                        product_supplier=product_supplier,
                        current_stock=current_stock,
                        threshold=threshold,
                        sales_velocity=sales_velocity
                    )
                else:
                    # No supplier - use default reorder quantity or calculate from deficit
                    default_qty = settings.default_reorder_quantity or 10
                    stock_deficit = threshold - current_stock
                    # Use sales velocity if available
                    if sales_velocity and sales_velocity['velocity_per_day'] > 0:
                        lead_time_days = 7
                        safety_days = 7
                        velocity_based_qty = int(sales_velocity['velocity_per_day'] * (lead_time_days + safety_days))
                        reorder_qty = max(default_qty, stock_deficit + 1, velocity_based_qty)
                    else:
                        reorder_qty = max(default_qty, stock_deficit + 1)
                
                # Determine unit cost
                unit_cost = None
                if product_supplier:
                    unit_cost = product_supplier.unit_cost
                
                if not unit_cost:
                    if variation and variation.cost:
                        unit_cost = variation.cost
                    elif product.cost:
                        unit_cost = product.cost
                    else:
                        # Use retail price as fallback (not ideal, but better than 0)
                        if variation:
                            unit_cost = variation.price * Decimal('0.6')  # Assume 60% margin
                        else:
                            unit_cost = product.retail_price * Decimal('0.6')
                
                # Check if item already exists in this draft PO
                existing_item = None
                if variation:
                    existing_item = PurchaseOrderItem.objects.filter(
                        purchase_order=purchase_order,
                        variation=variation
                    ).first()
                else:
                    existing_item = PurchaseOrderItem.objects.filter(
                        purchase_order=purchase_order,
                        product=product,
                        variation__isnull=True
                    ).first()
                
                if existing_item:
                    # Update existing item - stock decreased further
                    old_quantity = existing_item.quantity
                    old_total = existing_item.total
                    
                    # Recalculate quantity based on new stock level
                    # Increase quantity if stock decreased further
                    if current_stock < threshold:
                        # Stock decreased further, increase order quantity
                        additional_qty = max(0, threshold - current_stock)
                        new_quantity = existing_item.quantity + additional_qty
                    else:
                        # Use calculated reorder quantity
                        new_quantity = max(existing_item.quantity, reorder_qty)
                    
                    existing_item.quantity = new_quantity
                    existing_item.unit_price = unit_cost  # Update cost if changed
                    existing_item.total = Decimal(str(new_quantity)) * unit_cost
                    existing_item.notes = (
                        f"Auto-updated: Current stock {current_stock}, Threshold {threshold}. "
                        f"Sales velocity: {sales_velocity['velocity_per_day']:.2f}/day. "
                        f"Previous qty: {old_quantity}, New qty: {new_quantity}"
                    )
                    existing_item.save()
                    
                    po_subtotal = po_subtotal - old_total + existing_item.total
                    items_updated += 1
                    
                    log_auto_po_action(
                        tenant=tenant,
                        action_type='item_updated',
                        description=f"Updated item {product.name} in draft PO {purchase_order.po_number}",
                        context_data={
                            'po_number': purchase_order.po_number,
                            'product_id': product.id,
                            'variation_id': variation.id if variation else None,
                            'old_quantity': old_quantity,
                            'new_quantity': new_quantity,
                            'current_stock': current_stock,
                            'threshold': threshold,
                            'sales_velocity': sales_velocity
                        },
                        purchase_order=purchase_order,
                        product=product,
                        variation=variation,
                        supplier=supplier,
                        user=user
                    )
                else:
                    # Add new item to draft
                    po_item = PurchaseOrderItem.objects.create(
                        purchase_order=purchase_order,
                        product=product,
                        variation=variation,
                        quantity=reorder_qty,
                        unit_price=unit_cost,
                        notes=(
                            f"Auto-ordered: Current stock {current_stock}, Threshold {threshold}. "
                            f"Sales velocity: {sales_velocity['velocity_per_day']:.2f}/day"
                        ),
                    )
                    
                    po_subtotal += po_item.total
                    items_added += 1
                    
                    log_auto_po_action(
                        tenant=tenant,
                        action_type='item_added',
                        description=f"Added item {product.name} to draft PO {purchase_order.po_number}",
                        context_data={
                            'po_number': purchase_order.po_number,
                            'product_id': product.id,
                            'variation_id': variation.id if variation else None,
                            'quantity': reorder_qty,
                            'current_stock': current_stock,
                            'threshold': threshold,
                            'sales_velocity': sales_velocity
                        },
                        purchase_order=purchase_order,
                        product=product,
                        variation=variation,
                        supplier=supplier,
                        user=user
                    )
            
            # Update PO totals
            purchase_order.subtotal = po_subtotal
            purchase_order.total = po_subtotal + purchase_order.tax - purchase_order.discount
            purchase_order.save()
            
            if items_added > 0 or items_updated > 0:
                log_auto_po_action(
                    tenant=tenant,
                    action_type='draft_updated' if not is_new_draft else 'draft_created',
                    description=f"{'Updated' if not is_new_draft else 'Created'} draft PO {purchase_order.po_number} with {items_added} new items, {items_updated} updated items",
                    context_data={
                        'po_number': purchase_order.po_number,
                        'items_added': items_added,
                        'items_updated': items_updated,
                        'total_items': purchase_order.items.count(),
                        'subtotal': str(po_subtotal)
                    },
                    purchase_order=purchase_order,
                    supplier=supplier,
                    user=user
                )
            
            purchase_orders.append(purchase_order)
            total_items += items_added + items_updated
            
            logger.info(
                f"{'Created' if is_new_draft else 'Updated'} draft PO {purchase_order.po_number} for supplier {supplier.name} "
                f"with {items_added} new items, {items_updated} updated items"
            )
    
    return {
        'purchase_orders_created': drafts_created,
        'purchase_orders_updated': drafts_updated,
        'items_ordered': total_items,
        'purchase_orders': purchase_orders
    }


def _create_individual_purchase_orders(tenant, low_stock_items, settings, user, outlet):
    """Create individual purchase orders for each low stock item"""
    # This is similar but creates one PO per item
    # For now, we'll use grouped approach as it's more efficient
    return _create_grouped_purchase_orders(tenant, low_stock_items, settings, user, outlet)


def _generate_po_number(tenant):
    """Generate unique PO number for tenant"""
    from django.db.models import Max
    import re
    
    # Get tenant code
    tenant_name = tenant.name.upper()
    tenant_code = re.sub(r'[^A-Z0-9]', '', tenant_name)[:5]
    if not tenant_code:
        tenant_code = f"T{tenant.id}"
    
    # Get last PO number
    last_po = PurchaseOrder.objects.filter(
        tenant=tenant,
        po_number__startswith=f"{tenant_code}-PO-"
    ).aggregate(max_num=Max('po_number'))
    
    if last_po['max_num']:
        try:
            # Extract number from PO-XXXX format
            match = re.search(r'(\d+)$', last_po['max_num'])
            if match:
                next_num = int(match.group(1)) + 1
            else:
                next_num = PurchaseOrder.objects.filter(tenant=tenant).count() + 1
        except (ValueError, AttributeError):
            next_num = PurchaseOrder.objects.filter(tenant=tenant).count() + 1
    else:
        next_num = 1
    
    po_number = f"{tenant_code}-PO-{next_num:04d}"
    
    # Ensure uniqueness
    max_attempts = 1000
    attempts = 0
    while PurchaseOrder.objects.filter(tenant=tenant, po_number=po_number).exists() and attempts < max_attempts:
        next_num += 1
        po_number = f"{tenant_code}-PO-{next_num:04d}"
        attempts += 1
    
    if attempts >= max_attempts:
        # Fallback to timestamp
        import time
        po_number = f"{tenant_code}-PO-{int(time.time())}"
    
    return po_number

