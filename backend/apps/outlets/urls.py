from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OutletViewSet, TillViewSet, PrinterViewSet

router = DefaultRouter()
router.register(r'outlets', OutletViewSet, basename='outlet')
router.register(r'tills', TillViewSet, basename='till')
router.register(r'printers', PrinterViewSet, basename='printer')

urlpatterns = [
    path('', include(router.urls)),
]

