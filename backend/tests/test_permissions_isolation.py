import pytest
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APIClient
from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal
from apps.bids.models import BidOffer

@pytest.fixture
def client_operator_1(db):
    user = CustomUser.objects.create_user(
        email='op1@safaqat.dz', password='pass', role='operator'
    )
    c = APIClient()
    c.force_authenticate(user=user)
    return c, user

@pytest.fixture
def client_operator_2(db):
    user = CustomUser.objects.create_user(
        email='op2@safaqat.dz', password='pass', role='operator'
    )
    c = APIClient()
    c.force_authenticate(user=user)
    return c, user

@pytest.fixture
def client_authority_1(db):
    user = CustomUser.objects.create_user(
        email='auth1@safaqat.dz', password='pass', role='authority'
    )
    c = APIClient()
    c.force_authenticate(user=user)
    return c, user

@pytest.fixture
def client_authority_2(db):
    user = CustomUser.objects.create_user(
        email='auth2@safaqat.dz', password='pass', role='authority'
    )
    c = APIClient()
    c.force_authenticate(user=user)
    return c, user

@pytest.mark.django_db
class TestPermissionsAndDataIsolation:
    def test_operator_data_isolation(self, client_operator_1, client_operator_2, client_authority_1):
        """عزل بيانات المتعاملين: لا يمكن لمتعامل رؤية عروض متعامل آخر"""
        c_op1, op1 = client_operator_1
        c_op2, op2 = client_operator_2
        _, auth1 = client_authority_1

        deal = ProcurementDeal.objects.create(
            reference_number='DEAL-ISO-01',
            title='صفقة اختبار العزل',
            description='وصف الصفقة',
            authority=auth1,
            current_stage=5,
            submission_deadline=timezone.now() + timedelta(days=10),
            estimated_budget=Decimal('1000000.00'),
        )

        bid_op1 = BidOffer.objects.create(
            deal=deal,
            operator=op1,
            financial_amount=Decimal('950000.00'),
            status='submitted',
        )

        # Operator 1 can view their own bid
        res_op1 = c_op1.get(f'/api/bids/offers/{bid_op1.id}/')
        assert res_op1.status_code == 200

        # Operator 2 CANNOT view Operator 1's bid
        res_op2 = c_op2.get(f'/api/bids/offers/{bid_op1.id}/')
        assert res_op2.status_code == 404

    def test_authority_cannot_create_bid(self, client_authority_1):
        """رفض الصلاحيات: المصلحة المتعاقدة لا يحق لها التقدم بعطاءات"""
        c_auth, auth = client_authority_1
        deal = ProcurementDeal.objects.create(
            reference_number='DEAL-ISO-02',
            title='صفقة تجريبية',
            description='وصف',
            authority=auth,
            current_stage=5,
            submission_deadline=timezone.now() + timedelta(days=10),
        )

        res = c_auth.post('/api/bids/offers/', {
            'deal': str(deal.id),
            'financial_amount': '500000.00',
        }, format='json')

        assert res.status_code in [403, 400]

    def test_authority_data_isolation(self, client_operator_1, client_authority_1, client_authority_2):
        """عزل بيانات المصالح المتعاقدة: مصلحة متعاقدة لا ترى عروض صفقة تابعة لمصلحة أخرى"""
        c_op, op = client_operator_1
        _, auth1 = client_authority_1
        c_auth2, auth2 = client_authority_2

        deal1 = ProcurementDeal.objects.create(
            reference_number='DEAL-AUTH-01',
            title='صفقة المصلحة الأولى',
            description='وصف',
            authority=auth1,
            current_stage=5,
        )

        bid1 = BidOffer.objects.create(
            deal=deal1,
            operator=op,
            financial_amount=Decimal('400000.00'),
            status='submitted',
        )

        # Authority 2 cannot see bid submitted to Authority 1
        res_auth2 = c_auth2.get(f'/api/bids/offers/{bid1.id}/')
        assert res_auth2.status_code == 404

    def test_operator_cannot_create_deal(self, client_operator_1):
        """فصل المهام: منع المتعامل الاقتصادي من إنشاء صفقة عمومية"""
        c_op, op = client_operator_1
        res = c_op.post('/api/procurements/deals/', {
            'reference_number': 'FORBIDDEN-DEAL-01',
            'title': 'صفقة غير مصرح بها للمتعامل',
            'description': 'محاولة غير مصرح بها',
            'estimated_budget': '10000000.00',
            'wilaya': 'الجزائر',
        }, format='json')
        assert res.status_code == 403

    def test_authority_cannot_modify_operator_bid(self, client_operator_1, client_authority_1):
        """فصل المهام: منع المصلحة المتعاقدة من تعديل عرض المتعامل الاقتصادي"""
        c_op, op = client_operator_1
        c_auth, auth = client_authority_1
        deal = ProcurementDeal.objects.create(
            reference_number='DEAL-NO-MOD-01',
            title='صفقة فحص التعديل',
            description='وصف',
            authority=auth,
            current_stage=4,
            submission_deadline=timezone.now() + timedelta(days=10),
        )
        bid = BidOffer.objects.create(
            deal=deal,
            operator=op,
            financial_amount=Decimal('500000.00'),
            status='draft',
        )

        res = c_auth.patch(f'/api/bids/offers/{bid.id}/', {
            'financial_amount': '450000.00',
        }, format='json')
        assert res.status_code == 403

    def test_central_admin_cannot_modify_award_decision(self, client_authority_1, client_operator_1):
        """فصل المهام: منع الرقابة المركزية من تعديل قرارات التقييم والإسناد"""
        from apps.contracts.models import AwardDecision
        _, auth = client_authority_1
        _, op = client_operator_1
        deal = ProcurementDeal.objects.create(
            reference_number='DEAL-AWARD-TEST-01',
            title='صفقة اختبار الإسناد',
            description='وصف',
            authority=auth,
            current_stage=8,
        )
        bid = BidOffer.objects.create(
            deal=deal,
            operator=op,
            financial_amount=Decimal('800000.00'),
            status='awarded',
        )
        award = AwardDecision.objects.create(
            deal=deal,
            awarded_bid=bid,
            appeal_window_days=10,
            justification='إسناد قانوني أولي',
        )

        admin_user = CustomUser.objects.create_superuser(
            email='admin_perm_test@safaqat.dz',
            password='pass',
            role='central_admin'
        )
        c_admin = APIClient()
        c_admin.force_authenticate(user=admin_user)

        res = c_admin.patch(f'/api/contracts/awards/{award.id}/', {
            'justification': 'محاولة تعديل غير مصرح بها من الرقابة',
        }, format='json')
        assert res.status_code == 403


