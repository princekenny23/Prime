from rest_framework import serializers
from .models import Shift
from apps.outlets.serializers import OutletSerializer, TillSerializer


class ShiftSerializer(serializers.ModelSerializer):
    """Shift serializer"""
    outlet = OutletSerializer(read_only=True)
    till = TillSerializer(read_only=True)
    outlet_id = serializers.IntegerField(write_only=True)
    till_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Shift
        fields = ('id', 'outlet', 'outlet_id', 'till', 'till_id', 'user', 'operating_date',
                  'opening_cash_balance', 'floating_cash', 'closing_cash_balance',
                  'status', 'notes', 'start_time', 'end_time')
        read_only_fields = ('id', 'outlet', 'till', 'user', 'status', 'start_time', 'end_time')

