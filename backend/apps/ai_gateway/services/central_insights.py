import logging
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache
from apps.ai_gateway.models import AIInsight
from apps.procurements.models import ProcurementDeal
from apps.bids.models import BidOffer
from apps.contracts.models import AwardDecision, Contract
from apps.audit.models import AuditLog
from apps.users.models import CustomUser
from .suspicion_detector import (
    detect_bid_rigging,
    detect_price_manipulation,
    detect_conflict_of_interest,
    detect_phantom_competition,
)

logger = logging.getLogger(__name__)

INSIGHTS_CACHE_TIMEOUT = 86400  # 24 ساعة


def generate_central_insights() -> list[AIInsight]:
    """
    تحليل بيانات المنصة وتوليد التوصيات الذكية (AI Insights) للرقابة المركزية.
    تعتمد التخزين المؤقت (Cache: 24h) وسجل التدقيق (AuditLog) لكل توصية مستحدثة.
    """
    cache_key = "central_ai_insights_daily"
    cached_ids = cache.get(cache_key)
    if cached_ids:
        existing = AIInsight.objects.filter(id__in=cached_ids, is_resolved=False)
        if existing.exists():
            logger.info("استرجاع توصيات الرقابة المركزية من التخزين المؤقت (Cache)")
            return list(existing)

    insights: list[AIInsight] = []

    # 1. شبهات الفساد والتواطؤ
    insights.extend(_detect_fraud_patterns())

    # 2. الأسعار الشاذة والتلاعب
    insights.extend(_detect_price_anomalies())

    # 3. التأخير وتجاوز الآجال القانونية
    insights.extend(_detect_delays())

    # 4. الامتثال لقانون 23-12
    insights.extend(_detect_compliance_issues())

    # 5. الأنماط المشبوهة وتجزئة الصفقات
    insights.extend(_detect_patterns())

    # حفظ في قاعدة البيانات وسجل التدقيق
    saved_insights = []
    for item in insights:
        # منع تكرار نفس التوصية غير المحلولة
        existing_insight = AIInsight.objects.filter(
            title=item.title,
            category=item.category,
            is_resolved=False,
            target_authority=item.target_authority,
        ).first()

        if existing_insight:
            saved_insights.append(existing_insight)
            continue

        item.save()
        saved_insights.append(item)

        # تسجيل إلزامي في سجل التدقيق (AuditLog)
        try:
            AuditLog.objects.create(
                action=f"ai_insight_generated:{item.category}",
                resource_type="AIInsight",
                resource_id=str(item.id),
                user=None,
                description=f"توليد توصية استشارية ذكية: {item.title}",
                changes={
                    "severity": item.severity,
                    "confidence": item.confidence,
                    "related_tenders": item.related_tenders,
                    "is_advisory": True,
                },
            )
        except Exception as e:
            logger.error(f"تعذر تسجيل Insight في سجل التدقيق: {e}")

    # تخزين المعرفات في Cache لمدة 24 ساعة
    cache.set(cache_key, [str(i.id) for i in saved_insights], INSIGHTS_CACHE_TIMEOUT)
    logger.info(f"تم توليد {len(saved_insights)} توصية ذكية للرقابة المركزية بنجاح.")
    return saved_insights


def generate_authority_insights(authority_id) -> list[AIInsight]:
    """
    توليد توصيات استشارية خاصة بمصلحة متعاقدة محددة (بوابة المصلحة المتعاقدة).
    """
    authority = CustomUser.objects.filter(id=authority_id).first()
    if not authority:
        logger.warning(f"المصلحة المتعاقدة {authority_id} غير موجودة")
        return []

    cache_key = f"authority_ai_insights_{authority_id}"
    cached_ids = cache.get(cache_key)
    if cached_ids:
        existing = AIInsight.objects.filter(id__in=cached_ids, is_resolved=False)
        if existing.exists():
            return list(existing)

    insights: list[AIInsight] = []
    insights.extend(_detect_delays(authority=authority))
    insights.extend(_detect_compliance_issues(authority=authority))
    insights.extend(_detect_price_anomalies(authority=authority))
    insights.extend(_detect_fraud_patterns(authority=authority))

    saved_insights = []
    for item in insights:
        item.target_authority = authority
        existing_insight = AIInsight.objects.filter(
            title=item.title,
            category=item.category,
            target_authority=authority,
            is_resolved=False,
        ).first()

        if existing_insight:
            saved_insights.append(existing_insight)
            continue

        item.save()
        saved_insights.append(item)

        try:
            AuditLog.objects.create(
                action=f"ai_insight_generated:{item.category}",
                resource_type="AIInsight",
                resource_id=str(item.id),
                user=authority,
                description=f"توليد توصية استشارية لمصلحة متعاقدة: {item.title}",
                changes={
                    "severity": item.severity,
                    "confidence": item.confidence,
                    "related_tenders": item.related_tenders,
                    "target_authority": str(authority.id),
                },
            )
        except Exception as e:
            logger.error(f"تعذر تسجيل Insight في سجل التدقيق للمصلحة: {e}")

    cache.set(cache_key, [str(i.id) for i in saved_insights], INSIGHTS_CACHE_TIMEOUT)
    return saved_insights


# =========================================================================
# الدوال المساعدة للكشف والتحليل
# =========================================================================

def _detect_fraud_patterns(authority=None) -> list[AIInsight]:
    """كشف أنماط شبهات الفساد والتواطؤ"""
    insights = []
    rigging_list = detect_bid_rigging()
    conflict_list = detect_conflict_of_interest()

    for item in rigging_list + conflict_list:
        if authority and item.get("authority_id") != str(authority.id):
            continue

        insight = AIInsight(
            severity=AIInsight.Severity.CRITICAL if item.get("severity") == "critical" else AIInsight.Severity.HIGH,
            category=AIInsight.Category.FRAUD_SUSPICION,
            title=item.get("title", "شبهة تواطؤ أو احتكار"),
            description=item.get("description", ""),
            related_tenders=item.get("deal_ids", []),
            related_authorities=[item["authority_id"]] if item.get("authority_id") else [],
            related_operators=item.get("operator_ids", [item.get("operator_id")] if item.get("operator_id") else []),
            recommendation=item.get("recommendation", "إجراء تدقيق ومراجعة شاملة لملف الصفقة."),
            confidence=item.get("confidence", 0.8),
            is_advisory=True,
            human_verification_required=True,
            expires_at=timezone.now() + timedelta(days=30),
        )
        insights.append(insight)

    return insights


def _detect_price_anomalies(authority=None) -> list[AIInsight]:
    """كشف الأسعار الشاذة مقارنة بالميزانيات التقديرية ومتوسط السوق"""
    insights = []
    anomalies = detect_price_manipulation()

    for item in anomalies:
        if authority and item.get("authority_id") != str(authority.id):
            continue

        sev = AIInsight.Severity.HIGH if item.get("severity") == "high" else AIInsight.Severity.MEDIUM
        insight = AIInsight(
            severity=sev,
            category=AIInsight.Category.PRICE_ANOMALY,
            title=item.get("title", "سعر شاذ في العروض المقدمة"),
            description=item.get("description", ""),
            related_tenders=item.get("deal_ids", []),
            related_authorities=[item["authority_id"]] if item.get("authority_id") else [],
            related_operators=item.get("operator_ids", []),
            recommendation=item.get("recommendation", "مراجعة جدول الأسعار وتبريرات العارض."),
            confidence=item.get("confidence", 0.75),
            is_advisory=True,
            human_verification_required=True,
            expires_at=timezone.now() + timedelta(days=15),
        )
        insights.append(insight)

    return insights


def _detect_delays(authority=None) -> list[AIInsight]:
    """كشف التأخيرات والصفقات المعلقة التي تجاوزت الآجال المعيارية"""
    insights = []
    qs = ProcurementDeal.objects.all()
    if authority:
        qs = qs.filter(authority=authority)

    now = timezone.now()

    # 1. صفقات انقضى أجل إيداع عروضها دون استكمال مرحلة فتح وتقييم الأظرفة
    overdue_submission = qs.filter(
        submission_deadline__lt=now,
        current_stage__in=[3, 4, 5],
    )
    for deal in overdue_submission:
        days_late = (now - deal.submission_deadline).days
        if days_late > 7:
            insights.append(AIInsight(
                severity=AIInsight.Severity.HIGH if days_late > 20 else AIInsight.Severity.MEDIUM,
                category=AIInsight.Category.DELAY,
                title=f"تأخر فتح الأظرفة وتقييم العروض للصفقة ({deal.reference_number})",
                description=(
                    f"الصفقة '{deal.title}' تجاوزت أجل إيداع العروض بـ {days_late} يوماً "
                    f"دون الانتقال للمرحلة 06 (فتح وفحص العروض) المنصوص عليها في القانون 23-12."
                ),
                related_tenders=[str(deal.id)],
                related_authorities=[str(deal.authority_id)],
                recommendation="عقد جلسة لجنة فتح الأظرفة وتقييم العروض على الفور لتسجيل المحاضر القانونية.",
                confidence=0.9,
                is_advisory=True,
                human_verification_required=True,
            ))

    # 2. صفقات معلقة في مرحلة التقييم أو الإسناد لأكثر من 30 يوماً
    stalled_deals = qs.filter(
        current_stage__in=[6, 7],
        updated_at__lt=now - timedelta(days=30),
    )
    for deal in stalled_deals:
        insights.append(AIInsight(
            severity=AIInsight.Severity.MEDIUM,
            category=AIInsight.Category.DELAY,
            title=f"جمود مرحلة التقييم والإسناد للصفقة ({deal.reference_number})",
            description=(
                f"الصفقة '{deal.title}' متوقفة في مرحلة التقييم لأكثر من شهر دون تحديث إداري، "
                f"مما يهدد بتجاوز مدة صلاحية العروض."
            ),
            related_tenders=[str(deal.id)],
            related_authorities=[str(deal.authority_id)],
            recommendation="استعجال تقرير لجنة تقييم العروض لنشر قرار الإسناد المؤقت.",
            confidence=0.85,
            is_advisory=True,
            human_verification_required=True,
        ))

    return insights


def _detect_compliance_issues(authority=None) -> list[AIInsight]:
    """كشف مخالفات الامتثال الإجرائي وفق أحكام القانون 23-12"""
    insights = []
    qs = ProcurementDeal.objects.select_related("authority").all()
    if authority:
        qs = qs.filter(authority=authority)

    for deal in qs:
        # فحص وجود دفتر الشروط
        has_specs = hasattr(deal, "cahier_specs")
        if not has_specs and deal.current_stage >= 2:
            insights.append(AIInsight(
                severity=AIInsight.Severity.CRITICAL if deal.current_stage >= 3 else AIInsight.Severity.HIGH,
                category=AIInsight.Category.COMPLIANCE,
                title=f"صفقة مطروحة بدون دفتر شروط معتمد ({deal.reference_number})",
                description=(
                    f"الصفقة '{deal.title}' بلغت المرحلة {deal.current_stage} دون وجود وثيقة "
                    f"دفتر الشروط الرسمية في النظام، مما يعد خرقاً جوهرياً لمتطلبات النشر القانوني."
                ),
                related_tenders=[str(deal.id)],
                related_authorities=[str(deal.authority_id)],
                recommendation="إيقاف إجراءات النشر وتثبيت دفتر الشروط والموافقة عليه قبل المتابعة.",
                confidence=0.95,
                is_advisory=True,
                human_verification_required=True,
            ))
        elif has_specs and deal.current_stage >= 3 and not deal.cahier_specs.is_validated:
            insights.append(AIInsight(
                severity=AIInsight.Severity.HIGH,
                category=AIInsight.Category.COMPLIANCE,
                title=f"دفتر شروط غير مؤشر من لجنة الصفقات ({deal.reference_number})",
                description=(
                    f"نُشرت الصفقة '{deal.title}' دون تسجيل تأشيرة المصادقة القبلية من لجنة الصفقات المختصة."
                ),
                related_tenders=[str(deal.id)],
                related_authorities=[str(deal.authority_id)],
                recommendation="استيفاء تأشيرة الرقابة القبلية للجنة الصفقات وفق أحكام المادة 165.",
                confidence=0.9,
                is_advisory=True,
                human_verification_required=True,
            ))

    return insights


def _detect_patterns(authority=None) -> list[AIInsight]:
    """كشف أنماط تجزئة الصفقات أو الإسناد المباشر دون منافسة"""
    insights = []
    qs = ProcurementDeal.objects.all()
    if authority:
        qs = qs.filter(authority=authority)

    # 1. فحص تجزئة الصفقات (3 صفقات أو أكثر منشورة في نفس اليوم من نفس المصلحة)
    authorities = CustomUser.objects.filter(role="authority")
    for auth in authorities:
        deals = qs.filter(authority=auth)
        # تجميع الصفقات حسب تاريخ الإنشاء
        dates = {}
        for d in deals:
            day_str = d.created_at.strftime("%Y-%m-%d")
            dates.setdefault(day_str, []).append(d)

        for day_str, day_deals in dates.items():
            if len(day_deals) >= 3:
                insights.append(AIInsight(
                    severity=AIInsight.Severity.HIGH,
                    category=AIInsight.Category.PATTERN,
                    title="شبهة تجزئة مشاريع لتفادي اختصاص لجان الصفقات",
                    description=(
                        f"سجلت المصلحة '{auth.organization_name or auth.email}' طرح {len(day_deals)} صفقات "
                        f"في نفس اليوم ({day_str})، مما يثير شبهة تجزئة الحاجيات لتفادي الرقابة الخارجية."
                    ),
                    related_tenders=[str(d.id) for d in day_deals],
                    related_authorities=[str(auth.id)],
                    recommendation="التحقق من وحدة المشروع وعدم تجزئة الحاجيات لتفادي عتبات الصفقات العمومية.",
                    confidence=0.8,
                    is_advisory=True,
                    human_verification_required=True,
                ))

    return insights
