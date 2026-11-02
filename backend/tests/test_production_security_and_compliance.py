import pytest
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.core.exceptions import ValidationError, PermissionDenied
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from apps.users.models import CustomUser, OperatorProfile
from apps.procurements.models import ProcurementDeal
from apps.bids.models import BidOffer
from apps.bids.validators import validate_document_upload
from apps.audit.models import AuditLog
from apps.ai_gateway.services.llm_client import get_llm_client, RuleBasedFallback


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_users(db):
    pwd = "StrongSecurePassword2026!"
    authority_user_1 = CustomUser.objects.create_user(
        email="authority1@wilaya-alger.dz",
        password=pwd,
        role="authority",
        display_name="المصلحة المتعاقدة - العاصمة",
        organization_name="ولاية الجزائر",
    )
    authority_user_2 = CustomUser.objects.create_user(
        email="authority2@oran.dz",
        password=pwd,
        role="authority",
        display_name="المصلحة المتعاقدة - وهران",
        organization_name="بلدية وهران",
    )
    operator_user_1 = CustomUser.objects.create_user(
        email="operator1@algerian-works.dz",
        password=pwd,
        role="operator",
        display_name="مؤسسة الأشغال الكبرى",
        organization_name="شركة وطنية خاصة",
    )
    operator_user_2 = CustomUser.objects.create_user(
        email="operator2@building-solutions.dz",
        password=pwd,
        role="operator",
        display_name="مؤسسة البناء الحديث",
        organization_name="شركة ش.ذ.م.م",
    )
    admin_user = CustomUser.objects.create_superuser(
        email="audit-admin@safaqat.gov.dz",
        password=pwd,
        role="central_admin",
        display_name="المراقب المركزي الوطني",
        organization_name="المرصد الوطني للصفقات العمومية",
    )

    # وثائق إدارية سارية للمتعاملين، لاختبار دورة الإيداع دون قفل الوثائق.
    for operator in (operator_user_1, operator_user_2):
        OperatorProfile.objects.create(
            user=operator,
            extra_data={
                "tax_clearance_status": "valid",
                "social_clearance_status": "valid",
            },
        )

    return {
        "pwd": pwd,
        "auth1": authority_user_1,
        "auth2": authority_user_2,
        "op1": operator_user_1,
        "op2": operator_user_2,
        "admin": admin_user,
    }


@pytest.fixture
def active_deal(db, auth_users):
    """صفقة نشطة في مرحلة استلام العروض مع مهلة قانونية مفتوحة"""
    return ProcurementDeal.objects.create(
        reference_number="DZ-2026-ALGER-001",
        title="مشروع إنجاز مجمع مدرسي نموذجي",
        authority=auth_users["auth1"],
        wilaya="الجزائر",
        current_stage=5,  # إيداع العروض
        estimated_budget=Decimal("150000000.00"),
        submission_deadline=timezone.now() + timedelta(days=30),
    )


@pytest.fixture
def expired_deal(db, auth_users):
    """صفقة منقضية الأجل القانوني لإيداع العروض"""
    return ProcurementDeal.objects.create(
        reference_number="DZ-2026-EXPIRED-002",
        title="مشروع توريد تجهيزات إدارية منقضي",
        authority=auth_users["auth1"],
        wilaya="الجزائر",
        current_stage=5,
        estimated_budget=Decimal("10000000.00"),
        submission_deadline=timezone.now() - timedelta(days=2),
    )


# ==============================================================================
# 1. Successful and failed authentication
# ==============================================================================
@pytest.mark.django_db
class TestAuthenticationSecurity:
    def test_auth_success_returns_jwt_tokens(self, api_client, auth_users):
        """نجاح تسجيل الدخول بالبيانات الصحيحة وإصدار توكنات JWT مشفرة"""
        response = api_client.post(
            "/api/auth/login/",
            {"email": auth_users["op1"].email, "password": auth_users["pwd"]},
            format="json",
        )
        assert response.status_code == 200
        assert "access" in response.data
        assert "refresh" in response.data
        assert response.data["user"]["role"] == "operator"

    def test_auth_failure_wrong_password(self, api_client, auth_users):
        """فشل تسجيل الدخول ورفض الطلب عند إدخال كلمة مرور خاطئة"""
        response = api_client.post(
            "/api/auth/login/",
            {"email": auth_users["op1"].email, "password": "WrongPassword123!"},
            format="json",
        )
        assert response.status_code == 401
        assert "access" not in response.data

    def test_auth_failure_nonexistent_user(self, api_client):
        """فشل تسجيل الدخول عند استخدام بريد إلكتروني غير مسجل في النظام"""
        response = api_client.post(
            "/api/auth/login/",
            {"email": "unknown_ghost_user@safaqat.dz", "password": "AnyPassword!"},
            format="json",
        )
        assert response.status_code == 401


# ==============================================================================
# 2. Unauthenticated access denial
# ==============================================================================
@pytest.mark.django_db
class TestUnauthenticatedAccessDenial:
    def test_unauthenticated_cannot_access_bids(self, api_client):
        """حظر الوصول لغير المصادقين إلى مسار العروض والمناقصات (401 Unauthorized)"""
        response = api_client.get("/api/bids/offers/")
        assert response.status_code in [401, 403]

    def test_unauthenticated_cannot_schedule_sessions(self, api_client):
        """حظر الوصول لغير المصادقين إلى جدولة جلسات فتح الأظرفة"""
        response = api_client.post("/api/procurements/sessions/schedule/", {}, format="json")
        assert response.status_code in [401, 403]

    def test_unauthenticated_cannot_create_deal(self, api_client):
        """حظر غير المصادقين من إنشاء صفقات عمومية"""
        response = api_client.post(
            "/api/procurements/deals/",
            {"title": "صفقة غير مصرح بها", "wilaya": "الجزائر"},
            format="json",
        )
        assert response.status_code in [401, 403]


# ==============================================================================
# 3. Operator cannot access another operator’s offer
# ==============================================================================
@pytest.mark.django_db
class TestOperatorOfferIsolation:
    def test_operator_cannot_view_another_operator_offer(self, api_client, auth_users, active_deal):
        """عزل العروض: المتعامل (ب) لا يمكنه رؤية عرض المتعامل (أ)"""
        # إنشاء عرض خاص بالمتعامل الأول
        offer_1 = BidOffer.objects.create(
            deal=active_deal,
            operator=auth_users["op1"],
            status="draft",
            financial_amount=Decimal("145000000.00"),
        )

        # تسجيل دخول المتعامل الثاني
        api_client.force_authenticate(user=auth_users["op2"])

        # محاولة استعراض عرض المتعامل الأول برقم المعرف
        response = api_client.get(f"/api/bids/offers/{offer_1.id}/")
        assert response.status_code in [403, 404]

    def test_operator_cannot_modify_another_operator_offer(self, api_client, auth_users, active_deal):
        """حماية النزاهة: المتعامل (ب) يمنع قطعياً من تعديل عرض المتعامل (أ)"""
        offer_1 = BidOffer.objects.create(
            deal=active_deal,
            operator=auth_users["op1"],
            status="draft",
            financial_amount=Decimal("145000000.00"),
        )

        api_client.force_authenticate(user=auth_users["op2"])
        response = api_client.patch(
            f"/api/bids/offers/{offer_1.id}/",
            {"financial_amount": "99999999.00"},
            format="json",
        )
        assert response.status_code in [403, 404]
        offer_1.refresh_from_db()
        assert offer_1.financial_amount == Decimal("145000000.00")


# ==============================================================================
# 4. Operator cannot access authority-only APIs
# ==============================================================================
@pytest.mark.django_db
class TestRoleSeparationAuthorityOnly:
    def test_operator_cannot_create_procurement_deal(self, api_client, auth_users):
        """فصل الصلاحيات: المتعامل الاقتصادي لا يملك صلاحية إنشاء صفقة عمومية"""
        api_client.force_authenticate(user=auth_users["op1"])
        payload = {
            "reference_number": "DZ-2026-UNAUTH-999",
            "title": "محاولة إنشاء صفقة من متعامل",
            "wilaya": "الجزائر",
            "estimated_budget": "50000000.00",
        }
        response = api_client.post("/api/procurements/deals/", payload, format="json")
        assert response.status_code == 403

    def test_operator_cannot_schedule_session(self, api_client, auth_users, active_deal):
        """فصل الصلاحيات: المتعامل لا يملك صلاحية برمجة أو جدولة جلسة فتح الأظرفة"""
        api_client.force_authenticate(user=auth_users["op1"])
        payload = {
            "tender_id": str(active_deal.id),
            "session_type": "public",
            "scheduled_at": (timezone.now() + timedelta(days=5)).isoformat(),
        }
        response = api_client.post("/api/procurements/sessions/schedule/", payload, format="json")
        assert response.status_code == 403


# ==============================================================================
# 5. Authority cannot modify another authority’s opportunity
# ==============================================================================
@pytest.mark.django_db
class TestAuthorityIsolation:
    def test_authority_cannot_modify_another_authority_deal(self, api_client, auth_users, active_deal):
        """عزل المصالح: المصلحة (2) لا يمكنها تعديل أو حذف صفقة أطلقتها المصلحة (1)"""
        # صفقة تابعة للمصلحة 1 (ولاية الجزائر)
        assert active_deal.authority == auth_users["auth1"]

        # تسجيل دخول المصلحة 2 (بلدية وهران)
        api_client.force_authenticate(user=auth_users["auth2"])

        response = api_client.patch(
            f"/api/procurements/deals/{active_deal.id}/",
            {"title": "محاولة تعديل غير شرعية من مصلحة أخرى"},
            format="json",
        )
        # 404 مقبول أيضاً: إخفاء وجود الصفقة عن مصلحة أخرى حماية أفضل من
        # تأكيد وجودها عبر 403، والمهم ألا ينجح التعديل.
        assert response.status_code in (403, 404)
        active_deal.refresh_from_db()
        assert active_deal.title == "مشروع إنجاز مجمع مدرسي نموذجي"


# ==============================================================================
# 6. Operator can create and submit an offer before deadline
# ==============================================================================
@pytest.mark.django_db
class TestOfferSubmissionLifecycle:
    def test_operator_can_create_and_submit_offer_before_deadline(self, api_client, auth_users, active_deal):
        """تمكين المتعامل من إنشاء مسودة عرض وإيداعها رسمياً قبل انقضاء الأجل القانوني"""
        api_client.force_authenticate(user=auth_users["op1"])

        # 1. إنشاء مسودة عرض
        create_resp = api_client.post(
            "/api/bids/offers/",
            {
                "deal": str(active_deal.id),
                "financial_amount": "142000000.00",
                "status": "draft",
            },
            format="json",
        )
        assert create_resp.status_code == 201
        bid_id = create_resp.data["id"]

        # 2. إيداع العرض رسمياً وتأكيده قبل انقضاء الأجل
        update_resp = api_client.patch(
            f"/api/bids/offers/{bid_id}/",
            {"status": "submitted"},
            format="json",
        )
        assert update_resp.status_code == 200
        assert update_resp.data["status"] == "submitted"


# ==============================================================================
# 7. Offer submission is rejected after deadline
# ==============================================================================
@pytest.mark.django_db
class TestOfferDeadlineEnforcement:
    def test_offer_creation_rejected_after_deadline(self, api_client, auth_users, expired_deal):
        """رفض إيداع العرض فور انقضاء الأجل القانوني وفقاً للمادة من القانون 23-12"""
        api_client.force_authenticate(user=auth_users["op1"])
        response = api_client.post(
            "/api/bids/offers/",
            {
                "deal": str(expired_deal.id),
                "financial_amount": "9500000.00",
                "status": "draft",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "انقضى الأجل القانوني" in str(response.data)

    def test_offer_submission_rejected_after_deadline(self, api_client, auth_users, active_deal):
        """حظر تحديث العرض أو إيداعه إذا مر الأجل بعد إنشاء المسودة"""
        # إنشاء مسودة أثناء فتح الأجل
        bid = BidOffer.objects.create(
            deal=active_deal,
            operator=auth_users["op1"],
            status="draft",
            financial_amount=Decimal("140000000.00"),
        )
        # انقضاء الأجل لاحقاً
        active_deal.submission_deadline = timezone.now() - timedelta(minutes=10)
        active_deal.save()

        api_client.force_authenticate(user=auth_users["op1"])
        response = api_client.patch(
            f"/api/bids/offers/{bid.id}/",
            {"status": "submitted"},
            format="json",
        )
        assert response.status_code == 400
        assert "انقضى الأجل القانوني" in str(response.data)


# ==============================================================================
# 8. Submitted offer cannot be modified by operator
# ==============================================================================
@pytest.mark.django_db
class TestSubmittedOfferImmutability:
    def test_submitted_offer_cannot_be_modified(self, api_client, auth_users, active_deal):
        """العرض المودع مشفر ومغلق نهائياً ويمنع تعديله بتاتاً (قفل التعديل)"""
        bid = BidOffer.objects.create(
            deal=active_deal,
            operator=auth_users["op1"],
            status="submitted",
            financial_amount=Decimal("138000000.00"),
        )

        api_client.force_authenticate(user=auth_users["op1"])
        response = api_client.patch(
            f"/api/bids/offers/{bid.id}/",
            {"financial_amount": "120000000.00"},
            format="json",
        )
        assert response.status_code == 400
        assert "لا يمكن تعديل عرض بعد إيداعه الرسمي" in str(response.data)

        bid.refresh_from_db()
        assert bid.financial_amount == Decimal("138000000.00")


# ==============================================================================
# 9. Document upload validation
# ==============================================================================
class TestDocumentUploadValidation:
    def test_valid_pdf_document_upload_passes(self):
        """قبول ملف PDF سليم ذي حجم مشروع وغير فارغ"""
        pdf_file = SimpleUploadedFile("cahier_des_charges.pdf", b"%PDF-1.4 valid test pdf content", content_type="application/pdf")
        assert validate_document_upload(pdf_file) is True

    def test_empty_document_upload_rejected(self):
        """رفض رفع الملفات الفارغة ذات الحجم 0 بايت"""
        empty_file = SimpleUploadedFile("empty.pdf", b"", content_type="application/pdf")
        with pytest.raises(ValidationError, match="لا يمكن إيداع ملف فارغ"):
            validate_document_upload(empty_file)

    def test_dangerous_executable_upload_rejected(self):
        """حظر الامتدادات الخطيرة والتنفيذية لضمان الأمن السيبراني"""
        for dangerous_name in ["malware.exe", "script.sh", "payload.bat", "trojan.php"]:
            bad_file = SimpleUploadedFile(dangerous_name, b"echo harmful payload", content_type="application/octet-stream")
            with pytest.raises(ValidationError, match="محظورة لأسباب أمنية"):
                validate_document_upload(bad_file)

    def test_oversized_document_upload_rejected(self):
        """رفض الملفات التي تتجاوز السقف الأقصى للحجم (10 ميغابايت)"""
        oversized_content = b"X" * (10 * 1024 * 1024 + 1024)
        large_file = SimpleUploadedFile("very_large.pdf", oversized_content, content_type="application/pdf")
        with pytest.raises(ValidationError, match="يتجاوز الحد الأقصى"):
            validate_document_upload(large_file)


# ==============================================================================
# 10. Audit log creation for sensitive actions & immutability
# ==============================================================================
@pytest.mark.django_db
class TestAuditLogCreationAndTamperResistance:
    def test_audit_log_created_with_digital_checksum(self, auth_users, active_deal):
        """إنشاء سجل تدقيق للعمليات الحساسة مع احتساب البصمة الرقمية SHA-256"""
        log = AuditLog.objects.create(
            user=auth_users["auth1"],
            action="OFFER_ENCRYPTION_SEAL",
            resource_type="BidOffer",
            resource_id="sample-bid-uuid-1234",
            description="ختم وتشفير العطاء الرقمي للمتعامل",
            changes={"status": "submitted"},
        )
        assert log.pk is not None
        assert len(log.checksum) == 64  # SHA-256 64-char hex string

    def test_audit_log_cannot_be_modified_or_deleted(self, auth_users):
        """سجلات التدقيق غير قابلة للتعديل أو الحذف وفق المادة القانونية الصارمة"""
        log = AuditLog.objects.create(
            user=auth_users["admin"],
            action="LEGAL_INSPECTION",
            resource_type="ProcurementDeal",
            resource_id="deal-999",
            description="تفتيش رقابي دوري",
        )
        with pytest.raises(PermissionDenied, match="غير قابلة للتعديل"):
            log.description = "محاولة تغيير وصف السجل"
            log.save()

        with pytest.raises(PermissionDenied, match="غير قابلة للحذف"):
            log.delete()


# ==============================================================================
# 11. AI fallback works without external API keys
# ==============================================================================
class TestAIFallbackWithoutAPIKeys:
    def test_ai_fallback_instantiation_without_external_keys(self, monkeypatch):
        """ضمان عمل الذكاء الاصطناعي بنظام Fallback المحلي عند غياب مفاتيح API الخارجية"""
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
        monkeypatch.setenv("LLM_PROVIDER", "rule_based")

        client = get_llm_client()
        assert isinstance(client, RuleBasedFallback)
        assert client.test_connection() is True

    def test_ai_fallback_answers_compliance_queries_locally(self, monkeypatch):
        """استجابة محرك Fallback للاستشارات القانونية بدقة ودون انقطاع"""
        monkeypatch.setenv("LLM_PROVIDER", "rule_based")
        client = get_llm_client()

        # استفسار عن الامتثال للقانون 23-12
        response_compliance = client.chat([{"role": "user", "content": "ما هي شروط الامتثال لدفتر الشروط وفق القانون 23-12؟"}])
        assert "23-12" in response_compliance

        # استفسار عن مخاطر وتنبيهات
        response_risks = client.chat([{"role": "user", "content": "هل توجد مخاطر أو شبهات في الصفقات؟"}])
        assert isinstance(response_risks, str)
        assert len(response_risks) > 10
