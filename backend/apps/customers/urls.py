from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, CreditPaymentViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'credit-payments', CreditPaymentViewSet, basename='credit-payment')

urlpatterns = [
    path('', include(router.urls)),
]

