import logging
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from apps.bids.models import BidOffer
from apps.users.models import Notification

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=BidOffer)
def track_bid_previous_state(sender, instance, **kwargs):
    """حفظ حالة العرض السابقة للمقارنة بعد الحفظ"""
    if instance.pk:
        try:
            old = BidOffer.objects.filter(pk=instance.pk).values('status').first()
            if old:
                instance._prev_status = old['status']
            else:
                instance._prev_status = None
        except Exception:
            instance._prev_status = None
    else:
        instance._prev_status = None


@receiver(post_save, sender=BidOffer)
def handle_bid_status_notifications(sender, instance, created, **kwargs):
    """
    توليد الإشعارات عند تغيير حالة العرض:
    - مقبول (admitted)
    - مقيم (evaluated)
    - مرفوض (rejected)
    - فائز ومسند إليه (awarded)
    """
    prev_status = getattr(instance, '_prev_status', None)
    curr_status = instance.status

    if prev_status == curr_status and not created:
        return

    deal = instance.deal
    deal_title = deal.title if deal else "الصفقة"
    deal_ref = deal.reference_number if deal else ""

    try:
        if curr_status == 'admitted' and prev_status != 'admitted':
            Notification.objects.create(
                user=instance.operator,
                title=f"قبول العرض إدارياً وتقنياً: {deal_title}",
                text=f"تم قبول عرضكم إدارياً وتقنياً في الصفقة ({deal_ref}) بعد عملية فتح وتقييم الأظرفة.",
                link_href=f"/operator/bids/{instance.id}",
                notification_type="bid_admitted",
            )
        elif curr_status == 'evaluated' and prev_status != 'evaluated':
            score_text = ""
            if instance.technical_score is not None:
                score_text += f" (العلامة التقنية: {instance.technical_score}"
                if instance.financial_score is not None:
                    score_text += f" / المالية: {instance.financial_score})"
                else:
                    score_text += ")"
            Notification.objects.create(
                user=instance.operator,
                title=f"اكتمال تقييم العرض: {deal_title}",
                text=f"انتهت لجنة تقييم العروض من دراسة وتقييم عرضكم للصفقة ({deal_ref}){score_text}.",
                link_href=f"/operator/bids/{instance.id}",
                notification_type="bid_evaluated",
            )
        elif curr_status == 'rejected' and prev_status != 'rejected':
            reason = f" السبب: {instance.rejection_reason}" if instance.rejection_reason else ""
            Notification.objects.create(
                user=instance.operator,
                title=f"إشعار برفض العرض: {deal_title}",
                text=f"نأسف لإبلاغكم بعدم قبول العرض المقدم للصفقة ({deal_ref}) لعدم المطابقة مع دفتر الشروط.{reason}",
                link_href=f"/operator/bids/{instance.id}",
                notification_type="bid_rejected",
            )
        elif curr_status == 'awarded' and prev_status != 'awarded':
            Notification.objects.create(
                user=instance.operator,
                title=f"مبروك! إسناد الصفقة لعرضكم: {deal_title}",
                text=f"تم اختيار عرضكم كفائز بالصفقة رقم {deal_ref}. يرجى استكمال إجراءات توقيع العقد والضمانات.",
                link_href=f"/operator/contracts/{deal.id}",
                notification_type="bid_awarded",
            )
            # إشعار للمصلحة المتعاقدة
            if deal and deal.authority:
                op_name = (
                    instance.operator.organization_name
                    or instance.operator.get_full_name()
                    or instance.operator.email
                )
                Notification.objects.create(
                    user=deal.authority,
                    title=f"تم تحديد العرض الفائز: {deal_title}",
                    text=f"تم إسناد الصفقة ({deal_ref}) للمتعامل {op_name}.",
                    link_href=f"/authority/deals/{deal.id}",
                    notification_type="deal_awarded",
                )
    except Exception as e:
        logger.error(f"خطأ أثناء توليد إشعار العرض {instance.id}: {e}")
