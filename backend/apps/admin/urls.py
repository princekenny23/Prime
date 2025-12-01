from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminTenantViewSet, platform_analytics

router = DefaultRouter()
router.register(r'admin/tenants', AdminTenantViewSet, basename='admin-tenant')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/analytics/', platform_analytics, name='platform-analytics'),
]

