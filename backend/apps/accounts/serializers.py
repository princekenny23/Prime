from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """User serializer"""
    tenant = serializers.SerializerMethodField()
    
    def get_tenant(self, obj):
        """Get tenant info without circular import"""
        if not obj.tenant:
            return None
        # Import here to avoid circular dependency
        from apps.tenants.serializers import TenantSerializer
        return TenantSerializer(obj.tenant).data
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'name', 'phone', 'tenant', 'role', 'is_saas_admin', 'is_active', 'date_joined')
        read_only_fields = ('id', 'date_joined')


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer that includes user info"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['email'] = user.email
        token['role'] = user.role
        token['is_saas_admin'] = user.is_saas_admin
        if user.tenant:
            token['tenant_id'] = user.tenant.id
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        # Add user data to response
        data['user'] = UserSerializer(self.user).data
        return data


class RegisterSerializer(serializers.ModelSerializer):
    """Registration serializer"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ('email', 'username', 'name', 'password', 'password_confirm', 'phone', 'role')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user

