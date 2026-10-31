import logging
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from apps.procurements.models import ProcurementDeal, Contract
from apps.users.models import CustomUser, Notification

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=ProcurementDeal)
def track_deal_previous_state(sender, instance, **kwargs):
    """حفظ الحالة السابقة للصفقة للمقارنة بعد الحفظ"""
    if instance.pk:
        try:
            old = ProcurementDeal.objects.filter(pk=instance.pk).values('current_stage', 'status').first()
            if old:
                instance._prev_stage = old['current_stage']
                instance._prev_status = old['status']
            else:
                instance._prev_stage = None
                instance._prev_status = None
        except Exception:
            instance._prev_stage = None
            instance._prev_status = None
    else:
        instance._prev_stage = None
        instance._prev_status = None


@receiver(post_save, sender=ProcurementDeal)
def handle_deal_status_notifications(sender, instance, created, **kwargs):
    """
    توليد الإشعارات عند تغيير حالة الصفقة:
    1. نشر الإعلان (المرحلة 3 أو حالة published): إشعار للمتعاملين الاقتصاديين.
    2. الإسناد والمنح المؤقت (المرحلة 8 أو حالة awarded): إشعار للمصلحة والمتعامل الفائز.
    """
    prev_stage = getattr(instance, '_prev_stage', None)
    prev_status = str(getattr(instance, '_prev_status', '') or '').lower()
    curr_stage = instance.current_stage
    curr_status = str(instance.status or '').lower()

    # 1. إشعار النشر للمتعاملين
    is_now_published = curr_stage == 3 or curr_status == 'published'
    was_published = prev_stage == 3 or prev_status == 'published'

    if is_now_published and (created or not was_published):
        try:
            operators = CustomUser.objects.filter(role='operator')
            authority_name = (
                instance.authority.organization_name
                or instance.authority.get_full_name()
                or 'المصلحة المتعاقدة'
            )
            notifications = [
                Notification(
                    user=op,
                    title=f"صفقة معلنة جديدة: {instance.title}",
                    text=f"أعلنت {authority_name} عن صفقة جديدة بعنوان «{instance.title}» (المرجع: {instance.reference_number}). دفتر الشروط متاح لإيداع العروض.",
                    link_href=f"/operator/opportunities/{instance.id}",
                    notification_type="deal_published",
                )
                for op in operators
            ]
            if notifications:
                Notification.objects.bulk_create(notifications)
                logger.info(f"تم إرسال {len(notifications)} إشعار نشر للصفقة {instance.reference_number}")
        except Exception as e:
            logger.error(f"خطأ أثناء توليد إشعارات نشر الصفقة {instance.id}: {e}")

    # 2. إشعار الإسناد / المنح المؤقت
    is_now_awarded = curr_stage == 8 or curr_status in ['awarded', 'provisional_award']
    was_awarded = prev_stage == 8 or prev_status in ['awarded', 'provisional_award']

    if is_now_awarded and not was_awarded:
        try:
            # إشعار للمصلحة المتعاقدة
            Notification.objects.create(
                user=instance.authority,
                title=f"تسجيل المنح المؤقت: {instance.title}",
                text=f"تم تسجيل قرار الإسناد المؤقت للصفقة {instance.reference_number}. بدأت مهلة الطعون القانونية (10 أيام وفق المرسوم 15-247).",
                link_href=f"/authority/deals/{instance.id}",
                notification_type="deal_awarded",
            )
            # إشعار للمتعاملين أصحاب العروض الفائزة إن وجدوا
            winning_bids = instance.bids.filter(status='awarded').select_related('operator')
            for bid in winning_bids:
                Notification.objects.create(
                    user=bid.operator,
                    title=f"مبروك! منح مؤقت للصفقة: {instance.title}",
                    text=f"تم اختيار عرضكم كفائز مؤقت بالصفقة رقم {instance.reference_number}. بدأت مهلة الطعون القانونية.",
                    link_href=f"/operator/contracts/{instance.id}",
                    notification_type="deal_awarded",
                )
        except Exception as e:
            logger.error(f"خطأ أثناء توليد إشعارات إسناد الصفقة {instance.id}: {e}")


@receiver(post_save, sender=Contract)
def handle_contract_created_notifications(sender, instance, created, **kwargs):
    """
    توليد إشعار عند إبرام وتوليد عقد رسمي (للمصلحة والمتعامل)
    """
    if created:
        try:
            # إشعار للمتعامل الاقتصادي المتعاقد
            Notification.objects.create(
                user=instance.operator,
                title=f"تم إبرام وتوليد العقد: {instance.deal.title}",
                text=f"تم إنشاء وتوثيق العقد الرسمي رقم {instance.contract_number or instance.id} للصفقة {instance.deal.reference_number}. يمكنك متابعة بنود العقد وأوامر الخدمة (ODS).",
                link_href=f"/operator/contracts/{instance.deal.id}",
                notification_type="contract_created",
            )
            # إشعار للمصلحة المتعاقدة
            Notification.objects.create(
                user=instance.deal.authority,
                title=f"توثيق العقد الإداري: {instance.deal.title}",
                text=f"تم توثيق العقد رقم {instance.contract_number or instance.id} مع المتعامل {instance.operator.organization_name or instance.operator.get_full_name() or instance.operator.email}.",
                link_href=f"/authority/deals/{instance.deal.id}",
                notification_type="contract_created",
            )
        except Exception as e:
            logger.error(f"خطأ أثناء توليد إشعارات إنشاء العقد {instance.id}: {e}")
