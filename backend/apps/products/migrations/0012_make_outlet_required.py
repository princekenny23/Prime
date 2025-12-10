# Migration to make outlet field required (non-nullable)

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0011_assign_products_to_outlets'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='outlet',
            field=models.ForeignKey(
                help_text='Outlet this product belongs to',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='products',
                to='outlets.outlet',
                # null=False is implicit - field is now required
            ),
        ),
    ]

