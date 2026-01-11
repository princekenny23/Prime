"""
Django signals for automatic receipt generation
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction
from .models import Sale
from .services import ReceiptService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Sale)
def generate_receipt_on_sale_creation(sender, instance, created, **kwargs):
    """
    Automatically generate receipt when a sale is created.

    Important: defer expensive/DB-reads receipt generation until after the surrounding
    database transaction commits. Calling serializers or other DB operations inside
    the save transaction can hit "current transaction is aborted" errors if earlier
    parts of the transaction fail. Using `transaction.on_commit` ensures the callback
    runs only after a successful commit in a clean DB context.
    """
    if not created:
        return

    # Use on_commit and re-fetch the Sale instance to run receipt generation
    def _generate():
        try:
            # Re-fetch sale outside the original transaction to ensure a clean DB state
            sale = Sale.objects.select_related('tenant', 'user', 'outlet').get(pk=instance.pk)

            # Generate canonical HTML receipt (used for previews and archives)
            html_receipt = ReceiptService.generate_receipt(sale, format='html', user=sale.user)
            logger.info(f"HTML receipt {html_receipt.id} auto-generated for sale {sale.id}")

            # Generate ESC/POS receipt (base64) for printing; ensure backend owns the
            # conversion and stores payload so frontends can fetch it and print raw.
            try:
                esc_receipt = ReceiptService.generate_receipt(sale, format='escpos', user=sale.user)
                logger.info(f"ESC/POS receipt {esc_receipt.id} auto-generated for sale {sale.id}")
            except Exception as esc_e:
                logger.error(f"Failed to auto-generate ESC/POS for sale {sale.id}: {str(esc_e)}", exc_info=True)

        except Exception as e:
            # Log the error. We must not raise here as this is running post-commit.
            logger.error(f"Failed to auto-generate receipt for sale {instance.id}: {str(e)}", exc_info=True)

    transaction.on_commit(_generate)

