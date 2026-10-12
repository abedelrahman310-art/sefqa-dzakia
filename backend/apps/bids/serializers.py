from rest_framework import serializers
from .models import BidOffer

class BidOfferSerializer(serializers.ModelSerializer):
    operator_name = serializers.ReadOnlyField(source='operator.company_name')
    deal_title = serializers.ReadOnlyField(source='deal.title')
    deal_reference = serializers.ReadOnlyField(source='deal.reference_number')

    class Meta:
        model = BidOffer
        fields = '__all__'
