from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, RegisterView, me_view, logout_view, create_user, update_user, delete_user

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/me/', me_view, name='me'),
    path('auth/users/create/', create_user, name='create_user'),
    path('auth/users/<int:user_id>/', update_user, name='update_user'),
    path('auth/users/<int:user_id>/delete/', delete_user, name='delete_user'),
]

