import os
import io
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal, OfferDocument
from apps.bids.models import BidOffer
from apps.audit.models import AuditLog


@pytest.fixture(autouse=True)
def clear_caches_and_throttles():
    from django.core.cache import cache
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def users_fixture(db):
    operator1 = CustomUser.objects.create_user(
        email='operator1@safaqat.dz',
        password='Password@12345',
        role='operator',
        organization_name='المقاول الجزائري الأول',
    )
    operator2 = CustomUser.objects.create_user(
        email='operator2@safaqat.dz',
        password='Password@12345',
        role='operator',
        organization_name='المقاول الجزائري الثاني',
    )
    authority1 = CustomUser.objects.create_user(
        email='authority1@safaqat.dz',
        password='Password@12345',
        role='authority',
        organization_name='مديرية التجهيزات العمومية - الجزائر',
    )
    authority2 = CustomUser.objects.create_user(
        email='authority2@safaqat.dz',
        password='Password@12345',
        role='authority',
        organization_name='مديرية الري - وهران',
    )
    central_admin = CustomUser.objects.create_superuser(
        email='admin@safaqat.dz',
        password='Password@12345',
        role='central_admin',
        organization_name='المرصد الوطني لمراقبة الصفقات',
    )
    return {
        'operator1': operator1,
        'operator2': operator2,
        'authority1': authority1,
        'authority2': authority2,
        'central_admin': central_admin,
    }


@pytest.fixture
def deal_and_offer(db, users_fixture):
    deal = ProcurementDeal.objects.create(
        title='مشروع إنجاز مجمع مدرسي',
        description='صفقة عمومية للأشغال العامة',
        authority=users_fixture['authority1'],
        wilaya='16',
        estimated_budget=50000000.0,
        current_stage=5,
        status='evaluating',
    )
    offer = BidOffer.objects.create(
        deal=deal,
        operator=users_fixture['operator1'],
        financial_amount=48000000.0,
        status='submitted',
    )
    # إنشاء ملف تجريبي داخل مجلد media
    pdf_content = b"%PDF-1.4\n%Safaqat Secure Offer Document Content\n%%EOF"
    upload_file = SimpleUploadedFile("offer_doc.pdf", pdf_content, content_type="application/pdf")
    doc = OfferDocument.objects.create(offer=offer, file=upload_file)

    return {
        'deal': deal,
        'offer': offer,
        'doc': doc,
    }


@pytest.mark.django_db
class TestP0SecurityHardening:

    def test_secure_media_unauthenticated_blocked(self, deal_and_offer):
        """1. التحقق من منع أي وصول غير مصادق عليه لمجلد /media/ برمز 401"""
        client = APIClient()
        doc = deal_and_offer['doc']
        file_path = doc.file.name

        # تجربة المسار /media/<path>
        res = client.get(f'/media/{file_path}')
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

        # تجربة مسار /api/documents/<id>/download/
        res_api = client.get(f'/api/documents/{doc.id}/download/')
        assert res_api.status_code == status.HTTP_401_UNAUTHORIZED

    def test_secure_media_rbac_isolation(self, users_fixture, deal_and_offer):
        """2. التحقق من عزل الصلاحيات الصارم (RBAC) لتحميل ملفات العروض"""
        doc = deal_and_offer['doc']
        file_path = doc.file.name

        # أ. متعامل آخر (operator2) يحاول تحميل وثيقة عرض operator1 -> مرفوض 403
        client_op2 = APIClient()
        client_op2.force_authenticate(user=users_fixture['operator2'])
        res_op2 = client_op2.get(f'/media/{file_path}')
        assert res_op2.status_code == status.HTTP_403_FORBIDDEN

        res_op2_api = client_op2.get(f'/api/documents/{doc.id}/download/')
        assert res_op2_api.status_code == status.HTTP_403_FORBIDDEN

        # ب. مصلحة متعاقدة أخرى (authority2) غير معنية بالصفقة -> مرفوض 403
        client_auth2 = APIClient()
        client_auth2.force_authenticate(user=users_fixture['authority2'])
        res_auth2 = client_auth2.get(f'/media/{file_path}')
        assert res_auth2.status_code == status.HTTP_403_FORBIDDEN

        # ج. صاحب العرض (operator1) -> مسموح 200
        client_op1 = APIClient()
        client_op1.force_authenticate(user=users_fixture['operator1'])
        res_op1 = client_op1.get(f'/media/{file_path}')
        assert res_op1.status_code == status.HTTP_200_OK
        assert res_op1.headers['Content-Type'] == 'application/pdf'

        # د. المصلحة المالكة للصفقة (authority1) -> مسموح 200
        client_auth1 = APIClient()
        client_auth1.force_authenticate(user=users_fixture['authority1'])
        res_auth1 = client_auth1.get(f'/media/{file_path}')
        assert res_auth1.status_code == status.HTTP_200_OK

        # هـ. الإدارة المركزية (central_admin) -> مسموح 200
        client_admin = APIClient()
        client_admin.force_authenticate(user=users_fixture['central_admin'])
        res_admin = client_admin.get(f'/media/{file_path}')
        assert res_admin.status_code == status.HTTP_200_OK

    def test_path_traversal_blocked(self, users_fixture):
        """3. التحقق من منع هجمات Path Traversal والوصول إلى ملفات خارج MEDIA_ROOT"""
        client = APIClient()
        client.force_authenticate(user=users_fixture['central_admin'])

        res = client.get('/media/../../manage.py')
        assert res.status_code == status.HTTP_404_NOT_FOUND

        res2 = client.get('/media/..%2f..%2fmanage.py')
        assert res2.status_code in (status.HTTP_404_NOT_FOUND, status.HTTP_400_BAD_REQUEST)

    def test_token_blacklisting_on_logout(self, users_fixture):
        """4. التحقق من إبطال التوكن (Blacklist) عند تسجيل الخروج ومنع استخدامه لاحقاً"""
        client = APIClient()

        # تسجيل الدخول
        login_res = client.post('/api/auth/login/', {
            'email': 'operator1@safaqat.dz',
            'password': 'Password@12345',
        }, format='json')
        assert login_res.status_code == status.HTTP_200_OK
        refresh_token = login_res.data['refresh']
        access_token = login_res.data['access']

        # تسجيل الخروج مع تمرير التوكن للإبطال
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        logout_res = client.post('/api/auth/logout/', {
            'refresh': refresh_token,
        }, format='json')
        assert logout_res.status_code == status.HTTP_200_OK
        assert logout_res.data.get('blacklisted') is True

        # محاولة استخدام التوكن المبطل في مسار التجديد -> يجب أن يفشل برمز 401
        failed_refresh = client.post('/api/auth/token/refresh/', {
            'refresh': refresh_token,
        }, format='json')
        assert failed_refresh.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'blacklisted' in str(failed_refresh.data.get('detail', '')).lower() or failed_refresh.data.get('code') == 'token_not_valid'

    def test_document_upload_validation_rejects_dangerous_files(self, users_fixture, deal_and_offer):
        """5. التحقق من فحص الملفات ومنع البرمجيات الخبيثة والملفات الفارغة"""
        client = APIClient()
        client.force_authenticate(user=users_fixture['operator1'])
        offer = deal_and_offer['offer']

        # أ. رفع ملف تنفيذي خبيث (.exe / .sh)
        bad_file = SimpleUploadedFile("malware.exe", b"MZ\x90\x00\x03\x00\x00\x00", content_type="application/octet-stream")
        res_bad = client.post(
            f'/api/offers/{offer.id}/document/',
            {'document': bad_file},
            format='multipart'
        )
        assert res_bad.status_code == status.HTTP_400_BAD_REQUEST

        # ب. رفع ملف بايثون أو نصي تنفيذي (.py / .sh)
        script_file = SimpleUploadedFile("exploit.sh", b"#!/bin/bash\nrm -rf /", content_type="text/x-shellscript")
        res_script = client.post(
            f'/api/offers/{offer.id}/document/',
            {'document': script_file},
            format='multipart'
        )
        assert res_script.status_code == status.HTTP_400_BAD_REQUEST

        # ج. رفع ملف فارغ (0 بايت)
        empty_file = SimpleUploadedFile("empty.pdf", b"", content_type="application/pdf")
        res_empty = client.post(
            f'/api/offers/{offer.id}/document/',
            {'document': empty_file},
            format='multipart'
        )
        assert res_empty.status_code == status.HTTP_400_BAD_REQUEST

        # د. رفع وثيقة PDF سليمة
        valid_pdf = SimpleUploadedFile("valid_offer.pdf", b"%PDF-1.4\n1 0 obj\nValid Document\n%%EOF", content_type="application/pdf")
        res_valid = client.post(
            f'/api/offers/{offer.id}/document/',
            {'document': valid_pdf},
            format='multipart'
        )
        assert res_valid.status_code == status.HTTP_200_OK
