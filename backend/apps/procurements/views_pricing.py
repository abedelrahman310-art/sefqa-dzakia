"""تحليل الأسعار الذكي لعروض الصفقة (استشاري).

POST /api/authority/analyze-prices/
- مقتصر على المصلحة المتعاقدة المالكة للصفقة (أو الإدارة المركزية/مشرف النظام).
- يقارن مبلغ كل عرض بالمرجع: الميزانية التقديرية للصفقة إن وُجدت، وإلا وسيط العروض المقدمة.
- يعيد لكل عرض: المبلغ، نسبة الانحراف، تصنيف (طبيعي/شاذ)، وتوصية استشارية.
- التحليل استشاري فقط، والقرار النهائي للجنة التقييم.
"""

import logging
from decimal import Decimal, ROUND_HALF_UP

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bids.models import BidOffer
from apps.procurements.models import ProcurementDeal

logger = logging.getLogger(__name__)

# عتبة استشارية لتصنيف الانحراف عن المرجع (ليست قاعدة قانونية).
DEVIATION_THRESHOLD_PERCENT = Decimal("15.0")

BASELINE_LABELS = {
    "deal_budget": "الميزانية التقديرية للصفقة",
    "offers_median": "وسيط العروض المقدمة",
}


def _median(values):
    """وسيط قائمة من Decimal دون تحويلها إلى float."""
    ordered = sorted(values)
    count = len(ordered)
    if count == 0:
        return None
    middle = count // 2
    if count % 2 == 1:
        return ordered[middle]
    return (ordered[middle - 1] + ordered[middle]) / Decimal("2")


def _recommendation(deviation: Decimal) -> str:
    if deviation <= -DEVIATION_THRESHOLD_PERCENT:
        return (
            "سعر أقل من المرجع بفارق كبير: تحقق من اكتمال بنود العرض وقدرة المتعامل على التنفيذ "
            "قبل اعتماده، فالسعر المنخفض جداً قد يقابله نقص في التغطية."
        )
    if deviation >= DEVIATION_THRESHOLD_PERCENT:
        return (
            "سعر أعلى من المرجع بفارق كبير: يُستحسن طلب تبرير تفصيلي للبنود المكلفة "
            "ومقارنته بباقي العروض قبل التقييم النهائي."
        )
    return "داخل نطاق المرجع بفارق مقبول؛ يمكن اعتماده كأساس للمقارنة بين العروض."


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
    """تحليل استشاري لأسعار العروض المودعة في صفقة معيّنة."""

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

        offers = list(
            BidOffer.objects.filter(deal=deal, financial_amount__isnull=False)
            .select_related("operator")
            .order_by("financial_amount")
        )
        amounts = [offer.financial_amount for offer in offers if offer.financial_amount is not None]

        # 1. اختيار المرجع: الميزانية التقديرية، وإلا وسيط العروض
        baseline = None
        baseline_source = None
        budget = getattr(deal, "estimated_budget", None)
        if budget is not None and Decimal(budget) > 0:
            baseline = Decimal(budget)
            baseline_source = "deal_budget"
        elif amounts:
            baseline = _median(amounts)
            baseline_source = "offers_median"

        # 2. تحليل كل عرض نسبةً إلى المرجع
        offers_payload = []
        outliers_count = 0
        for offer in offers:
            amount = offer.financial_amount
            deviation = None
            offer_status = "unknown"
            recommendation = "لا يتوفر مرجع سعري لحساب الانحراف لهذه الصفقة."

            if baseline and baseline > 0 and amount is not None:
                deviation = (
                    ((Decimal(amount) - baseline) / baseline) * Decimal("100")
                ).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)
                offer_status = (
                    "outlier"
                    if abs(deviation) > DEVIATION_THRESHOLD_PERCENT
                    else "normal"
                )
                recommendation = _recommendation(deviation)
                if offer_status == "outlier":
                    outliers_count += 1

            offers_payload.append(
                {
                    "offer_id": str(offer.id),
                    "operator_name": _operator_label(offer.operator),
                    "amount": float(amount) if amount is not None else None,
                    "deviation_percent": float(deviation) if deviation is not None else None,
                    "status": offer_status,
                    "recommendation": recommendation,
                }
            )

        average_amount = (
            (sum(amounts) / Decimal(len(amounts))) if amounts else None
        )

        logger.info(
            "تحليل أسعار استشاري للصفقة %s بواسطة %s (%d عرضاً)",
            deal.reference_number,
            getattr(user, "email", "unknown"),
            len(offers),
        )

        return Response(
            {
                "deal_id": str(deal.id),
                "deal_reference": deal.reference_number,
                "deal_title": deal.title,
                "baseline": {
                    "amount": float(baseline) if baseline is not None else None,
                    "source": baseline_source,
                    "source_label": BASELINE_LABELS.get(baseline_source, "غير متوفر"),
                },
                "threshold_percent": float(DEVIATION_THRESHOLD_PERCENT),
                "offers": offers_payload,
                "summary": {
                    "offers_count": len(offers_payload),
                    "outliers_count": outliers_count,
                    "normal_count": len(offers_payload) - outliers_count,
                    "average_amount": float(average_amount) if average_amount is not None else None,
                    "min_amount": float(min(amounts)) if amounts else None,
                    "max_amount": float(max(amounts)) if amounts else None,
                },
                "is_advisory": True,
                "disclaimer": "هذا التحليل استشاري فقط، والقرار النهائي يعود للجنة التقييم.",
            },
            status=status.HTTP_200_OK,
        )
