"""فحص الأسعار المقترحة مقابل الأسعار المرجعية (استشاري).

POST /api/procurements/check-prices/
- يستقبل قائمة بنود مالية (اسم المادة/الخدمة + السعر المقترح) وولاية افتراضية اختيارية.
- يطابق كل بند مع ReferencePrice لنفس الاسم والولاية بعد تطبيع النص العربي.
- يحسب نسبة الانحراف، ويصنّف السعر: طبيعي / منخفض جداً / مرتفع جداً / بلا مرجع.
- يعيد توصية عربية لكل بند. التحذير استشاري ولا يمنع حفظ العرض أو إيداعه.
"""

import logging
from collections import defaultdict

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ReferencePrice
from .reference_prices import (
    DEVIATION_THRESHOLD_PERCENT,
    build_recommendation,
    classify_deviation,
    compute_deviation,
    match_reference,
    normalize_item_name,
    normalize_wilaya,
)
from .serializers import CheckPricesRequestSerializer

logger = logging.getLogger(__name__)

DISCLAIMER = (
    "هذه المقارنة استشارية فقط لمساعدة المتعامل على مراجعة تسعيرته، "
    "ولا تمنع حفظ العرض أو إيداعه، ولا تُلزم المصلحة المتعاقدة أو لجنة التقييم."
)


class CheckPricesView(APIView):
    """مقارنة أسعار بنود مالية بالأسعار المرجعية المتاحة."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        payload = request.data
        # دعم استقبال قائمة مباشرة من البنود، إضافة إلى الغلاف {"items": [...]}.
        if isinstance(payload, list):
            payload = {"items": payload}

        serializer = CheckPricesRequestSerializer(data=payload)
        if not serializer.is_valid():
            return Response(
                {
                    'error': 'بيانات البنود المالية غير صالحة.',
                    'details': serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated = serializer.validated_data
        default_wilaya = (validated.get('wilaya') or '').strip()

        # 1. تجهيز البنود وتطبيع الاسم والولاية مرة واحدة.
        resolved_items = []
        for item in validated['items']:
            wilaya = (item.get('wilaya') or default_wilaya).strip()
            resolved_items.append(
                {
                    'name': item['name'].strip(),
                    'proposed_price': item['proposed_price'],
                    'unit': (item.get('unit') or '').strip(),
                    'wilaya': wilaya,
                    'normalized_name': normalize_item_name(item['name']),
                    'normalized_wilaya': normalize_wilaya(wilaya) if wilaya else '',
                }
            )

        # 2. تحميل المراجع مرة واحدة (ولاية/ولايات الطلب أو كل الجدول عند غياب الولاية).
        normalized_wilayas = {
            item['normalized_wilaya']
            for item in resolved_items
            if item['normalized_wilaya']
        }
        has_unscoped_item = any(not item['normalized_wilaya'] for item in resolved_items)

        references_qs = ReferencePrice.objects.all()
        if normalized_wilayas and not has_unscoped_item:
            references_qs = references_qs.filter(
                normalized_wilaya__in=normalized_wilayas
            )

        references = list(
            references_qs.order_by('-updated_at', 'wilaya', 'name')
        )

        exact_index = {}
        latest_by_name = {}
        by_wilaya = defaultdict(list)
        for reference in references:
            exact_index.setdefault(
                (reference.normalized_name, reference.normalized_wilaya),
                reference,
            )
            latest_by_name.setdefault(reference.normalized_name, reference)
            by_wilaya[reference.normalized_wilaya].append(reference)

        # 3. مطابقة كل بند وحساب الانحراف والتوصية.
        items_payload = []
        summary = {
            'total': len(resolved_items),
            'matched_count': 0,
            'normal_count': 0,
            'too_low_count': 0,
            'too_high_count': 0,
            'no_reference_count': 0,
        }

        for item in resolved_items:
            reference = None
            match_type = 'none'

            if item['normalized_wilaya']:
                reference = exact_index.get(
                    (item['normalized_name'], item['normalized_wilaya'])
                )
                if reference is not None:
                    match_type = 'exact'
                else:
                    reference = match_reference(
                        item['normalized_name'],
                        by_wilaya.get(item['normalized_wilaya'], []),
                    )
                    if reference is not None:
                        match_type = 'fuzzy'
            else:
                reference = latest_by_name.get(item['normalized_name'])
                if reference is not None:
                    match_type = 'exact'
                else:
                    reference = match_reference(item['normalized_name'], references)
                    if reference is not None:
                        match_type = 'fuzzy'

            deviation = None
            is_normal = None
            price_status = 'no_reference'
            reference_price = None
            reference_unit = None
            reference_wilaya = None
            reference_name = None
            reference_updated_at = None

            if reference is not None:
                reference_price = reference.reference_price
                reference_unit = reference.unit
                reference_wilaya = reference.wilaya
                reference_name = reference.name
                reference_updated_at = reference.updated_at.isoformat()
                deviation = compute_deviation(
                    item['proposed_price'],
                    reference.reference_price,
                )
                price_status = classify_deviation(deviation)
                is_normal = price_status == 'normal'
                recommendation = build_recommendation(price_status, deviation)
                summary['matched_count'] += 1
            else:
                if item['wilaya']:
                    recommendation = (
                        'لا يتوفر سعر مرجعي لهذه المادة في الولاية المحددة؛ '
                        'تعذّر تقييم السعر المقترح.'
                    )
                else:
                    recommendation = (
                        'لا يتوفر سعر مرجعي لهذه المادة؛ تعذّر تقييم السعر المقترح.'
                    )

            summary[f'{price_status}_count'] += 1

            items_payload.append(
                {
                    'name': item['name'],
                    'unit': item['unit'] or (reference_unit or ''),
                    'wilaya': item['wilaya'] or None,
                    'proposed_price': float(item['proposed_price']),
                    'reference_price': float(reference_price)
                    if reference_price is not None
                    else None,
                    'reference_unit': reference_unit,
                    'reference_wilaya': reference_wilaya,
                    'reference_name': reference_name,
                    'reference_updated_at': reference_updated_at,
                    'deviation_percent': float(deviation)
                    if deviation is not None
                    else None,
                    'is_normal': is_normal,
                    'status': price_status,
                    'match_type': match_type,
                    'recommendation': recommendation,
                }
            )

        logger.info(
            'فحص أسعار %d بنداً بواسطة %s',
            len(items_payload),
            getattr(request.user, 'email', 'unknown'),
        )

        return Response(
            {
                'wilaya': default_wilaya or None,
                'threshold_percent': float(DEVIATION_THRESHOLD_PERCENT),
                'items': items_payload,
                'summary': summary,
                'is_advisory': True,
                'disclaimer': DISCLAIMER,
            },
            status=status.HTTP_200_OK,
        )
