from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from .models import Tenant

User = get_user_model()


class TenantMiddleware(MiddlewareMixin):
    """
    Middleware to extract tenant from JWT token and set request.tenant
    SaaS admins bypass tenant filtering
    """
    def process_request(self, request):
        request.tenant = None
        
        # Skip for admin and static files
        if request.path.startswith('/admin/') or request.path.startswith('/static/'):
            return None

        # Get token from Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        
        try:
            # Decode token
            untyped_token = UntypedToken(token)
            user_id = untyped_token.get('user_id')
            
            if user_id:
                user = User.objects.select_related('tenant').get(id=user_id)
                
                # SaaS admins don't have tenant restrictions
                if user.is_saas_admin:
                    request.tenant = None
                    request.user = user
                elif user.tenant:
                    request.tenant = user.tenant
                    request.user = user
                    
        except (TokenError, InvalidToken, User.DoesNotExist):
            # Invalid token or user not found
            pass

        return None

