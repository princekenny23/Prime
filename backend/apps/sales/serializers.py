from rest_framework import serializers
from .models import Sale, SaleItem
from apps.products.serializers import ProductSerializer


class SaleItemSerializer(serializers.ModelSerializer):
    """Sale item serializer"""
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = SaleItem
        fields = ('id', 'product', 'product_id', 'product_name', 'quantity', 'price', 'total', 'created_at')
        read_only_fields = ('id', 'product', 'created_at')


class SaleSerializer(serializers.ModelSerializer):
    """Sale serializer"""
    items = SaleItemSerializer(many=True, read_only=True)
    items_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=True
    )
    
    class Meta:
        model = Sale
        fields = (
            'id', 'tenant', 'outlet', 'user', 'shift', 'customer', 'receipt_number',
            'subtotal', 'tax', 'discount', 'total', 'payment_method', 'status',
            'due_date', 'amount_paid', 'payment_status',
            'notes', 'items', 'items_data', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'receipt_number', 'due_date', 'amount_paid', 'payment_status', 'created_at', 'updated_at')
    
    def validate_items_data(self, value):
        """Validate sale items"""
        if not value or len(value) == 0:
            raise serializers.ValidationError("Sale must have at least one item")
        return value

