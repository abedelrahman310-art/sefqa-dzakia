import pytest
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APIClient
from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal
from apps.bids.models import BidOffer

@pytest.fixture
def op_user(db):
    return CustomUser.objects.create_user(
        email='op_lifecycle@safaqat.dz', password='pass', role='operator'
    )

@pytest.fixture
def auth_user(db):
    return CustomUser.objects.create_user(
        email='auth_lifecycle@safaqat.dz', password='pass', role='authority'
    )

@pytest.mark.django_db
class TestLifecycleRules:
    def test_bid_modification_blocked_after_deadline(self, op_user, auth_user):
        """منع تعديل العرض بعد انقضاء أجل الاستلام القانوني وفق المادة 68 من القانون 23-12"""
        past_deadline = timezone.now() - timedelta(days=2)
        deal = ProcurementDeal.objects.create(
            reference_number='DEAL-DEADLINE-EXP',
            title='صفقة منتهية الأجل',
            description='وصف الصفقة',
            authority=auth_user,
            current_stage=5,
            submission_deadline=past_deadline,
        )

        bid = BidOffer.objects.create(
            deal=deal,
            operator=op_user,
            financial_amount=Decimal('1000000.00'),
            status='draft',
        )

        client = APIClient()
        client.force_authenticate(user=op_user)

        response = client.patch(f'/api/bids/offers/{bid.id}/', {
            'financial_amount': '900000.00'
        }, format='json')

        assert response.status_code == 400
        assert 'انقضى الأجل القانوني' in str(response.data)

    def test_bid_modification_blocked_after_evaluation_stage(self, op_user, auth_user):
        """منع تعديل العرض إذا انتقلت الصفقة لمرحلة التقييم والإسناد (المرحلة 6 فما فوق)"""
        future_deadline = timezone.now() + timedelta(days=5)
        deal = ProcurementDeal.objects.create(
            reference_number='DEAL-STAGE-EVAL',
            title='صفقة في مرحلة التقييم',
            description='وصف',
            authority=auth_user,
            current_stage=7,  # المرحلة 07: التقييم والمقارنة
            submission_deadline=future_deadline,
        )

        bid = BidOffer.objects.create(
            deal=deal,
            operator=op_user,
            financial_amount=Decimal('1200000.00'),
            status='draft',
        )

        client = APIClient()
        client.force_authenticate(user=op_user)

        response = client.patch(f'/api/bids/offers/{bid.id}/', {
            'financial_amount': '1100000.00'
        }, format='json')

        assert response.status_code == 400
        assert 'انتهت مرحلة استلام العروض' in str(response.data)
