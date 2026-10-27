"""اختبارات التحليل المالي الذكي لعروض الصفقة (استشاري)."""

from decimal import Decimal

import pytest
from rest_framework.test import APIClient

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

        self.deal = ProcurementDeal.objects.create(
            reference_number="DZ-PRICE-TEST-001",
            title="إنجاز طريق ولائي",
            description="أشغال تعبئة الطريق",
            authority=self.authority,
            current_stage=7,
            estimated_budget=Decimal("100000000.00"),
        )

        for operator, amount in (
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

    def test_owner_authority_gets_price_analysis(self):
        """المصلحة المالكة تحصل على تحليل مقارن بكل عرض."""
        self.client.force_authenticate(user=self.authority)
        response = self.client.post(URL, {"deal_id": str(self.deal.id)}, format="json")

        assert response.status_code == 200
        data = response.data

        assert data["deal_reference"] == "DZ-PRICE-TEST-001"
        assert data["baseline"]["source"] == "deal_budget"
        assert data["baseline"]["amount"] == pytest.approx(100000000.0)
        assert data["threshold_percent"] == pytest.approx(15.0)
        assert len(data["offers"]) == 3

        deviations = [offer["deviation_percent"] for offer in data["offers"]]
        assert deviations == pytest.approx([-10.0, 1.0, 60.0])

        statuses = [offer["status"] for offer in data["offers"]]
        assert statuses == ["normal", "normal", "outlier"]

        assert data["summary"]["outliers_count"] == 1
        assert data["summary"]["offers_count"] == 3
        assert all(offer["recommendation"] for offer in data["offers"])

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
        """المتعامل الاقتصادي لا يملك هذا التحليل."""
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
        assert data["baseline"]["source"] == "offers_median"
        assert data["baseline"]["amount"] == pytest.approx(2000000.0)
        assert [o["deviation_percent"] for o in data["offers"]] == pytest.approx([-50.0, 0.0, 50.0])
        assert data["summary"]["outliers_count"] == 2

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

    def test_unauthenticated_request_is_denied(self):
        response = self.client.post(URL, {"deal_id": str(self.deal.id)}, format="json")

        assert response.status_code in (401, 403)
