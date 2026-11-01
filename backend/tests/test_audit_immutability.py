import pytest
from django.core.exceptions import PermissionDenied
from rest_framework.test import APIClient
from apps.users.models import CustomUser
from apps.audit.models import AuditLog

@pytest.fixture
def admin_user(db):
    return CustomUser.objects.create_superuser(
        email='auditor@safaqat.dz', password='pass', role='central_admin'
    )

@pytest.mark.django_db
class TestAuditLogImmutability:
    def test_audit_log_checksum_generated(self, admin_user):
        """التحقق من توليد بصمة سلامة رقمية SHA-256 لسجل التدقيق تلقائياً"""
        log = AuditLog.objects.create(
            user=admin_user,
            action='TEST_ACTION',
            resource_type='ProcurementDeal',
            resource_id='12345',
            description='سجل تدقيق تجريبي'
        )

        assert log.checksum is not None
        assert len(log.checksum) == 64  # طول شفرة SHA-256 بالـ hex

    def test_audit_log_deletion_prohibited(self, admin_user):
        """منع الحذف النهائي لسجلات التدقيق وفق القانون 23-12"""
        log = AuditLog.objects.create(
            user=admin_user,
            action='TEST_ACTION_DELETE',
            resource_type='ProcurementDeal',
            resource_id='54321',
            description='سجل غير قابل للحذف'
        )

        with pytest.raises(PermissionDenied):
            log.delete()

    def test_audit_log_modification_prohibited(self, admin_user):
        """منع تعديل أي سجل تدقيق بعد إنشائه لحفظ سلامة التتبع القانوني"""
        log = AuditLog.objects.create(
            user=admin_user,
            action='ORIGINAL_ACTION',
            resource_type='BidOffer',
            resource_id='999',
            description='بيان أصلي'
        )

        log.description = 'محاولة تعديل غير مشروعة'
        with pytest.raises(PermissionDenied):
            log.save()

    def test_audit_log_api_read_only(self, admin_user):
        """واجهة برمجة التطبيقات لسجل التدقيق للقراءة والتصفح فقط (Read-Only)"""
        log = AuditLog.objects.create(
            user=admin_user,
            action='API_LOG',
            resource_type='Contract',
            resource_id='CONT-01',
            description='سجل عبر API'
        )

        client = APIClient()
        client.force_authenticate(user=admin_user)

        # List is allowed
        res_list = client.get('/api/audit/logs/')
        assert res_list.status_code == 200

        # Retrieve is allowed
        res_get = client.get(f'/api/audit/logs/{log.id}/')
        assert res_get.status_code == 200

        # POST / PUT / DELETE are strictly disallowed (405 Method Not Allowed)
        res_post = client.post('/api/audit/logs/', {'action': 'HACK'}, format='json')
        assert res_post.status_code == 405

        res_delete = client.delete(f'/api/audit/logs/{log.id}/')
        assert res_delete.status_code == 405

    def test_audit_log_bulk_deletion_prohibited(self, admin_user):
        """منع الحذف الجماعي لسجلات التدقيق عبر QuerySet.delete() وفق القانون 23-12"""
        AuditLog.objects.create(
            user=admin_user,
            action='BULK_DEL_TEST',
            resource_type='ProcurementDeal',
            resource_id='B1',
            description='سجل اختبار الحذف الجماعي'
        )
        with pytest.raises(PermissionDenied):
            AuditLog.objects.filter(action='BULK_DEL_TEST').delete()

        with pytest.raises(PermissionDenied):
            AuditLog.objects.all().delete()

    def test_audit_log_bulk_update_prohibited(self, admin_user):
        """منع التعديل الجماعي لسجلات التدقيق عبر QuerySet.update() وفق القانون 23-12"""
        AuditLog.objects.create(
            user=admin_user,
            action='BULK_UPD_TEST',
            resource_type='ProcurementDeal',
            resource_id='B2',
            description='سجل اختبار التحديث الجماعي'
        )
        with pytest.raises(PermissionDenied):
            AuditLog.objects.filter(action='BULK_UPD_TEST').update(description='محاولة اختراق')

        with pytest.raises(PermissionDenied):
            AuditLog.objects.all().update(description='محاولة اختراق جماعية')
