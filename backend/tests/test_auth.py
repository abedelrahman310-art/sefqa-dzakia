import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.users.models import CustomUser

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_users(db):
    password = 'Safaqat@2026'
    authority = CustomUser.objects.create_user(
        email='auth_test@safaqat.dz',
        password=password,
        role='authority',
        display_name='مسؤول مصلحة تجريبي',
        organization_name='مديرية التعمير'
    )
    operator = CustomUser.objects.create_user(
        email='op_test@safaqat.dz',
        password=password,
        role='operator',
        display_name='متعامل تجريبي',
        organization_name='شركة الإنجاز'
    )
    admin = CustomUser.objects.create_superuser(
        email='admin_test@safaqat.dz',
        password=password,
        role='central_admin',
        display_name='مراقب مركزي تجريبي',
        organization_name='المفتشية'
    )
    return {
        'authority': authority,
        'operator': operator,
        'admin': admin,
        'password': password
    }

@pytest.mark.django_db
class TestAuthentication:
    def test_login_success_for_all_roles(self, api_client, test_users):
        """اختبار تسجيل الدخول بنجاح وإصدار JWT لكل دور من الأدوار الثلاثة"""
        for role_key in ['authority', 'operator', 'admin']:
            user = test_users[role_key]
            response = api_client.post('/api/auth/login/', {
                'email': user.email,
                'password': test_users['password'],
            }, format='json')

            assert response.status_code == 200, f"Login failed for role {role_key}: {response.data}"
            assert 'access' in response.data
            assert 'refresh' in response.data
            assert response.data['user']['email'] == user.email
            assert response.data['user']['role'] == user.role

    def test_login_invalid_credentials(self, api_client, test_users):
        """اختبار رفض تسجيل الدخول عند إدخال كلمة مرور غير صحيحة"""
        response = api_client.post('/api/auth/login/', {
            'email': 'auth_test@safaqat.dz',
            'password': 'WrongPassword@123',
        }, format='json')

        assert response.status_code == 401
        assert 'error' in response.data

    def test_me_endpoint_with_bearer_token(self, api_client, test_users):
        """اختبار استرجاع بيانات المستخدم الحالي عبر مسار /api/auth/me/"""
        user = test_users['operator']
        login_res = api_client.post('/api/auth/login/', {
            'email': user.email,
            'password': test_users['password'],
        }, format='json')
        token = login_res.data['access']

        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        me_res = api_client.get('/api/auth/me/')

        assert me_res.status_code == 200
        assert me_res.data['user']['email'] == user.email
        assert me_res.data['user']['role'] == 'operator'

    def test_token_refresh(self, api_client, test_users):
        """اختبار تجديد التوكن بنجاح عبر مسار /api/auth/token/refresh/"""
        user = test_users['authority']
        login_res = api_client.post('/api/auth/login/', {
            'email': user.email,
            'password': test_users['password'],
        }, format='json')
        refresh_token = login_res.data['refresh']

        refresh_res = api_client.post('/api/auth/token/refresh/', {
            'refresh': refresh_token,
        }, format='json')

        assert refresh_res.status_code == 200
        assert 'access' in refresh_res.data
        assert isinstance(refresh_res.data['access'], str)

    def test_jwt_expiration(self, api_client, test_users):
        """اختبار رفض التوكن منتهي الصلاحية مع رمز 401"""
        from datetime import timedelta
        from rest_framework_simplejwt.tokens import AccessToken

        user = test_users['operator']
        expired_token = AccessToken.for_user(user)
        expired_token.set_exp(lifetime=-timedelta(minutes=5))

        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(expired_token)}')
        res = api_client.get('/api/auth/me/')

        assert res.status_code == 401
        assert res.data.get('code') == 'token_not_valid' or 'detail' in res.data

    def test_operator_registration_success(self, api_client):
        """اختبار تسجيل متعامل اقتصادي جديد بنجاح وتوليد التوكن وسجل التدقيق"""
        from apps.audit.models import AuditLog
        from apps.users.models import OperatorProfile

        payload = {
            'role': 'operator',
            'fullName': 'أحمد بن علي',
            'email': 'ahmed.operator@safaqat.dz',
            'phone': '0555123456',
            'password': 'SecurePassword@2026',
            'wilaya': '16',
            'company': 'مؤسسة البناء الحديثة',
            'legalForm': 'SARL',
            'rc': '16/00-1234567B26',
            'nif': '002616012345678',
        }

        response = api_client.post('/api/auth/register/', payload, format='json')
        assert response.status_code == 201
        assert response.data['user']['email'] == 'ahmed.operator@safaqat.dz'
        assert response.data['user']['role'] == 'operator'
        assert response.data['user']['display_name'] == 'أحمد بن علي'
        assert response.data['user']['organization_name'] == 'مؤسسة البناء الحديثة'
        assert 'access' in response.data
        assert 'refresh' in response.data

        # التحقق من وجود المستخدم في قاعدة البيانات
        created_user = CustomUser.objects.get(email='ahmed.operator@safaqat.dz')
        assert created_user.role == 'operator'

        # التحقق من إنشاء ملف المتعامل الاقتصادي
        profile = OperatorProfile.objects.get(user=created_user)
        assert '16' in profile.available_wilayas

        # التحقق من تدوين العملية في سجل التدقيق غير القابل للتعديل
        audit = AuditLog.objects.filter(resource_id=str(created_user.id), action='USER_REGISTRATION').first()
        assert audit is not None
        assert audit.checksum != ''

    def test_authority_registration_success(self, api_client):
        """اختبار تسجيل مصلحة متعاقدة جديدة بنجاح"""
        from apps.audit.models import AuditLog

        payload = {
            'role': 'authority',
            'name': 'مديرية التجهيزات العمومية لولاية وهران',
            'repName': 'محمد منصوري',
            'email': 'dlep.oran@safaqat.dz',
            'phone': '041234567',
            'password': 'AuthoritySecure@2026',
            'wilaya': '31',
            'category': 'deconcentrated',
            'tutelle': 'وزارة السكن والعمران والمدينة',
            'code': 'DLEP-31',
        }

        response = api_client.post('/api/auth/register/', payload, format='json')
        assert response.status_code == 201
        assert response.data['user']['email'] == 'dlep.oran@safaqat.dz'
        assert response.data['user']['role'] == 'authority'
        assert response.data['user']['organization_name'] == 'مديرية التجهيزات العمومية لولاية وهران'
        assert 'access' in response.data

        created_user = CustomUser.objects.get(email='dlep.oran@safaqat.dz')
        assert created_user.role == 'authority'

    def test_registration_blocks_central_admin(self, api_client):
        """اختبار حظر التسجيل الذاتي بدور الإدارة المركزية والرقابة (منع تصعيد الصلاحيات)"""
        payload = {
            'role': 'central_admin',
            'email': 'hacker@safaqat.dz',
            'password': 'HackerPassword@2026',
            'fullName': 'محاولة اختراق',
        }
        response = api_client.post('/api/auth/register/', payload, format='json')
        assert response.status_code == 400

    def test_registration_duplicate_email_fails(self, api_client, test_users):
        """اختبار رفض التسجيل ببريد إلكتروني مسجل مسبقاً"""
        payload = {
            'role': 'operator',
            'email': test_users['operator'].email,
            'password': 'AnotherPassword@2026',
            'fullName': 'مستخدم مكرر',
        }
        response = api_client.post('/api/auth/register/', payload, format='json')
        assert response.status_code == 400
        assert 'email' in response.data

    def test_registration_short_password_fails(self, api_client):
        """اختبار رفض كلمات المرور الأقل من 8 أحرف"""
        payload = {
            'role': 'operator',
            'email': 'shortpass@safaqat.dz',
            'password': '123',
            'fullName': 'مستخدم',
        }
        response = api_client.post('/api/auth/register/', payload, format='json')
        assert response.status_code == 400
        assert 'password' in response.data


