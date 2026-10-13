"""
اختبارات شاملة لطبقة AI الرقابية لمنصة صفقات ذكية
تغطي: الصلاحيات، المنطق الاستشاري، النماذج، الـ API endpoints
تعمل مع SQLite (بدون PostgreSQL) و RuleBasedFallback (بدون API key)
"""
import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from apps.users.models import CustomUser
from apps.ai_gateway.models import AIInsight, AIConversation, AIMessage
from apps.procurements.models import ProcurementDeal


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def central_admin(db):
    return CustomUser.objects.create_user(
        email="central@safaqat.dz",
        password="AdminPass123!",
        role="central_admin",
        organization_name="الرقابة الوطنية للصفقات",
    )


@pytest.fixture
def authority_user(db):
    return CustomUser.objects.create_user(
        email="authority@safaqat.dz",
        password="AuthPass123!",
        role="authority",
        organization_name="مديرية التجهيز ولاية الجزائر",
    )


@pytest.fixture
def operator_user(db):
    return CustomUser.objects.create_user(
        email="operator@safaqat.dz",
        password="OpPass123!",
        role="operator",
        organization_name="مؤسسة البناء والإنجاز",
    )


@pytest.fixture
def sample_insight(db, central_admin):
    return AIInsight.objects.create(
        severity=AIInsight.Severity.HIGH,
        category=AIInsight.Category.COMPLIANCE,
        title="دفتر شروط غير مؤشر للصفقة المرجعية 2024/001",
        description="تفاصيل المخالفة الإجرائية",
        is_advisory=True,
        human_verification_required=True,
        confidence=0.9,
    )


@pytest.fixture
def authority_insight(db, authority_user):
    return AIInsight.objects.create(
        severity=AIInsight.Severity.MEDIUM,
        category=AIInsight.Category.DELAY,
        title="تأخر صفقة الولاية",
        description="وصف التأخير",
        target_authority=authority_user,
        is_advisory=True,
        human_verification_required=True,
        confidence=0.8,
    )


@pytest.fixture
def sample_deal(db, authority_user):
    return ProcurementDeal.objects.create(
        reference_number="2024/TEST/001",
        title="صفقة اختبارية",
        description="وصف الصفقة",
        authority=authority_user,
        current_stage=2,
        estimated_budget=1_000_000,
        wilaya="الجزائر",
    )


# ─────────────────────────────────────────────────────────────────────────────
# 1. اختبارات الصلاحيات (Permission Tests)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCentralEndpointsRequireAdmin:
    """كل نقاط نهاية /central/* تتطلب دور central_admin"""

    CENTRAL_ENDPOINTS = [
        ("GET", "/api/ai/central/insights/"),
        ("POST", "/api/ai/central/insights/generate/"),
        ("GET", "/api/ai/central/suspicions/"),
        ("POST", "/api/ai/central/chat/"),
        ("GET", "/api/ai/central/alerts/"),
        ("GET", "/api/ai/health/"),
    ]

    def _client_for(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    @pytest.mark.parametrize("method,url", CENTRAL_ENDPOINTS)
    def test_operator_blocked_on_central_endpoints(self, operator_user, method, url):
        """المتعامل الاقتصادي يحصل على 403 على كل نقاط Central"""
        client = self._client_for(operator_user)
        response = getattr(client, method.lower())(url, format="json")
        assert response.status_code == 403, (
            f"يجب أن يحصل المتعامل على 403 على {url}"
        )

    @pytest.mark.parametrize("method,url", CENTRAL_ENDPOINTS)
    def test_authority_blocked_on_central_endpoints(self, authority_user, method, url):
        """المصلحة المتعاقدة تحصل على 403 على نقاط Central"""
        client = self._client_for(authority_user)
        response = getattr(client, method.lower())(url, format="json")
        assert response.status_code == 403, (
            f"يجب أن تحصل المصلحة على 403 على {url}"
        )

    def test_unauthenticated_blocked(self):
        """المستخدم غير المصادق يحصل على 401"""
        client = APIClient()
        response = client.get("/api/ai/central/insights/")
        assert response.status_code == 401

    def test_central_admin_can_access_insights(self, central_admin):
        """الإدارة المركزية تصل لقائمة التوصيات بنجاح"""
        client = self._client_for(central_admin)
        response = client.get("/api/ai/central/insights/")
        assert response.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# 2. اختبارات نقطة نهاية التوصيات (Insights Endpoint Tests)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestInsightsEndpoint:

    def test_insights_endpoint_returns_list(self, central_admin, sample_insight):
        """يعيد قائمة من التوصيات النشطة"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.get("/api/ai/central/insights/")
        assert response.status_code == 200
        assert isinstance(response.data, list)

    def test_insights_filter_by_severity(self, central_admin, sample_insight):
        """الفلترة بمستوى الخطورة"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.get("/api/ai/central/insights/?severity=high")
        assert response.status_code == 200
        for item in response.data:
            assert item["severity"] == "high"

    def test_insights_filter_by_category(self, central_admin, sample_insight):
        """الفلترة بالتصنيف"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.get("/api/ai/central/insights/?category=compliance")
        assert response.status_code == 200
        for item in response.data:
            assert item["category"] == "compliance"

    def test_resolved_insights_excluded(self, central_admin, sample_insight):
        """التوصيات المعالجة لا تظهر في القائمة"""
        sample_insight.is_resolved = True
        sample_insight.save()
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.get("/api/ai/central/insights/")
        assert response.status_code == 200
        ids = [str(item["id"]) for item in response.data]
        assert str(sample_insight.id) not in ids


# ─────────────────────────────────────────────────────────────────────────────
# 3. اختبار توليد التوصيات
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestGenerateInsights:

    def test_generate_insights_creates_records(self, central_admin):
        """POST /generate/ ينتج قائمة توصيات"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.post("/api/ai/central/insights/generate/")
        assert response.status_code == 201
        assert "generated" in response.data
        assert isinstance(response.data["generated"], int)
        assert response.data.get("is_advisory") is True

    def test_generate_insights_all_advisory(self, central_admin):
        """كل توصية تحمل is_advisory=True"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.post("/api/ai/central/insights/generate/")
        assert response.status_code == 201
        for insight in response.data.get("insights", []):
            assert insight.get("is_advisory") is True
            assert insight.get("human_verification_required") is True


# ─────────────────────────────────────────────────────────────────────────────
# 4. اختبار معالجة التوصية (Resolve)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestResolveInsight:

    def test_resolve_insight_sets_fields(self, central_admin, sample_insight):
        """معالجة التوصية تضبط is_resolved وresolution_notes"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.post(
            f"/api/ai/central/insights/{sample_insight.id}/resolve/",
            {"resolution_notes": "تم التحقق البشري وتأكيد المعالجة الإدارية."},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["is_resolved"] is True
        assert response.data["resolution_notes"] == "تم التحقق البشري وتأكيد المعالجة الإدارية."

    def test_resolve_insight_requires_notes(self, central_admin, sample_insight):
        """يجب تقديم ملاحظات المعالجة"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.post(
            f"/api/ai/central/insights/{sample_insight.id}/resolve/",
            {"resolution_notes": "قصير"},
            format="json",
        )
        assert response.status_code == 400

    def test_resolve_already_resolved_insight_fails(self, central_admin, sample_insight):
        """لا يمكن معالجة توصية تمت معالجتها مسبقاً"""
        sample_insight.is_resolved = True
        sample_insight.save()
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.post(
            f"/api/ai/central/insights/{sample_insight.id}/resolve/",
            {"resolution_notes": "محاولة ثانية للمعالجة"},
            format="json",
        )
        assert response.status_code == 400


# ─────────────────────────────────────────────────────────────────────────────
# 5. اختبار نقطة الشبهات (Suspicions)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestSuspicionsEndpoint:

    def test_suspicions_endpoint_returns_dict(self, central_admin):
        """يعيد قاموساً بمحاور الشبهات الأربعة"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.get("/api/ai/central/suspicions/")
        assert response.status_code == 200
        assert "suspicions" in response.data
        suspicions = response.data["suspicions"]
        assert "bid_rigging" in suspicions
        assert "price_manipulation" in suspicions
        assert "phantom_competition" in suspicions
        assert "conflict_of_interest" in suspicions

    def test_suspicions_are_advisory(self, central_admin):
        """الشبهات استشارية وتستوجب تحققاً بشرياً"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.get("/api/ai/central/suspicions/")
        assert response.status_code == 200
        assert response.data.get("is_advisory") is True
        assert response.data.get("human_verification_required") is True


# ─────────────────────────────────────────────────────────────────────────────
# 6. اختبار محادثة الإدارة (Admin Chat)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestAdminChatEndpoint:

    def test_chat_endpoint_creates_conversation(self, central_admin):
        """يُنشئ محادثة ويعيد conversation_id"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.post(
            "/api/ai/central/chat/",
            {"message": "كم عدد الصفقات المتأخرة حالياً؟"},
            format="json",
        )
        assert response.status_code == 200
        assert "conversation_id" in response.data
        assert "answer" in response.data

    def test_chat_endpoint_returns_advisory_flag(self, central_admin):
        """كل رد يحمل is_advisory=True دائماً"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.post(
            "/api/ai/central/chat/",
            {"message": "ما هي أبرز المخاطر في الصفقات الحالية؟"},
            format="json",
        )
        assert response.status_code == 200
        assert response.data.get("is_advisory") is True
        assert response.data.get("human_verification_required") is True

    def test_chat_continues_existing_conversation(self, central_admin):
        """المحادثة تتواصل عبر conversation_id"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        first = client.post(
            "/api/ai/central/chat/",
            {"message": "مرحباً، احتاج معلومات عن التأخيرات"},
            format="json",
        )
        assert first.status_code == 200
        conv_id = first.data["conversation_id"]

        second = client.post(
            "/api/ai/central/chat/",
            {"conversation_id": conv_id, "message": "هل توجد ولايات أكثر تأخيراً؟"},
            format="json",
        )
        assert second.status_code == 200
        assert second.data["conversation_id"] == conv_id

    def test_chat_rejects_short_message(self, central_admin):
        """رسالة قصيرة جداً مرفوضة"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.post(
            "/api/ai/central/chat/",
            {"message": "أ"},
            format="json",
        )
        assert response.status_code == 400

    def test_chat_persists_ai_messages(self, central_admin):
        """الرسائل تُحفظ في AIMessage"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.post(
            "/api/ai/central/chat/",
            {"message": "أعطني تقريراً عن أداء المنصة"},
            format="json",
        )
        assert response.status_code == 200
        conv_id = response.data["conversation_id"]
        conv = AIConversation.objects.get(id=conv_id)
        assert conv.messages.count() >= 2  # رسالة المستخدم + رد المساعد


# ─────────────────────────────────────────────────────────────────────────────
# 7. اختبار التنبيهات الذكية (Smart Alerts)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestSmartAlertsEndpoint:

    def test_alerts_endpoint_returns_kpis(self, central_admin):
        """يعيد الـ KPIs الأربعة بالبنية المطلوبة"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.get("/api/ai/central/alerts/")
        assert response.status_code == 200
        assert "alerts" in response.data
        alerts = response.data["alerts"]
        assert "compliance_rate" in alerts
        assert "objections" in alerts
        assert "critical_tenders" in alerts
        assert "delayed_tenders" in alerts

    def test_alerts_structure(self, central_admin):
        """كل تنبيه يحوي: value، alert، message"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.get("/api/ai/central/alerts/")
        assert response.status_code == 200
        for key, item in response.data["alerts"].items():
            assert "value" in item, f"حقل 'value' مفقود في {key}"
            assert "alert" in item, f"حقل 'alert' مفقود في {key}"
            assert item["alert"] in ["low", "medium", "high", "critical"], (
                f"قيمة 'alert' غير صالحة في {key}: {item['alert']}"
            )

    def test_alerts_is_advisory(self, central_admin):
        """التنبيهات استشارية وتشير للمرجع القانوني"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.get("/api/ai/central/alerts/")
        assert response.status_code == 200
        assert response.data.get("is_advisory") is True


# ─────────────────────────────────────────────────────────────────────────────
# 8. اختبار نقطة الصحة (Health Endpoint)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestHealthEndpoint:

    def test_health_endpoint_returns_provider(self, central_admin):
        """يعيد اسم المزود وحالة الاتصال"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.get("/api/ai/health/")
        assert response.status_code == 200
        assert "provider" in response.data
        assert "is_available" in response.data
        assert response.data.get("is_advisory") is True

    def test_health_returns_rule_based_without_api_key(self, central_admin):
        """بدون API key يعيد RuleBasedFallback وis_available=True"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.get("/api/ai/health/")
        assert response.status_code == 200
        assert response.data["provider"] == "RuleBasedFallback"
        assert response.data["is_available"] is True


# ─────────────────────────────────────────────────────────────────────────────
# 9. اختبار بوابة المصلحة المتعاقدة (Authority Insights)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestAuthorityInsightsEndpoint:

    def test_authority_can_access_own_insights(self, authority_user, authority_insight):
        """المصلحة المتعاقدة تصل لتوصياتها الخاصة"""
        client = APIClient()
        client.force_authenticate(user=authority_user)
        response = client.get("/api/ai/authority/insights/")
        assert response.status_code == 200
        assert isinstance(response.data, list)

    def test_operator_cannot_access_authority_insights(self, operator_user):
        """المتعامل الاقتصادي محجوب من بوابة التوصيات"""
        client = APIClient()
        client.force_authenticate(user=operator_user)
        response = client.get("/api/ai/authority/insights/")
        assert response.status_code == 403

    def test_authority_only_sees_own_insights(self, authority_user, authority_insight, central_admin):
        """المصلحة لا ترى توصيات مصالح أخرى"""
        other_auth = CustomUser.objects.create_user(
            email="other_auth@safaqat.dz",
            password="Pass123!",
            role="authority",
            organization_name="مصلحة أخرى",
        )
        AIInsight.objects.create(
            severity=AIInsight.Severity.HIGH,
            category=AIInsight.Category.DELAY,
            title="توصية مصلحة أخرى",
            description="يجب ألا تراها المصلحة الأولى",
            target_authority=other_auth,
            is_advisory=True,
            human_verification_required=True,
        )
        client = APIClient()
        client.force_authenticate(user=authority_user)
        response = client.get("/api/ai/authority/insights/")
        assert response.status_code == 200
        for item in response.data:
            # لا يوجد طريقة مباشرة للتحقق من target_authority في الـ serializer حالياً
            # لكن نتحقق أن التوصيات المعادة تخص المصلحة الصحيحة
            assert item["title"] != "توصية مصلحة أخرى"

    def test_central_admin_can_access_authority_insights(self, central_admin, authority_insight):
        """الإدارة المركزية تصل لنقطة authority/insights"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.get("/api/ai/authority/insights/")
        assert response.status_code == 200


# ─────────────────────────────────────────────────────────────────────────────
# 10. اختبار المحرك المحلي القاعدي (RuleBasedFallback)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestRuleBasedFallback:

    def test_rule_based_always_available(self):
        """المحرك المحلي متاح دائماً بدون API key"""
        from apps.ai_gateway.services.llm_client import RuleBasedFallback
        client = RuleBasedFallback()
        assert client.test_connection() is True

    def test_rule_based_returns_advisory_content(self):
        """المحرك المحلي يعيد محتوى نصياً عربياً"""
        from apps.ai_gateway.services.llm_client import RuleBasedFallback
        client = RuleBasedFallback()
        result = client.chat([
            {"role": "system", "content": "أنت مساعد رقابي"},
            {"role": "user", "content": "كم عدد الصفقات المتأخرة؟"},
        ])
        assert isinstance(result, str)
        assert len(result) > 20

    def test_get_llm_client_returns_rule_based_without_keys(self):
        """get_llm_client() يعيد RuleBasedFallback بدون GEMINI_API_KEY"""
        import os
        # ضمان عدم وجود مفاتيح في البيئة
        os.environ.pop("GEMINI_API_KEY", None)
        os.environ.pop("ANTHROPIC_API_KEY", None)
        os.environ.pop("OPENAI_API_KEY", None)
        os.environ["LLM_PROVIDER"] = "rule_based"

        from apps.ai_gateway.services.llm_client import get_llm_client, RuleBasedFallback
        client = get_llm_client()
        assert isinstance(client, RuleBasedFallback)


# ─────────────────────────────────────────────────────────────────────────────
# 11. اختبار الامتثال القانوني العام (Advisory Only)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestAdvisoryComplianceGlobal:

    def test_insights_are_advisory_only(self, central_admin, sample_insight):
        """كل توصية تحمل is_advisory=True وhuman_verification_required=True"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.get("/api/ai/central/insights/")
        assert response.status_code == 200
        for item in response.data:
            assert item["is_advisory"] is True
            assert item["human_verification_required"] is True

    def test_ai_insight_model_defaults_advisory(self, db):
        """نموذج AIInsight يضبط is_advisory=True افتراضياً"""
        insight = AIInsight(
            severity=AIInsight.Severity.INFO,
            category=AIInsight.Category.RECOMMENDATION,
            title="توصية اختبارية",
            description="وصف",
        )
        assert insight.is_advisory is True
        assert insight.human_verification_required is True

    def test_pii_not_in_chat_response(self, central_admin):
        """ردود المحادثة لا تحتوي على PII"""
        client = APIClient()
        client.force_authenticate(user=central_admin)
        response = client.post(
            "/api/ai/central/chat/",
            {"message": "أعطني تفاصيل المستخدمين في النظام"},
            format="json",
        )
        if response.status_code == 200:
            answer = response.data.get("answer", "")
            # التحقق من عدم ظهور عنوان البريد الإلكتروني
            assert "@" not in answer or "[محجوب" in answer
