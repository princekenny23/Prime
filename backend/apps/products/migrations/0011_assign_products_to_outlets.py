# Data migration to assign existing products to outlets

from django.db import migrations


def assign_products_to_outlets(apps, schema_editor):
    """
    Assign all existing products to outlets.
    - If tenant has outlets, assign to first active outlet
    - If no outlets exist, create a default outlet
    """
    Product = apps.get_model('products', 'Product')
    Outlet = apps.get_model('outlets', 'Outlet')
    Tenant = apps.get_model('tenants', 'Tenant')
    
    # Get all products without outlet
    products_without_outlet = Product.objects.filter(outlet__isnull=True)
    
    print(f"\nFound {products_without_outlet.count()} products without outlet")
    
    if products_without_outlet.count() == 0:
        print("No products to assign. Skipping data migration.")
        return
    
    assigned_count = 0
    created_outlets_count = 0
    
    # Group products by tenant
    from collections import defaultdict
    products_by_tenant = defaultdict(list)
    
    for product in products_without_outlet:
        products_by_tenant[product.tenant_id].append(product)
    
    print(f"Processing {len(products_by_tenant)} tenants...")
    
    for tenant_id, products in products_by_tenant.items():
        try:
            tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            print(f"Warning: Tenant {tenant_id} not found, skipping products")
            continue
        
        # Get first active outlet for the tenant
        outlet = Outlet.objects.filter(tenant=tenant, is_active=True).first()
        
        if not outlet:
            # If no outlet exists, create a default one
            outlet = Outlet.objects.create(
                tenant=tenant,
                name=f"{tenant.name} - Main Outlet",
                is_active=True
            )
            created_outlets_count += 1
            print(f"Created default outlet '{outlet.name}' for tenant '{tenant.name}'")
        
        # Assign all products for this tenant to the outlet
        for product in products:
            product.outlet = outlet
            product.save()
            assigned_count += 1
        
        print(f"Assigned {len(products)} products to outlet '{outlet.name}' (tenant: {tenant.name})")
    
    print(f"\n✅ Migration complete:")
    print(f"   - Assigned {assigned_count} products to outlets")
    print(f"   - Created {created_outlets_count} default outlets")


def reverse_assign_products_to_outlets(apps, schema_editor):
    """Reverse migration - set outlet to null"""
    Product = apps.get_model('products', 'Product')
    Product.objects.all().update(outlet=None)
    print("Reversed: Set all product outlets to NULL")


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0010_add_outlet_to_product'),
        ('outlets', '0001_initial'),
        ('tenants', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(assign_products_to_outlets, reverse_assign_products_to_outlets),
    ]

