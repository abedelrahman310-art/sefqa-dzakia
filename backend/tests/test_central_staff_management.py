import uuid
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import CustomUser, CentralStaffInvitation
from apps.audit.models import AuditLog


class CentralStaffManagementTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. المفتش العام (Inspector General)
        self.inspector_general = CustomUser.objects.create_user(
            email='inspector.general@safaqat.gov.dz',
            password='Password123#Secure',
            display_name='السيد المفتش العام',
            role='central_admin',
            central_role='inspector_general',
            is_staff=True,
            is_active=True,
        )

        # 2. محلل بيانات (Analyst) - لا يملك صلاحية دعوة الموظفين
        self.analyst = CustomUser.objects.create_user(
            email='analyst@safaqat.gov.dz',
            password='Password123#Secure',
            display_name='محلل بيانات المنظومة',
            role='central_admin',
            central_role='analyst',
            is_staff=True,
            is_active=True,
        )

        # 3. متعامل اقتصادي عادي (Operator)
        self.operator = CustomUser.objects.create_user(
            email='operator@company.dz',
            password='Password123#Secure',
            display_name='شركة الإنجاز',
            role='operator',
            is_staff=False,
            is_active=True,
        )

    def test_list_staff_as_inspector_general(self):
        """التحقق من قدرة المفتش العام على استعراض قائمة الموظفين والدعوات"""
        self.client.force_authenticate(user=self.inspector_general)
        response = self.client.get('/api/central/staff/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data['can_manage'])
        self.assertGreaterEqual(data['total_staff'], 2)

    def test_invite_staff_unauthorized_for_operator(self):
        """حظر المتعامل الاقتصادي من دعوة أي موظف (403)"""
        self.client.force_authenticate(user=self.operator)
        response = self.client.post('/api/central/staff/invite/', {
            'email': 'new.auditor@safaqat.gov.dz',
            'full_name': 'مراقب مالي جديد',
            'role': 'financial_auditor',
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_invite_staff_success_and_audit_trail(self):
        """نجاح إرسال دعوة موظف جديد من طرف المفتش العام وتوثيقها في سجل التدقيق"""
        self.client.force_authenticate(user=self.inspector_general)
        email = 'new.auditor@safaqat.gov.dz'
        response = self.client.post('/api/central/staff/invite/', {
            'email': email,
            'full_name': 'أحمد بن علي',
            'role': 'financial_auditor',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertIn('invitation', data)
        self.assertEqual(data['invitation']['email'], email)
        self.assertEqual(data['invitation']['role'], 'financial_auditor')

        # التحقق من وجود الدعوة في قاعدة البيانات
        invitation = CentralStaffInvitation.objects.get(email=email)
        self.assertTrue(invitation.is_valid())
        self.assertEqual(invitation.status, 'pending')

        # التحقق من تسجيل العملية في AuditLog
        log = AuditLog.objects.filter(action='invited_central_staff', resource_id=str(invitation.id)).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.user, self.inspector_general)

    def test_accept_invitation_workflow(self):
        """مسار قبول الدعوة بالكامل: فحص الرابط، تعيين كلمة المرور، وتفعيل الحساب"""
        # إنشاء دعوة
        invitation = CentralStaffInvitation.objects.create(
            email='new.inspector@safaqat.gov.dz',
            full_name='سمير خليل',
            role='inspector',
            invited_by=self.inspector_general,
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )

        # 1. التحقق من صحة الرابط عبر GET (بدون تسجيل دخول)
        verify_res = self.client.get(f'/api/central/staff/accept-invite/{invitation.token}/')
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        verify_data = verify_res.json()
        self.assertTrue(verify_data['valid'])
        self.assertEqual(verify_data['email'], invitation.email)

        # 2. إرسال كلمة مرور ضعيفة للتأكد من فحص validate_password
        weak_res = self.client.post(f'/api/central/staff/accept-invite/{invitation.token}/', {
            'password': '123',
            'password_confirm': '123',
        })
        self.assertEqual(weak_res.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. إرسال كلمة مرور قوية مقبولة
        accept_res = self.client.post(f'/api/central/staff/accept-invite/{invitation.token}/', {
            'password': 'StrongPass2026!@Central',
            'password_confirm': 'StrongPass2026!@Central',
        })
        self.assertEqual(accept_res.status_code, status.HTTP_200_OK)

        # التحقق من إنشاء المستخدم وتعيين دوره
        new_user = CustomUser.objects.get(email=invitation.email)
        self.assertEqual(new_user.role, 'central_admin')
        self.assertEqual(new_user.central_role, 'inspector')
        self.assertTrue(new_user.is_active)
        self.assertTrue(new_user.check_password('StrongPass2026!@Central'))

        # التحقق من تحديث حالة الدعوة
        invitation.refresh_from_db()
        self.assertEqual(invitation.status, 'accepted')

        # التحقق من توثيق العملية في سجل التدقيق
        log = AuditLog.objects.filter(action='accept_central_invitation', resource_id=str(new_user.id)).first()
        self.assertIsNotNone(log)

    def test_revoke_and_toggle_staff_status(self):
        """تعطيل وتفعيل حساب موظف بالإدارة المركزية مع منع تعطيل الذات"""
        self.client.force_authenticate(user=self.inspector_general)

        # محاولة تعطيل الحساب الشخصي للمفتش العام (محظورة 400)
        self_res = self.client.patch(f'/api/central/staff/{self.inspector_general.id}/revoke/')
        self.assertEqual(self_res.status_code, status.HTTP_400_BAD_REQUEST)

        # تعطيل حساب المحلل
        deact_res = self.client.patch(f'/api/central/staff/{self.analyst.id}/revoke/', {'is_active': False}, format='json')
        self.assertEqual(deact_res.status_code, status.HTTP_200_OK)
        self.analyst.refresh_from_db()
        self.assertFalse(self.analyst.is_active)

        # إعادة تفعيل الحساب
        act_res = self.client.patch(f'/api/central/staff/{self.analyst.id}/revoke/', {'is_active': True}, format='json')
        self.assertEqual(act_res.status_code, status.HTTP_200_OK)
        self.analyst.refresh_from_db()
        self.assertTrue(self.analyst.is_active)
