"""
Custom JWT Authentication that ensures tenant is loaded
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth import get_user_model

User = get_user_model()


class TenantJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that ensures user.tenant is loaded
    This ensures TenantFilterMixin can access request.user.tenant
    """
    
    def get_user(self, validated_token):
        """
        Override to ensure tenant relationship is loaded
        """
        user = super().get_user(validated_token)
        # Reload user with tenant relationship if not already loaded
        if user and not hasattr(user, '_tenant_loaded'):
            user = User.objects.select_related('tenant').get(pk=user.pk)
            user._tenant_loaded = True
        return user

