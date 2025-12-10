# Generated migration to rename price to retail_price

from django.db import migrations, models
import django.core.validators
from decimal import Decimal


def migrate_price_to_retail_price(apps, schema_editor):
    """Migrate existing price values to retail_price"""
    Product = apps.get_model('products', 'Product')
    
    # Copy price to retail_price for all products
    for product in Product.objects.all():
        if hasattr(product, 'price') and product.price:
            product.retail_price = product.price
            product.save(update_fields=['retail_price'])


def reverse_migrate(apps, schema_editor):
    """Reverse migration: copy retail_price back to price"""
    Product = apps.get_model('products', 'Product')
    
    for product in Product.objects.all():
        if hasattr(product, 'retail_price') and product.retail_price:
            product.price = product.retail_price
            product.save(update_fields=['price'])


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0004_add_wholesale_fields'),
    ]

    operations = [
        # Step 1: Add retail_price field (temporary, will be renamed from price)
        migrations.AddField(
            model_name='product',
            name='retail_price',
            field=models.DecimalField(
                decimal_places=2,
                max_digits=10,
                null=True,
                blank=True,
                validators=[django.core.validators.MinValueValidator(Decimal('0.01'))],
                help_text='Retail price'
            ),
        ),
        
        # Step 2: Migrate data from price to retail_price
        migrations.RunPython(migrate_price_to_retail_price, reverse_migrate),
        
        # Step 3: Remove old price field
        migrations.RemoveField(
            model_name='product',
            name='price',
        ),
        
        # Step 4: Make retail_price required (not null)
        migrations.AlterField(
            model_name='product',
            name='retail_price',
            field=models.DecimalField(
                decimal_places=2,
                max_digits=10,
                validators=[django.core.validators.MinValueValidator(Decimal('0.01'))],
                help_text='Retail price'
            ),
        ),
    ]
