from rest_framework import serializers
from .models import AwardDecision, Contract

class AwardDecisionSerializer(serializers.ModelSerializer):
    deal_title = serializers.ReadOnlyField(source='deal.title')
    deal_reference = serializers.ReadOnlyField(source='deal.reference_number')
    operator_name = serializers.ReadOnlyField(source='awarded_bid.operator.company_name')

    class Meta:
        model = AwardDecision
        fields = '__all__'

class ContractSerializer(serializers.ModelSerializer):
    deal_title = serializers.ReadOnlyField(source='deal.title')
    deal_reference = serializers.ReadOnlyField(source='deal.reference_number')
    operator_name = serializers.ReadOnlyField(source='awarded_operator.company_name')

    class Meta:
        model = Contract
        fields = '__all__'
