import re
import logging
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Optional

from django.core.cache import cache
from apps.ai_gateway.models import MarketPriceReference, TemplateType

logger = logging.getLogger(__name__)

CACHE_TIMEOUT = 3600  # 1 ساعة

DISCLAIMER_TEXT = (
    "هذا التقدير استشاري واسترشادي وفق أسعار السوق المحلي لسنة 2026 وأحكام المادة 17 "
    "من القانون 23-12 المتعلق بالمشتريات العمومية. لا يُلزم المصلحة المتعاقدة، "
    "ويخضع للتدقيق والتحقق البشري الإلزامي من قِبل لجنة الصفقات المختصة."
)

# كلمات مفتاحية لتحديد نوع الصفقة
TEMPLATE_KEYWORDS = {
    TemplateType.WORKS: [
        "بناء", "أشغال", "هياكل", "خرسانة", "جدار", "جدران", "تسقيف", "سقف",
        "طرق", "طريق", "سفلتة", "تعبيد", "أرصفة", "رصيف", "مياه", "شبكة مياه",
        "كهرباء", "تطهير", "قنوات", "إنارة",
    ],
    TemplateType.SUPPLIES: [
        "حاسوب", "حواسيب", "كمبيوتر", "طابعة", "طابعات", "أثاث", "مكتب", "كراسي",
        "ورق", "معدات", "تصوير", "نسخ", "لوازم", "تجهيزات", "سيرفر",
    ],
    TemplateType.SERVICES: [
        "نظافة", "تنظيف", "أمن", "حراسة", "صيانة", "تكييف", "نقل", "شاحنة",
        "شاحنات", "إطعام", "خدمات",
    ],
    TemplateType.STUDIES: [
        "دراسة", "دراسات", "جدوى", "GED", "متابعة", "إشراف", "استشارة", "قانونية",
        "محاماة", "هندسية", "مخطط",
    ],
}

# قواميس مطابقة الفئات المعروفة بدقة
CATEGORY_KEYWORDS_MAP = [
    # WORKS
    ("بناء — هياكل خرسانية", ["خرسانة", "هياكل خرسانية", "هيكل خرساني", "خرسانية"]),
    ("بناء — جدران", ["جدران", "جدار", "بناء جدار"]),
    ("بناء — تسقيف", ["تسقيف", "سقف", "أسقف", "كتامة"]),
    ("طرق — سفلتة", ["سفلتة", "تعبيد", "تزفيت", "طرقات", "طريق"]),
    ("طرق — أرصفة", ["أرصفة", "رصيف", "تبليط أرصفة"]),
    ("مياه — مد شبكة", ["شبكة مياه", "مد شبكة مياه", "قنوات مياه", "مياه صالحة"]),
    ("كهرباء — تمديد شبكة", ["شبكة كهرباء", "تمديد شبكة كهرباء", "إنارة عمومية", "شبكة إنارة"]),

    # SUPPLIES
    ("حواسيب مكتبية", ["حاسوب", "حواسيب", "كمبيوتر", "حاسب آلي", "micro-ordinateur"]),
    ("طابعات ليزر", ["طابعة", "طابعات", "طابعة ليزر", "imprimante"]),
    ("أثاث مكتبي", ["أثاث", "مكاتب", "كراسي مكتبية", "تأثيث"]),
    ("ورق A4", ["ورق a4", "ورق", "أوراق طباعة", "ورق تصوير"]),
    ("معدات تصوير", ["معدات تصوير", "آلة تصوير", "آلات نسخ", "photocopieuse"]),

    # SERVICES
    ("نظافة — مبنى إداري", ["نظافة", "تنظيف", "مبنى إداري", "مباني إدارية"]),
    ("أمن — حراسة", ["أمن", "حراسة", "أعوان حراسة", "حراسة أمنية"]),
    ("صيانة — تكييف", ["تكييف", "صيانة تكييف", "مكيفات", "تبريد"]),
    ("نقل — شاحنة", ["نقل", "شاحنة", "شاحنات", "نقل بضائع"]),

    # STUDIES
    ("دراسة تقنية — GED", ["ged", "دراسة تقنية", "دراسة هندسية", "مخططات تقنية"]),
    ("دراسة جدوى", ["دراسة جدوى", "جدوى اقتصادية", "جدوى"]),
    ("متابعة أشغال", ["متابعة أشغال", "متابعة ورشات", "إشراف على الأشغال"]),
    ("استشارة قانونية", ["استشارة قانونية", "قانونية", "محامي", "تحكيم"]),
]


def estimate_price(
    template_type: str,
    category: str,
    quantity: Optional[Any] = 1,
    unit: Optional[str] = None,
    wilaya: Optional[str] = None,
    description: Optional[str] = None,
) -> dict:
    """
    تقدير الميزانية والأسعار المرجعية وفق بيانات السوق المحلي والقانون 23-12.

    المراحل:
    1. فحص التخزين المؤقت (Cache) لمدة 1 ساعة.
    2. استعلام MarketPriceReference وفق منطق التدرج:
       - مطابقة تامة (نوع + فئة + ولاية)
       - تراجع لولاية الجزائر (16)
       - تراجع لأي ولاية متاحة
       - رفع استثناء DoesNotExist
    3. حساب التكلفة وهامش التباين وفق مستوى الثقة (Decimal).
    4. استخراج عينات مرجعية وطنية.
    """
    # تسوية المدخلات
    target_wilaya = (str(wilaya).strip() if wilaya else "16").zfill(2)
    normalized_type = str(template_type).strip().lower()
    normalized_category = str(category).strip()

    try:
        quantity_dec = Decimal(str(quantity or 1))
        if quantity_dec <= Decimal("0"):
            quantity_dec = Decimal("1")
    except Exception:
        quantity_dec = Decimal("1")

    # 1. التخزين المؤقت (مع إزالة المسافات لتجنب تحذيرات مفاتيح الذاكرة المؤقتة)
    safe_category_key = re.sub(r"\s+", "_", normalized_category)
    cache_key = f"price_est:{normalized_type}:{safe_category_key}:{target_wilaya}:{quantity_dec}"
    cached_result = cache.get(cache_key)
    if cached_result:
        logger.debug(f"استرجاع التقدير المرجعي من التخزين المؤقت: {cache_key}")
        return cached_result

    # 2. استعلام قاعدة البيانات
    matched_ref = None

    # أ) مطابقة تامة في الولاية المحددة
    matched_ref = MarketPriceReference.objects.filter(
        template_type=normalized_type,
        wilaya=target_wilaya,
        category=normalized_category,
    ).first()

    # ب) مطابقة جزئية في نفس الولاية
    if not matched_ref:
        matched_ref = MarketPriceReference.objects.filter(
            template_type=normalized_type,
            wilaya=target_wilaya,
            category__icontains=normalized_category,
        ).first()

    # ج) محاولة المطابقة عبر الكلمات المفتاحية
    if not matched_ref:
        for canon_cat, kws in CATEGORY_KEYWORDS_MAP:
            if any(kw in normalized_category.lower() for kw in kws):
                matched_ref = MarketPriceReference.objects.filter(
                    template_type=normalized_type,
                    wilaya=target_wilaya,
                    category=canon_cat,
                ).first() or MarketPriceReference.objects.filter(
                    template_type=normalized_type,
                    wilaya="16",
                    category=canon_cat,
                ).first() or MarketPriceReference.objects.filter(
                    template_type=normalized_type,
                    category=canon_cat,
                ).first()
                if matched_ref:
                    break

    # د) التراجع إلى ولاية الجزائر (16)
    if not matched_ref:
        logger.info(f"عدم توفر فئة '{normalized_category}' في ولاية {target_wilaya}. التراجع لولاية الجزائر (16).")
        matched_ref = MarketPriceReference.objects.filter(
            template_type=normalized_type,
            wilaya="16",
            category=normalized_category,
        ).first() or MarketPriceReference.objects.filter(
            template_type=normalized_type,
            wilaya="16",
            category__icontains=normalized_category,
        ).first()

    # هـ) التراجع لأي ولاية مسجلة
    if not matched_ref:
        matched_ref = MarketPriceReference.objects.filter(
            template_type=normalized_type,
            category__icontains=normalized_category,
        ).first()


    # هـ) في حال عدم العثور التام
    if not matched_ref:
        logger.warning(f"لا توجد أسعار مرجعية للفئة '{normalized_category}' في نوع '{normalized_type}'")
        raise MarketPriceReference.DoesNotExist(
            f"لا توجد أسعار مرجعية للفئة '{normalized_category}' ضمن نوع '{normalized_type}'"
        )

    # 3. الحسابات المالية (Decimal و ROUND_HALF_UP)
    unit_price = matched_ref.unit_price
    estimated_avg = (unit_price * quantity_dec).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # تحديد هامش التباين وفق درجة الثقة
    confidence = matched_ref.confidence
    if confidence >= 0.85:
        margin_percent = Decimal("5.0")
        confidence_level = "high"
    elif confidence >= 0.70:
        margin_percent = Decimal("10.0")
        confidence_level = "medium"
    else:
        margin_percent = Decimal("20.0")
        confidence_level = "low"

    margin_factor = margin_percent / Decimal("100")
    estimated_min = (estimated_avg * (Decimal("1") - margin_factor)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    estimated_max = (estimated_avg * (Decimal("1") + margin_factor)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

    # 4. عينات مقارنة مرجعية من ولايات أخرى (3 إلى 5 عينات)
    references_qs = (
        MarketPriceReference.objects.filter(
            template_type=matched_ref.template_type,
            category=matched_ref.category,
        )
        .exclude(id=matched_ref.id)
        .order_by("wilaya")[:5]
    )

    references_list = [
        {
            "wilaya": ref.wilaya,
            "wilaya_name_ar": ref.wilaya_name_ar,
            "wilaya_name_fr": ref.wilaya_name_fr,
            "unit_price": ref.unit_price,
            "year": ref.source_date.year,
        }
        for ref in references_qs
    ]

    # 5. بناء كائن الاستجابة المنظم
    result = {
        "estimated_min": estimated_min,
        "estimated_max": estimated_max,
        "estimated_avg": estimated_avg,
        "currency": "DZD",
        "template_type": matched_ref.template_type,
        "template_type_ar": matched_ref.get_template_type_display(),
        "category": matched_ref.category,
        "subcategory": matched_ref.subcategory,
        "unit": matched_ref.unit,
        "unit_price": matched_ref.unit_price,
        "quantity": float(quantity_dec),
        "wilaya": matched_ref.wilaya,
        "wilaya_name": {
            "ar": matched_ref.wilaya_name_ar,
            "fr": matched_ref.wilaya_name_fr,
        },
        "confidence": matched_ref.confidence,
        "confidence_level": confidence_level,
        "margin_percent": float(margin_percent),
        "references": references_list,
        "source": matched_ref.source,
        "last_updated": matched_ref.updated_at.strftime("%Y-%m-%d") if matched_ref.updated_at else str(matched_ref.source_date),
        "is_advisory": True,
        "human_verification_required": True,
        "disclaimer": DISCLAIMER_TEXT,
    }

    cache.set(cache_key, result, timeout=CACHE_TIMEOUT)
    return result


def estimate_from_description(description: str, wilaya: Optional[str] = None) -> dict:
    """
    استخراج المعطيات وتقدير السعر المرجعي آلياً من نص حر باللغة العربية.
    يتعرف على:
    - نوع الصفقة (template_type)
    - الفئة المناسبة (category)
    - الكمية المستهدفة (quantity)
    - الوحدة (unit)
    """
    if not description or not description.strip():
        raise ValueError("no_match")

    text = description.strip().lower()

    # 1. مطابقة الفئة المباشرة
    matched_category = None
    for category_name, keywords in CATEGORY_KEYWORDS_MAP:
        if any(kw.lower() in text for kw in keywords):
            matched_category = category_name
            break

    if not matched_category:
        raise ValueError("no_match")

    # 2. تحديد نوع الصفقة (Template Type)
    detected_template_type = None
    for t_type, kw_list in TEMPLATE_KEYWORDS.items():
        if any(kw in text for kw in kw_list):
            detected_template_type = t_type
            break

    # إذا لم نكتشف النوع صراحة نأخذه من الفئة المطابقة
    if not detected_template_type:
        sample_ref = MarketPriceReference.objects.filter(category=matched_category).first()
        if sample_ref:
            detected_template_type = sample_ref.template_type
        else:
            detected_template_type = TemplateType.WORKS

    # 3. استخراج الكمية العددية من النص
    numbers = re.findall(r"\b\d+(?:[\.,]\d+)?\b", text)
    if numbers:
        raw_num = numbers[0].replace(",", ".")
        try:
            quantity_val = float(raw_num)
        except ValueError:
            quantity_val = 1.0
    else:
        quantity_val = 1.0

    # 4. استخراج الوحدة
    unit_val = None
    if any(u in text for u in ["م²", "م2", "متر مربع"]):
        unit_val = "م²"
    elif any(u in text for u in ["م³", "م3", "متر مكعب"]):
        unit_val = "م³"
    elif any(u in text for u in ["متر", "أمتار"]):
        unit_val = "متر"
    elif any(u in text for u in ["علبة", "علب"]):
        unit_val = "علبة"
    elif any(u in text for u in ["ساعة", "ساعات"]):
        unit_val = "ساعة"
    elif any(u in text for u in ["يوم", "أيام"]):
        unit_val = "يوم"
    elif any(u in text for u in ["مشروع", "دراسة"]):
        unit_val = "مشروع"
    elif any(u in text for u in ["وحدة", "أجهزة", "جهاز"]):
        unit_val = "وحدة"

    # استدعاء دالة التقدير
    return estimate_price(
        template_type=detected_template_type,
        category=matched_category,
        quantity=quantity_val,
        unit=unit_val,
        wilaya=wilaya,
        description=description,
    )
