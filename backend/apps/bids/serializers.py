from rest_framework import serializers
from .models import BidOffer, ElectronicSignature
from apps.procurements.serializers import OfferSerializer, OfferDocumentSerializer


class ElectronicSignatureSerializer(serializers.ModelSerializer):
    """محدد بيانات التوقيع الإلكتروني المؤهل (قانون 15-04)"""
    signer_email = serializers.ReadOnlyField(source='signer.email')

    class Meta:
        model = ElectronicSignature
        fields = [
            'id',
            'bid',
            'signer',
            'signer_email',
            'signer_name',
            'signer_role',
            'signer_nif',
            'certificate_serial',
            'certificate_issuer',
            'signed_data_hash',
            'signature_value',
            'signature_algorithm',
            'timestamp_token',
            'legal_framework',
            'is_valid',
            'verification_metadata',
            'created_at',
        ]
        read_only_fields = fields


class BidOfferSerializer(serializers.ModelSerializer):
    operator_name = serializers.ReadOnlyField(source='operator.company_name')
    deal_title = serializers.ReadOnlyField(source='deal.title')
    deal_reference = serializers.ReadOnlyField(source='deal.reference_number')
    signatures = ElectronicSignatureSerializer(many=True, read_only=True)
    is_signed_law_15_04 = serializers.SerializerMethodField()

    class Meta:
        model = BidOffer
        fields = '__all__'
        read_only_fields = ['operator', 'submission_timestamp']

    def get_is_signed_law_15_04(self, obj) -> bool:
        return obj.signatures.filter(is_valid=True).exists()

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        # حجب المبلغ المالي والمبلغ المشفر عن المصلحة المتعاقدة قبل مرحلة فتح الأظرفة الرسمية (المراحل 1، 2، 3)
        if user and getattr(user, 'role', None) == 'authority':
            deal = getattr(instance, 'deal', None)
            stage = getattr(deal, 'current_stage', 1) if deal else 1
            if stage < 4 or getattr(instance, 'is_encrypted', True):
                ret['financial_amount'] = None
                ret['encrypted_financial_amount'] = None
        return ret
