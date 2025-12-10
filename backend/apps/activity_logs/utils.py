"""
Utility functions for creating activity logs programmatically.
Use these functions to log specific actions that may not be captured by middleware.
"""
from django.contrib.auth import get_user_model
from .models import ActivityLog

User = get_user_model()


def log_activity(
    tenant,
    user,
    action,
    module,
    description,
    resource_type=None,
    resource_id=None,
    metadata=None,
    ip_address=None,
    user_agent=None,
    request_path=None,
    request_method=None,
):
    """
    Create an activity log entry programmatically.
    
    Args:
        tenant: Tenant instance
        user: User instance (can be None for system actions)
        action: Action type (from ActivityLog.ACTION_CHOICES)
        module: Module type (from ActivityLog.MODULE_CHOICES)
        description: Human-readable description
        resource_type: Type of resource (e.g., 'Sale', 'Product')
        resource_id: ID of the resource
        metadata: Additional JSON data
        ip_address: Client IP address
        user_agent: User agent string
        request_path: Request path
        request_method: HTTP method
    
    Returns:
        ActivityLog instance
    """
    return ActivityLog.objects.create(
        tenant=tenant,
        user=user,
        action=action,
        module=module,
        resource_type=resource_type or '',
        resource_id=str(resource_id) if resource_id else '',
        description=description,
        metadata=metadata or {},
        ip_address=ip_address,
        user_agent=user_agent or '',
        request_path=request_path or '',
        request_method=request_method or '',
    )


def log_login(user, ip_address=None, user_agent=None):
    """Log user login"""
    if not user.tenant:
        return None
    
    return log_activity(
        tenant=user.tenant,
        user=user,
        action=ActivityLog.ACTION_LOGIN,
        module=ActivityLog.MODULE_AUTH,
        description=f"User {user.email} logged in",
        ip_address=ip_address,
        user_agent=user_agent,
        request_path='/api/v1/auth/login/',
        request_method='POST',
    )


def log_logout(user, ip_address=None, user_agent=None):
    """Log user logout"""
    if not user.tenant:
        return None
    
    return log_activity(
        tenant=user.tenant,
        user=user,
        action=ActivityLog.ACTION_LOGOUT,
        module=ActivityLog.MODULE_AUTH,
        description=f"User {user.email} logged out",
        ip_address=ip_address,
        user_agent=user_agent,
        request_path='/api/v1/auth/logout/',
        request_method='POST',
    )


def log_refund(user, sale, amount, ip_address=None):
    """Log refund action"""
    if not user.tenant:
        return None
    
    return log_activity(
        tenant=user.tenant,
        user=user,
        action=ActivityLog.ACTION_REFUND,
        module=ActivityLog.MODULE_SALES,
        description=f"Refunded {amount} for Sale #{sale.id}",
        resource_type='Sale',
        resource_id=str(sale.id),
        metadata={'amount': str(amount), 'sale_id': sale.id},
        ip_address=ip_address,
    )


def log_discount(user, sale, discount_amount, ip_address=None):
    """Log discount application"""
    if not user.tenant:
        return None
    
    return log_activity(
        tenant=user.tenant,
        user=user,
        action=ActivityLog.ACTION_DISCOUNT,
        module=ActivityLog.MODULE_SALES,
        description=f"Applied discount of {discount_amount} to Sale #{sale.id}",
        resource_type='Sale',
        resource_id=str(sale.id),
        metadata={'discount_amount': str(discount_amount), 'sale_id': sale.id},
        ip_address=ip_address,
    )


def log_cash_movement(user, movement, ip_address=None):
    """Log cash movement"""
    if not user.tenant:
        return None
    
    return log_activity(
        tenant=user.tenant,
        user=user,
        action=ActivityLog.ACTION_CASH_MOVEMENT,
        module=ActivityLog.MODULE_CASH,
        description=f"Cash movement: {movement.movement_type} - {movement.amount}",
        resource_type='CashMovement',
        resource_id=str(movement.id),
        metadata={
            'amount': str(movement.amount),
            'movement_type': movement.movement_type,
            'reason': movement.reason or '',
        },
        ip_address=ip_address,
    )


def log_inventory_adjustment(user, adjustment, ip_address=None):
    """Log inventory adjustment"""
    if not user.tenant:
        return None
    
    return log_activity(
        tenant=user.tenant,
        user=user,
        action=ActivityLog.ACTION_INVENTORY_ADJUSTMENT,
        module=ActivityLog.MODULE_INVENTORY,
        description=f"Inventory adjustment: {adjustment.adjustment_type} for {adjustment.product.name}",
        resource_type='StockAdjustment',
        resource_id=str(adjustment.id),
        metadata={
            'product_id': adjustment.product.id,
            'adjustment_type': adjustment.adjustment_type,
            'quantity': adjustment.quantity,
        },
        ip_address=ip_address,
    )


def log_shift_event(user, shift, action, ip_address=None):
    """Log shift open/close"""
    if not user.tenant:
        return None
    
    action_type = ActivityLog.ACTION_SHIFT_OPEN if action == 'open' else ActivityLog.ACTION_SHIFT_CLOSE
    
    return log_activity(
        tenant=user.tenant,
        user=user,
        action=action_type,
        module=ActivityLog.MODULE_SHIFTS,
        description=f"Shift {action}: Shift #{shift.id}",
        resource_type='Shift',
        resource_id=str(shift.id),
        metadata={'shift_id': shift.id, 'opening_cash': str(shift.opening_cash) if hasattr(shift, 'opening_cash') else ''},
        ip_address=ip_address,
    )


def log_settings_change(user, setting_name, old_value, new_value, ip_address=None):
    """Log settings change"""
    if not user.tenant:
        return None
    
    return log_activity(
        tenant=user.tenant,
        user=user,
        action=ActivityLog.ACTION_SETTINGS_CHANGE,
        module=ActivityLog.MODULE_SETTINGS,
        description=f"Changed setting '{setting_name}'",
        resource_type='Setting',
        metadata={
            'setting_name': setting_name,
            'old_value': str(old_value),
            'new_value': str(new_value),
        },
        ip_address=ip_address,
    )

