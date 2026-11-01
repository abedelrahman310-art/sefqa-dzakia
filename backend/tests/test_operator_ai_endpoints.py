from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.ai_gateway.models import AIConversation
from apps.procurements.models import CahierSpecs, ProcurementDeal
from apps.users.models import CustomUser


@pytest.fixture
def operator_user(db):
    return CustomUser.objects.create_user(
        email="operator_ai@safaqat.dz",
        password="password123",
        role="operator",
        display_name="مؤسسة الأشغال النموذجية",
    )


@pytest.fixture
def authority_user(db):
    return CustomUser.objects.create_user(
        email="authority_ai@safaqat.dz",
        password="password123",
        role="authority",
        organization_name="مديرية التجهيزات العمومية",
    )


@pytest.fixture
def central_admin_user(db):
    return CustomUser.objects.create_user(
        email="central_admin_ai@safaqat.dz",
        password="password123",
        role="central_admin",
        display_name="المفتش المركزي للرقابة",
    )


@pytest.fixture
def ai_deal(authority_user):
    return ProcurementDeal.objects.create(
        reference_number="DZ-2026-AI-001",
        title="إنجاز مجمع إداري ولائي",
        description="أشغال بناء مجمع إداري مع التهيئة الخارجية.",
        authority=authority_user,
        estimated_budget=45000000,
        wilaya="الجزائر",
        current_stage=3,
        submission_deadline=timezone.now() + timedelta(days=12),
    )


@pytest.fixture
def ai_specs(ai_deal):
    return CahierSpecs.objects.create(
        deal=ai_deal,
        administrative_clauses={
            "procurement_nature": "works",
            "procurement_method": "call_for_tenders",
            "procurement_form": "open",
            "competition_scope": "national",
            "required_documents": [
                {
                    "code": "RC",
                    "name": "السجل التجاري",
                    "category": "candidacy",
                    "isMandatory": True,
                },
                {
                    "code": "TECH",
                    "name": "المراجع التقنية",
                    "category": "technical",
                    "isMandatory": True,
                },
            ],
        },
        technical_requirements={
            "details": "إنجاز الهيكل الخرساني والتجهيزات التقنية.",
            "duration": "8 أشهر",
            "warranty": "ضمان حسن التنفيذ لمدة سنة.",
        },
        financial_criteria={
            "terms": "الدفع بعد الاستلام المؤقت.",
            "scoring": "60% تقني و40% مالي.",
        },
    )


@pytest.fixture
def operator_client(operator_user):
    client = APIClient()
    client.force_authenticate(user=operator_user)
    return client


@pytest.fixture
def authority_client(authority_user):
    client = APIClient()
    client.force_authenticate(user=authority_user)
    return client


@pytest.fixture
def central_admin_client(central_admin_user):
    client = APIClient()
    client.force_authenticate(user=central_admin_user)
    return client


@pytest.mark.django_db
class TestOperatorLegalChat:
    def test_operator_gets_advisory_answer_and_conversation_is_persisted(
        self, operator_client, operator_user
    ):
        response = operator_client.post(
            "/api/ai/legal-chat/",
            {"message": "ما هي آجال الطعن على قرار الإسناد؟"},
            format="json",
        )

        assert response.status_code == 200
        assert response.data["is_advisory"] is True
        assert response.data["human_verification_required"] is True
        assert response.data["answer"]
        assert "القانون 23-12" in response.data["statutory_reference"]
        assert response.data["sources"]

        conversation = AIConversation.objects.get(user=operator_user)
        assert conversation.messages.count() == 2
        assert conversation.messages.filter(role="user").exists()
        assert conversation.messages.filter(role="assistant").exists()

    def test_operator_can_continue_existing_conversation(
        self, operator_client, operator_user
    ):
        first = operator_client.post(
            "/api/ai/legal-chat/",
            {"message": "ما هي وثائق ملف الترشح؟"},
            format="json",
        )
        assert first.status_code == 200

        second = operator_client.post(
            "/api/ai/legal-chat/",
            {
                "conversation_id": first.data["conversation_id"],
                "message": "وما هي ضمانات حسن التنفيذ؟",
            },
            format="json",
        )

        assert second.status_code == 200
        assert second.data["conversation_id"] == first.data["conversation_id"]
        conversation = AIConversation.objects.get(user=operator_user)
        assert conversation.messages.count() == 4

    def test_authority_can_use_legal_chat(self, authority_client):
        # المصلحة المتعاقدة مسموح لها استخدام المساعد القانوني للاستشارات وفق القانون 23-12
        response = authority_client.post(
            "/api/ai/legal-chat/",
            {"message": "ما هي حالات فسخ الصفقة على عاتق المتعامل؟"},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["answer"]

    def test_central_admin_cannot_use_legal_chat(self, central_admin_client):
        # الإدارة المركزية مستبعدة صراحة لأن لديها أدوات رقابية مستقلة
        response = central_admin_client.post(
            "/api/ai/legal-chat/",
            {"message": "ما هي آجال الطعن؟"},
            format="json",
        )
        assert response.status_code == 403


@pytest.mark.django_db
class TestAnalyzeTender:
    def test_operator_gets_structured_tender_analysis(self, operator_client, ai_deal, ai_specs):
        response = operator_client.post(
            "/api/ai/analyze-tender/",
            {"deal_id": str(ai_deal.id)},
            format="json",
        )

        assert response.status_code == 200
        data = response.data
        assert data["deal"]["id"] == str(ai_deal.id)
        assert data["is_advisory"] is True
        assert data["human_verification_required"] is True
        assert data["summary"]
        assert data["key_requirements"]
        assert data["recommendations"]
        assert data["legal_references"]
        assert any("ملف الترشح" in item["category"] for item in data["key_requirements"])
        assert any("السجل التجاري" in item["detail"] for item in data["key_requirements"])

    def test_analysis_works_without_cahier_specs(self, operator_client, ai_deal):
        response = operator_client.post(
            "/api/ai/analyze-tender/",
            {"deal_id": str(ai_deal.id)},
            format="json",
        )

        assert response.status_code == 200
        assert response.data["is_advisory"] is True
        assert any(
            point["title"] == "دفتر الشروط غير متاح"
            for point in response.data["points_of_attention"]
        )

    def test_analysis_requires_deal_id(self, operator_client):
        response = operator_client.post("/api/ai/analyze-tender/", {}, format="json")
        assert response.status_code == 400
        assert response.data.get("error")

    def test_non_operator_cannot_analyze_tender(self, authority_client, ai_deal):
        response = authority_client.post(
            "/api/ai/analyze-tender/",
            {"deal_id": str(ai_deal.id)},
            format="json",
        )
        assert response.status_code == 403
