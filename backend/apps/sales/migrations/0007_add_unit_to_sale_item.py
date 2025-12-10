# Migration to add unit support to SaleItem
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('sales', '0006_add_variation_support'),
        ('products', '0013_add_product_unit'),
    ]

    operations = [
        migrations.AddField(
            model_name='saleitem',
            name='unit',
            field=models.ForeignKey(
                blank=True,
                help_text='Product unit used for this sale (e.g., piece, dozen, box)',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='sale_items',
                to='products.productunit'
            ),
        ),
        migrations.AddField(
            model_name='saleitem',
            name='unit_name',
            field=models.CharField(
                blank=True,
                help_text="Unit name snapshot (e.g., 'piece', 'dozen')",
                max_length=50
            ),
        ),
        migrations.AddField(
            model_name='saleitem',
            name='quantity_in_base_units',
            field=models.IntegerField(
                default=1,
                help_text='Quantity in base units (for inventory deduction)',
                validators=[django.core.validators.MinValueValidator(1)]
            ),
        ),
        migrations.AddIndex(
            model_name='saleitem',
            index=models.Index(fields=['unit'], name='sales_saleit_unit_idx'),
        ),
        # Data migration: Set quantity_in_base_units = quantity for existing records
        migrations.RunPython(
            code=lambda apps, schema_editor: apps.get_model('sales', 'SaleItem').objects.update(
                quantity_in_base_units=models.F('quantity')
            ),
            reverse_code=migrations.RunPython.noop,
        ),
    ]

