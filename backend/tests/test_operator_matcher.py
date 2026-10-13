"""
اختبارات وحدة وتكامل لخدمة ومسار التوفيق الذكي للمتعامل الاقتصادي
(AI Operator Matching & Recommendations) وفق أحكام القانون 23-12.
"""

from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.ai_gateway.services.operator_matcher import (
    recommend_tenders,
    score_tender_for_operator,
)
from apps.procurements.models import ProcurementDeal
from apps.users.models import CustomUser, OperatorProfile


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def authority_user(db):
    """مصلحة متعاقدة لإنشاء الصفقات"""
    return CustomUser.objects.create_user(
        email="authority_test_matcher@safaqat.dz",
        password="auth_password_2026",
        role="authority",
        organization_name="مديرية التجهيزات العمومية لولاية الجزائر",
    )


@pytest.fixture
def operator_user(db):
    """متعامل اقتصادي مع ملف مهني مكتمل"""
    user = CustomUser.objects.create_user(
        email="operator_test_matcher@safaqat.dz",
        password="op_password_2026",
        role="operator",
        organization_name="شركة مقاولات وأشغال البناء الكبرى",
    )
    OperatorProfile.objects.create(
        user=user,
        sector="works",
        available_wilayas=["16", "09"],
        max_capacity=Decimal("150000000.00"),
        years_of_experience=5,
        employee_count=45,
    )
    return user


@pytest.fixture
def sample_tenders(db, authority_user):
    """
    إنشاء صفقات متعددة بمراحل وخصائص مختلفة لاختبار التقييم والترتيب
    """
    now = timezone.now()

    # 1. صفقة نشر ملائمة جداً (أشغال + الجزائر 16 + ميزانية 80 مليون دج + مهلة 20 يوماً)
    tender_high = ProcurementDeal.objects.create(
        reference_number="MATCHER-DZ-2026-WORKS",
        title="مشروع إنجاز مجمع مدرسي صنف 1 ومطعم ببلدية زرالدة",
        description="أشغال بناء وهياكل خرسانية مقاومة للزلازل",
        authority=authority_user,
        current_stage=4,  # نشر واستلام العروض
        estimated_budget=Decimal("80000000.00"),
        wilaya="الجزائر",
        submission_deadline=now + timedelta(days=20),
    )

    # 2. صفقة نشر أقل ملاءمة (لوازم + وهران 31 + ميزانية 400 مليون دج + مهلة يومين)
    tender_low = ProcurementDeal.objects.create(
        reference_number="MATCHER-DZ-2026-SUPPLIES",
        title="اقتناء حواسيب مكتبية وخوادم مركزية للمؤسسات التعليمية",
        description="توريد لوازم وعتاد معلوماتي وتجهيزات شبكية",
        authority=authority_user,
        current_stage=4,  # نشر واستلام العروض
        estimated_budget=Decimal("400000000.00"),
        wilaya="وهران",
        submission_deadline=now + timedelta(days=2),
    )

    # 3. صفقة في مرحلة التخطيط (Stage 1) — يجب ألا تظهر في التوصيات المنشورة
    tender_draft = ProcurementDeal.objects.create(
        reference_number="MATCHER-DZ-2026-PLAN",
        title="دراسة مسودة مشروع مركز أرشيف",
        description="تخطيط أولي وتحضير الحاجات فقط",
        authority=authority_user,
        current_stage=1,
        estimated_budget=Decimal("15000000.00"),
        wilaya="الجزائر",
        submission_deadline=now + timedelta(days=60),
    )

    return {
        "high": tender_high,
        "low": tender_low,
        "draft": tender_draft,
    }


@pytest.mark.django_db
class TestOperatorMatcher:
    """مجموعة اختبارات خدمة ونقطة نهاية التوفيق الذكي للمتعاملين."""

    def test_operator_can_access_recommendations(self, api_client, operator_user, sample_tenders):
        """1. operator -> 200 + is_advisory=True + count >= 0."""
        api_client.force_authenticate(user=operator_user)
        response = api_client.get("/api/ai/operator/recommendations/")

        assert response.status_code == 200
        data = response.data
        assert data.get("is_advisory") is True
        assert data.get("human_verification_required") is True
        assert isinstance(data.get("count"), int)
        assert data.get("count") >= 1
        assert isinstance(data.get("recommendations"), list)

    def test_authority_cannot_access(self, api_client, authority_user):
        """2. authority -> 403 (الميزة متاحة للمتعاملين فقط)."""
        api_client.force_authenticate(user=authority_user)
        response = api_client.get("/api/ai/operator/recommendations/")

        assert response.status_code == 403
        assert "للمتعاملين الاقتصاديين فقط" in response.data.get("detail", "")

    def test_anonymous_cannot_access(self, api_client):
        """3. مستخدم غير مسجل -> 401."""
        api_client.force_authenticate(user=None)
        response = api_client.get("/api/ai/operator/recommendations/")

        assert response.status_code == 401

    def test_limit_clamped_to_max_50(self, api_client, operator_user, sample_tenders):
        """4. ?limit=999 -> count <= 50 ولا يتجاوز الحد الأقصى."""
        api_client.force_authenticate(user=operator_user)
        response = api_client.get("/api/ai/operator/recommendations/?limit=999")

        assert response.status_code == 200
        assert response.data.get("count") <= 50

    def test_limit_fallback_for_invalid(self, api_client, operator_user, sample_tenders):
        """5. ?limit=invalid -> count <= 10 (fallback افتراضي)."""
        api_client.force_authenticate(user=operator_user)
        response = api_client.get("/api/ai/operator/recommendations/?limit=invalid")

        assert response.status_code == 200
        assert response.data.get("count") <= 10

    def test_score_tender_for_operator_returns_valid_structure(self, operator_user, sample_tenders):
        """
        6. score_tender_for_operator(op, tender):
           - تحقق: match_score (0-100), match_level في [excellent, good, fair, low]
           - score_breakdown فيه 5 مفاتيح أساسية
           - reasons و warnings قوائم نصوص
           - is_advisory=True
        """
        tender = sample_tenders["high"]
        result = score_tender_for_operator(operator_user, tender)

        assert 0 <= result["match_score"] <= 100
        assert result["match_level"] in ["excellent", "good", "fair", "low"]
        assert result["is_advisory"] is True
        assert result["tender_id"] == str(tender.id)
        assert result["reference"] == tender.reference_number
        assert result["title"] == tender.title

        breakdown = result["score_breakdown"]
        expected_keys = {"sector", "wilaya", "budget", "deadline", "experience"}
        assert set(breakdown.keys()) == expected_keys
        for key in expected_keys:
            assert isinstance(breakdown[key], int)

        assert isinstance(result["reasons"], list)
        assert isinstance(result["warnings"], list)
        # صفقة ملائمة في الأشغال لولاية الجزائر ضمن الميزانية
        assert "قطاع مطابق" in result["reasons"]
        assert "ولاية مطابقة" in result["reasons"]
        assert "الميزانية في نطاق قدرتك" in result["reasons"]
        assert "أجل كافٍ للتحضير" in result["reasons"]

    def test_recommendations_sorted_descending(self, operator_user, sample_tenders):
        """
        7. recommend_tenders(op, limit=10):
           - التوصيات مرتبة تنازلياً حسب match_score
           - لا تتضمن صفقات مسودة في مرحلة التخطيط
        """
        recs = recommend_tenders(operator_user, limit=10)

        assert len(recs) >= 2
        scores = [r["match_score"] for r in recs]
        assert scores == sorted(scores, reverse=True)
        assert recs[0]["match_score"] >= recs[1]["match_score"]

        # الصفقة عالية التوافق يجب أن تكون الأولى
        assert recs[0]["reference"] == sample_tenders["high"].reference_number
        assert recs[0]["match_score"] > recs[1]["match_score"]

        # التحقق من عدم تضمين صفقات مرحلة التخطيط غير المنشورة
        refs = [r["reference"] for r in recs]
        assert sample_tenders["draft"].reference_number not in refs
