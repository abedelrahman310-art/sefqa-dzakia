import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.reports.central_views import (
    CentralAuthoritiesView,
    CentralOperatorsView,
    CentralDashboardView,
    CentralDealsView,
)
from apps.ai_gateway.views import AIAnalyzeTenderView
from apps.legal_rag.services.rag_service import build_rag_system_prompt
from apps.procurements.models import ProcurementDeal

User = get_user_model()


@pytest.fixture
def central_admin(db):
    user = User.objects.create_user(
        email="central@gov.dz",
        password="ValidPassword123!",
        role="central_admin",
    )
    return user


@pytest.fixture
def operator_user(db):
    user = User.objects.create_user(
        email="operator@company.dz",
        organization_name="SARL Digital Tech",
        password="ValidPassword123!",
        role="operator",
    )
    return user


@pytest.fixture
def authority_user(db):
    user = User.objects.create_user(
        email="authority@wilaya.dz",
        organization_name="مديرية التجهيزات العمومية",
        password="ValidPassword123!",
        role="authority",
    )
    return user


@pytest.mark.django_db
class TestZeroPaperCompliance:
    def test_heuristic_analysis_zero_paper_no_three_envelopes(self):
        analyzer = AIAnalyzeTenderView()
        result = analyzer._heuristic_analysis("نص تجريبي لدفتر شروط", None)

        all_text = " ".join(
            result.get("warnings", [])
            + result.get("qualification_conditions", [])
            + result.get("deadlines", [])
            + result.get("recommendations", [])
            + [result.get("summary", "")]
        )

        assert "ثلاثة أظرفة" not in all_text, "يجب عدم ذكر ثلاثة أظرفة نهائياً في التحليل"
        assert "ثلاث أظرفة" not in all_text, "يجب عدم ذكر ثلاث أظرفة"
        assert "أظرفة منفصلة" not in all_text, "يجب عدم طلب أظرفة ورقية منفصلة"
        assert "صفر ورقة" in all_text or "رقمي بالكامل" in all_text, "يجب التأكيد على الرقمنة الشاملة"
        assert "AES-256" in all_text, "يجب الإشارة لتشفير العرض المالي بـ AES-256"
        assert len(result.get("recommendations", [])) == 5, "يجب توفير 5 توصيات عملية"
        assert "الربط البيني للدولة" in all_text, "يجب التحقق عبر الربط البيني"

    def test_rag_system_prompt_mandates_zero_paper(self):
        prompt = build_rag_system_prompt()
        assert "صفر ورقة" in prompt
        assert "AES-256" in prompt
        assert "أظرفة ورقية" in prompt
        assert "لا تنصح المتعامل إطلاقاً بإعداد أو تقديم أظرفة ورقية" in prompt


@pytest.mark.django_db
class TestCentralOversightEndpointsRealData:
    def test_central_authorities_queries_real_users_only(self, central_admin, authority_user):
        client = APIClient()
        client.force_authenticate(user=central_admin)

        response = client.get("/api/central/authorities/")
        assert response.status_code == 200
        data = response.json()
        assert "authorities" in data
        assert data["count"] == 1
        assert data["authorities"][0]["id"] == str(authority_user.id)
        assert data["authorities"][0]["email"] == authority_user.email

    def test_central_operators_queries_real_users_only(self, central_admin, operator_user):
        client = APIClient()
        client.force_authenticate(user=central_admin)

        response = client.get("/api/central/operators/")
        assert response.status_code == 200
        data = response.json()
        assert "operators" in data
        assert data["count"] == 1
        assert data["operators"][0]["id"] == str(operator_user.id)
        assert data["operators"][0]["company_name"] == "SARL Digital Tech"

    def test_central_dashboard_kpis_count_dynamically(self, central_admin, authority_user, operator_user):
        client = APIClient()
        client.force_authenticate(user=central_admin)

        response = client.get("/api/central/dashboard/")
        assert response.status_code == 200
        data = response.json()
        assert data["total_authorities_count"] == 1
        assert data["active_authorities_count"] == 0
        assert data["total_operators_count"] == 1
        assert data["active_deals_count"] == 0
        assert data["total_deals"] == 0

    def test_central_deals_queries_real_deals_only(self, central_admin, authority_user):
        client = APIClient()
        client.force_authenticate(user=central_admin)

        response = client.get("/api/central/deals/")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 0
        assert data["deals"] == []

        deal = ProcurementDeal.objects.create(
            title="مشروع بناء مدرسة رقمية",
            reference_number="DEAL-2026-TEST",
            authority=authority_user,
            estimated_budget=Decimal("50000000.00"),
            current_stage=2,
            wilaya="الجزائر",
        )

        response2 = client.get("/api/central/deals/")
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["count"] == 1
        assert data2["deals"][0]["id"] == str(deal.id)
        assert data2["deals"][0]["reference_number"] == "DEAL-2026-TEST"
