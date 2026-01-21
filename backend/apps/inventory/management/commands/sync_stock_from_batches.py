"""
Management command to sync LocationStock.quantity from actual batch quantities
This fixes discrepancies between LocationStock and Batch tables
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from apps.inventory.models import LocationStock, Batch
from apps.products.models import Product


class Command(BaseCommand):
    help = 'Synchronize LocationStock quantities from batch data (fixes stock discrepancies)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without making actual changes',
        )
        parser.add_argument(
            '--tenant',
            type=int,
            help='Sync only for specific tenant ID',
        )
        parser.add_argument(
            '--outlet',
            type=int,
            help='Sync only for specific outlet ID',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        tenant_id = options.get('tenant')
        outlet_id = options.get('outlet')

        self.stdout.write(self.style.WARNING(
            '\n=== Stock Synchronization Command ===\n'
        ))

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made\n'))

        # Build query
        location_stocks = LocationStock.objects.select_related('variation', 'outlet', 'tenant')
        
        if tenant_id:
            location_stocks = location_stocks.filter(tenant_id=tenant_id)
            self.stdout.write(f'Filtering by tenant ID: {tenant_id}')
        
        if outlet_id:
            location_stocks = location_stocks.filter(outlet_id=outlet_id)
            self.stdout.write(f'Filtering by outlet ID: {outlet_id}')

        total_count = location_stocks.count()
        self.stdout.write(f'\nFound {total_count} LocationStock records to check\n')

        updated_count = 0
        discrepancy_count = 0
        error_count = 0

        # Process each LocationStock
        for location_stock in location_stocks:
            try:
                old_quantity = location_stock.quantity
                
                # Calculate actual quantity from non-expired batches
                today = timezone.now().date()
                batches = Batch.objects.filter(
                    variation=location_stock.variation,
                    outlet=location_stock.outlet,
                    expiry_date__gt=today,
                    quantity__gt=0
                )
                actual_quantity = sum(batch.quantity for batch in batches)

                if old_quantity != actual_quantity:
                    discrepancy_count += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f'[DISCREPANCY] {location_stock.variation.product.name} '
                            f'({location_stock.variation.name}) @ {location_stock.outlet.name}: '
                            f'LocationStock={old_quantity}, Batches={actual_quantity}, '
                            f'Difference={actual_quantity - old_quantity}'
                        )
                    )

                    if not dry_run:
                        with transaction.atomic():
                            location_stock.quantity = actual_quantity
                            location_stock.save(update_fields=['quantity', 'updated_at'])
                            updated_count += 1
                            
                            # Also update Product.stock for the first variation
                            if location_stock.variation == location_stock.variation.product.default_variation:
                                product = location_stock.variation.product
                                product_total = product.get_total_stock(location_stock.outlet)
                                if product.stock != product_total:
                                    product.stock = product_total
                                    product.save(update_fields=['stock', 'updated_at'])
                                    self.stdout.write(
                                        f'  → Updated Product.stock: {product.stock}'
                                    )
                else:
                    # Quantity is already correct
                    pass

            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(
                        f'[ERROR] Failed to process {location_stock}: {str(e)}'
                    )
                )

        # Summary
        self.stdout.write(self.style.SUCCESS(
            f'\n=== Synchronization Complete ===\n'
            f'Total records checked: {total_count}\n'
            f'Discrepancies found: {discrepancy_count}\n'
        ))

        if dry_run:
            self.stdout.write(self.style.WARNING(
                f'Records that would be updated: {discrepancy_count}\n'
                f'Run without --dry-run to apply changes'
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'Records updated: {updated_count}\n'
                f'Errors: {error_count}'
            ))

        if error_count > 0:
            self.stdout.write(self.style.ERROR(
                f'\n⚠️  {error_count} errors occurred during synchronization'
            ))
            return

        if discrepancy_count == 0:
            self.stdout.write(self.style.SUCCESS(
                '\n✓ All stock quantities are already in sync!'
            ))
        elif not dry_run:
            self.stdout.write(self.style.SUCCESS(
                '\n✓ Stock synchronization completed successfully!'
            ))
