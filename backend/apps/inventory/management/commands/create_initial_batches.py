"""
Management command to create initial batches from existing LocationStock quantities
Run this ONCE to migrate from old stock system to new batch-based system
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from apps.inventory.models import LocationStock, Batch, StockMovement
from apps.products.models import Product


class Command(BaseCommand):
    help = 'Create initial batches from existing LocationStock quantities (one-time migration)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without making actual changes',
        )
        parser.add_argument(
            '--tenant',
            type=int,
            help='Migrate only for specific tenant ID',
        )
        parser.add_argument(
            '--outlet',
            type=int,
            help='Migrate only for specific outlet ID',
        )
        parser.add_argument(
            '--expiry-days',
            type=int,
            default=365,
            help='Default expiry days for initial batches (default: 365)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        tenant_id = options.get('tenant')
        outlet_id = options.get('outlet')
        expiry_days = options['expiry_days']

        self.stdout.write(self.style.WARNING(
            '\n=== Initial Batch Creation from LocationStock ===\n'
        ))

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made\n'))

        # Build query
        location_stocks = LocationStock.objects.select_related(
            'variation__product', 'outlet', 'tenant'
        ).filter(quantity__gt=0)
        
        if tenant_id:
            location_stocks = location_stocks.filter(tenant_id=tenant_id)
            self.stdout.write(f'Filtering by tenant ID: {tenant_id}')
        
        if outlet_id:
            location_stocks = location_stocks.filter(outlet_id=outlet_id)
            self.stdout.write(f'Filtering by outlet ID: {outlet_id}')

        total_count = location_stocks.count()
        self.stdout.write(f'\nFound {total_count} LocationStock records with quantity > 0\n')

        created_count = 0
        skipped_count = 0
        error_count = 0

        today = timezone.now().date()
        expiry_date = today + timedelta(days=expiry_days)

        # Process each LocationStock
        for location_stock in location_stocks:
            try:
                # Check if batches already exist for this variation/outlet
                existing_batches = Batch.objects.filter(
                    variation=location_stock.variation,
                    outlet=location_stock.outlet,
                    quantity__gt=0
                )

                if existing_batches.exists():
                    skipped_count += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f'[SKIP] {location_stock.variation.product.name} '
                            f'({location_stock.variation.name}) @ {location_stock.outlet.name}: '
                            f'Batches already exist'
                        )
                    )
                    continue

                # Create initial batch
                batch_number = f'INIT-{location_stock.variation.id}-{today.strftime("%Y%m%d")}'
                
                self.stdout.write(
                    f'[CREATE] {location_stock.variation.product.name} '
                    f'({location_stock.variation.name}) @ {location_stock.outlet.name}: '
                    f'Quantity={location_stock.quantity}, Batch={batch_number}, '
                    f'Expiry={expiry_date}'
                )

                if not dry_run:
                    with transaction.atomic():
                        # Create batch
                        batch = Batch.objects.create(
                            tenant=location_stock.tenant,
                            variation=location_stock.variation,
                            outlet=location_stock.outlet,
                            batch_number=batch_number,
                            quantity=location_stock.quantity,
                            expiry_date=expiry_date,
                            cost_price=location_stock.variation.cost
                        )

                        # Create stock movement for audit trail
                        StockMovement.objects.create(
                            tenant=location_stock.tenant,
                            batch=batch,
                            variation=location_stock.variation,
                            # product will be auto-set from variation in model save()
                            outlet=location_stock.outlet,
                            user=None,  # System migration
                            movement_type='adjustment',
                            quantity=location_stock.quantity,
                            reason=f'Initial batch migration from LocationStock'
                        )

                        created_count += 1

            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(
                        f'[ERROR] Failed to process {location_stock}: {str(e)}'
                    )
                )

        # Summary
        self.stdout.write(self.style.SUCCESS(
            f'\n=== Migration Complete ===\n'
            f'Total records processed: {total_count}\n'
            f'Batches created: {created_count if not dry_run else "N/A (dry run)"}\n'
            f'Skipped (batches exist): {skipped_count}\n'
            f'Errors: {error_count}\n'
        ))

        if dry_run:
            self.stdout.write(self.style.WARNING(
                f'\nBatches that would be created: {total_count - skipped_count}\n'
                f'Run without --dry-run to create batches'
            ))
        else:
            if created_count > 0:
                self.stdout.write(self.style.SUCCESS(
                    f'\n✓ Created {created_count} initial batches!'
                ))
                self.stdout.write(self.style.WARNING(
                    f'\nNEXT STEP: Run "python manage.py sync_stock_from_batches" '
                    f'to verify LocationStock is in sync with batches'
                ))

        if error_count > 0:
            self.stdout.write(self.style.ERROR(
                f'\n⚠️  {error_count} errors occurred during migration'
            ))
