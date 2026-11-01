import logging
from datetime import timedelta, datetime, time
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.audit.models import AuditLog

logger = logging.getLogger(__name__)


def create_objection(
    tender,
    objector,
    objection_type,
    grounds,
    description,
    award_announced_at=None,
    contested_operator=None,
    objector_ip=None,
):
    """
    إنشاء طعن جديد وفق المادة 72 من القانون 23-12.

    التحققات:
    1. objector قدّم عرضاً في الصفقة
    2. المهلة لم تنته (10 أيام من الإعلان)
    3. لا يوجد طعن مفتوح من نفس المُطعِن

    النتيجة:
    - إنشاء AwardObjection (status=SUBMITTED)
    - إضافة ObjectionTimeline
    - تسجيل في AuditLog
    """
    from apps.contracts.models import (
        AwardObjection,
        ObjectionTimeline,
        ObjectionStatus,
    )
    from apps.bids.models import BidOffer

    now = timezone.now()

    # 1. التحقق من العرض
    has_offer = BidOffer.objects.filter(deal=tender, operator=objector).exists()
    if not has_offer:
        logger.warning(
            "رفض إنشاء طعن: المستخدم %s لم يقدّم عرضاً في الصفقة %s",
            objector.email,
            tender.reference_number,
        )
        raise ValidationError("يجب أن تكون قدّمت عرضاً في هذه الصفقة لتتمكن من الطعن")

    # 2. حساب المهلة (10 أيام)
    if not award_announced_at:
        award_decision = getattr(tender, "award_decision", None)
        if award_decision and award_decision.publication_date:
            award_announced_at = timezone.make_aware(
                datetime.combine(award_decision.publication_date, time.min)
            )
        else:
            award_announced_at = now

    deadline = award_announced_at + timedelta(days=10)

    if now > deadline:
        logger.warning(
            "رفض إنشاء طعن: انقضاء الأجل القانوني للصفقة %s (الموعد: %s, الحالي: %s)",
            tender.reference_number,
            deadline,
            now,
        )
        raise ValidationError(
            f"انتهت مهلة الطعن القانونية (10 أيام). آخر أجل كان: {deadline.strftime('%Y-%m-%d')}"
        )

    # 3. التحقق من عدم وجود طعن مفتوح
    existing = AwardObjection.objects.filter(
        tender=tender,
        objector=objector,
        status__in=[
            ObjectionStatus.SUBMITTED,
            ObjectionStatus.UNDER_REVIEW,
        ],
    ).exists()
    if existing:
        logger.warning(
            "رفض إنشاء طعن: يوجد طعن مفتوح بالفعل للمستخدم %s على الصفقة %s",
            objector.email,
            tender.reference_number,
        )
        raise ValidationError("يوجد طعن مفتوح بالفعل على هذه الصفقة")

    # 4. الإنشاء
    objection = AwardObjection.objects.create(
        tender=tender,
        objector=objector,
        contested_operator=contested_operator,
        objection_type=objection_type,
        grounds=grounds,
        description=description,
        award_announced_at=award_announced_at,
        deadline_at=deadline,
        submitted_at=now,
        status=ObjectionStatus.SUBMITTED,
        objector_ip=objector_ip,
    )

    # 5. السجل الزمني
    ObjectionTimeline.objects.create(
        objection=objection,
        event="submitted",
        actor=objector,
        notes="تم إيداع الطعن رسمياً وفق المادة 72 من القانون 23-12",
        metadata={
            "objection_type": objection_type,
            "grounds": grounds,
        },
    )

    # 6. سجل التدقيق القانوني (قانون 23-12 و18-07)
    AuditLog.objects.create(
        action="objection_submitted",
        resource_type="AwardObjection",
        resource_id=str(objection.id),
        user=objector,
        description=f"إيداع طعن إداري {objection.reference} على الصفقة {tender.reference_number}",
        changes={
            "tender": str(tender.id),
            "type": objection_type,
            "grounds": grounds,
        },
        ip_address=objector_ip,
    )

    logger.info("تم إنشاء الطعن بنجاح: %s للصفقة %s", objection.reference, tender.reference_number)
    return objection


def start_review(objection, reviewer):
    """بدء دراسة الطعن — authority فقط"""
    from apps.contracts.models import (
        ObjectionTimeline,
        ObjectionStatus,
    )

    if objection.status != ObjectionStatus.SUBMITTED:
        logger.warning(
            "تعذر بدء دراسة الطعن %s: الحالة الحالية %s",
            objection.reference,
            objection.status,
        )
        raise ValidationError(f"لا يمكن بدء الدراسة — الطعن في حالة {objection.status}")

    objection.status = ObjectionStatus.UNDER_REVIEW
    objection.reviewer = reviewer
    objection.review_started_at = timezone.now()
    objection.save()

    ObjectionTimeline.objects.create(
        objection=objection,
        event="review_started",
        actor=reviewer,
        notes="بدأت دراسة الطعن من قبل المصلحة المتعاقدة / لجنة الصفقات",
    )

    AuditLog.objects.create(
        action="objection_review_started",
        resource_type="AwardObjection",
        resource_id=str(objection.id),
        user=reviewer,
        description=f"بدء دراسة الطعن {objection.reference} من قبل {reviewer.email}",
        changes={"reviewer": str(reviewer.id)},
    )

    logger.info("تم بدء دراسة الطعن %s من قبل %s", objection.reference, reviewer.email)
    return objection


def decide_objection(objection, reviewer, decision, reason):
    """إصدار القرار — authority فقط"""
    from apps.contracts.models import (
        ObjectionTimeline,
        ObjectionStatus,
    )

    if objection.status != ObjectionStatus.UNDER_REVIEW:
        logger.warning(
            "تعذر إصدار قرار للطعن %s: الطعن ليس قيد الدراسة (الحالة: %s)",
            objection.reference,
            objection.status,
        )
        raise ValidationError("يجب أن يكون الطعن قيد الدراسة لإصدار قرار")

    if decision not in ["accepted", "rejected"]:
        raise ValidationError("القرار يجب أن يكون 'accepted' أو 'rejected'")

    if len(reason.strip()) < 10:
        raise ValidationError("يجب كتابة تبرير واضح (10 أحرف على الأقل)")

    objection.status = (
        ObjectionStatus.ACCEPTED if decision == "accepted" else ObjectionStatus.REJECTED
    )
    objection.decision = decision
    objection.decision_reason = reason
    objection.review_ended_at = timezone.now()
    objection.save()

    decision_ar = "قبول" if decision == "accepted" else "رفض"
    ObjectionTimeline.objects.create(
        objection=objection,
        event=f"decided_{decision}",
        actor=reviewer,
        notes=f"قرار {decision_ar} الطعن: {reason[:200]}",
        metadata={"decision": decision},
    )

    AuditLog.objects.create(
        action=f"objection_{decision}",
        resource_type="AwardObjection",
        resource_id=str(objection.id),
        user=reviewer,
        description=f"إصدار قرار {decision_ar} الطعن {objection.reference}",
        changes={"decision": decision, "reason": reason[:200]},
    )

    logger.info("تم إصدار قرار (%s) في الطعن %s بواسطة %s", decision, objection.reference, reviewer.email)
    return objection


def withdraw_objection(objection, user):
    """سحب الطعن — المُطعِن فقط"""
    from apps.contracts.models import (
        ObjectionTimeline,
        ObjectionStatus,
    )

    if objection.objector != user:
        logger.warning(
            "محاولة سحب طعن غير مصرح بها: المستخدم %s ليس صاحب الطعن %s",
            user.email,
            objection.reference,
        )
        raise ValidationError("فقط المُطعِن يمكنه سحب الطعن")

    if objection.status not in [
        ObjectionStatus.SUBMITTED,
        ObjectionStatus.UNDER_REVIEW,
    ]:
        logger.warning(
            "تعذر سحب الطعن %s: الحالة الحالية %s لا تسمح بالسحب",
            objection.reference,
            objection.status,
        )
        raise ValidationError("لا يمكن سحب الطعن في حالته الحالية")

    objection.status = ObjectionStatus.WITHDRAWN
    objection.save()

    ObjectionTimeline.objects.create(
        objection=objection,
        event="withdrawn",
        actor=user,
        notes="تم سحب الطعن بطلب صريح من المتعامل المُطعِن",
    )

    AuditLog.objects.create(
        action="objection_withdrawn",
        resource_type="AwardObjection",
        resource_id=str(objection.id),
        user=user,
        description=f"سحب الطعن {objection.reference} من قبل صاحبه {user.email}",
        changes={"status": "withdrawn"},
    )

    logger.info("تم سحب الطعن %s بواسطة %s", objection.reference, user.email)
    return objection
