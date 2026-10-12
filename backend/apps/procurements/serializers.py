from rest_framework import serializers
from .models import ProcurementDeal, CahierSpecs

class CahierSpecsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CahierSpecs
        fields = '__all__'

class ProcurementDealSerializer(serializers.ModelSerializer):
    authority_name = serializers.ReadOnlyField(source='authority.full_name')
    authority_entity = serializers.ReadOnlyField(source='authority.entity_name')
    cahier_specs = CahierSpecsSerializer(read_only=True)
    stage_display = serializers.CharField(source='get_current_stage_display', read_only=True)

    class Meta:
        model = ProcurementDeal
        fields = '__all__'
        read_only_fields = ['authority']

