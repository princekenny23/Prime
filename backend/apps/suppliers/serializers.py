from rest_framework import serializers
from .models import (
    Supplier, PurchaseOrder, PurchaseOrderItem, SupplierInvoice,
    PurchaseReturn, PurchaseReturnItem, ProductSupplier, AutoPurchaseOrderSettings,
    AutoPOAuditLog
)
from apps.outlets.serializers import OutletSerializer
from apps.products.serializers import ProductSerializer, ItemVariationSerializer


class SupplierSerializer(serializers.ModelSerializer):
    """Supplier serializer"""
    outlet = OutletSerializer(read_only=True)
    outlet_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Supplier
        fields = (
            'id', 'tenant', 'outlet', 'outlet_id', 'name', 'contact_name',
            'email', 'phone', 'address', 'city', 'state', 'zip_code', 'country', 'tax_id',
            'payment_terms', 'notes', 'is_active', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at')
    
    def validate_outlet_id(self, value):
        """Validate that outlet belongs to tenant"""
        # Convert empty string to None
        if value == '' or value is None:
            return None
        
        request = self.context.get('request')
        if request:
            tenant = getattr(request, 'tenant', None) or request.user.tenant
            if tenant:
                from apps.outlets.models import Outlet
                try:
                    # Convert to int if it's a string
                    outlet_id = int(value) if isinstance(value, str) else value
                    outlet = Outlet.objects.get(id=outlet_id, tenant=tenant)
                    return outlet_id
                except Outlet.DoesNotExist:
                    raise serializers.ValidationError("Outlet does not belong to your tenant")
                except (ValueError, TypeError):
                    raise serializers.ValidationError("Invalid outlet ID format")
        return None
    
    def create(self, validated_data):
        """Override create to handle outlet_id properly"""
        outlet_id = validated_data.pop('outlet_id', None)
        outlet = None
        if outlet_id:
            from apps.outlets.models import Outlet
            outlet = Outlet.objects.get(id=outlet_id)
        
        supplier = Supplier.objects.create(**validated_data, outlet=outlet)
        return supplier
    
    def update(self, instance, validated_data):
        """Override update to handle outlet_id properly"""
        outlet_id = validated_data.pop('outlet_id', None)
        if outlet_id is not None:
            if outlet_id:
                from apps.outlets.models import Outlet
                instance.outlet = Outlet.objects.get(id=outlet_id)
            else:
                instance.outlet = None
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    """Purchase Order Item serializer with variation and supplier support"""
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    variation = ItemVariationSerializer(read_only=True)
    variation_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    supplier = SupplierSerializer(read_only=True)
    supplier_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = PurchaseOrderItem
        fields = (
            'id', 'purchase_order', 'product', 'product_id', 'variation', 'variation_id',
            'supplier', 'supplier_id', 'quantity', 'unit_price', 'total', 'received_quantity',
            'supplier_status', 'notes', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'purchase_order', 'total', 'supplier_status', 'created_at', 'updated_at')


class PurchaseOrderSerializer(serializers.ModelSerializer):
    """Purchase Order serializer"""
    supplier = SupplierSerializer(read_only=True)
    supplier_id = serializers.IntegerField(write_only=True)
    outlet = OutletSerializer(read_only=True)
    outlet_id = serializers.IntegerField(write_only=True)
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    items_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text="List of items: [{'product_id': 1, 'quantity': 10, 'unit_price': '5.00'}]"
    )
    created_by = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = (
            'id', 'tenant', 'supplier', 'supplier_id', 'outlet', 'outlet_id',
            'po_number', 'order_date', 'expected_delivery_date', 'status',
            'subtotal', 'tax', 'discount', 'total', 'notes', 'terms',
            'created_by', 'items', 'items_data', 'created_at', 'updated_at',
            'approved_at', 'received_at'
        )
        read_only_fields = ('id', 'tenant', 'po_number', 'subtotal', 'total', 'created_by', 'created_at', 'updated_at', 'approved_at', 'received_at')
    
    def validate_items_data(self, value):
        """Validate items data"""
        if not value:
            raise serializers.ValidationError("At least one item is required")
        for item in value:
            if 'product_id' not in item or 'quantity' not in item or 'unit_price' not in item:
                raise serializers.ValidationError("Each item must have product_id, quantity, and unit_price")
        return value
    
    def create(self, validated_data):
        """Create purchase order with items - supports supplier-optional POs"""
        items_data = validated_data.pop('items_data', [])
        supplier_id = validated_data.pop('supplier_id', None)
        outlet_id = validated_data.pop('outlet_id')
        
        from apps.outlets.models import Outlet
        outlet = Outlet.objects.get(id=outlet_id)
        supplier = None
        if supplier_id:
            supplier = Supplier.objects.get(id=supplier_id)
        
        # Generate PO number
        from django.utils import timezone
        from datetime import date
        today = date.today()
        po_count = PurchaseOrder.objects.filter(tenant=validated_data['tenant'], order_date__year=today.year).count() + 1
        po_number = f"PO-{today.strftime('%Y%m%d')}-{po_count:04d}"
        
        # Determine initial status based on supplier
        initial_status = validated_data.get('status', 'pending_supplier' if supplier is None else 'draft')
        
        purchase_order = PurchaseOrder.objects.create(
            **validated_data,
            supplier=supplier,
            outlet=outlet,
            po_number=po_number,
            status=initial_status,
            created_by=self.context['request'].user
        )
        
        # Create items
        for item_data in items_data:
            from apps.products.models import Product
            product = Product.objects.get(id=item_data['product_id'])
            item_supplier_id = item_data.get('supplier_id')
            item_supplier = None
            if item_supplier_id:
                item_supplier = Supplier.objects.get(id=item_supplier_id)
            
            PurchaseOrderItem.objects.create(
                purchase_order=purchase_order,
                product=product,
                supplier=item_supplier,
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                notes=item_data.get('notes', '')
            )
        
        purchase_order.calculate_totals()
        return purchase_order


class SupplierInvoiceSerializer(serializers.ModelSerializer):
    """Supplier Invoice serializer"""
    supplier = SupplierSerializer(read_only=True)
    supplier_id = serializers.IntegerField(write_only=True)
    purchase_order = PurchaseOrderSerializer(read_only=True)
    purchase_order_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    outlet = OutletSerializer(read_only=True)
    outlet_id = serializers.IntegerField(write_only=True)
    balance = serializers.ReadOnlyField()
    
    class Meta:
        model = SupplierInvoice
        fields = (
            'id', 'tenant', 'supplier', 'supplier_id', 'purchase_order', 'purchase_order_id',
            'outlet', 'outlet_id', 'invoice_number', 'supplier_invoice_number',
            'invoice_date', 'due_date', 'status', 'subtotal', 'tax', 'discount',
            'total', 'amount_paid', 'balance', 'notes', 'payment_terms',
            'created_at', 'updated_at', 'paid_at'
        )
        read_only_fields = ('id', 'tenant', 'invoice_number', 'status', 'balance', 'created_at', 'updated_at', 'paid_at')
    
    def create(self, validated_data):
        """Create supplier invoice"""
        supplier_id = validated_data.pop('supplier_id')
        outlet_id = validated_data.pop('outlet_id')
        purchase_order_id = validated_data.pop('purchase_order_id', None)
        
        from apps.outlets.models import Outlet
        outlet = Outlet.objects.get(id=outlet_id)
        supplier = Supplier.objects.get(id=supplier_id)
        purchase_order = None
        if purchase_order_id:
            purchase_order = PurchaseOrder.objects.get(id=purchase_order_id)
        
        # Generate invoice number
        from datetime import date
        today = date.today()
        inv_count = SupplierInvoice.objects.filter(tenant=validated_data['tenant'], invoice_date__year=today.year).count() + 1
        invoice_number = f"INV-{today.strftime('%Y%m%d')}-{inv_count:04d}"
        
        invoice = SupplierInvoice.objects.create(
            **validated_data,
            supplier=supplier,
            outlet=outlet,
            purchase_order=purchase_order,
            invoice_number=invoice_number
        )
        
        return invoice


class PurchaseReturnItemSerializer(serializers.ModelSerializer):
    """Purchase Return Item serializer"""
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    purchase_order_item_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = PurchaseReturnItem
        fields = (
            'id', 'purchase_return', 'product', 'product_id', 'purchase_order_item',
            'purchase_order_item_id', 'quantity', 'unit_price', 'total',
            'reason', 'notes', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'purchase_return', 'total', 'created_at', 'updated_at')


class PurchaseReturnSerializer(serializers.ModelSerializer):
    """Purchase Return serializer"""
    supplier = SupplierSerializer(read_only=True)
    supplier_id = serializers.IntegerField(write_only=True)
    purchase_order = PurchaseOrderSerializer(read_only=True)
    purchase_order_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    outlet = OutletSerializer(read_only=True)
    outlet_id = serializers.IntegerField(write_only=True)
    items = PurchaseReturnItemSerializer(many=True, read_only=True)
    items_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text="List of items: [{'product_id': 1, 'quantity': 5, 'unit_price': '5.00', 'reason': 'Defective'}]"
    )
    created_by = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = PurchaseReturn
        fields = (
            'id', 'tenant', 'supplier', 'supplier_id', 'purchase_order', 'purchase_order_id',
            'outlet', 'outlet_id', 'return_number', 'return_date', 'status',
            'reason', 'total', 'notes', 'items', 'items_data', 'created_by',
            'created_at', 'updated_at', 'returned_at'
        )
        read_only_fields = ('id', 'tenant', 'return_number', 'total', 'created_by', 'created_at', 'updated_at', 'returned_at')
    
    def validate_items_data(self, value):
        """Validate items data"""
        if not value:
            raise serializers.ValidationError("At least one item is required")
        for item in value:
            if 'product_id' not in item or 'quantity' not in item or 'unit_price' not in item:
                raise serializers.ValidationError("Each item must have product_id, quantity, and unit_price")
        return value
    
    def create(self, validated_data):
        """Create purchase return with items"""
        items_data = validated_data.pop('items_data', [])
        supplier_id = validated_data.pop('supplier_id')
        outlet_id = validated_data.pop('outlet_id')
        purchase_order_id = validated_data.pop('purchase_order_id', None)
        
        from apps.outlets.models import Outlet
        outlet = Outlet.objects.get(id=outlet_id)
        supplier = Supplier.objects.get(id=supplier_id)
        purchase_order = None
        if purchase_order_id:
            purchase_order = PurchaseOrder.objects.get(id=purchase_order_id)
        
        # Generate return number
        from datetime import date
        today = date.today()
        ret_count = PurchaseReturn.objects.filter(tenant=validated_data['tenant'], return_date__year=today.year).count() + 1
        return_number = f"RET-{today.strftime('%Y%m%d')}-{ret_count:04d}"
        
        purchase_return = PurchaseReturn.objects.create(
            **validated_data,
            supplier=supplier,
            outlet=outlet,
            purchase_order=purchase_order,
            return_number=return_number,
            created_by=self.context['request'].user
        )
        
        # Create items
        for item_data in items_data:
            from apps.products.models import Product
            product = Product.objects.get(id=item_data['product_id'])
            purchase_order_item = None
            if item_data.get('purchase_order_item_id'):
                purchase_order_item = PurchaseOrderItem.objects.get(id=item_data['purchase_order_item_id'])
            
            PurchaseReturnItem.objects.create(
                purchase_return=purchase_return,
                product=product,
                purchase_order_item=purchase_order_item,
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                reason=item_data.get('reason', ''),
                notes=item_data.get('notes', '')
            )
        
        purchase_return.calculate_total()
        return purchase_return


class ProductSupplierSerializer(serializers.ModelSerializer):
    """Product Supplier relationship serializer"""
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    supplier = SupplierSerializer(read_only=True)
    supplier_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = ProductSupplier
        fields = (
            'id', 'tenant', 'product', 'product_id', 'supplier', 'supplier_id',
            'reorder_quantity', 'reorder_point', 'unit_cost', 'is_preferred',
            'is_active', 'notes', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at')
    
    def create(self, validated_data):
        """Create product-supplier relationship"""
        product_id = validated_data.pop('product_id')
        supplier_id = validated_data.pop('supplier_id')
        
        from apps.products.models import Product
        product = Product.objects.get(id=product_id)
        supplier = Supplier.objects.get(id=supplier_id)
        
        product_supplier = ProductSupplier.objects.create(
            **validated_data,
            product=product,
            supplier=supplier
        )
        return product_supplier
    
    def update(self, instance, validated_data):
        """Update product-supplier relationship"""
        if 'product_id' in validated_data:
            from apps.products.models import Product
            instance.product = Product.objects.get(id=validated_data.pop('product_id'))
        if 'supplier_id' in validated_data:
            instance.supplier = Supplier.objects.get(id=validated_data.pop('supplier_id'))
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class AutoPurchaseOrderSettingsSerializer(serializers.ModelSerializer):
    """Auto Purchase Order Settings serializer"""
    tenant = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = AutoPurchaseOrderSettings
        fields = (
            'id', 'tenant', 'auto_po_enabled', 'default_reorder_quantity',
            'auto_approve_po', 'notify_on_auto_po', 'notification_emails',
            'minimum_order_value', 'group_by_supplier', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at')

