from rest_framework import serializers
from .models import ExecutionMilestone, ContractAmendment, ReceptionProcess, PaymentSituation

class ExecutionMilestoneSerializer(serializers.ModelSerializer):
    contract_number = serializers.ReadOnlyField(source='contract.contract_number')

    class Meta:
        model = ExecutionMilestone
        fields = '__all__'

class ContractAmendmentSerializer(serializers.ModelSerializer):
    contract_number = serializers.ReadOnlyField(source='contract.contract_number')

    class Meta:
        model = ContractAmendment
        fields = '__all__'

class ReceptionProcessSerializer(serializers.ModelSerializer):
    contract_number = serializers.ReadOnlyField(source='contract.contract_number')

    class Meta:
        model = ReceptionProcess
        fields = '__all__'

class PaymentSituationSerializer(serializers.ModelSerializer):
    contract_number = serializers.ReadOnlyField(source='contract.contract_number')

    class Meta:
        model = PaymentSituation
        fields = '__all__'
