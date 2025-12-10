from rest_framework import serializers
from .models import Table, KitchenOrderTicket


class TableSerializer(serializers.ModelSerializer):
    """Table serializer"""
    outlet = serializers.SerializerMethodField(read_only=True)
    outlet_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Table
        fields = ('id', 'number', 'capacity', 'status', 'location', 'notes', 
                  'is_active', 'outlet', 'outlet_id', 'created_at', 'updated_at')
        read_only_fields = ('id', 'outlet', 'created_at', 'updated_at')
    
    def get_outlet(self, obj):
        """Return outlet details as nested object"""
        if obj.outlet:
            return {
                'id': str(obj.outlet.id),
                'name': obj.outlet.name,
            }
        return None
    
    def validate_outlet_id(self, value):
        """Validate that outlet belongs to tenant"""
        if value is None:
            return None
        
        request = self.context.get('request')
        if request:
            tenant = getattr(request, 'tenant', None) or request.user.tenant
            if tenant:
                from apps.outlets.models import Outlet
                try:
                    outlet = Outlet.objects.get(id=value, tenant=tenant)
                    return value
                except Outlet.DoesNotExist:
                    raise serializers.ValidationError("Outlet does not belong to your tenant")
        return value


class KitchenOrderTicketSerializer(serializers.ModelSerializer):
    """Kitchen Order Ticket serializer"""
    table = serializers.SerializerMethodField(read_only=True)
    table_id = serializers.IntegerField(write_only=True, required=False)
    sale = serializers.SerializerMethodField(read_only=True)
    sale_id = serializers.IntegerField(write_only=True, required=True)
    items = serializers.SerializerMethodField()
    
    class Meta:
        model = KitchenOrderTicket
        fields = ('id', 'kot_number', 'status', 'priority', 'table', 'table_id', 
                  'sale', 'sale_id', 'items', 'sent_to_kitchen_at', 'started_at', 
                  'ready_at', 'served_at', 'notes', 'created_at', 'updated_at')
        read_only_fields = ('id', 'kot_number', 'sent_to_kitchen_at', 'started_at', 
                           'ready_at', 'served_at', 'created_at', 'updated_at')
    
    def get_table(self, obj):
        """Return table details"""
        if obj.table:
            return {
                'id': str(obj.table.id),
                'number': obj.table.number,
            }
        return None
    
    def get_sale(self, obj):
        """Return sale details"""
        if obj.sale:
            return {
                'id': str(obj.sale.id),
                'receipt_number': obj.sale.receipt_number,
                'total': str(obj.sale.total),
            }
        return None
    
    def get_items(self, obj):
        """Return sale items with kitchen status"""
        if obj.sale:
            return [
                {
                    'id': str(item.id),
                    'product_name': item.product_name,
                    'quantity': item.quantity,
                    'kitchen_status': item.kitchen_status,
                    'notes': item.notes,
                }
                for item in obj.sale.items.all()
            ]
        return []

