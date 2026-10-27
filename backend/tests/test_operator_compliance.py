import pytest
from io import BytesIO
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from apps.procurements.models import ProcurementDeal, CahierSpecs
from apps.users.models import OperatorProfile
from apps.audit.models import AuditLog
from apps.ai_gateway.throttles import AIAnalyzeTenderThrottle, AIInsightsThrottle

User = get_user_model()


@pytest.fixture
def authority_user(db):
    return User.objects.create_user(
        email="authority.compliance@safaqat.dz",
        password="ValidPassword123!",
        role="authority",
        organization_name="وزارة الأشغال العمومية والمنشآت القاعدية",
        display_name="مصلحة الصفقات العمومية",
    )


@pytest.fixture
def operator_user(db):
    return User.objects.create_user(
        email="operator.compliance@safaqat.dz",
        password="ValidPassword123!",
        role="operator",
        organization_name="مؤسسة الإنجاز والبناء الجزائرية",
        display_name="المقاول المعتمد",
    )


@pytest.fixture
def sample_supplies_deal(db, authority_user):
    return ProcurementDeal.objects.create(
        reference_number="DEAL-2026-COMP-001",
        title="توريد تجهيزات معلوماتية وخوادم للإدارة المركزية",
        description="توريد حواسيب ولواحق ومعدات مكتبية",
        authority=authority_user,
        estimated_budget=45000000.0,
        current_stage=3,
        status="active",
    )


@pytest.fixture
def sample_works_deal(db, authority_user):
    return ProcurementDeal.objects.create(
        reference_number="DEAL-2026-COMP-002",
        title="مشروع أشغال تهيئة وتوسعة الطريق الوطني رقم 01",
        description="أشغال بناء وتعبيد الطرقات والمنشآت الفنية",
        authority=authority_user,
        estimated_budget=120000000.0,
        current_stage=3,
        status="active",
    )


@pytest.mark.django_db
class TestOperatorCheckComplianceEndpoint:
    """اختبارات وكيل فحص الامتثال القانوني للمتعامل (Law 23-12 Compliance Agent)"""

    def test_unauthenticated_request_is_blocked(self, sample_supplies_deal):
        client = APIClient()
        response = client.post(
            "/api/operator/check-compliance/",
            {"deal_id": sample_supplies_deal.id},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_missing_deal_id_returns_bad_request(self, operator_user):
        client = APIClient()
        client.force_authenticate(user=operator_user)
        response = client.post("/api/operator/check-compliance/", {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "deal_id" in response.data.get("error", "")

    def test_nonexistent_deal_returns_not_found(self, operator_user):
        client = APIClient()
        client.force_authenticate(user=operator_user)
        response = client.post(
            "/api/operator/check-compliance/",
            {"deal_id": 999999},
            format="json",
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_operator_with_missing_documents(self, operator_user, sample_supplies_deal):
        """عندما لا يمتلك المتعامل أي وثائق في ملفه، يجب أن يعيد missing_documents ونسبة منخفضة"""
        profile, _ = OperatorProfile.objects.get_or_create(user=operator_user)
        profile.extra_data = {}
        profile.save()

        # مسح اسم المنظمة لاختبار ملف فارغ تماماً
        operator_user.organization_name = ""
        operator_user.save()

        client = APIClient()
        client.force_authenticate(user=operator_user)

        response = client.post(
            "/api/operator/check-compliance/",
            {"deal_id": sample_supplies_deal.id},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.data

        # التحقق من الحقول الأساسية
        assert data["deal_id"] == str(sample_supplies_deal.id)
        assert data["is_compliant"] is False
        assert data["compliance_score"] < 100
        assert data["missing_count"] > 0
        assert len(data["missing_documents"]) == data["missing_count"]
        assert len(data["missing_documents"]) == data["total_required"]

        # التحقق من وجود الوثائق الإلزامية في قائمة النواقص
        missing_codes = [doc["code"] for doc in data["missing_documents"]]
        assert "candidacy_declaration" in missing_codes
        assert "probity_declaration" in missing_codes
        assert "trade_register" in missing_codes
        assert "tax_id_nif" in missing_codes
        assert "tax_clearance" in missing_codes
        assert "social_clearance" in missing_codes
        assert "technical_memo" in missing_codes
        assert "financial_letter_and_bpu" in missing_codes

        # التحقق من توثيق العملية في سجل التدقيق غير القابل للتعديل
        assert AuditLog.objects.filter(
            user=operator_user,
            action="COMPLIANCE_CHECK_PERFORMED",
            resource_id=str(sample_supplies_deal.id),
        ).exists()

    def test_operator_fully_compliant(self, operator_user, sample_supplies_deal):
        """عندما يرفع المتعامل جميع الوثائق المطلوبة، يجب أن تكون نسبة الامتثال 100%"""
        profile, _ = OperatorProfile.objects.get_or_create(user=operator_user)
        profile.extra_data = {
            "registrationNumber": "16/00-1234567B22",
            "nif": "002216012345678",
            "documents": [
                {"code": "candidacy_declaration", "title": "التصريح بالترشح"},
                {"code": "probity_declaration", "title": "التصريح بالنزاهة"},
                {"code": "tax_clearance", "title": "شهادة الضرائب"},
                {"code": "social_clearance", "title": "شهادة الضمان الاجتماعي"},
                {"code": "technical_memo", "title": "المذكرة التقنية"},
                {"code": "financial_letter_and_bpu", "title": "رسالة التعهد"},
            ],
        }
        profile.save()

        client = APIClient()
        client.force_authenticate(user=operator_user)

        response = client.post(
            "/api/operator/check-compliance/",
            {"deal_id": sample_supplies_deal.id},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.data

        assert data["is_compliant"] is True
        assert data["compliance_score"] == 100
        assert data["missing_count"] == 0
        assert len(data["missing_documents"]) == 0
        assert data["submitted_count"] == data["total_required"]
        assert len(data["available_documents"]) == data["total_required"]
        assert "ملفكم يستوفي كافة الوثائق الأساسية" in data["advisory_notes"][0]

    def test_works_deal_requires_qualification_certificate(self, operator_user, sample_works_deal):
        """صفقات الأشغال تتطلب شهادة تأهيل مهني متخصصة"""
        profile, _ = OperatorProfile.objects.get_or_create(user=operator_user)
        profile.extra_data = {
            "registrationNumber": "16/00-1234567B22",
            "nif": "002216012345678",
            "documents": [
                {"code": "candidacy_declaration"},
                {"code": "probity_declaration"},
                {"code": "tax_clearance"},
                {"code": "social_clearance"},
                {"code": "technical_memo"},
                {"code": "financial_letter_and_bpu"},
            ],
        }
        profile.save()

        client = APIClient()
        client.force_authenticate(user=operator_user)

        response = client.post(
            "/api/operator/check-compliance/",
            {"deal_id": sample_works_deal.id},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.data

        # غير ممتثل بسبب نقص شهادة التأهيل المهني
        assert data["is_compliant"] is False
        assert data["missing_count"] == 1
        missing_codes = [d["code"] for d in data["missing_documents"]]
        assert "qualification_certificate" in missing_codes

        # إضافة شهادة التأهيل
        profile.extra_data["declaredQualificationLevel"] = "درجة 4 فما فوق"
        profile.save()

        response2 = client.post(
            "/api/operator/check-compliance/",
            {"deal_id": sample_works_deal.id},
            format="json",
        )
        assert response2.data["is_compliant"] is True
        assert response2.data["compliance_score"] == 100


@pytest.mark.django_db
class TestCahierSpecsUploadedFileServing:
    """اختبار إرجاع ملف دفتر الشروط المرفوع فعلياً أو المولد تلقائياً كـ fallback"""

    def test_serves_uploaded_file_when_present(self, authority_user, sample_supplies_deal):
        # إنشاء دفتر شروط مع ملف مرفوع
        pdf_content = b"%PDF-1.4 Mock Uploaded Cahier Specs File Content"
        uploaded_file = SimpleUploadedFile(
            "official_cahier_specs.pdf",
            pdf_content,
            content_type="application/pdf",
        )

        specs = CahierSpecs.objects.create(
            deal=sample_supplies_deal,
            file=uploaded_file,
            administrative_clauses={"clause": "official"},
        )

        client = APIClient()
        client.force_authenticate(user=authority_user)

        response = client.get(f"/api/procurements/deals/{sample_supplies_deal.id}/specs-pdf/")
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "application/pdf"
        assert response.getvalue() == pdf_content

    def test_falls_back_to_generator_when_file_is_none(self, authority_user, sample_supplies_deal):
        specs = CahierSpecs.objects.create(
            deal=sample_supplies_deal,
            file=None,
            administrative_clauses={"clause": "generated"},
        )

        client = APIClient()
        client.force_authenticate(user=authority_user)

        response = client.get(f"/api/procurements/deals/{sample_supplies_deal.id}/specs-pdf/")
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "application/pdf"
        assert response.content.startswith(b"%PDF-")


def test_ai_analyze_tender_throttling_rate():
    """التحقق من أن حد الـ Throttling لمسار تحليل المناقصات هو 50 طلباً بالساعة"""
    assert AIAnalyzeTenderThrottle.rate == "50/hour"
    assert AIInsightsThrottle.rate == "50/hour"
    assert AIAnalyzeTenderThrottle.scope == "ai_analyze_tender"
