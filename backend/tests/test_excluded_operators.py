import pytest
from datetime import date, timedelta
from rest_framework.test import APIClient
from apps.users.models import CustomUser, ExcludedOperator
from apps.audit.models import AuditLog


@pytest.mark.django_db
class TestExcludedOperators:
    @pytest.fixture(autouse=True)
    def setup_data(self):
        self.client = APIClient()

        # 1. Central Admin
        self.central_admin = CustomUser.objects.create_user(
            email="central.monitor@safaqat.gov.dz",
            password="CentralPassword123!",
            role="central_admin",
            organization_name="المرصد الوطني لمراقبة الصفقات العمومية",
            display_name="مراقب مركزي أول",
        )

        # 2. Authority User
        self.authority = CustomUser.objects.create_user(
            email="authority.wilaya@safaqat.gov.dz",
            password="AuthorityPassword123!",
            role="authority",
            organization_name="مديرية التجهيزات العمومية",
            display_name="مدير الصفقات",
        )

        # 3. Operator User
        self.operator = CustomUser.objects.create_user(
            email="contractor@etp.dz",
            password="OperatorPassword123!",
            role="operator",
            organization_name="شركة المقاولات الحديثة",
            display_name="المسير الإداري",
        )

    def test_unauthenticated_access_blocked(self):
        """فحص حظر الوصول غير المصادق عليه (401)"""
        response = self.client.get("/api/central/excluded-operators/")
        assert response.status_code == 401

    def test_non_central_admin_forbidden(self):
        """فحص حظر وصول أصحاب المصلحة المتعاقدة أو المتعاملين إلى القائمة السوداء (403)"""
        self.client.force_authenticate(user=self.authority)
        response = self.client.get("/api/central/excluded-operators/")
        assert response.status_code == 403

        self.client.force_authenticate(user=self.operator)
        response = self.client.get("/api/central/excluded-operators/")
        assert response.status_code == 403

    def test_central_admin_create_and_audit_log(self):
        """فحص إضافة متعامل للقائمة السوداء وتوثيقه في سجل التدقيق AuditLog"""
        self.client.force_authenticate(user=self.central_admin)

        start_date = date.today()
        end_date = start_date + timedelta(days=365 * 2)

        payload = {
            "operator_name": "مؤسسة البناء والري المغشوش ش.ذ.م.م",
            "nif": "001234567890123",
            "reason": "تقديم تصريحات كاذبة وشهادات إنجاز غير مطابقة للواقع وفق المادة 75 من المرسوم 15-247.",
            "decision_reference": "قرار وزاري رقم 2026/84-إق",
            "start_date": str(start_date),
            "end_date": str(end_date),
            "is_active": True,
        }

        response = self.client.post("/api/central/excluded-operators/", payload, format="json")
        assert response.status_code == 201
        data = response.data
        assert data["operator_name"] == payload["operator_name"]
        assert data["nif"] == payload["nif"]
        assert data["is_active"] is True
        assert str(data["created_by"]) == str(self.central_admin.id)

        # التحقق من تسجيل العملية في سجل التدقيق غير القابل للتعديل
        audit = AuditLog.objects.filter(
            action="EXCLUDED_OPERATOR_ADDED",
            resource_type="ExcludedOperator",
            resource_id=data["id"],
        ).first()
        assert audit is not None
        assert audit.user == self.central_admin
        assert "قرار وزاري رقم 2026/84-إق" in audit.description

    def test_central_admin_list_excluded_operators(self):
        """فحص استرجاع قائمة المتعاملين المقصيين من قبل الإدارة المركزية"""
        ExcludedOperator.objects.create(
            operator_name="شركة مقاولات التضليل",
            nif="009876543210987",
            reason="فسخ العقد على حساب وضرر المتعامل بسبب التأخر الفادح في الإنجاز.",
            decision_reference="قرار ولائي رقم 2026/12",
            start_date=date.today(),
            is_active=True,
            created_by=self.central_admin,
        )

        self.client.force_authenticate(user=self.central_admin)
        response = self.client.get("/api/central/excluded-operators/")
        assert response.status_code == 200
        results = response.data if isinstance(response.data, list) else response.data.get("results", [])
        assert len(results) >= 1
        assert any(item["nif"] == "009876543210987" for item in results)

    def test_central_admin_delete_excluded_operator_and_audit(self):
        """فحص إلغاء الإقصاء (حذف السجل) وتوثيقه في سجل التدقيق"""
        item = ExcludedOperator.objects.create(
            operator_name="مؤسسة الأشغال الموقوفة",
            nif="005555555555555",
            reason="إقصاء مؤقت لحين انتهاء التحقيق الإداري.",
            decision_reference="مقرر تحفظي رقم 05",
            start_date=date.today(),
            is_active=True,
            created_by=self.central_admin,
        )

        self.client.force_authenticate(user=self.central_admin)
        response = self.client.delete(f"/api/central/excluded-operators/{item.id}/")
        assert response.status_code == 204
        assert not ExcludedOperator.objects.filter(id=item.id).exists()

        # التحقق من توثيق عملية الإزالة في سجل التدقيق
        audit = AuditLog.objects.filter(
            action="EXCLUDED_OPERATOR_REMOVED",
            resource_type="ExcludedOperator",
            resource_id=str(item.id),
        ).first()
        assert audit is not None
        assert audit.user == self.central_admin
        assert "مؤسسة الأشغال الموقوفة" in audit.description
