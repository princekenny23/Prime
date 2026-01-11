from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate, APITestCase
from apps.tenants.models import Tenant
from apps.outlets.models import Outlet
from apps.products.models import Product, ItemVariation
from apps.products.views import ProductViewSet
from apps.products.serializers import ItemVariationSerializer, ProductSerializer


class ProductLookupAndValidationTests(APITestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        User = get_user_model()
        # create a basic user
        self.user = User.objects.create_user(username='testuser', password='testpass')
        # create tenant and outlet
        self.tenant = Tenant.objects.create(name='TestTenant')
        self.outlet = Outlet.objects.create(name='Main Outlet', tenant=self.tenant)
        # assign tenant to user if attribute exists
        if hasattr(self.user, 'tenant'):
            setattr(self.user, 'tenant', self.tenant)
            self.user.save()

    def test_lookup_variation_exact_match(self):
        product = Product.objects.create(tenant=self.tenant, outlet=self.outlet, name='Prod A', retail_price=10)
        variation = ItemVariation.objects.create(product=product, name='Default', price=10, barcode='VAR123')

        request = self.factory.get('/api/v1/products/lookup/', {'barcode': 'VAR123', 'outlet': str(self.outlet.id)})
        force_authenticate(request, user=self.user)
        # attach tenant to request for middleware expectations
        setattr(request, 'tenant', self.tenant)

        view = ProductViewSet.as_view({'get': 'lookup'})
        response = view(request)

        self.assertEqual(response.status_code, 200)
        self.assertIn('variations', response.data)
        self.assertEqual(len(response.data['variations']), 1)
        self.assertEqual(response.data['variations'][0]['id'], variation.id)

    def test_lookup_product_exact_match(self):
        product = Product.objects.create(tenant=self.tenant, outlet=self.outlet, name='Prod B', retail_price=15, barcode='PRD456')

        request = self.factory.get('/api/v1/products/lookup/', {'barcode': 'PRD456', 'outlet': str(self.outlet.id)})
        force_authenticate(request, user=self.user)
        setattr(request, 'tenant', self.tenant)

        view = ProductViewSet.as_view({'get': 'lookup'})
        response = view(request)

        self.assertEqual(response.status_code, 200)
        self.assertIn('products', response.data)
        self.assertEqual(len(response.data['products']), 1)
        self.assertEqual(response.data['products'][0]['id'], product.id)

    def test_lookup_contains_fallback(self):
        product = Product.objects.create(tenant=self.tenant, outlet=self.outlet, name='Prod C', retail_price=20, barcode='LONG-ABC-000123')

        request = self.factory.get('/api/v1/products/lookup/', {'barcode': '000123', 'outlet': str(self.outlet.id)})
        force_authenticate(request, user=self.user)
        setattr(request, 'tenant', self.tenant)

        view = ProductViewSet.as_view({'get': 'lookup'})
        response = view(request)

        self.assertEqual(response.status_code, 200)
        # contains fallback should find the product
        self.assertIn('products', response.data)
        self.assertTrue(any(p['id'] == product.id for p in response.data['products']))

    def test_serializer_rejects_duplicate_barcode_between_product_and_variation(self):
        # Create existing product with barcode
        existing_product = Product.objects.create(tenant=self.tenant, outlet=self.outlet, name='Prod D', retail_price=25, barcode='DUP123')

        # Now attempt to create a new variation for another product that uses same barcode
        other_product = Product.objects.create(tenant=self.tenant, outlet=self.outlet, name='Prod E', retail_price=30)

        request = self.factory.post('/api/v1/products/', {})
        force_authenticate(request, user=self.user)
        setattr(request, 'tenant', self.tenant)

        # Validate variation serializer
        serializer = ItemVariationSerializer(data={'product': other_product.id, 'name': 'Var1', 'price': 5, 'barcode': 'DUP123'}, context={'request': request})
        is_valid = serializer.is_valid()
        self.assertFalse(is_valid)
        self.assertIn('barcode', serializer.errors)

    def test_serializer_rejects_duplicate_barcode_between_variation_and_product(self):
        # Create existing variation with barcode
        prod = Product.objects.create(tenant=self.tenant, outlet=self.outlet, name='Prod F', retail_price=35)
        existing_var = ItemVariation.objects.create(product=prod, name='V1', price=5, barcode='VUPC')

        request = self.factory.post('/api/v1/products/', {})
        force_authenticate(request, user=self.user)
        setattr(request, 'tenant', self.tenant)

        # Validate product serializer trying to use same barcode
        serializer = ProductSerializer(data={'name': 'Prod G', 'retail_price': 40, 'barcode': 'VUPC', 'outlet': self.outlet.id}, context={'request': request})
        is_valid = serializer.is_valid()
        self.assertFalse(is_valid)
        self.assertIn('barcode', serializer.errors)
