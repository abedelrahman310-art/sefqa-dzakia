from rest_framework import serializers
from .models import BidOffer
from apps.procurements.serializers import OfferSerializer, OfferDocumentSerializer

class BidOfferSerializer(serializers.ModelSerializer):
    operator_name = serializers.ReadOnlyField(source='operator.company_name')
    deal_title = serializers.ReadOnlyField(source='deal.title')
    deal_reference = serializers.ReadOnlyField(source='deal.reference_number')

    class Meta:
        model = BidOffer
        fields = '__all__'
        read_only_fields = ['operator', 'submission_timestamp']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        # حجب المبلغ المالي عن المصلحة المتعاقدة قبل مرحلة فتح الأظرفة (المراحل 1، 2، 3)
        if user and getattr(user, 'role', None) == 'authority':
            deal = getattr(instance, 'deal', None)
            stage = getattr(deal, 'current_stage', 1) if deal else 1
            if stage < 4:
                ret['financial_amount'] = None
        return ret


