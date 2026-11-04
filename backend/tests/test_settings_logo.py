"""
test_settings_logo.py — اختبار سريع لرفع شعار المصلحة والمتعامل في الإعدادات.

يغطي: رفع شعار صالح (PNG) + رفض ملف أكبر من 2MB + رفض PDF
+ حصرية الآمر بالصرف (ordonnateur) لرفع شعار المصلحة
+ تدفق الصورة في المسار الإظهاري + توثيق العملية في AuditLog.
"""
import io
import uuid

import pytest
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APIClient

from apps.users.models import CustomUser
from apps.procurements.models import Authority
from apps.audit.models import AuditLog

MEDIA = override_settings(MEDIA_ROOT=None)  # الوسائط تعتمد التخزين الافتراضي أثناء الاختبارات

def _valid_png() -> SimpleUploadedFile:
    """شعار PNG صالح 1×1 (يُنشأ من جديد لكل استدعاء لأن الملف يُقرأ مرة واحدة)."""
    return SimpleUploadedFile(
        'logo.png',
        bytes.fromhex(
            '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489'
            '0000000d49444154789c6360010000000100ffff03000006000557bfabd40000000049454e44ae426082'
        ),
        content_type='image/png',
    )


def _oversized_png() -> SimpleUploadedFile:
    """ملف أكثر من الحد الأقصى بقليل (2.01 ميغابايت) باسم png لاختبار رفض الحجم."""
    return SimpleUploadedFile(
        'logo.png',
        b'\x00' * (int(2.01 * 1024 * 1024)),
        content_type='image/png',
    )


def _pdf() -> SimpleUploadedFile:
    """ملف PDF برسمه لاختبار رفض الصيغة."""
    return SimpleUploadedFile(
        'logo.pdf',
        b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n',
        content_type='application/pdf',
    )


@pytest.fixture(autouse=True)
def _media_dir(tmp_path, settings):
    settings.MEDIA_ROOT = tmp_path


@pytest.fixture
def client_api():
    return APIClient()


@pytest.fixture
def operator(db):
    return CustomUser.objects.create_user(
        email=f'logo_op_{uuid.uuid4().hex[:8]}@safaqat.dz',
        password='Safaqat@2026',
        role='operator',
        display_name='متعامل تجريبي',
        organization_name='شركة الإنجاز للبناء',
    )


def _make_authority_user(role: str) -> CustomUser:
    user = CustomUser.objects.create_user(
        email=f'logo_auth_{uuid.uuid4().hex[:8]}@safaqat.dz',
        password='Safaqat@2026',
        role=role,
        display_name='مسؤول مصلحة تجريبي',
        organization_name='مديرية التعمير والهندسة',
    )
    Authority.objects.create(name='مديرية التعمير والهندسة', user=user)
    return user


@pytest.fixture
def ordonnateur(db):
    return _make_authority_user('ordonnateur')


def _upload(client_api, url: str, f: SimpleUploadedFile):
    """رفع مباشر لملف جاهز."""
    return client_api.post(url, {'logo': f}, format='multipart')


class TestOperatorLogo:
    def test_valid_png_upload_persists_and_audits(self, client_api, operator):
        client_api.force_authenticate(operator)
        response = _upload(client_api, '/api/operator/settings/', _valid_png())
        assert response.status_code == 200, response.data
        assert response.data['has_logo'] is True
        operator.refresh_from_db()
        assert operator.company_logo and operator.company_logo.size > 0
        assert AuditLog.objects.filter(
            action='OPERATOR_LOGO_UPLOADED', resource_id=str(operator.id)
        ).exists()

    def test_oversized_file_rejected(self, client_api, operator):
        client_api.force_authenticate(operator)
        response = _upload(client_api, '/api/operator/settings/', _oversized_png())
        assert response.status_code == 400, response.data
        assert 'logo' in response.data or 'detail' in response.data
        operator.refresh_from_db()
        assert not operator.company_logo

    def test_pdf_rejected(self, client_api, operator):
        client_api.force_authenticate(operator)
        response = _upload(client_api, '/api/operator/settings/', _pdf())
        assert response.status_code == 400, response.data

    def test_logo_bytes_streamed_for_topbar(self, client_api, operator):
        client_api.force_authenticate(operator)
        _upload(client_api, '/api/operator/settings/', _valid_png())
        response = client_api.get('/api/operator/settings/logo/')
        assert response.status_code == 200
        assert b'\x89PNG' in b''.join(response.streaming_content)

    def test_unauthenticated_rejected(self, client_api):
        assert client_api.post('/api/operator/settings/').status_code in (401, 403)


class TestAuthorityLogo:
    def test_ordonnateur_can_upload(self, client_api, ordonnateur):
        client_api.force_authenticate(ordonnateur)
        response = _upload(client_api, '/api/authority/settings/', _valid_png())
        assert response.status_code == 200, response.data
        authority = Authority.objects.get(user=ordonnateur)
        assert authority.logo and authority.logo.size > 0
        assert AuditLog.objects.filter(
            action='AUTHORITY_LOGO_UPLOADED', resource_id=str(authority.id)
        ).exists()

    def test_plain_authority_role_forbidden(self, client_api, db):
        user = _make_authority_user('authority')
        client_api.force_authenticate(user)
        response = _upload(client_api, '/api/authority/settings/', _valid_png())
        assert response.status_code == 403, response.data
        assert response.data.get('code') == 'ordonnateur_only'

    def test_oversized_rejected(self, client_api, ordonnateur):
        client_api.force_authenticate(ordonnateur)
        response = _upload(client_api, '/api/authority/settings/', _oversized_png())
        assert response.status_code == 400, response.data

    def test_pdf_rejected(self, client_api, ordonnateur):
        client_api.force_authenticate(ordonnateur)
        response = _upload(client_api, '/api/authority/settings/', _pdf())
        assert response.status_code == 400, response.data

    def test_delete_and_audit(self, client_api, ordonnateur):
        client_api.force_authenticate(ordonnateur)
        _upload(client_api, '/api/authority/settings/', _valid_png())
        response = client_api.delete('/api/authority/settings/')
        assert response.status_code == 200
        authority = Authority.objects.get(user=ordonnateur)
        assert not authority.logo
        assert AuditLog.objects.filter(
            action='AUTHORITY_LOGO_DELETED', resource_id=str(authority.id)
        ).exists()

    def test_logo_bytes_streamed_for_topbar(self, client_api, ordonnateur):
        client_api.force_authenticate(ordonnateur)
        upload_response = _upload(client_api, '/api/authority/settings/', _valid_png())
        assert upload_response.status_code == 200, upload_response.data
        response = client_api.get('/api/authority/settings/logo/')
        assert response.status_code == 200
        assert b'\x89PNG' in b''.join(response.streaming_content)
