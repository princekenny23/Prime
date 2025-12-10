# Generated migration to initialize LocationStock from Product.stock

from django.db import migrations
from django.db.models import Q


def initialize_location_stock(apps, schema_editor):
    """Initialize LocationStock from Product.stock for default variations"""
    Product = apps.get_model('products', 'Product')
    ItemVariation = apps.get_model('products', 'ItemVariation')
    Outlet = apps.get_model('outlets', 'Outlet')
    LocationStock = apps.get_model('inventory', 'LocationStock')
    Tenant = apps.get_model('tenants', 'Tenant')
    
    # Get all products with variations
    products = Product.objects.all()
    stocks_created = 0
    
    for product in products:
        # Get default variation (first variation or create one if missing)
        variation = ItemVariation.objects.filter(product=product).first()
        if not variation:
            # Skip if no variation (shouldn't happen after 0008 migration)
            continue
        
        # Get all outlets for this tenant
        outlets = Outlet.objects.filter(tenant=product.tenant)
        
        if outlets.exists():
            # Distribute stock evenly across outlets, or put all in first outlet
            # For simplicity, we'll put all stock in the first outlet
            default_outlet = outlets.first()
            
            # Only create if stock > 0
            if product.stock > 0:
                LocationStock.objects.get_or_create(
                    tenant=product.tenant,
                    variation=variation,
                    outlet=default_outlet,
                    defaults={'quantity': product.stock}
                )
                stocks_created += 1
        else:
            # No outlets - create a placeholder (or skip)
            # For now, we'll skip - stock will be 0 until outlets are created
            pass
    
    print(f"Initialized {stocks_created} LocationStock entries from Product.stock")


def reverse_initialize_location_stock(apps, schema_editor):
    """Reverse migration - LocationStock will remain but can be cleaned up manually"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0008_create_default_variations'),
        ('inventory', '0002_add_location_stock_and_variation_support'),
        ('outlets', '0001_initial'),  # Adjust if different migration name
    ]

    operations = [
        migrations.RunPython(initialize_location_stock, reverse_initialize_location_stock),
    ]

