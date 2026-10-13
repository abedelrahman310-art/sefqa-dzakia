"""
اختبارات وحدة وتكامل لمساعد تقدير الأسعار المرجعية والميزانية التقديرية
(Price Estimator AI Assistant) وفق القانون 23-12 والتقسيم الإداري 69 ولاية.
"""
import pytest
from rest_framework.test import APIClient
from django.core.management import call_command
from django.core.cache import cache

from apps.users.models import CustomUser
from apps.ai_gateway.models import MarketPriceReference


@pytest.fixture(autouse=True)
def seeded_market_prices(db):
    """
    بذر الأسعار المرجعية الوطنية (1380 سجلاً) في قاعدة بيانات الاختبار،
    وتنظيف التخزين المؤقت قبل وبعد كل اختبار.
    """
    cache.clear()
    if not MarketPriceReference.objects.exists():
        call_command("seed_market_prices", allow_production=True, stdout=None)
    yield
    cache.clear()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def authority_user(db):
    return CustomUser.objects.create_user(
        email="test_authority@safaqat.dz",
        password="auth_user_pass_2026",
        role="authority",
        organization_name="مديرية التجهيزات العمومية لولاية الجزائر",
    )


@pytest.fixture
def operator_user(db):
    return CustomUser.objects.create_user(
        email="test_operator@safaqat.dz",
        password="oper_user_pass_2026",
        role="operator",
        organization_name="شركة المقاولات والأشغال الحديثة",
    )



@pytest.mark.django_db
class TestPriceEstimator:
    """مجموعة اختبارات المساعد الذكي لتقدير الأسعار المرجعية."""

    def test_estimate_works_returns_valid_price(self, api_client, authority_user):
        """1. authority + works + Alger 16 -> تحقق: 200 + estimated_avg = 20,125,000."""
        api_client.force_authenticate(user=authority_user)
        payload = {
            "template_type": "works",
            "category": "بناء — هياكل خرسانية",
            "quantity": 500,
            "unit": "م²",
            "wilaya": "16",
        }
        response = api_client.post("/api/ai/price-estimate/", payload, format="json")
        assert response.status_code == 200
        assert float(response.data["estimated_avg"]) == 20125000.0
        assert response.data["template_type"] == "works"
        assert response.data["currency"] == "DZD"
        assert response.data["wilaya"] == "16"
        assert float(response.data["unit_price"]) == 40250.0

    def test_estimate_supplies_with_high_confidence(self, api_client, authority_user):
        """2. supplies + حاسوب مكتبي -> تحقق: 200 + confidence = 0.90 + margin = 5%."""
        api_client.force_authenticate(user=authority_user)
        payload = {
            "template_type": "supplies",
            "category": "حاسوب مكتبي",
            "quantity": 10,
            "wilaya": "16",
        }
        response = api_client.post("/api/ai/price-estimate/", payload, format="json")
        assert response.status_code == 200
        assert float(response.data["confidence"]) == 0.90
        assert float(response.data["margin_percent"]) == 5.0
        assert response.data["confidence_level"] == "high"

    def test_estimate_unknown_category_404(self, api_client, authority_user):
        """3. works + 'نوع غير موجود' -> تحقق: 404 + available_categories موجودة."""
        api_client.force_authenticate(user=authority_user)
        payload = {
            "template_type": "works",
            "category": "نوع غير موجود",
            "quantity": 100,
            "wilaya": "16",
        }
        response = api_client.post("/api/ai/price-estimate/", payload, format="json")
        assert response.status_code == 404
        assert "available_categories" in response.data
        assert isinstance(response.data["available_categories"], list)
        assert len(response.data["available_categories"]) > 0
        assert "detail" in response.data

    def test_estimate_different_wilaya_different_price(self, api_client, authority_user):
        """4. نفس الفئة + Alger 16 vs Wilaya 69 -> تحقق: سعر 16 أعلى من 69 بسبب المعامل الإقليمي."""
        api_client.force_authenticate(user=authority_user)
        payload_16 = {
            "template_type": "works",
            "category": "بناء — هياكل خرسانية",
            "quantity": 100,
            "wilaya": "16",
        }
        payload_69 = {
            "template_type": "works",
            "category": "بناء — هياكل خرسانية",
            "quantity": 100,
            "wilaya": "69",
        }
        res_16 = api_client.post("/api/ai/price-estimate/", payload_16, format="json")
        res_69 = api_client.post("/api/ai/price-estimate/", payload_69, format="json")

        assert res_16.status_code == 200
        assert res_69.status_code == 200
        assert float(res_16.data["unit_price"]) > float(res_69.data["unit_price"])
        assert float(res_16.data["estimated_avg"]) > float(res_69.data["estimated_avg"])

    def test_estimate_new_wilaya_69_works(self, api_client, authority_user):
        """5. works + الأبيض سيدي الشيخ (69) -> تحقق: 200 + wilaya_name.ar يحتوي 'الأبيض'."""
        api_client.force_authenticate(user=authority_user)
        payload = {
            "template_type": "works",
            "category": "بناء — هياكل خرسانية",
            "quantity": 50,
            "wilaya": "69",
        }
        response = api_client.post("/api/ai/price-estimate/", payload, format="json")
        assert response.status_code == 200
        assert response.data["wilaya"] == "69"
        assert "الأبيض" in response.data["wilaya_name"]["ar"]
        assert "El Abiodh" in response.data["wilaya_name"]["fr"]

    def test_estimate_advisory_flags_set(self, api_client, authority_user):
        """6. أي طلب صحيح -> تحقق: is_advisory=True + human_verification_required=True."""
        api_client.force_authenticate(user=authority_user)
        payload = {
            "template_type": "works",
            "category": "طرق — سفلتة",
            "quantity": 200,
            "wilaya": "16",
        }
        response = api_client.post("/api/ai/price-estimate/", payload, format="json")
        assert response.status_code == 200
        assert response.data["is_advisory"] is True
        assert response.data["human_verification_required"] is True
        assert "disclaimer" in response.data
        assert "23-12" in response.data["disclaimer"]

    def test_estimate_confidence_margins(self, api_client, authority_user):
        """7. 3 حالات: confidence 0.90 -> 5%, 0.85 -> 5%, 0.75 -> 10% -> margin_percent صحيح."""
        api_client.force_authenticate(user=authority_user)

        # الحالة 1: supplies لسلعة معيارية (ثقة 0.90 -> هامش 5%)
        res_high = api_client.post(
            "/api/ai/price-estimate/",
            {
                "template_type": "supplies",
                "category": "ورق A4",
                "quantity": 50,
                "wilaya": "16",
            },
            format="json",
        )
        assert res_high.status_code == 200
        assert float(res_high.data["confidence"]) == 0.90
        assert float(res_high.data["margin_percent"]) == 5.0

        # الحالة 2: ولاية كبرى (ثقة 0.85 -> هامش 5%)
        res_major = api_client.post(
            "/api/ai/price-estimate/",
            {
                "template_type": "works",
                "category": "بناء — هياكل خرسانية",
                "quantity": 100,
                "wilaya": "16",
            },
            format="json",
        )
        assert res_major.status_code == 200
        assert float(res_major.data["confidence"]) == 0.85
        assert float(res_major.data["margin_percent"]) == 5.0

        # الحالة 3: ولاية مستحدثة كالولاية 69 (ثقة 0.75 -> هامش 10%)
        res_new = api_client.post(
            "/api/ai/price-estimate/",
            {
                "template_type": "works",
                "category": "بناء — هياكل خرسانية",
                "quantity": 100,
                "wilaya": "69",
            },
            format="json",
        )
        assert res_new.status_code == 200
        assert float(res_new.data["confidence"]) == 0.75
        assert float(res_new.data["margin_percent"]) == 10.0

    def test_estimate_from_description_works(self, api_client, authority_user):
        """8. description: 'بناء 500 م² هياكل خرسانية' -> تحقق: 200 + category + quantity=500."""
        api_client.force_authenticate(user=authority_user)
        payload = {
            "template_type": "works",
            "description": "بناء 500 م² هياكل خرسانية",
            "wilaya": "16",
        }
        response = api_client.post("/api/ai/price-estimate/", payload, format="json")
        assert response.status_code == 200
        assert response.data["category"] == "بناء — هياكل خرسانية"
        assert float(response.data["quantity"]) == 500.0
        assert response.data["unit"] == "م²"
        assert float(response.data["estimated_avg"]) == 20125000.0

    def test_estimate_from_description_no_match(self, api_client, authority_user):
        """9. description: 'مرحبا كيف حالك' -> تحقق: 400 + رسالة خطأ واضحة."""
        api_client.force_authenticate(user=authority_user)
        payload = {
            "template_type": "works",
            "description": "مرحبا كيف حالك",
            "wilaya": "16",
        }
        response = api_client.post("/api/ai/price-estimate/", payload, format="json")
        assert response.status_code == 400
        assert "detail" in response.data
        assert "تعذر" in response.data["detail"] or "خطأ" in response.data["detail"]

    def test_operator_cannot_access(self, api_client, operator_user):
        """10. operator + أي طلب -> تحقق: 403 Forbidden."""
        api_client.force_authenticate(user=operator_user)
        payload = {
            "template_type": "works",
            "category": "بناء — هياكل خرسانية",
            "quantity": 100,
            "wilaya": "16",
        }
        response = api_client.post("/api/ai/price-estimate/", payload, format="json")
        assert response.status_code == 403
        assert "detail" in response.data
