import pytest
from decimal import Decimal
from django.utils import timezone
from rest_framework.test import APIClient
from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal, CahierSpecs
from apps.audit.models import AuditLog


@pytest.mark.django_db
class TestCentralOversightEndpoints:
    @pytest.fixture(autouse=True)
    def setup_data(self):
        self.client = APIClient()

        # 1. Central Admin User
        self.central_admin = CustomUser.objects.create_user(
            email="central_hawk@safaqat.dz",
            password="HawkAdminPassword123!",
            role="central_admin",
            organization_name="المفتشية العامة للرقابة والتدقيق",
            display_name="مفتش مركزي",
        )

        # 2. Regular Authority User
        self.authority = CustomUser.objects.create_user(
            email="dop_algiers@wilaya.dz",
            password="AuthorityPassword123!",
            role="authority",
            organization_name="مديرية الأشغال العمومية - الجزائر",
            display_name="مهندس الصفقات",
        )

        # 3. Regular Operator User
        self.operator = CustomUser.objects.create_user(
            email="operator_btr@safaqat.dz",
            password="OperatorPassword123!",
            role="operator",
            organization_name="مؤسسة كوسيدار للأشغال",
            display_name="مسؤول المناقصات",
        )

        # 4. Create sample Procurement Deals in different Wilayas
        now = timezone.now()
        self.deal_algiers_1 = ProcurementDeal.objects.create(
            reference_number="DZ-16-2026-TEST-001",
            title="تهيئة وتعبيد المسالك الحضرية ببلدية زرالدة",
            description="مشروع تهيئة المسالك الحضرية لربط الأحياء السكنية",
            authority=self.authority,
            wilaya="الجزائر",
            current_stage=3,
            status="PUBLISHED",
            estimated_budget=Decimal("45000000.00"),
            submission_deadline=now + timezone.timedelta(days=20),
        )

        self.deal_algiers_2 = ProcurementDeal.objects.create(
            reference_number="DZ-16-2026-TEST-002",
            title="أشغال تهيئة وصيانة الإنارة العمومية بالطاقة الشمسية",
            description="مشروع تزويد الأحياء بالإنارة الذكية",
            authority=self.authority,
            wilaya="الجزائر",
            current_stage=2,
            status="PENDING_VISA",
            estimated_budget=Decimal("25000000.00"),
            submission_deadline=now + timezone.timedelta(days=15),
        )

        self.deal_oran = ProcurementDeal.objects.create(
            reference_number="DZ-31-2026-TEST-003",
            title="إنجاز مجمع مدرسي صنف د ببلدية بئر الجير",
            description="مشروع مدرسي متكامل",
            authority=self.authority,
            wilaya="وهران",
            current_stage=5,
            status="PUBLISHED",
            estimated_budget=Decimal("85000000.00"),
            submission_deadline=now - timezone.timedelta(days=5),  # delayed
        )

        self.deal_algiers_3 = ProcurementDeal.objects.create(
            reference_number="DZ-16-2026-TEST-004",
            title="أشغال صيانة الإنارة العمومية التكميلية",
            description="مشروع تكميلي تحت العتبة",
            authority=self.authority,
            wilaya="الجزائر",
            current_stage=2,
            status="PUBLISHED",
            estimated_budget=Decimal("9000000.00"),
            submission_deadline=now + timezone.timedelta(days=10),
        )

    def test_unauthenticated_requests_are_denied(self):
        """التحقق من أن الطلبات غير المصادق عليها ترفض (401)"""
        endpoints = [
            "/api/central/heatmap/",
            "/api/central/dashboard/",
            "/api/central/suspicions/",
            "/api/central/reports/",
            "/api/central/authorities/",
            "/api/central/operators/",
            "/api/central/deals/",
        ]
        for url in endpoints:
            response = self.client.get(url)
            assert response.status_code == 401, f"Expected 401 for {url}, got {response.status_code}"

    def test_non_central_admin_roles_are_forbidden(self):
        """التحقق من أن الأدوار غير الإدارية المركزية تُمنع من الوصول (403)"""
        # اختبار كمتعامل اقتصادي
        self.client.force_authenticate(user=self.operator)
        endpoints = [
            "/api/central/heatmap/",
            "/api/central/dashboard/",
            "/api/central/suspicions/",
            "/api/central/reports/",
            "/api/central/authorities/",
            "/api/central/operators/",
            "/api/central/deals/",
        ]
        for url in endpoints:
            response = self.client.get(url)
            assert response.status_code == 403, f"Operator should get 403 on {url}"

        # اختبار كمصلحة متعاقدة عادية
        self.client.force_authenticate(user=self.authority)
        for url in endpoints:
            response = self.client.get(url)
            assert response.status_code == 403, f"Authority should get 403 on {url}"

    def test_heatmap_api_success(self):
        """اختبار مسار الخريطة الحرارية لجلب الصفقات حسب الولايات ومستويات الخطورة"""
        self.client.force_authenticate(user=self.central_admin)
        response = self.client.get("/api/central/heatmap/")

        assert response.status_code == 200
        data = response.data
        assert "wilayas" in data
        assert "total_deals" in data
        assert "total_budget_dzd" in data
        assert data["total_deals"] >= 3

        wilaya_codes = [w["wilaya_code"] for w in data["wilayas"]]
        assert "16" in wilaya_codes  # Algiers
        assert "31" in wilaya_codes  # Oran

        algiers_stat = next(w for w in data["wilayas"] if w["wilaya_code"] == "16")
        assert algiers_stat["deals_count"] >= 2
        assert algiers_stat["risk_level"] in ["critical", "high", "medium", "low"]
        assert "total_budget" in algiers_stat

    def test_dashboard_kpis_api_success(self):
        """اختبار مسار لوحة القيادة والمؤشرات الحقيقية"""
        self.client.force_authenticate(user=self.central_admin)
        response = self.client.get("/api/central/dashboard/")

        assert response.status_code == 200
        data = response.data
        assert "active_deals_count" in data
        assert "pending_visa_count" in data
        assert "active_authorities_count" in data
        assert "total_ai_alarms" in data
        assert "stages_distribution" in data
        assert "recent_deals" in data

        assert data["active_deals_count"] >= 3
        assert data["pending_visa_count"] >= 1
        assert data["active_authorities_count"] >= 1

    def test_suspicions_api_and_audit_log_recording(self):
        """اختبار مسار كشف الشبهات وتجزئة الصفقات والتحقق من التسجيل في AuditLog"""
        self.client.force_authenticate(user=self.central_admin)

        initial_audit_count = AuditLog.objects.count()
        response = self.client.get("/api/central/suspicions/")

        assert response.status_code == 200
        data = response.data
        assert "total_suspicions" in data
        assert "suspicions" in data
        assert "results" in data
        assert "tender_splitting" in data["suspicions"]

        # التحقق من أن خوارزمية تجزئة الصفقات تعمل
        tender_splitting_alerts = data["suspicions"]["tender_splitting"]
        assert isinstance(tender_splitting_alerts, list)

        # التحقق من تسجيل إنذار في AuditLog
        new_audit_logs = AuditLog.objects.filter(
            action__startswith="SUSPICION_ALERT_"
        )
        assert new_audit_logs.exists()
        logged_record = new_audit_logs.first()
        assert logged_record.checksum  # بصمة SHA-256 محسوبة
        assert logged_record.resource_type == "ProcurementDeal"

    def test_reports_api_success(self):
        """اختبار مسار التقارير الوطنية وأداء المصالح المتعاقدة"""
        self.client.force_authenticate(user=self.central_admin)
        response = self.client.get("/api/central/reports/")

        assert response.status_code == 200
        data = response.data
        assert "national_summary" in data
        assert "authorities" in data
        assert "reports" in data

        assert len(data["authorities"]) >= 1
        auth_perf = data["authorities"][0]
        assert "compliance_rate" in auth_perf
        assert "transparency_score" in auth_perf
        assert "deals_count" in auth_perf
        assert "status" in auth_perf
        assert 0.0 <= auth_perf["compliance_rate"] <= 100.0
        assert 0.0 <= auth_perf["transparency_score"] <= 100.0

    def test_central_authorities_api_real_data(self):
        """اختبار مسار المصالح لجلب المستخدمين الحقيقيين فقط برتبة authority دون أي بيانات وهمية"""
        self.client.force_authenticate(user=self.central_admin)
        response = self.client.get("/api/central/authorities/")

        assert response.status_code == 200
        data = response.data
        authorities = data.get("authorities", data.get("results", []))
        assert len(authorities) == CustomUser.objects.filter(role="authority").count()
        auth_emails = [a["email"] for a in authorities]
        assert self.authority.email in auth_emails
        assert self.operator.email not in auth_emails
        assert self.central_admin.email not in auth_emails

    def test_central_operators_api_real_data(self):
        """اختبار مسار المتعاملين لجلب المستخدمين الحقيقيين فقط برتبة operator دون أي بيانات وهمية"""
        self.client.force_authenticate(user=self.central_admin)
        response = self.client.get("/api/central/operators/")

        assert response.status_code == 200
        data = response.data
        operators = data.get("operators", data.get("results", []))
        assert len(operators) == CustomUser.objects.filter(role="operator").count()
        op_emails = [o["email"] for o in operators]
        assert self.operator.email in op_emails
        assert self.authority.email not in op_emails
        assert self.central_admin.email not in op_emails

    def test_central_deals_api_real_data(self):
        """اختبار مسار الصفقات المركزية لجلب الصفقات الحقيقية فقط من جدول الصفقات"""
        self.client.force_authenticate(user=self.central_admin)
        response = self.client.get("/api/central/deals/")

        assert response.status_code == 200
        data = response.data
        deals = data.get("deals", data.get("results", []))
        assert len(deals) == ProcurementDeal.objects.count()
        refs = [d["reference_number"] for d in deals]
        assert self.deal_algiers_1.reference_number in refs
        assert self.deal_oran.reference_number in refs

    def test_seed_command_refuses_production_without_flag(self):
        """التحقق من أن أوامر الـ seed ترفض العمل تلقائياً في بيئة الإنتاج إلا براية صريحة"""
        from django.conf import settings
        from django.core.management import call_command
        from django.core.management.base import CommandError

        original_debug = settings.DEBUG
        try:
            settings.DEBUG = False
            with pytest.raises(CommandError, match="DEBUG=False"):
                call_command("seed_central_demo")
            with pytest.raises(CommandError, match="DEBUG=False"):
                call_command("seed_procurement_data")
        finally:
            settings.DEBUG = original_debug
