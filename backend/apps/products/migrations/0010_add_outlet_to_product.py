# Generated migration to add outlet field to Product model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0009_fix_sku_nullable_and_constraint'),
        ('outlets', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='outlet',
            field=models.ForeignKey(
                help_text='Outlet this product belongs to',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='products',
                to='outlets.outlet',
                null=True,  # Allow null temporarily for existing products
            ),
        ),
        # Create index for outlet
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['outlet'], name='products_pr_outlet_idx'),
        ),
        # Create composite index for tenant and outlet
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['tenant', 'outlet'], name='products_pr_tenant_outlet_idx'),
        ),
        # Make outlet required after data migration (if needed)
        # Note: You may want to create a data migration to assign existing products to a default outlet
        # For now, we'll make it nullable=False in a separate migration after data is migrated
    ]

