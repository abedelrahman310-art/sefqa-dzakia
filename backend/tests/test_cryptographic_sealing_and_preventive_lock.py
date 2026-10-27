import pytest
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from apps.users.models import CustomUser, OperatorProfile, OperatorDocument
from apps.procurements.models import ProcurementDeal, OpeningSession
from apps.bids.models import BidOffer
from apps.bids.security import encrypt_data, decrypt_data

@pytest.fixture
def auth_user(db):
    return CustomUser.objects.create_user(
        email="authority.sealing@safaqat.dz",
        password="ValidPassword123!",
        role="authority",
        organization_name="وزارة الأشغال العمومية",
    )

@pytest.fixture
def operator_user(db):
    user = CustomUser.objects.create_user(
        email="operator.sealing@safaqat.dz",
        password="ValidPassword123!",
        role="operator",
        organization_name="شركة المقاولات الحديثة",
    )
    profile, _ = OperatorProfile.objects.get_or_create(user=user)
    today = timezone.now().date()
    # إضافة وثائق صالحة افتراضياً
    OperatorDocument.objects.create(
        profile=profile,
        document_type='trade_register',
        name='السجل التجاري',
        expiry_date=today + timedelta(days=180),
        is_valid=True,
    )
    OperatorDocument.objects.create(
        profile=profile,
        document_type='tax_clearance',
        name='شهادة الجباية',
        expiry_date=today + timedelta(days=90),
        is_valid=True,
    )
    OperatorDocument.objects.create(
        profile=profile,
        document_type='social_clearance',
        name='شهادة الضمان الاجتماعي',
        expiry_date=today + timedelta(days=90),
        is_valid=True,
    )
    return user

@pytest.fixture
def sample_deal_stage3(db, auth_user):
    return ProcurementDeal.objects.create(
        reference_number="DEAL-2026-SEAL-001",
        title="مشروع مرحلة النشر قبل الفتح",
        description="تفاصيل المشروع",
        authority=auth_user,
        estimated_budget=Decimal("50000000.00"),
        current_stage=3,
        status="active",
        submission_deadline=timezone.now() + timedelta(days=10),
    )

@pytest.mark.django_db
class TestCryptographicSealing:
    def test_bid_offer_aes256_encryption_on_save(self, operator_user, sample_deal_stage3):
        """1 & 2. التحقق من تشفير مبلغ العرض بـ AES-256 وحقل is_encrypted=True"""
        amount = Decimal("35000000.00")
        offer = BidOffer.objects.create(
            deal=sample_deal_stage3,
            operator=operator_user,
            financial_amount=amount,
            status="submitted",
        )

        assert offer.is_encrypted is True
        assert offer.encrypted_financial_amount is not None
        assert len(offer.encrypted_financial_amount) > 20
        # فك التشفير واستعادة القيمة بدقة
        assert offer.decrypt_financial_amount() == amount
        assert Decimal(decrypt_data(offer.encrypted_financial_amount)) == amount

    def test_deal_offers_endpoint_hides_financial_amount_in_stages_below_4(self, auth_user, operator_user, sample_deal_stage3):
        """3. التحقق من أن GET /api/procurements/deals/{id}/offers/ يعيد المبلغ null في مرحلة أقل من 4 للمصلحة"""
        offer = BidOffer.objects.create(
            deal=sample_deal_stage3,
            operator=operator_user,
            financial_amount=Decimal("45000000.00"),
            status="submitted",
        )

        client = APIClient()
        client.force_authenticate(user=auth_user)

        response = client.get(f"/api/procurements/deals/{sample_deal_stage3.id}/offers/")
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert "offers" in data
        assert len(data["offers"]) == 1
        assert data["offers"][0]["financial_amount"] is None
        assert data["offers"][0]["financialOffer"] is None

    def test_open_envelope_decrypts_financial_amount_by_committee_chair(self, auth_user, operator_user, sample_deal_stage3):
        """4. التحقق من أن فك التشفير يتم حصراً عبر POST /api/opening/sessions/{id}/open-envelope/ من قبل رئيس اللجنة"""
        sample_deal_stage3.current_stage = 4
        sample_deal_stage3.save()

        offer = BidOffer.objects.create(
            deal=sample_deal_stage3,
            operator=operator_user,
            financial_amount=Decimal("42000000.00"),
            status="submitted",
            submission_timestamp=timezone.now() - timedelta(hours=1),
        )
        assert offer.is_encrypted is True

        session = OpeningSession.objects.create(
            tender=sample_deal_stage3,
            created_by=auth_user,
            status="live",
            scheduled_at=timezone.now(),
        )

        client = APIClient()
        # محاولة فك التشفير من غير المصلحة (مرفوضة 403)
        client.force_authenticate(user=operator_user)
        res_forbidden = client.post(
            f"/api/opening/sessions/{session.id}/open-envelope/",
            {"offer_id": str(offer.id), "envelope_type": "financial"},
            format="json",
        )
        assert res_forbidden.status_code == status.HTTP_403_FORBIDDEN

        # فك التشفير من قبل رئيس اللجنة (المصلحة)
        client.force_authenticate(user=auth_user)
        res_open = client.post(
            f"/api/opening/sessions/{session.id}/open-envelope/",
            {"offer_id": str(offer.id), "envelope_type": "financial"},
            format="json",
        )
        assert res_open.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
        assert Decimal(str(res_open.data["announced_amount"])) == Decimal("42000000.00")

        # التحقق من أن العرض أصبح غير مشفر بعد الفتح
        offer.refresh_from_db()
        assert offer.is_encrypted is False

@pytest.mark.django_db
class TestPreventiveDocumentLock:
    def test_submit_offer_blocked_if_mandatory_document_expired(self, operator_user, sample_deal_stage3):
        """التحقق من رفض تقديم العرض إذا كانت شهادة الجباية أو أي وثيقة منتهية الصلاحية"""
        profile = operator_user.operator_profile
        doc = profile.documents.get(document_type='tax_clearance')
        # جعل الوثيقة منتهية الصلاحية
        doc.expiry_date = timezone.now().date() - timedelta(days=5)
        doc.save()

        client = APIClient()
        client.force_authenticate(user=operator_user)

        response = client.post("/api/bids/offers/", {
            "deal": str(sample_deal_stage3.id),
            "financial_amount": "38000000.00",
            "status": "submitted",
        }, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        error_text = str(response.data)
        assert "لا يمكن تقديم العرض" in error_text
        assert "شهادة الجباية" in error_text or "tax_clearance" in error_text
        assert "منتهية الصلاحية" in error_text

    def test_submit_offer_blocked_if_mandatory_document_missing(self, operator_user, sample_deal_stage3):
        """التحقق من رفض تقديم العرض إذا كانت وثيقة السجل التجاري غير موجودة"""
        profile = operator_user.operator_profile
        profile.documents.filter(document_type='trade_register').delete()
        profile.extra_data = {}
        profile.save()
        operator_user.organization_name = ""
        operator_user.save()

        client = APIClient()
        client.force_authenticate(user=operator_user)

        response = client.post("/api/bids/offers/", {
            "deal": str(sample_deal_stage3.id),
            "financial_amount": "38000000.00",
            "status": "submitted",
        }, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        error_text = str(response.data)
        assert "لا يمكن تقديم العرض" in error_text
        assert "السجل التجاري" in error_text or "غير موجودة" in error_text
