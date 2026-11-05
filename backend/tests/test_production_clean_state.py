import pytest
from io import StringIO
from django.core.management import call_command
from django.conf import settings
from django.utils import timezone
from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal
from apps.bids.models import BidOffer
from apps.contracts.models import Contract
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestProductionCleanState:
    """
    مجموعة اختبارات التحقق من تهيئة المنصة للإنتاج النظيف:
    1. تصفير العدادات والبيانات الوهمية
    2. الحفاظ الصارم على حسابات الإدارة والمشرفين
    3. تعطيل أمر seed التلقائي عند إيقاف ENABLE_DEMO_DATA
    4. استجابة المسارات الرقابية وحسابات المشغلين بحالات فارغة نقية
    """

    def test_reset_production_data_command(self):
        # 1. إنشاء حساب مسؤول رسمي محمي
        admin_user, _ = CustomUser.objects.get_or_create(
            email="admin@safaqat.dz",
            defaults={
                "display_name": "المفتشية العامة",
                "role": "central_admin",
                "is_staff": True,
                "is_superuser": True,
            }
        )

        # 2. إنشاء بيانات تجريبية وهمية (مستخدم تجريبي وصفقة)
        demo_operator = CustomUser.objects.create(
            email="operator_demo_test@safaqat.dz",
            display_name="متعامل تجريبي وهمي",
            role="operator",
        )
        deal = ProcurementDeal.objects.create(
            authority=admin_user,
            reference_number="DEMO-DEAL-999",
            title="صفقة اختبارية وهمية",
            current_stage=3,
            submission_deadline=timezone.now() + timezone.timedelta(days=15),
        )
        BidOffer.objects.create(
            deal=deal,
            operator=demo_operator,
            status="SUBMITTED",
        )

        # التحقق من وجود البيانات قبل التصفير
        assert ProcurementDeal.objects.filter(reference_number="DEMO-DEAL-999").exists()
        assert BidOffer.objects.count() >= 1
        assert CustomUser.objects.filter(email="operator_demo_test@safaqat.dz").exists()

        # 3. تشغيل أمر reset_production_data مع راية --confirm
        out = StringIO()
        call_command("reset_production_data", "--confirm", stdout=out)
        output = out.getvalue()

        # 4. التحقق من نجاح التصفير بالكامل
        assert "تقرير تصفير منصة «صفقات ذكية» للإنتاج الحقيقي" in output
        assert ProcurementDeal.objects.count() == 0
        assert BidOffer.objects.count() == 0
        assert not CustomUser.objects.filter(email="operator_demo_test@safaqat.dz").exists()

        # 5. التحقق من بقاء حساب الإدارة الرسمي سليماً
        assert CustomUser.objects.filter(email="admin@safaqat.dz").exists()
        admin_refreshed = CustomUser.objects.get(email="admin@safaqat.dz")
        assert admin_refreshed.is_superuser is True

    def test_seed_procurement_data_respects_enable_demo_data_guard(self, monkeypatch):
        # محاكاة إيقاف ENABLE_DEMO_DATA
        monkeypatch.setattr(settings, 'ENABLE_DEMO_DATA', False)

        out = StringIO()
        # محاولة تنفيذ أمر البذر بدون استثناء
        call_command("seed_procurement_data", stdout=out)
        output = out.getvalue()

        # يجب أن يخرج برسالة تحذير ويرفض بذر أي صفقات تجريبية
        assert "ENABLE_DEMO_DATA=False" in output
        assert ProcurementDeal.objects.filter(reference_number="DTP-DZ-2026-042").count() == 0

    def test_empty_platform_operator_and_central_apis_return_zero(self):
        # التأكد من خلو قاعدة البيانات من الصفقات
        ProcurementDeal.objects.all().delete()
        BidOffer.objects.all().delete()

        admin_user, _ = CustomUser.objects.get_or_create(
            email="admin@safaqat.dz",
            defaults={"role": "central_admin", "is_staff": True, "is_superuser": True}
        )
        operator_user = CustomUser.objects.create(
            email="clean_operator@safaqat.dz",
            role="operator",
        )

        client = APIClient()

        # 1. اختبار رادار المشغل: يعيد قائمة فارغة تماماً دون أي تطابقات مصطنعة
        client.force_authenticate(user=operator_user)
        res_radar = client.get("/api/operator/recommended-deals/")
        assert res_radar.status_code == 200
        # القائمة فارغة والعدد صفر
        if isinstance(res_radar.data, dict):
            assert res_radar.data.get("deals") == []
            assert res_radar.data.get("count") == 0
        else:
            assert res_radar.data == []

        # 2. اختبار لوحة الرقابة المركزية: تعيد عدادات بأصفار حقيقية
        client.force_authenticate(user=admin_user)
        res_central = client.get("/api/central/dashboard/")
        assert res_central.status_code == 200
        assert res_central.data.get("active_deals_count") == 0
        assert res_central.data.get("total_deals") == 0
        assert res_central.data.get("total_ai_alarms") == 0
