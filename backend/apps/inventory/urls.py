from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StockMovementViewSet, StockTakeViewSet, StockTakeItemViewSet, LocationStockViewSet, BatchViewSet, adjust, transfer, receive

router = DefaultRouter()
router.register(r'inventory/movements', StockMovementViewSet, basename='stockmovement')
router.register(r'inventory/stock-take', StockTakeViewSet, basename='stocktake')
router.register(
    r'inventory/stock-take/(?P<stock_take_pk>[^/.]+)/items',
    StockTakeItemViewSet,
    basename='stocktakeitem'
)
router.register(r'inventory/location-stock', LocationStockViewSet, basename='locationstock')
router.register(r'inventory/batches', BatchViewSet, basename='batch')

urlpatterns = [
    path('', include(router.urls)),
    path('inventory/adjust/', adjust, name='stock-adjust'),
    path('inventory/transfer/', transfer, name='stock-transfer'),
    path('inventory/receive/', receive, name='stock-receive'),
]
