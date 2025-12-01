from rest_framework import serializers
from .models import Customer, LoyaltyTransaction, CreditPayment


class LoyaltyTransactionSerializer(serializers.ModelSerializer):
    """Loyalty transaction serializer"""
    
    class Meta:
        model = LoyaltyTransaction
        fields = ('id', 'customer', 'transaction_type', 'points', 'reason', 'created_at')
        read_only_fields = ('id', 'created_at')


class CreditPaymentSerializer(serializers.ModelSerializer):
    """Credit payment serializer"""
    sale_receipt_number = serializers.CharField(source='sale.receipt_number', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = CreditPayment
        fields = (
            'id', 'tenant', 'customer', 'sale', 'sale_receipt_number',
            'amount', 'payment_method', 'payment_date', 'reference_number',
            'notes', 'user', 'user_name', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'tenant', 'payment_date', 'created_at', 'updated_at')


class CustomerSerializer(serializers.ModelSerializer):
    """Customer serializer"""
    loyalty_transactions = LoyaltyTransactionSerializer(many=True, read_only=True)
    outstanding_balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    available_credit = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Customer
        fields = (
            'id', 'tenant', 'outlet', 'name', 'email', 'phone', 'address',
            'loyalty_points', 'total_spent', 'last_visit', 'is_active',
            'credit_enabled', 'credit_limit', 'payment_terms_days', 'credit_status', 'credit_notes',
            'outstanding_balance', 'available_credit',
            'loyalty_transactions', 'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'loyalty_points', 'total_spent', 'last_visit',
            'outstanding_balance', 'available_credit',
            'created_at', 'updated_at'
        )

