"""وكيل تحليل الأسعار لعروض الصفقة (Price Analysis Agent).

POST /api/authority/analyze-prices/
1. يستقبل deal_id.
2. يجلب جميع العروض المقدمة للصفقة ويحسب:
   - متوسط العروض (Average).
   - الانحراف المعياري (Standard Deviation).
3. يجلب الميزانية التقديرية للصفقة (estimated_budget).
4. يقوم بتوليد تحليل لكل عرض يحتوي على:
   - status: (normal, abnormally_low, abnormally_high).
   - deviation_percent: نسبة الانحراف عن الميزانية.
   - warnings: قائمة بالتحذيرات (مثلاً: "العرض يقل عن 60% من الميزانية").
   - ai_recommendation: توصية نصية للجنة.
5. يحفظ التحليل في سجل التدقيق (AuditLog) لضمان الشفافية ومطابقة القانون 23-12.
"""

import logging
import math
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Tuple, Dict, Any

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.models import AuditLog
from apps.bids.models import BidOffer
from apps.procurements.models import ProcurementDeal

logger = logging.getLogger(__name__)

# عتبات التصنيف المالي الاستشاري
ABNORMALLY_LOW_THRESHOLD_PCT = Decimal("-25.0")   # انحراف سالب يتجاوز -25%
ABNORMALLY_HIGH_THRESHOLD_PCT = Decimal("20.0")   # انحراف موجب يتجاوز +20%
CRITICAL_LOW_BUDGET_RATIO = Decimal("0.60")       # أقل من 60% من الميزانية التقديرية

BASELINE_LABELS = {
    "deal_budget": "الميزانية التقديرية للصفقة",
    "offers_median": "وسيط العروض المقدمة",
    "offers_average": "متوسط العروض المقدمة",
}


def _median(values: List[Decimal]) -> Optional[Decimal]:
    """وسيط قائمة من Decimal بدقة دون تحويلها إلى float."""
    ordered = sorted(values)
    count = len(ordered)
    if count == 0:
        return None
    middle = count // 2
    if count % 2 == 1:
        return ordered[middle]
    return (ordered[middle - 1] + ordered[middle]) / Decimal("2")


def _calculate_stats(amounts: List[Decimal]) -> Tuple[Optional[Decimal], Optional[Decimal]]:
    """
    حساب المتوسط الحسابي والانحراف المعياري (Standard Deviation)
    - للعينة (Sample Standard Deviation) عند توفر عرضين فأكثر.
    - يساوي 0.00 عند وجود عرض واحد فقط.
    """
    if not amounts:
        return None, None
    n = len(amounts)
    avg = sum(amounts) / Decimal(n)
    if n == 1:
        return avg.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), Decimal("0.00")

    # حساب تباين وانحراف العينة الإحصائي
    variance = sum((x - avg) ** 2 for x in amounts) / Decimal(n - 1)
    std_dev = Decimal(math.sqrt(float(variance))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return avg.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), std_dev


def _analyze_single_offer(
    amount: Optional[Decimal],
    budget: Optional[Decimal],
    avg: Optional[Decimal],
    std_dev: Optional[Decimal],
) -> Dict[str, Any]:
    """تحليل كل عرض على حدة وتحديد حالته والتحذيرات والتوصية الذكية."""
    if amount is None:
        return {
            "status": "normal",
            "deviation_percent": None,
            "warnings": ["لم يتم تحديد المبلغ المالي للعرض بعد."],
            "ai_recommendation": "العرض لا يحتوي على مبلغ مالي محدد للتقييم.",
        }

    # المرجع الأساسي لحساب نسبة الانحراف: الميزانية التقديرية للصفقة، وإلا المتوسط الحسابي
    reference = budget if (budget is not None and budget > 0) else avg

    if reference is None or reference <= 0:
        return {
            "status": "normal",
            "deviation_percent": None,
            "warnings": ["لا يتوفر مرجع مالي لحساب الانحراف."],
            "ai_recommendation": "يتعذر تقييم العرض مالياً لغياب الميزانية التقديرية أو متوسط العروض.",
        }

    deviation = (((amount - reference) / reference) * Decimal("100")).quantize(
        Decimal("0.1"), rounding=ROUND_HALF_UP
    )

    # 1. تصنيف الحالة (normal, abnormally_low, abnormally_high)
    if deviation <= ABNORMALLY_LOW_THRESHOLD_PCT:
        offer_status = "abnormally_low"
    elif deviation >= ABNORMALLY_HIGH_THRESHOLD_PCT:
        offer_status = "abnormally_high"
    else:
        offer_status = "normal"

    # 2. توليد قائمة التحذيرات (Warnings)
    warnings: List[str] = []
    if budget is not None and budget > 0:
        if amount < (CRITICAL_LOW_BUDGET_RATIO * budget):
            warnings.append("العرض يقل عن 60% من الميزانية التقديرية (عرض منخفض بصفة غير عادية).")
        elif deviation <= ABNORMALLY_LOW_THRESHOLD_PCT:
            warnings.append(f"العرض يقل عن الميزانية التقديرية بنسبة ملحوظة ({deviation}%).")

        if deviation >= ABNORMALLY_HIGH_THRESHOLD_PCT:
            warnings.append(f"العرض يتجاوز الميزانية التقديرية بنسبة (+{deviation}%).")

    # فحص الانحراف الإحصائي عن متوسط العروض
    if std_dev is not None and std_dev > 0 and avg is not None:
        if amount < (avg - (Decimal("1.5") * std_dev)):
            warnings.append("العرض يقل بأكثر من 1.5 انحراف معياري عن متوسط عروض المتنافسين.")
        elif amount > (avg + (Decimal("1.5") * std_dev)):
            warnings.append("العرض يزيد بأكثر من 1.5 انحراف معياري عن متوسط عروض المتنافسين.")

    # 3. التوصية النصية للجنة (AI Recommendation)
    if offer_status == "abnormally_low":
        ai_recommendation = (
            "يُنصح بطلب تبريرات تفصيلية للأسعار الأحادية وتحليل تركيبة التكاليف من هذا المتعامل "
            "عملاً بأحكام قانون الصفقات العمومية قبل اتخاذ قرار الإسناد أو الإقصاء."
        )
    elif offer_status == "abnormally_high":
        ai_recommendation = (
            "العرض يتجاوز السقف المالي التقديري المرصود للصفقة؛ يُنصح بمراجعة جدول الأسعار أو استبعاد العرض "
            "في حال عدم كفاية الاعتمادات المالية المتاحة."
        )
    else:
        ai_recommendation = (
            "العرض المالي متوازن ويقع ضمن النطاق المقبول للميزانية التقديرية ومتوسط العروض؛ "
            "يُوصى باعتماده كأساس للمقارنة والتقييم النهائي."
        )

    return {
        "status": offer_status,
        "deviation_percent": float(deviation),
        "warnings": warnings,
        "ai_recommendation": ai_recommendation,
    }


def _operator_label(operator) -> str:
    if not operator:
        return "متعامل غير معروف"
    return (
        getattr(operator, "organization_name", "")
        or getattr(operator, "display_name", "")
        or getattr(operator, "email", "")
        or "متعامل غير معروف"
    )


class AuthorityPriceAnalysisView(APIView):
    """
    POST /api/authority/analyze-prices/
    وكيل تحليل الأسعار المالي في بوابة المصلحة المتعاقدة.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        deal_id = (
            request.data.get("deal_id")
            or request.data.get("dealId")
            or request.data.get("deal")
        )
        if not deal_id:
            return Response(
                {"error": "معرف الصفقة deal_id مطلوب لتنفيذ التحليل المالي."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            deal = (
                ProcurementDeal.objects.select_related("authority")
                .filter(pk=deal_id)
                .first()
            )
        except (ValueError, TypeError):
            deal = None

        if not deal:
            return Response(
                {"error": "الصفقة المحددة غير موجودة."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # التحقق من الصلاحيات: المصلحة المالكة للصفقة أو الإدارة المركزية
        user = request.user
        role = getattr(user, "role", None)
        is_owner = str(getattr(deal, "authority_id", "")) == str(getattr(user, "id", ""))
        is_admin = bool(getattr(user, "is_staff", False)) or role == "central_admin"

        if not (is_owner or is_admin):
            return Response(
                {
                    "error": "هذا التحليل مقتصر على المصلحة المتعاقدة المالكة للصفقة "
                    "أو جهة الرقابة المركزية."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # 1. جلب جميع العروض المقدمة للصفقة
        offers = list(
            BidOffer.objects.filter(deal=deal, financial_amount__isnull=False)
            .select_related("operator")
            .order_by("financial_amount")
        )
        amounts = [
            Decimal(offer.financial_amount)
            for offer in offers
            if offer.financial_amount is not None
        ]

        # 2. حساب المتوسط والانحراف المعياري
        average_amount, std_dev = _calculate_stats(amounts)

        # 3. جلب الميزانية التقديرية للصفقة
        raw_budget = getattr(deal, "estimated_budget", None)
        budget = Decimal(raw_budget) if (raw_budget is not None and Decimal(raw_budget) > 0) else None

        # تحديد المرجع السعري الأساسي (الميزانية التقديرية أولاً، ثم وسيط العروض)
        if budget is not None:
            baseline = budget
            baseline_source = "deal_budget"
        elif amounts:
            baseline = _median(amounts)
            baseline_source = "offers_median"
        else:
            baseline = None
            baseline_source = None

        # 4. توليد تحليل لكل عرض
        offers_payload = []
        for offer in offers:
            amt = Decimal(offer.financial_amount) if offer.financial_amount is not None else None
            analysis = _analyze_single_offer(amt, budget, average_amount, std_dev)

            offers_payload.append(
                {
                    "offer_id": str(offer.id),
                    "operator_name": _operator_label(offer.operator),
                    "amount": float(amt) if amt is not None else None,
                    "deviation_percent": analysis["deviation_percent"],
                    "status": analysis["status"],
                    "warnings": analysis["warnings"],
                    "ai_recommendation": analysis["ai_recommendation"],
                    "recommendation": analysis["ai_recommendation"],  # للتوافقية
                    "is_outlier": analysis["status"] in ("abnormally_low", "abnormally_high"),
                }
            )

        abnormally_low_count = sum(1 for o in offers_payload if o["status"] == "abnormally_low")
        abnormally_high_count = sum(1 for o in offers_payload if o["status"] == "abnormally_high")
        normal_count = sum(1 for o in offers_payload if o["status"] == "normal")
        outliers_count = abnormally_low_count + abnormally_high_count

        response_data = {
            "deal_id": str(deal.id),
            "deal_reference": deal.reference_number,
            "deal_title": deal.title,
            "estimated_budget": float(budget) if budget is not None else None,
            "average": float(average_amount) if average_amount is not None else None,
            "standard_deviation": float(std_dev) if std_dev is not None else None,
            "baseline": {
                "amount": float(baseline) if baseline is not None else None,
                "source": baseline_source,
                "source_label": BASELINE_LABELS.get(baseline_source, "غير متوفر"),
            },
            "threshold_percent": float(ABNORMALLY_HIGH_THRESHOLD_PCT),
            "offers": offers_payload,
            "summary": {
                "offers_count": len(offers_payload),
                "average": float(average_amount) if average_amount is not None else None,
                "average_amount": float(average_amount) if average_amount is not None else None,
                "standard_deviation": float(std_dev) if std_dev is not None else None,
                "estimated_budget": float(budget) if budget is not None else None,
                "normal_count": normal_count,
                "abnormally_low_count": abnormally_low_count,
                "abnormally_high_count": abnormally_high_count,
                "outliers_count": outliers_count,
                "min_amount": float(min(amounts)) if amounts else None,
                "max_amount": float(max(amounts)) if amounts else None,
            },
            "is_advisory": True,
            "disclaimer": "هذا التحليل استشاري فقط، والقرار النهائي يعود للجنة التقييم.",
        }

        # 5. حفظ التحليل في سجل التدقيق (AuditLog) لضمان الشفافية
        try:
            AuditLog.objects.create(
                user=user,
                action="PRICE_ANALYSIS_EXECUTED",
                resource_type="ProcurementDeal",
                resource_id=str(deal.id),
                description=f"تنفيذ وكيل تحليل الأسعار لعروض الصفقة {deal.reference_number}",
                changes={
                    "deal_id": str(deal.id),
                    "reference_number": deal.reference_number,
                    "estimated_budget": float(budget) if budget is not None else None,
                    "average": float(average_amount) if average_amount is not None else None,
                    "standard_deviation": float(std_dev) if std_dev is not None else None,
                    "offers_count": len(offers_payload),
                    "abnormally_low_count": abnormally_low_count,
                    "abnormally_high_count": abnormally_high_count,
                    "normal_count": normal_count,
                },
                ip_address=request.META.get("REMOTE_ADDR"),
            )
        except Exception as exc:
            logger.warning("تعذر تسجيل عملية تحليل الأسعار في AuditLog: %s", exc)

        logger.info(
            "تم تنفيذ تحليل الأسعار للصفقة %s بواسطة %s (%d عرضاً)",
            deal.reference_number,
            getattr(user, "email", "unknown"),
            len(offers),
        )

        return Response(response_data, status=status.HTTP_200_OK)
