import pytest
from decimal import Decimal
from django.utils import timezone
from rest_framework.test import APIClient
from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal, OpeningSession, OpeningCommitteeShare
from apps.bids.models import BidOffer, ElectronicSignature
from apps.bids.digital_signature import compute_bid_hash, sign_bid, verify_bid_signature
from apps.procurements.threshold_crypto import (
    split_secret,
    recover_secret,
    init_session_committee,
    submit_committee_share,
)
from apps.audit.models import AuditLog


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def operator_user(db):
    return CustomUser.objects.create_user(
        email="operator_p2@safaqat.dz",
        password="TestPassword123!",
        role="operator",
        display_name="شركة المقاولات الجزائرية الكبرى",
        organization_name="شركة المقاولات الجزائرية الكبرى",
    )


@pytest.fixture
def other_operator_user(db):
    return CustomUser.objects.create_user(
        email="other_operator_p2@safaqat.dz",
        password="TestPassword123!",
        role="operator",
        display_name="مؤسسة الإنشاءات العامة",
        organization_name="مؤسسة الإنشاءات العامة",
    )


@pytest.fixture
def authority_user(db):
    return CustomUser.objects.create_user(
        email="authority_p2@safaqat.dz",
        password="TestPassword123!",
        role="authority",
        display_name="رئيس المصلحة المتعاقدة",
        organization_name="مديرية التجهيزات العمومية",
    )


@pytest.fixture
def tender_deal(db, authority_user):
    return ProcurementDeal.objects.create(
        authority=authority_user,
        title="مشروع إنجاز المجمع الإداري الذكي",
        reference_number="DZ-2026-P2-001",
        description="مشروع إنجاز مجمع إداري متكامل بأحدث المعايير التقنية",
        estimated_budget=Decimal("50000000.00"),
        current_stage=5,
        submission_deadline=timezone.now() + timezone.timedelta(days=7),
    )


@pytest.fixture
def bid_offer(db, tender_deal, operator_user):
    bid = BidOffer.objects.create(
        deal=tender_deal,
        operator=operator_user,
        status="submitted",
        financial_amount=Decimal("45000000.00"),
        submission_timestamp=timezone.now(),
    )
    return bid


@pytest.mark.django_db
class TestLaw1504ElectronicSignature:
    """اختبارات التوقيع الإلكتروني المؤهل وفق القانون رقم 15-04"""

    def test_sign_bid_and_verify_tamper_evidence(self, bid_offer, operator_user):
        # 1. التوقيع الرقمي بموجب القانون 15-04
        sig = sign_bid(
            bid=bid_offer,
            signer=operator_user,
            cert_serial="DZ-PKI-TEST-998877",
            signer_role="المدير العام المفوض",
        )

        assert sig.is_valid is True
        assert sig.certificate_serial == "DZ-PKI-TEST-998877"
        assert "القانون رقم 15-04" in sig.legal_framework
        assert sig.signed_data_hash is not None

        # 2. فحص صحة التوقيع
        verif = verify_bid_signature(sig)
        assert verif['is_valid'] is True
        assert verif['status_code'] == 'VALID'
        assert verif['hash_intact'] is True

        # 3. محاكاة تلاعب أو تعديل في مبلغ العرض
        bid_offer.financial_amount = Decimal("30000000.00")
        bid_offer.save()

        # 4. إعادة الفحص يجب أن تكتشف التلاعب فوراً
        tampered_verif = verify_bid_signature(sig)
        assert tampered_verif['is_valid'] is False
        assert tampered_verif['status_code'] == 'TAMPERED'
        assert tampered_verif['hash_intact'] is False

    def test_sign_bid_via_api_and_audit(self, api_client, bid_offer, operator_user, other_operator_user):
        api_client.force_authenticate(user=operator_user)

        # إرسال طلب التوقيع عبر API
        response = api_client.post(
            f"/api/offers/{bid_offer.id}/sign/",
            {
                "certificate_serial": "DZ-CERT-TEST-4411",
                "signer_role": "الممثل القانوني المعتمد",
            },
            format="json",
        )
        assert response.status_code == 201
        data = response.data
        assert "القانون رقم 15-04" in data['message']
        assert data['signature']['certificate_serial'] == "DZ-CERT-TEST-4411"

        # فحص استرجاع التوقيع
        get_res = api_client.get(f"/api/offers/{bid_offer.id}/signature/")
        assert get_res.status_code == 200
        assert get_res.data['verification']['is_valid'] is True

        # التحقق من تسجيل العملية في سجل التدقيق غير القابل للتعديل
        audit = AuditLog.objects.filter(
            action="BID_ELECTRONICALLY_SIGNED_LAW_15_04",
            user=operator_user,
        ).first()
        assert audit is not None
        assert str(bid_offer.id) in audit.description

        # فحص رفض توقيع متعامل آخر لعرض لا يملكه
        api_client.force_authenticate(user=other_operator_user)
        denied_res = api_client.post(f"/api/offers/{bid_offer.id}/sign/", {}, format="json")
        assert denied_res.status_code in [403, 404]


@pytest.mark.django_db
class TestThresholdMultiPartyCeremony:
    """اختبارات التشفير التعددي العتباتي (Shamir Secret Sharing) للجنة فتح الأظرفة"""

    def test_shamir_mathematical_recovery(self):
        raw_secret = b"safaqat_test_key_32_bytes_len!!!"
        assert len(raw_secret) == 32
        shares = split_secret(raw_secret, n=3, k=2)
        assert len(shares) == 3

        # استرجاع بأي حصتين
        rec1 = recover_secret([shares[0], shares[1]])
        rec2 = recover_secret([shares[1], shares[2]])
        rec3 = recover_secret([shares[0], shares[2]])

        assert rec1 == raw_secret
        assert rec2 == raw_secret
        assert rec3 == raw_secret

    def test_opening_session_ceremony_workflow(self, api_client, tender_deal, authority_user, bid_offer):
        # 1. إنشاء وبرمجة جلسة فتح الأظرفة
        session = OpeningSession.objects.create(
            tender=tender_deal,
            scheduled_at=timezone.now(),
            location="قاعة الاجتماعات الرسمية",
            status="live",
            created_by=authority_user,
        )

        # تهيئة حصص أعضاء اللجنة (رئيس المصلحة، ممثل المالية، ممثل التقنية)
        init_session_committee(session)
        assert session.committee_shares.count() == 3
        assert session.ceremony_status == "pending_quorum"

        api_client.force_authenticate(user=authority_user)

        # 2. محاولة فتح ظرف العرض قبل اكتمال النصاب يجب أن تفشل مع كود THRESHOLD_QUORUM_REQUIRED
        fail_open = api_client.post(
            f"/api/procurements/sessions/{session.id}/open-offer/",
            {
                "offer_id": str(bid_offer.id),
                "announced_price": 45000000,
                "is_accepted": True,
            },
            format="json",
        )
        assert fail_open.status_code == 400
        assert fail_open.data.get("error_code") == "THRESHOLD_QUORUM_REQUIRED"

        # 3. تقديم الحصة الأولى (رئيس المصلحة) -> لم يكتمل النصاب بعد
        res_share1 = api_client.post(
            f"/api/procurements/sessions/{session.id}/submit-key-share/",
            {"member_role": "president"},
            format="json",
        )
        assert res_share1.status_code == 200
        assert res_share1.data["submitted_count"] == 1
        assert res_share1.data["quorum_reached"] is False

        session.refresh_from_db()
        assert session.ceremony_status == "pending_quorum"

        # 4. تقديم الحصة الثانية (ممثل المالية / المحاسب العمومي) -> يكتمل النصاب وتتحول الجلسة إلى unlocked!
        res_share2 = api_client.post(
            f"/api/procurements/sessions/{session.id}/submit-key-share/",
            {"member_role": "finance_rep"},
            format="json",
        )
        assert res_share2.status_code == 200
        assert res_share2.data["submitted_count"] == 2
        assert res_share2.data["quorum_reached"] is True
        assert res_share2.data["ceremony_status"] == "unlocked"

        session.refresh_from_db()
        assert session.ceremony_status == "unlocked"
        assert session.unlocked_at is not None

        # 5. الآن فتح ظرف العرض بعد اكتمال النصاب ينجح بالكامل
        success_open = api_client.post(
            f"/api/procurements/sessions/{session.id}/open-offer/",
            {
                "offer_id": str(bid_offer.id),
                "announced_price": 45000000,
                "is_accepted": True,
            },
            format="json",
        )
        assert success_open.status_code == 201
        assert success_open.data["event_type"] == "offer_opened"
