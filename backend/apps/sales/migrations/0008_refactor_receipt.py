# Generated migration to support receipt versioning and immutability
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('sales', '0007_add_unit_to_sale_item'),
    ]

    operations = [
        # Change receipt_number to non-unique so a sale can have historical receipts
        migrations.AlterField(
            model_name='receipt',
            name='receipt_number',
            field=models.CharField(max_length=50, db_index=True, help_text='Receipt number for quick lookup'),
        ),
        # Change OneToOne -> ForeignKey to allow multiple receipts per sale (versioning)
        migrations.AlterField(
            model_name='receipt',
            name='sale',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='receipts', to='sales.sale'),
        ),
        # Add versioning/immutability fields
        migrations.AddField(
            model_name='receipt',
            name='is_current',
            field=models.BooleanField(default=True, help_text='Whether this is the current receipt for the sale/format'),
        ),
        migrations.AddField(
            model_name='receipt',
            name='voided',
            field=models.BooleanField(default=False, help_text='Whether this receipt has been voided/superseded'),
        ),
        migrations.AddField(
            model_name='receipt',
            name='superseded_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='supersedes', to='sales.receipt'),
        ),
    ]
