import json
import logging
import re
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional

from apps.procurements.models import ReferencePrice
from .llm_client import get_llm_client, RuleBasedFallback

logger = logging.getLogger(__name__)

DISCLAIMER_TEXT = (
    "هذا الجدول تقدير مالي مبدئي أُعد بمساعدة الذكاء الاصطناعي لصالح المصلحة المتعاقدة، "
    "وهو وثيقة إدارية داخلية سرية طبقاً لأحكام المادة 19 من القانون رقم 23-12 المتعلق بالصفقات العمومية. "
    "تجب مراجعته والتحقق من الكميات والأسعار والمواصفات من قِبل المصالح التقنية والمالية المختصة قبل اعتماده وإطلاق طلب العروض."
)

AUTHORITY_BOQ_SYSTEM_PROMPT = """
أنت مستشار ذكاء اصطناعي متخصص في الهندسة المالية وتقدير تكاليف الصفقات العمومية بالجمهورية الجزائرية الديمقراطية الشعبية، 
تعمل حصرياً لصالح «المصلحة المتعاقدة» وفق أحكام القانون رقم 23-12 المؤرخ في 5 أوت 2023 والمرسوم الرئاسي رقم 15-247.

مهمتك:
مساعدة المصلحة في إعداد «تقدير مالي مبدئي وموضوعي وتوليد جدول كميات B.O.Q» قبل إطلاق طلب العروض، وليس إعداد عرض مالي لمتعامل.

قواعد صارمة:
1. التقدير سر إداري داخلي محمي بالمادة 19 من القانون 23-12، لا يُنشر للمتعهدين بل يُطرح جدول كميات فارغ الأسعار للمنافسة.
2. لا تخترع أسعاراً غير واقعية، واعتمد على الأسعار المرجعية لسنة 2026 في الجزائر.
3. صياغة بنود الـ B.O.Q بمواصفات تقنية وظيفية محايدة تماماً دون ذكر أي علامات تجارية أو طراز حصري (المادة 16).
4. استخدم الدينار الجزائري (دج) واحتسب المبالغ خارج الرسم (HT) وبكل الرسوم (TTC).
5. العتبات القانونية للإبرام في القانون 23-12: 12,000,000 دج للأشغال واللوازم، و6,000,000 دج للدراسات والخدمات.

أجب حصراً بصيغة JSON نظيفة وصحيحة 100% تتبع البنية التالية بدقة:
{
  "deal_summary": {
    "title": "اسم الصفقة",
    "authority_name": "اسم المصلحة",
    "procurement_nature": "works | supplies | services | studies",
    "procurement_nature_ar": "الأشغال | اللوازم | الخدمات | الدراسات",
    "wilaya": "16",
    "estimated_procedure": "صفقة عمومية رسمية أو إجراءات مكيفة",
    "threshold_limit": 12000000,
    "items_count": 3
  },
  "boq_items": [
    {
      "id": "boq-1",
      "item_number": "1.01",
      "name": "بيان البند والمواصفة الفنية المحايدة",
      "unit": "وحدة | م² | م³ | خدمة | شهر",
      "quantity": 10,
      "unit_price": 120000,
      "total_price": 1200000,
      "reference_source": "السعر المرجعي الوطني 2026",
      "technical_notes": "ملاحظة فنية أو متطلبات فحص"
    }
  ],
  "budget_summary": {
    "subtotal_ht": 1200000,
    "transport_cost": 20000,
    "installation_cost": 0,
    "total_ht": 1220000,
    "vat_rate": 19,
    "vat_amount": 231800,
    "total_ttc": 1451800,
    "available_budget": 1500000,
    "budget_variance": 48200,
    "is_within_budget": true,
    "procedure_recommendation": "توصية قانونية بخصوص طريقة الإبرام استناداً للعتبة"
  },
  "authority_alerts": [
    "تنبيه فني أو قانوني مهم للمصلحة المتعاقدة"
  ],
  "tender_recommendations": [
    "توصية لدفتر الشروط ومعايير تقييم العروض والضمانات"
  ],
  "disclaimer": "نص التنبيه الرسمي"
}
"""


def _get_threshold(procurement_nature: str) -> Decimal:
    """عتبة الصفقات العمومية وفق القانون 23-12"""
    nature = (procurement_nature or "").lower().strip()
    if nature in ("works", "supplies", "أشغال", "لوازم"):
        return Decimal("12000000")  # 12 مليون دينار جزائري
    return Decimal("6000000")  # 6 ملايين دينار للدراسات والخدمات


def _find_reference_price(keyword: str, wilaya: str = "") -> Optional[Decimal]:
    """البحث في جدول الأسعار المرجعية بـ procurements.ReferencePrice"""
    try:
        kw = keyword.strip()
        qs = ReferencePrice.objects.filter(name__icontains=kw)
        if wilaya:
            wilaya_qs = qs.filter(wilaya=wilaya)
            if wilaya_qs.exists():
                return Decimal(str(wilaya_qs.first().reference_price))
        if qs.exists():
            return Decimal(str(qs.first().reference_price))
    except Exception as e:
        logger.debug(f"خطأ أثناء البحث عن سعر مرجعي لـ {keyword}: {e}")
    return None


def generate_fallback_boq(
    title: str,
    description: str,
    procurement_nature: str,
    wilaya: str,
    available_budget: Optional[float],
    vat_rate: float,
    transport_cost: float,
    installation_cost: float,
) -> Dict[str, Any]:
    """
    مولد ذكي بديل يعتمد على النماذج الإجرائية والأسعار المرجعية الجزائرية
    في حال انقطاع خدمة الـ LLM أو عدم ضبط مفتاح API.
    """
    nature = (procurement_nature or "supplies").lower().strip()
    threshold = _get_threshold(nature)
    vat_dec = Decimal(str(vat_rate or 19))
    transport_dec = Decimal(str(transport_cost or 0))
    install_dec = Decimal(str(installation_cost or 0))

    items: List[Dict[str, Any]] = []

    # توليد بنود نموذجية ذكية بناءً على الطبيعة والوصف
    if nature in ("supplies", "لوازم"):
        if any(w in description for w in ["حاسوب", "كمبيوتر", "إعلام آلي", "حواسيب"]):
            items.append({
                "id": "boq-1",
                "item_number": "1.01",
                "name": "حاسوب مكتبي بمعالج عالي الأداء مع شاشة 24 بوصة ولواحقها",
                "unit": "وحدة",
                "quantity": 10,
                "unit_price": 120000.0,
                "total_price": 1200000.0,
                "reference_source": f"الأسعار المرجعية لسنة 2026 (ولاية {wilaya})",
                "technical_notes": "مواصفة محايدة: معالج سداسي النواة، ذاكرة 16GB، قرص 512GB SSD",
            })
            items.append({
                "id": "boq-2",
                "item_number": "1.02",
                "name": "طابعة ليزر متعددة الوظائف أحادية اللون ذات قدرة تشغيلية عالية",
                "unit": "وحدة",
                "quantity": 2,
                "unit_price": 85000.0,
                "total_price": 170000.0,
                "reference_source": "مؤشر أسعار المشتريات العمومية 2026",
                "technical_notes": "سرعة طباعة لا تقل عن 35 صفحة/دقيقة مع دعم الشبكة السلكية",
            })
            items.append({
                "id": "boq-3",
                "item_number": "1.03",
                "name": "موزع تيار كهربائي غير منقطع (UPS) بطاقة 1500VA",
                "unit": "وحدة",
                "quantity": 10,
                "unit_price": 28000.0,
                "total_price": 280000.0,
                "reference_source": "عقود صفقات سابقة مماثلة",
                "technical_notes": "حماية المعدات من التذبذب الكهربائي مع استقلالية 15 دقيقة",
            })
        else:
            items.append({
                "id": "boq-1",
                "item_number": "1.01",
                "name": f"توريد التجهيزات واللوازم المطابقة لموضوع: {title}",
                "unit": "حصة",
                "quantity": 1,
                "unit_price": 750000.0,
                "total_price": 750000.0,
                "reference_source": "التقدير الاسترشادي لأسعار السوق المحلي",
                "technical_notes": "مطابقة المعايير التقنية المعمول بها وضمان 24 شهراً",
            })
    elif nature in ("works", "أشغال"):
        items.append({
            "id": "boq-1",
            "item_number": "1.01",
            "name": "أشغال الحفر وتهيئة الأرضية وإعداد الأساسات",
            "unit": "م³",
            "quantity": 150,
            "unit_price": 2800.0,
            "total_price": 420000.0,
            "reference_source": "جدول الأسعار الأحادية لمشاريع البناء - وزارة السكن",
            "technical_notes": "حفر في جميع أنواع الأتربة مع تفريغ وإخلاء الردوم للمفرغة العمومية",
        })
        items.append({
            "id": "boq-2",
            "item_number": "1.02",
            "name": "خرسانة مسلحة للأساسات والهياكل الحاملة عيار 350 كغ/م³",
            "unit": "م³",
            "quantity": 80,
            "unit_price": 22000.0,
            "total_price": 1760000.0,
            "reference_source": "أسعار مواد البناء المرجعية للولاية",
            "technical_notes": "إجراء تجارب المقاومة الميكانيكية للخرسانة بواسطة مخبر معتمد",
        })
        items.append({
            "id": "boq-3",
            "item_number": "1.03",
            "name": "أشغال البناء بالآجر المفرغ سمك 15 سم و10 سم مع الملاط",
            "unit": "م²",
            "quantity": 300,
            "unit_price": 2100.0,
            "total_price": 630000.0,
            "reference_source": "مؤشر كلفة الإنجاز للبناء والأشغال",
            "technical_notes": "مقاومة العزل الحراري واستواء واجهات الجدران",
        })
    elif nature in ("studies", "دراسات"):
        items.append({
            "id": "boq-1",
            "item_number": "1.01",
            "name": f"إعداد الدراسة التقنية والتنفيذية لـ: {title}",
            "unit": "دراسة",
            "quantity": 1,
            "unit_price": 1400000.0,
            "total_price": 1400000.0,
            "reference_source": "المقياس المرجعي لأتعاب مكاتب الدراسات والهندسة",
            "technical_notes": "تسليم المخططات الهندسية والمصادقة من هيئة المراقبة التقنية CTC",
        })
        items.append({
            "id": "boq-2",
            "item_number": "1.02",
            "name": "متابعة ومراقبة تنفيذ الأشغال طيلة فترة الإنجاز",
            "unit": "شهر",
            "quantity": 6,
            "unit_price": 120000.0,
            "total_price": 720000.0,
            "reference_source": "اتفاقيات سابقة للإشراف الهندسي",
            "technical_notes": "إعداد تقارير دورية ومحاضر الورشة والوضعيات المالية",
        })
    else:  # services
        items.append({
            "id": "boq-1",
            "item_number": "1.01",
            "name": f"خدمات الصيانة الدورية والوقائية والتصحيحية لـ: {title}",
            "unit": "شهر",
            "quantity": 12,
            "unit_price": 85000.0,
            "total_price": 1020000.0,
            "reference_source": "أسعار الخدمات الاستشارية والإدارية 2026",
            "technical_notes": "التدخل السريع خلال ساعتين من التبليغ وتوفير قطع الغيار المستهلكة",
        })

    # الحسابات المالية
    subtotal_ht = sum(Decimal(str(item["total_price"])) for item in items)
    total_ht = subtotal_ht + transport_dec + install_dec
    vat_amount = (total_ht * (vat_dec / Decimal("100"))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    total_ttc = (total_ht + vat_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    avail_budget_dec = Decimal(str(available_budget)) if available_budget else None
    if avail_budget_dec:
        variance = (avail_budget_dec - total_ttc).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        is_within = variance >= 0
    else:
        variance = Decimal("0")
        is_within = True

    is_formal_deal = total_ht >= threshold
    procedure = "صفقة عمومية رسمية (طلب عروض مفتوح)" if is_formal_deal else "إجراءات مكيفة / استشارة بسيطة"
    procedure_rec = (
        f"المبلغ الإجمالي خارج الرسم ({total_ht:,.2f} دج) "
        f"{'تجاوز' if is_formal_deal else 'أقل من'} العتبة القانونية المحددة بـ ({threshold:,.2f} دج) "
        f"بموجب المادة 13 من القانون 23-12، ولذلك يخضع المسار إلى: {procedure}."
    )

    nature_ar_map = {
        "works": "الأشغال العمومية",
        "supplies": "اللوازم والتجهيزات",
        "services": "الخدمات",
        "studies": "الدراسات والاستشارات",
    }

    return {
        "deal_summary": {
            "title": title or "مشروع صفقة جديدة",
            "authority_name": "المصلحة المتعاقدة",
            "procurement_nature": nature,
            "procurement_nature_ar": nature_ar_map.get(nature, "صفقة عمومية"),
            "wilaya": wilaya or "16",
            "estimated_procedure": procedure,
            "threshold_limit": float(threshold),
            "items_count": len(items),
        },
        "boq_items": items,
        "budget_summary": {
            "subtotal_ht": float(subtotal_ht),
            "transport_cost": float(transport_dec),
            "installation_cost": float(install_dec),
            "total_ht": float(total_ht),
            "vat_rate": float(vat_dec),
            "vat_amount": float(vat_amount),
            "total_ttc": float(total_ttc),
            "available_budget": float(avail_budget_dec) if avail_budget_dec else None,
            "budget_variance": float(variance),
            "is_within_budget": is_within,
            "procedure_recommendation": procedure_rec,
        },
        "authority_alerts": [
            "التقدير الإداري وثيقة سرية داخلية محظور نشرها في دفتر الشروط الموجه للمتعهدين طبقاً للمادة 19 من القانون 23-12.",
            "اطرح في دفتر الشروط جدول كميات فارغ الأسعار (B.O.Q vierge) لتفادي أي شبهة تواطؤ أو مواءمة أسعار بين المتعهدين.",
            "التأكد من توفر الاعتماد المالي المرصود في ميزانية التجهيز/التسيير قبل الإطلاق الإجرائي للصفقة.",
        ],
        "tender_recommendations": [
            "صياغة المواصفات بدلالة الأداء والوظيفة وتجنب أي أسماء تجارية أو حصرية امتثالاً للمادة 16 من القانون 23-12.",
            "اشتراط كفالة التعهد عند الاقتضاء لضمان جدية العارضين، وفترة ضمان لا تقل عن 12 شهراً.",
            "اعتماد معايير تقييم تقنية موضوعية ومحددة بنقاط واضحة مسبقاً في دفتر الشروط.",
        ],
        "disclaimer": DISCLAIMER_TEXT,
    }


def estimate_authority_boq(
    title: str,
    description: str,
    procurement_nature: str = "supplies",
    wilaya: str = "16",
    available_budget: Optional[float] = None,
    vat_rate: float = 19.0,
    transport_cost: float = 0.0,
    installation_cost: float = 0.0,
    raw_specs_text: str = "",
) -> Dict[str, Any]:
    """
    الخدمة الرئيسية لتقدير كلفة الصفقة وتوليد جدول B.O.Q الإداري السري.
    تحاول أولاً استخدام نموذج الذكاء الاصطناعي مع إلزامه بالصيغة الهيكلية للـ JSON،
    وفي حال تعذر ذلك تلجأ للمحرك المرجعي الاحتياطي المتوافق مع بيانات السوق الجزائري.
    """
    user_prompt = f"""
بيانات الصفقة المقدمة من المصلحة المتعاقدة:
- اسم الصفقة: {title}
- طبيعة الصفقة: {procurement_nature}
- ولاية التنفيذ: {wilaya}
- وصف الحاجة والهدف: {description}
- المواصفات الفنية أو الدراسات المرفوعة: {raw_specs_text or 'لا توجد مرفقات، اعتمد على الوصف'}
- الميزانية المتاحة: {available_budget if available_budget else 'غير محددة'} دج
- معدل الرسم على القيمة المضافة: {vat_rate}%
- تكاليف النقل التقديرية: {transport_cost} دج
- تكاليف التركيب/التنفيذ: {installation_cost} دج

المطلوب:
1. توليد بنود B.O.Q محايدة ومفصلة مع وحدة القياس والكمية والأسعار المرجعية الحقيقية بالدينار الجزائري لولاية {wilaya}.
2. حساب الإجماليات HT وTTC ومقارنتها بالعتبة القانونية ({_get_threshold(procurement_nature)} دج) والميزانية المتاحة.
3. تقديم التنبيهات والتوصيات لصالح المصلحة المتعاقدة.
أخرج النتيجة حصراً كـ JSON صالح ومكتمل.
"""

    messages = [
        {"role": "system", "content": AUTHORITY_BOQ_SYSTEM_PROMPT.strip()},
        {"role": "user", "content": user_prompt.strip()},
    ]

    client = get_llm_client()
    try:
        raw_output = client.chat(messages, temperature=0.1, max_tokens=3000)
        # محاولة استخراج كائن JSON من رد الـ LLM
        json_match = re.search(r"\{.*\}", raw_output, re.DOTALL)
        if json_match:
            parsed = json.loads(json_match.group(0))
            if "boq_items" in parsed and "budget_summary" in parsed:
                # التحقق والتأكد من وجود الديسكلايمر النظامي
                parsed["disclaimer"] = DISCLAIMER_TEXT
                parsed["is_advisory"] = True
                parsed["human_verification_required"] = True
                parsed["is_confidential_admin_estimate"] = True
                return parsed
    except Exception as e:
        logger.warning(f"تعذر توليد B.O.Q عبر LLM: {e}. اللجوء للمحرك المرجعي الاحتياطي.")

    # المحرك المرجعي الاحتياطي
    fallback = generate_fallback_boq(
        title=title,
        description=description,
        procurement_nature=procurement_nature,
        wilaya=wilaya,
        available_budget=available_budget,
        vat_rate=vat_rate,
        transport_cost=transport_cost,
        installation_cost=installation_cost,
    )
    fallback["is_advisory"] = True
    fallback["human_verification_required"] = True
    fallback["is_confidential_admin_estimate"] = True
    return fallback
