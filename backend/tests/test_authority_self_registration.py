import uuid
from django.test import TestCase, RequestFactory
from django.utils import timezone
from django.http import HttpResponse
from rest_framework.test import APIClient
from rest_framework import status

from apps.users.models import CustomUser, Notification
from apps.procurements.models import Authority
from apps.audit.models import AuditLog
from apps.users.middleware import WorkspaceStatusMiddleware


class AuthoritySelfRegistrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.rf = RequestFactory()

        # حساب إدارة مركزية لتلقي الإشعارات
        self.central_admin = CustomUser.objects.create_user(
            email='central@safaqat.gov.dz',
            password='AdminPassword123#',
            role='central_admin',
            is_staff=True,
        )

        # حساب مصلحة سابقة معتمدة (Approved Authority)
        self.existing_authority_user = CustomUser.objects.create_user(
            email='existing.authority@safaqat.gov.dz',
            password='Password123#Secure',
            role='authority',
            organization_name='مديرية السكن السابقة',
            is_staff=True,
        )
        self.existing_authority = Authority.objects.create(
            name='مديرية السكن السابقة',
            wilaya='الجزائر',
            user=self.existing_authority_user,
            status='approved',
        )

    def test_self_registration_endpoint_success(self):
        """نجاح إيداع طلب تسجيل ذاتي لمصلحة متعاقدة جديدة بحالة pending_approval"""
        payload = {
            'name': 'مديرية التجهيزات العمومية لولاية وهران',
            'wilaya': 'وهران',
            'entity_type': 'wilaya',
            'email': 'dup.oran@safaqat.gov.dz',
            'password': 'StrongPassword2026!#Oran',
            'ordonnateur_name': 'السيد المدير الولائي',
            'ordonnateur_title': 'مدير التجهيزات العمومية',
            'ordonnateur_phone': '041234567',
        }

        response = self.client.post('/api/auth/register/authority/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data['status'], 'pending_approval')
        self.assertIn('authority_id', data)

        # 1. التحقق من إنشاء المستخدم بدور ordonnateur
        user = CustomUser.objects.get(email='dup.oran@safaqat.gov.dz')
        self.assertEqual(user.role, 'ordonnateur')
        self.assertEqual(user.organization_name, payload['name'])

        # 2. التحقق من إنشاء كائن Authority بحالة pending_approval
        authority = Authority.objects.get(id=data['authority_id'])
        self.assertEqual(authority.user, user)
        self.assertEqual(authority.status, 'pending_approval')
        self.assertEqual(authority.ordonnateur_name, payload['ordonnateur_name'])

        # 3. التحقق من توثيق العملية في سجل التدقيق AuditLog
        log = AuditLog.objects.filter(action='authority_self_registration', resource_id=str(authority.id)).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.user, user)

        # 4. التحقق من وصول إشعار للإدارة المركزية
        notif = Notification.objects.filter(user=self.central_admin).first()
        self.assertIsNotNone(notif)
        self.assertIn('مديرية التجهيزات العمومية', notif.text)

    def test_duplicate_email_blocked(self):
        """حظر التسجيل ببريد مستخدم مسجل مسبقاً"""
        payload = {
            'name': 'بلدية بئر خادم',
            'email': 'existing.authority@safaqat.gov.dz',
            'password': 'StrongPassword2026!#',
            'ordonnateur_name': 'رئيس المجلس',
        }
        response = self.client.post('/api/auth/register/authority/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_workspace_status_middleware_blocks_pending_authority(self):
        """الوسيط يمنع المصلحة المعلقة من الوصول إلى مسارات /api/authority/ فقط"""
        # مستخدم معلق
        pending_user = CustomUser.objects.create_user(
            email='pending@safaqat.gov.dz',
            password='Password123#Secure',
            role='ordonnateur',
        )
        Authority.objects.create(
            name='مصلحة معلقة',
            user=pending_user,
            status='pending_approval',
        )

        middleware = WorkspaceStatusMiddleware(lambda req: HttpResponse("OK", status=200))

        # 1. محاولة الوصول إلى /api/authority/deals/ -> محظور 403
        req_auth = self.rf.get('/api/authority/deals/')
        req_auth.user = pending_user
        res_auth = middleware(req_auth)
        self.assertEqual(res_auth.status_code, 403)
        self.assertIn('قيد المراجعة', res_auth.content.decode('utf-8'))

        # 2. محاولة الوصول إلى /api/auth/me/ -> مسموح 200
        req_me = self.rf.get('/api/auth/me/')
        req_me.user = pending_user
        res_me = middleware(req_me)
        self.assertEqual(res_me.status_code, 200)

    def test_workspace_status_middleware_allows_approved_authority(self):
        """المصالح المعتمدة الحالية تعمل بحرية تامة وبدون أي تعطيل (Zero Breaking Changes)"""
        middleware = WorkspaceStatusMiddleware(lambda req: HttpResponse("OK", status=200))

        req = self.rf.get('/api/authority/deals/')
        req.user = self.existing_authority_user
        res = middleware(req)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.content.decode('utf-8'), "OK")
