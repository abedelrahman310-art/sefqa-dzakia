import pytest
from decimal import Decimal
from django.utils import timezone
from rest_framework.test import APIClient, APIRequestFactory
from safaqat_core.settings import REST_FRAMEWORK
from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal
from apps.bids.models import BidOffer
from apps.procurements.serializers import OfferSerializer


@pytest.mark.django_db
class TestSecurityAndConfidentiality:
    def test_csrf_exempt_session_authentication_is_removed(self):
        """1. التحقق من إزالة CsrfExemptSessionAuthentication والاعتماد الحصري على JWT"""
        auth_classes = REST_FRAMEWORK.get('DEFAULT_AUTHENTICATION_CLASSES', ())
        assert 'apps.users.authentication.CsrfExemptSessionAuthentication' not in auth_classes
        assert 'rest_framework.authentication.SessionAuthentication' not in auth_classes
        assert 'rest_framework_simplejwt.authentication.JWTAuthentication' in auth_classes
        assert len(auth_classes) == 1

    def test_offer_serializer_hides_financial_amount_from_authority_in_stages_1_2_3(self):
        """2 & 3. التحقق من حجب المبالغ المالية عن المصلحة المتعاقدة في المراحل 1 و 2 و 3"""
        factory = APIRequestFactory()

        authority = CustomUser.objects.create_user(
            email="auth_security@safaqat.dz",
            password="Password123!",
            role="authority",
            organization_name="مديرية التجهيزات",
        )

        operator = CustomUser.objects.create_user(
            email="op_security@safaqat.dz",
            password="Password123!",
            role="operator",
            organization_name="مؤسسة الإنجاز",
        )

        # فحص المراحل 1، 2، 3
        for test_stage in [1, 2, 3]:
            deal = ProcurementDeal.objects.create(
                reference_number=f"DZ-STAGE-{test_stage}-TEST",
                title=f"مشروع المرحلة {test_stage}",
                description="وصف المشروع",
                authority=authority,
                current_stage=test_stage,
                estimated_budget=Decimal("50000000.00"),
            )

            offer = BidOffer.objects.create(
                deal=deal,
                operator=operator,
                financial_amount=Decimal("42000000.00"),
                status="submitted",
            )

            # طلب من قبل المصلحة المتعاقدة
            request = factory.get('/')
            request.user = authority
            serializer = OfferSerializer(offer, context={'request': request})
            data = serializer.data

            assert data['financial_amount'] is None, (
                f"في المرحلة {test_stage} يجب أن يعود financial_amount بـ null للمصلحة، ولكن رجع: {data['financial_amount']}"
            )
            assert data['financialOffer'] is None, (
                f"في المرحلة {test_stage} يجب أن يعود financialOffer بـ null للمصلحة"
            )

            # في المقابل: المتعامل صاحب العرض يستطيع رؤية عرضه
            op_request = factory.get('/')
            op_request.user = operator
            op_serializer = OfferSerializer(offer, context={'request': op_request})
            op_data = op_serializer.data
            assert op_data['financial_amount'] == Decimal("42000000.00")

    def test_offer_serializer_reveals_financial_amount_to_authority_in_stage_4_and_above(self):
        """التحقق من ظهور المبالغ المالية للمصلحة المتعاقدة عند بلوغ مرحلة فتح الأظرفة (المرحلة 4 وما فوق)"""
        factory = APIRequestFactory()

        authority = CustomUser.objects.create_user(
            email="auth_opening@safaqat.dz",
            password="Password123!",
            role="authority",
            organization_name="مديرية الأشغال",
        )

        operator = CustomUser.objects.create_user(
            email="op_opening@safaqat.dz",
            password="Password123!",
            role="operator",
            organization_name="مؤسسة البناء",
        )

        # فحص المرحلة 4 (فتح الأظرفة) والمرحلة 5 و 6
        for test_stage in [4, 5, 6]:
            deal = ProcurementDeal.objects.create(
                reference_number=f"DZ-STAGE-{test_stage}-OPEN",
                title=f"مشروع الفتح مرحلة {test_stage}",
                description="وصف",
                authority=authority,
                current_stage=test_stage,
                estimated_budget=Decimal("60000000.00"),
            )

            offer = BidOffer.objects.create(
                deal=deal,
                operator=operator,
                financial_amount=Decimal("55000000.00"),
                status="submitted",
            )

            request = factory.get('/')
            request.user = authority
            serializer = OfferSerializer(offer, context={'request': request})
            data = serializer.data

            assert data['financial_amount'] == Decimal("55000000.00"), (
                f"في المرحلة {test_stage} يجب أن يظهر المبلغ للمصلحة، ولكن رجع: {data['financial_amount']}"
            )
            assert data['financialOffer'] == "55000000.00"

    def test_evaluation_data_endpoint_hides_financial_amount_for_authority_in_stages_1_2_3(self):
        """التحقق من حجب العروض المالية في API التقييم للمصلحة في المراحل 1، 2، 3"""
        client = APIClient()

        authority = CustomUser.objects.create_user(
            email="auth_eval_sec@safaqat.dz",
            password="Password123!",
            role="authority",
            organization_name="بلدية الرويبة",
        )

        operator = CustomUser.objects.create_user(
            email="op_eval_sec@safaqat.dz",
            password="Password123!",
            role="operator",
            organization_name="شركة المقاولات",
        )

        deal = ProcurementDeal.objects.create(
            reference_number="DZ-EVAL-SEC-001",
            title="مشروع قيد النشر",
            description="وصف",
            authority=authority,
            current_stage=3,  # مرحلة النشر قبل الفتح
            estimated_budget=Decimal("10000000.00"),
        )

        offer = BidOffer.objects.create(
            deal=deal,
            operator=operator,
            financial_amount=Decimal("9500000.00"),
            status="submitted",
        )

        client.force_authenticate(user=authority)
        response = client.get(f"/api/authority/opportunities/{deal.id}/evaluation-data/")
        assert response.status_code == 200

        data = response.data
        assert "offers" in data
        assert len(data["offers"]) == 1
        retrieved_offer = data["offers"][0]
        assert retrieved_offer["financialAmount"] is None
        assert retrieved_offer["financial_amount"] is None

        # تغيير مرحلة الصفقة إلى 4 (فتح الأظرفة)
        deal.current_stage = 4
        deal.save()

        response2 = client.get(f"/api/authority/opportunities/{deal.id}/evaluation-data/")
        assert response2.status_code == 200
        retrieved_offer2 = response2.data["offers"][0]
        assert retrieved_offer2["financialAmount"] == "9500000.00"
