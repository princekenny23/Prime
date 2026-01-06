from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SupplierViewSet, PurchaseOrderViewSet,
    SupplierInvoiceViewSet, PurchaseReturnViewSet,
    ProductSupplierViewSet
)

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-order')
router.register(r'supplier-invoices', SupplierInvoiceViewSet, basename='supplier-invoice')
router.register(r'purchase-returns', PurchaseReturnViewSet, basename='purchase-return')
router.register(r'product-suppliers', ProductSupplierViewSet, basename='product-supplier')

urlpatterns = [
    path('', include(router.urls)),
]

