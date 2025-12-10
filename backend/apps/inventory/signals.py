"""
Django signals for inventory management
Automatically creates purchase orders when low stock is detected
"""
import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction
from .models import StockMovement, LocationStock
from apps.products.models import Product, ItemVariation
from apps.suppliers.services import check_low_stock_and_create_po

logger = logging.getLogger(__name__)


@receiver(post_save, sender=StockMovement)
def check_low_stock_after_movement(sender, instance, created, **kwargs):
    """
    Check for low stock after a stock movement
    Only check on creation (not updates) to avoid duplicate checks
    """
    if not created:
        return
    
    try:
        tenant = instance.tenant
        outlet = instance.outlet
        
        # Only check if movement reduces stock (sale, transfer_out, damage, expiry)
        if instance.movement_type in ['sale', 'transfer_out', 'damage', 'expiry']:
            # Use transaction.on_commit to ensure stock is updated first
            transaction.on_commit(
                lambda: _trigger_auto_po_check(tenant, outlet, instance.user)
            )
    except Exception as e:
        logger.error(f"Error in check_low_stock_after_movement: {e}", exc_info=True)


@receiver(post_save, sender=LocationStock)
def check_low_stock_after_location_update(sender, instance, created, **kwargs):
    """
    Check for low stock after LocationStock is updated
    This handles variation-level stock tracking
    """
    try:
        tenant = instance.tenant
        outlet = instance.outlet
        
        # Check if stock is at or below threshold
        variation = instance.variation
        if variation and variation.track_inventory and variation.low_stock_threshold > 0:
            if instance.quantity <= variation.low_stock_threshold:
                # Use transaction.on_commit to ensure all updates are complete
                transaction.on_commit(
                    lambda: _trigger_auto_po_check(tenant, outlet, None)
                )
    except Exception as e:
        logger.error(f"Error in check_low_stock_after_location_update: {e}", exc_info=True)


@receiver(post_save, sender=Product)
def check_low_stock_after_product_update(sender, instance, created, **kwargs):
    """
    Check for low stock after product stock is updated
    This handles product-level stock tracking (backward compatibility)
    """
    if created:
        return  # Don't check on creation
    
    try:
        # Only check if stock was updated and is low
        if instance.low_stock_threshold > 0 and instance.stock <= instance.low_stock_threshold:
            tenant = instance.tenant
            # Use transaction.on_commit to ensure all updates are complete
            transaction.on_commit(
                lambda: _trigger_auto_po_check(tenant, None, None)
            )
    except Exception as e:
        logger.error(f"Error in check_low_stock_after_product_update: {e}", exc_info=True)


def _trigger_auto_po_check(tenant, outlet, user):
    """
    Helper function to trigger auto-PO check
    Wrapped in try-except to prevent signal errors from breaking the main operation
    """
    try:
        result = check_low_stock_and_create_po(tenant, outlet, user)
        if result['purchase_orders_created'] > 0:
            logger.info(
                f"Auto-created {result['purchase_orders_created']} purchase orders "
                f"for {result['items_ordered']} low stock items (Tenant: {tenant.id})"
            )
    except Exception as e:
        logger.error(f"Error triggering auto-PO check: {e}", exc_info=True)

