"""اختبارات وكيل تحليل الأسعار المالي (Price Analysis Agent) في بوابة المصلحة المتعاقدة."""

from decimal import Decimal
import pytest
from rest_framework.test import APIClient

from apps.audit.models import AuditLog
from apps.bids.models import BidOffer
from apps.procurements.models import ProcurementDeal
from apps.users.models import CustomUser

URL = "/api/authority/analyze-prices/"


@pytest.mark.django_db
class TestAuthorityPriceAnalysis:
    @pytest.fixture(autouse=True)
    def setup_data(self):
        self.client = APIClient()

        self.authority = CustomUser.objects.create_user(
            email="price_auth@safaqat.dz",
            password="TestPassword123!",
            role="authority",
            organization_name="مديرية الأشغال العمومية - الجزائر",
        )
        self.other_authority = CustomUser.objects.create_user(
            email="price_auth_other@safaqat.dz",
            password="TestPassword123!",
            role="authority",
            organization_name="مديرية أخرى",
        )
        self.op1 = CustomUser.objects.create_user(
            email="price_op1@safaqat.dz",
            password="TestPassword123!",
            role="operator",
            organization_name="مؤسسة البناء",
        )
        self.op2 = CustomUser.objects.create_user(
            email="price_op2@safaqat.dz",
            password="TestPassword123!",
            role="operator",
            organization_name="مؤسسة الأشغال",
        )
        self.op3 = CustomUser.objects.create_user(
            email="price_op3@safaqat.dz",
            password="TestPassword123!",
            role="operator",
            organization_name="مؤسسة الطرق",
        )
        self.op4 = CustomUser.objects.create_user(
            email="price_op4@safaqat.dz",
            password="TestPassword123!",
            role="operator",
            organization_name="مؤسسة الإنشاء السريع",
        )

        self.deal = ProcurementDeal.objects.create(
            reference_number="DZ-PRICE-TEST-001",
            title="إنجاز طريق ولائي",
            description="أشغال تعبئة الطريق",
            authority=self.authority,
            current_stage=7,
            estimated_budget=Decimal("100000000.00"),
        )

        # إنشاء 4 عروض بمستويات سعرية مختلفة:
        # op4: 50,000,000 (-50% يقل عن 60% من الميزانية -> abnormally_low)
        # op1: 90,000,000 (-10% -> normal)
        # op2: 101,000,000 (+1% -> normal)
        # op3: 160,000,000 (+60% -> abnormally_high)
        for operator, amount in (
            (self.op4, Decimal("50000000.00")),
            (self.op1, Decimal("90000000.00")),
            (self.op2, Decimal("101000000.00")),
            (self.op3, Decimal("160000000.00")),
        ):
            BidOffer.objects.create(
                deal=self.deal,
                operator=operator,
                financial_amount=amount,
                status="submitted",
            )

    def test_price_analysis_agent_full_evaluation(self):
        """
        اختبار وكيل تحليل الأسعار:
        - حساب المتوسط (Average) والانحراف المعياري (Standard Deviation).
        - جلب الميزانية التقديرية (estimated_budget).
        - تصنيف العروض (normal, abnormally_low, abnormally_high).
        - التحذيرات والتوصيات الذكية.
        - التوثيق في سجل التدقيق AuditLog.
        """
        self.client.force_authenticate(user=self.authority)
        response = self.client.post(URL, {"deal_id": str(self.deal.id)}, format="json")

        assert response.status_code == 200
        data = response.data

        # 1. الميزانية التقديرية
        assert data["deal_reference"] == "DZ-PRICE-TEST-001"
        assert data["estimated_budget"] == pytest.approx(100000000.0)
        assert data["baseline"]["source"] == "deal_budget"
        assert data["baseline"]["amount"] == pytest.approx(100000000.0)

        # 2. المتوسط والانحراف المعياري
        # العروض: [50M, 90M, 101M, 160M] -> المتوسط = 100,250,000.0
        assert data["average"] == pytest.approx(100250000.0)
        assert data["standard_deviation"] is not None
        assert data["standard_deviation"] > 0

        # 3. تحليل العروض
        assert len(data["offers"]) == 4
        offers_by_op = {o["operator_name"]: o for o in data["offers"]}

        # العرض المنخفض بصفة غير عادية (50M)
        low_offer = offers_by_op["مؤسسة الإنشاء السريع"]
        assert low_offer["status"] == "abnormally_low"
        assert low_offer["deviation_percent"] == pytest.approx(-50.0)
        assert any("60%" in w for w in low_offer["warnings"])
        assert "تبريرات تفصيلية للأسعار الأحادية" in low_offer["ai_recommendation"]

        # العرض الطبيعي (90M)
        norm_offer1 = offers_by_op["مؤسسة البناء"]
        assert norm_offer1["status"] == "normal"
        assert norm_offer1["deviation_percent"] == pytest.approx(-10.0)
        assert "متوازن" in norm_offer1["ai_recommendation"]

        # العرض الطبيعي (101M)
        norm_offer2 = offers_by_op["مؤسسة الأشغال"]
        assert norm_offer2["status"] == "normal"
        assert norm_offer2["deviation_percent"] == pytest.approx(1.0)

        # العرض المرتفع بصفة غير عادية (160M)
        high_offer = offers_by_op["مؤسسة الطرق"]
        assert high_offer["status"] == "abnormally_high"
        assert high_offer["deviation_percent"] == pytest.approx(60.0)
        assert any("يتجاوز الميزانية" in w for w in high_offer["warnings"])
        assert "السقف المالي" in high_offer["ai_recommendation"]

        # 4. ملخص النتائج
        assert data["summary"]["offers_count"] == 4
        assert data["summary"]["abnormally_low_count"] == 1
        assert data["summary"]["abnormally_high_count"] == 1
        assert data["summary"]["normal_count"] == 2
        assert data["summary"]["outliers_count"] == 2

        # 5. التوثيق في سجل التدقيق AuditLog
        audit_entry = AuditLog.objects.filter(
            action="PRICE_ANALYSIS_EXECUTED",
            resource_id=str(self.deal.id),
        ).first()
        assert audit_entry is not None
        assert audit_entry.user == self.authority
        assert audit_entry.changes["estimated_budget"] == pytest.approx(100000000.0)
        assert audit_entry.changes["average"] == pytest.approx(100250000.0)
        assert audit_entry.changes["offers_count"] == 4

    def test_analysis_is_advisory_only(self):
        """الاستجابة تُعلن صراحةً أنها استشارية وأن القرار للجنة."""
        self.client.force_authenticate(user=self.authority)
        response = self.client.post(URL, {"deal_id": str(self.deal.id)}, format="json")

        assert response.status_code == 200
        assert response.data["is_advisory"] is True
        assert "استشاري" in response.data["disclaimer"]
        assert "لجنة التقييم" in response.data["disclaimer"]

    def test_other_authority_is_forbidden(self):
        """مصلحة أخرى لا تستطيع تحليل عروض صفقة ليست لها."""
        self.client.force_authenticate(user=self.other_authority)
        response = self.client.post(URL, {"deal_id": str(self.deal.id)}, format="json")

        assert response.status_code == 403

    def test_operator_is_forbidden(self):
        """المتعامل الاقتصادي لا يملك صلاحية تشغيل هذا التحليل."""
        self.client.force_authenticate(user=self.op1)
        response = self.client.post(URL, {"deal_id": str(self.deal.id)}, format="json")

        assert response.status_code == 403

    def test_missing_deal_id_returns_400(self):
        self.client.force_authenticate(user=self.authority)
        response = self.client.post(URL, {}, format="json")

        assert response.status_code == 400
        assert "deal_id" in response.data["error"]

    def test_unknown_deal_returns_404(self):
        self.client.force_authenticate(user=self.authority)
        response = self.client.post(
            URL, {"deal_id": "00000000-0000-0000-0000-000000000000"}, format="json"
        )

        assert response.status_code == 404

    def test_falls_back_to_offers_median_without_budget(self):
        """بدون ميزانية تقديرية يُستخدم وسيط العروض كمرجع، ويُعلن ذلك."""
        deal_without_budget = ProcurementDeal.objects.create(
            reference_number="DZ-PRICE-TEST-002",
            title="صفقة بلا ميزانية",
            description="بدون ميزانية تقديرية",
            authority=self.authority,
            current_stage=7,
            estimated_budget=None,
        )
        for operator, amount in (
            (self.op1, Decimal("1000000.00")),
            (self.op2, Decimal("2000000.00")),
            (self.op3, Decimal("3000000.00")),
        ):
            BidOffer.objects.create(
                deal=deal_without_budget,
                operator=operator,
                financial_amount=amount,
                status="submitted",
            )

        self.client.force_authenticate(user=self.authority)
        response = self.client.post(
            URL, {"deal_id": str(deal_without_budget.id)}, format="json"
        )

        assert response.status_code == 200
        data = response.data
        assert data["estimated_budget"] is None
        assert data["average"] == pytest.approx(2000000.0)
        assert data["baseline"]["source"] == "offers_median"
        assert data["baseline"]["amount"] == pytest.approx(2000000.0)
        assert [o["deviation_percent"] for o in data["offers"]] == pytest.approx([-50.0, 0.0, 50.0])
        assert data["summary"]["abnormally_low_count"] == 1
        assert data["summary"]["abnormally_high_count"] == 1
        assert data["summary"]["normal_count"] == 1

    def test_deal_without_offers_returns_empty_list(self):
        empty_deal = ProcurementDeal.objects.create(
            reference_number="DZ-PRICE-TEST-003",
            title="صفقة بلا عروض",
            description="لا عروض",
            authority=self.authority,
            current_stage=6,
            estimated_budget=Decimal("5000000.00"),
        )

        self.client.force_authenticate(user=self.authority)
        response = self.client.post(URL, {"deal_id": str(empty_deal.id)}, format="json")

        assert response.status_code == 200
        assert response.data["offers"] == []
        assert response.data["summary"]["offers_count"] == 0
        assert response.data["average"] is None
        assert response.data["standard_deviation"] is None

    def test_single_offer_has_zero_standard_deviation(self):
        """عند وجود عرض واحد فقط، يكون الانحراف المعياري 0.00."""
        single_offer_deal = ProcurementDeal.objects.create(
            reference_number="DZ-PRICE-TEST-004",
            title="صفقة بعرض وحيد",
            description="عرض واحد",
            authority=self.authority,
            current_stage=6,
            estimated_budget=Decimal("10000000.00"),
        )
        BidOffer.objects.create(
            deal=single_offer_deal,
            operator=self.op1,
            financial_amount=Decimal("9500000.00"),
            status="submitted",
        )

        self.client.force_authenticate(user=self.authority)
        response = self.client.post(URL, {"deal_id": str(single_offer_deal.id)}, format="json")

        assert response.status_code == 200
        assert response.data["average"] == pytest.approx(9500000.0)
        assert response.data["standard_deviation"] == pytest.approx(0.0)
        assert len(response.data["offers"]) == 1

    def test_unauthenticated_request_is_denied(self):
        response = self.client.post(URL, {"deal_id": str(self.deal.id)}, format="json")

        assert response.status_code in (401, 403)
