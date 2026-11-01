import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.procurements.models import ProcurementDeal

User = get_user_model()


@pytest.fixture
def central_admin_user(db):
    return User.objects.create_user(
        email="central.admin.pdf@safaqat.dz",
        password="ValidPassword123!",
        role="central_admin",
        display_name="مفتش الإدارة المركزية",
    )


@pytest.fixture
def operator_user(db):
    return User.objects.create_user(
        email="operator.pdf@safaqat.dz",
        password="ValidPassword123!",
        role="operator",
        display_name="شركة المقاولات الحديثة",
    )


@pytest.fixture
def authority_user(db):
    return User.objects.create_user(
        email="authority.pdf@safaqat.dz",
        password="ValidPassword123!",
        role="authority",
        organization_name="مديرية الأشغال العمومية لولاية الجزائر",
        display_name="مدير الصفقات",
    )


@pytest.mark.django_db
class TestCentralReportPdfView:
    def test_unauthenticated_user_blocked(self):
        client = APIClient()
        response = client.get("/api/central/reports/NAT-REP-2026-Q4/pdf/")
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_operator_blocked_from_downloading_pdf(self, operator_user):
        client = APIClient()
        client.force_authenticate(user=operator_user)
        response = client.get("/api/central/reports/NAT-REP-2026-Q4/pdf/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_authority_blocked_from_downloading_pdf(self, authority_user):
        client = APIClient()
        client.force_authenticate(user=authority_user)
        response = client.get("/api/central/reports/NAT-REP-2026-Q4/pdf/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_central_admin_downloads_valid_pdf_with_checksum(self, central_admin_user, authority_user):
        # Create a sample deal for authority
        ProcurementDeal.objects.create(
            authority=authority_user,
            title="مشروع إنجاز ازدواجية الطريق الوطني رقم 01",
            wilaya="01",
            current_stage=4,
            estimated_budget=450000000.0,
        )

        client = APIClient()
        client.force_authenticate(user=central_admin_user)
        response = client.get("/api/central/reports/NAT-REP-2026-Q4/pdf/")

        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "application/pdf"
        assert "attachment" in response["Content-Disposition"]
        assert "safaqat_report_nat_rep_2026_q4.pdf" in response["Content-Disposition"]
        assert response["X-Report-Id"] == "NAT-REP-2026-Q4"

        # Check SHA-256 header
        checksum = response.get("X-Report-Checksum")
        assert checksum is not None
        assert len(checksum) == 64

        # Verify PDF magic bytes
        pdf_bytes = response.content
        assert pdf_bytes.startswith(b"%PDF-")
        assert len(pdf_bytes) > 20000  # Substantial PDF document

    def test_pdf_endpoint_without_trailing_slash(self, central_admin_user):
        client = APIClient()
        client.force_authenticate(user=central_admin_user)
        response = client.get("/api/central/reports/NAT-REP-2026-M10/pdf")
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "application/pdf"
        assert response.content.startswith(b"%PDF-")
