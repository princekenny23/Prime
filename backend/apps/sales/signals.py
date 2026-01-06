"""
Django signals for automatic receipt generation
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Sale
from .services import ReceiptService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Sale)
def generate_receipt_on_sale_creation(sender, instance, created, **kwargs):
    """
    Automatically generate receipt when a sale is created
    This signal runs after the sale is saved, without modifying the sale creation process
    """
    if created:
        try:
            # Generate receipt automatically
            receipt = ReceiptService.generate_receipt(instance, format='html', user=instance.user)
            logger.info(f"Receipt {receipt.id} auto-generated for sale {instance.id}")
        except Exception as e:
            # Log error but don't fail sale creation
            logger.error(f"Failed to auto-generate receipt for sale {instance.id}: {str(e)}", exc_info=True)

