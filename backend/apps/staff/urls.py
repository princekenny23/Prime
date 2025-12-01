from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoleViewSet, StaffViewSet, AttendanceViewSet

router = DefaultRouter()
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'staff', StaffViewSet, basename='staff')
router.register(r'attendance', AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('', include(router.urls)),
]

