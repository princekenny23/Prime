# Generated migration to create default variations for existing products

from django.db import migrations


def create_default_variations(apps, schema_editor):
    """Create default variation for all existing products"""
    Product = apps.get_model('products', 'Product')
    ItemVariation = apps.get_model('products', 'ItemVariation')
    
    products = Product.objects.all()
    variations_created = 0
    
    for product in products:
        # Check if product already has variations
        if ItemVariation.objects.filter(product=product).exists():
            continue
        
        # Create default variation with product's existing data
        ItemVariation.objects.create(
            product=product,
            name='Default',  # Default variation name
            price=product.retail_price,
            cost=product.cost,
            sku=product.sku if product.sku else '',
            barcode=product.barcode if product.barcode else '',
            track_inventory=True,  # Default to tracking inventory
            unit=product.unit,
            low_stock_threshold=product.low_stock_threshold,
            is_active=product.is_active,
            sort_order=0
        )
        variations_created += 1
    
    print(f"Created {variations_created} default variations for existing products")


def reverse_create_default_variations(apps, schema_editor):
    """Reverse migration - remove default variations"""
    ItemVariation = apps.get_model('products', 'ItemVariation')
    # Remove all variations named 'Default' (or we could remove all)
    # For safety, we'll just leave them - they don't break anything
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0007_add_item_variation_model'),
    ]

    operations = [
        migrations.RunPython(create_default_variations, reverse_create_default_variations),
    ]

