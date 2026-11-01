import pytest
from rest_framework.test import APIClient
from apps.users.models import CustomUser, Notification
from apps.procurements.models import ProcurementDeal, Contract
from apps.bids.models import BidOffer


@pytest.mark.django_db
def test_procurement_deal_published_signal():
    """التحقق من توليد إشعار للمتعاملين عند نشر صفقة جديدة"""
    authority = CustomUser.objects.create_user(
        email='authority_signal@example.com',
        role='authority',
        organization_name='مديرية التجهيزات العمومية',
    )
    operator = CustomUser.objects.create_user(
        email='op_signal@example.com',
        role='operator',
        organization_name='شركة الإنجاز الجزائري',
    )

    # إنشاء صفقة في مرحلة التحضير (المرحلة 1)
    deal = ProcurementDeal.objects.create(
        title='مشروع بناء مدرسة نموذجية',
        reference_number='DEAL-SIG-001',
        authority=authority,
        current_stage=1,
        status='draft',
    )

    # التأكد من عدم إرسال إشعار بعد
    assert Notification.objects.filter(user=operator, notification_type='deal_published').count() == 0

    # نشر الصفقة (المرحلة 3)
    deal.current_stage = 3
    deal.status = 'published'
    deal.save()

    # التحقق من وصول الإشعار للمتعامل
    notif = Notification.objects.filter(user=operator, notification_type='deal_published').first()
    assert notif is not None
    assert 'مشروع بناء مدرسة نموذجية' in notif.title
    assert notif.is_read is False


@pytest.mark.django_db
def test_bid_offer_status_signals():
    """التحقق من توليد الإشعارات عند تغير حالة العرض (مقبول، مقيم، مرفوض، مسند)"""
    authority = CustomUser.objects.create_user(
        email='auth_bid_sig@example.com',
        role='authority',
    )
    operator = CustomUser.objects.create_user(
        email='op_bid_sig@example.com',
        role='operator',
    )
    deal = ProcurementDeal.objects.create(
        title='توريد تجهيزات إعلام آلي',
        reference_number='DEAL-IT-002',
        authority=authority,
        current_stage=5,
        status='opening_session',
    )

    # 1. إيداع عرض جديد
    bid = BidOffer.objects.create(
        deal=deal,
        operator=operator,
        status='submitted',
        financial_amount=5000000,
    )

    # 2. تغيير الحالة إلى مقبول (admitted)
    bid.status = 'admitted'
    bid.save()
    assert Notification.objects.filter(user=operator, notification_type='bid_admitted').exists()

    # 3. تقييم العرض (evaluated)
    bid.status = 'evaluated'
    bid.technical_score = 85.5
    bid.financial_score = 90.0
    bid.save()
    assert Notification.objects.filter(user=operator, notification_type='bid_evaluated').exists()

    # 4. إسناد العرض (awarded)
    bid.status = 'awarded'
    bid.save()
    assert Notification.objects.filter(user=operator, notification_type='bid_awarded').exists()
    assert Notification.objects.filter(user=authority, notification_type='deal_awarded').exists()


@pytest.mark.django_db
def test_notification_api_endpoints():
    """التحقق من مسارات /api/notifications/ و /read/ و mark-all-read/"""
    user = CustomUser.objects.create_user(
        email='user_notif_api@example.com',
        role='operator',
    )

    notif1 = Notification.objects.create(
        user=user,
        title='تنبيه 1',
        text='محتوى الإشعار الأول',
        is_read=False,
    )
    notif2 = Notification.objects.create(
        user=user,
        title='تنبيه 2',
        text='محتوى الإشعار الثاني',
        is_read=False,
    )

    client = APIClient()
    client.force_authenticate(user=user)

    # 1. جلب قائمة الإشعارات
    res = client.get('/api/notifications/')
    assert res.status_code == 200
    data = res.json()
    assert 'notifications' in data
    assert 'unread_count' in data
    assert data['unread_count'] == 2

    # 2. تعليم إشعار فردي كمقروء عبر POST /api/notifications/{id}/read/
    res_read = client.post(f'/api/notifications/{notif1.id}/read/')
    assert res_read.status_code == 200
    notif1.refresh_from_db()
    assert notif1.is_read is True

    # 3. تعليم الكل كمقروء عبر POST /api/notifications/mark-all-read/
    res_all = client.post('/api/notifications/mark-all-read/')
    assert res_all.status_code == 200
    notif2.refresh_from_db()
    assert notif2.is_read is True

    # التحقق من أن unread_count أصبح 0
    res_after = client.get('/api/notifications/')
    assert res_after.json()['unread_count'] == 0
