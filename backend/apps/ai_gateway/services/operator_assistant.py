from datetime import timedelta

from django.utils import timezone

LEGAL_SOURCES = [
    "القانون رقم 23-12 المؤرخ في 5 أوت 2023 المتعلق بالمشتريات العمومية",
    "المرسوم الرئاسي رقم 15-247 المتعلق بتنظيم الصفقات العمومية",
    "القانون رقم 18-07 المتعلق بحماية المعطيات الشخصية",
]

_METHOD_LABELS = {
    "call_for_tenders": "طلب العروض",
    "open_tender": "المناقصة المفتوحة",
    "negotiated_procedure": "الإجراء التفاوضي",
}

_FORM_LABELS = {
    "open": "مفتوح",
    "open_with_min_capacity": "مفتوح مع حد أدنى للقدرات",
    "restricted": "مقيد",
    "competition": "مسابقة",
    "direct": "مباشر",
    "after_consultation": "بعد استشارة",
}

_NATURE_LABELS = {
    "works": "الأشغال العمومية",
    "supplies": "اللوازم",
    "studies": "الدراسات",
    "services": "الخدمات",
}


def _text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, (int, float)):
        return str(value)
    return ""


def _short(value, limit: int = 500) -> str:
    text = _text(value)
    if len(text) <= limit:
        return text
    return f"{text[:limit].rstrip()}…"


def _money(value) -> str:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return ""
    return f"{number:,.2f} دج".replace(",", " ")


def _document_label(document) -> str:
    if isinstance(document, dict):
        return _text(
            document.get("name")
            or document.get("titleAr")
            or document.get("title")
            or document.get("code")
        )
    return _text(document)


def _extract_required_documents(admin: dict, technical: dict) -> list[str]:
    raw_documents = technical.get("required_documents") or admin.get("required_documents") or []
    if not isinstance(raw_documents, list):
        return []
    labels = []
    for document in raw_documents:
        label = _document_label(document)
        if label and label not in labels:
            labels.append(label)
    return labels


def _authority_label(deal) -> str:
    authority = getattr(deal, "authority", None)
    if not authority:
        return "المصلحة المتعاقدة"
    return (
        _text(getattr(authority, "organization_name", ""))
        or _text(getattr(authority, "display_name", ""))
        or _text(getattr(authority, "email", ""))
        or "المصلحة المتعاقدة"
    )


def analyze_tender_for_operator(deal, specs=None) -> dict:
    """
    تحليل استشاري منظم لدفتر شروط صفقة، موجه للمتعامل الاقتصادي.

    التحليل يعتمد على البيانات المنشورة فعلياً في الصفقة ودفتر الشروط،
    ويعيد ملخصاً، متطلبات رئيسية، نقاط انتباه، وتوصيات عملية. وهو استشاري
    ولا يعد قراراً إدارياً أو تقييماً رسمياً.
    """
    admin = getattr(specs, "administrative_clauses", None) or {}
    technical = getattr(specs, "technical_requirements", None) or {}
    financial = getattr(specs, "financial_criteria", None) or {}

    if not isinstance(admin, dict):
        admin = {}
    if not isinstance(technical, dict):
        technical = {}
    if not isinstance(financial, dict):
        financial = {}

    required_documents = _extract_required_documents(admin, technical)
    nature = _NATURE_LABELS.get(_text(admin.get("procurement_nature")), "")
    method = _METHOD_LABELS.get(_text(admin.get("procurement_method")), "")
    form = _FORM_LABELS.get(_text(admin.get("procurement_form")), "")
    scope = "وطني ودولي" if _text(admin.get("competition_scope")) == "national_and_international" else "وطني"
    deadline = getattr(deal, "submission_deadline", None)
    budget = _money(getattr(deal, "estimated_budget", None))
    duration = _short(technical.get("duration"), 160)
    warranty = _short(technical.get("warranty"), 260)
    details = _short(technical.get("details"), 700)
    scoring = _short(financial.get("scoring"), 700)
    terms = _short(financial.get("terms"), 500)
    boq_total = _money(financial.get("boq_total"))
    now = timezone.now()

    key_requirements = []
    procedure_parts = [part for part in [nature, method, form] if part]
    if procedure_parts or scope:
        key_requirements.append(
            {
                "category": "الإطار الإجرائي",
                "title": "طبيعة الصفقة وطريقة الإبرام",
                "detail": "، ".join(procedure_parts + ([f"نطاق {scope}"] if scope else []))
                or "لم تُحدد طريقة الإبرام بشكل صريح في دفتر الشروط.",
            }
        )

    if required_documents:
        shown = "، ".join(required_documents[:8])
        if len(required_documents) > 8:
            shown += f"، و{len(required_documents) - 8} وثائق أخرى"
        key_requirements.append(
            {
                "category": "ملف الترشح",
                "title": "الوثائق الإدارية والتقنية والمالية",
                "detail": shown,
            }
        )

    if details or duration or warranty:
        technical_parts = []
        if details:
            technical_parts.append(details)
        if duration:
            technical_parts.append(f"مدة التنفيذ: {duration}")
        if warranty:
            technical_parts.append(f"الضمان/الالتزام الفني: {warranty}")
        key_requirements.append(
            {
                "category": "المواصفات الفنية",
                "title": "نطاق الأعمال والالتزامات التقنية",
                "detail": " | ".join(technical_parts),
            }
        )

    if scoring or terms:
        financial_parts = []
        if scoring:
            financial_parts.append(f"معايير التقييم: {scoring}")
        if terms:
            financial_parts.append(f"الشروط المالية: {terms}")
        if boq_total:
            financial_parts.append(f"المجموع التقديري لجدول الكميات: {boq_total}")
        key_requirements.append(
            {
                "category": "التقييم والمالية",
                "title": "معايير المفاضلة والشروط المالية",
                "detail": " | ".join(financial_parts),
            }
        )

    key_requirements.append(
        {
            "category": "الآجال",
            "title": "آخر أجل لإيداع العروض",
            "detail": (
                deadline.strftime("%Y-%m-%d %H:%M")
                if deadline
                else "لم يُحدد آخر أجل بدقة في البيانات المنشورة؛ راجع إعلان الصفقة ودفتر الشروط."
            ),
        }
    )

    points_of_attention = []
    if not specs:
        points_of_attention.append(
            {
                "severity": "high",
                "title": "دفتر الشروط غير متاح",
                "detail": "لا يمكن التحقق من الشروط الإدارية والفنية والمالية. اطلب من المصلحة نشر الدفتر أو مراجعة الإعلان.",
            }
        )
    if not required_documents:
        points_of_attention.append(
            {
                "severity": "medium",
                "title": "قائمة الوثائق غير محددة",
                "detail": "لم تُدرج وثائق الترشح المطلوبة في البيانات المتاحة؛ تحقق من دفتر الشروط قبل تجهيز الملف.",
            }
        )
    if not scoring:
        points_of_attention.append(
            {
                "severity": "medium",
                "title": "معايير التقييم غير مفصلة",
                "detail": "غياب شبكة تنقيط واضحة قد يزيد الغموض حول ترتيب العروض. اطلب توضيحاً قبل الإيداع.",
            }
        )
    if not deadline:
        points_of_attention.append(
            {
                "severity": "medium",
                "title": "أجل الإيداع غير محدد",
                "detail": "لا تبدأ في تجهيز العرض النهائي دون التأكد من آخر أجل قانوني لإيداع العروض.",
            }
        )
    elif deadline < now:
        points_of_attention.append(
            {
                "severity": "high",
                "title": "انقضى أجل إيداع العروض",
                "detail": f"آخر أجل مسجل هو {deadline.strftime('%Y-%m-%d %H:%M')}. تحقق من إمكانية تمديد الأجل أو من إجراء آخر.",
            }
        )
    elif deadline - now <= timedelta(days=5):
        points_of_attention.append(
            {
                "severity": "high",
                "title": "الأجل المتبقي قصير",
                "detail": f"يتبقى أقل من 5 أيام على آخر أجل ({deadline.strftime('%Y-%m-%d %H:%M')}). جهّز الوثائق والضمانات فوراً.",
            }
        )
    if not budget:
        points_of_attention.append(
            {
                "severity": "low",
                "title": "الميزانية التقديرية غير منشورة",
                "detail": "غياب الميزانية التقديرية لا يمنع المشاركة، لكنه يحد من دقة تقدير هامش السعر.",
            }
        )
    if not technical.get("duration"):
        points_of_attention.append(
            {
                "severity": "low",
                "title": "مدة التنفيذ غير محددة",
                "detail": "تحقق من مدة التنفيذ لأنها تؤثر في التخطيط والموارد والضمانات.",
            }
        )
    if not warranty:
        points_of_attention.append(
            {
                "severity": "low",
                "title": "الضمانات الفنية غير مفصلة",
                "detail": "راجع شروط الضمان وحسن التنفيذ والالتزامات ما بعد التسليم.",
            }
        )

    recommendations = [
        "حمّل دفتر الشروط والإعلان واقرأهما كاملين قبل تجهيز العرض.",
        "أعد قائمة تحقق بالوثائق الإدارية والتقنية والمالية المطلوبة، وتأكد من صلاحية كل وثيقة.",
        "تحقق من قدراتك الفنية والمالية ومن متطلبات التأهيل قبل الالتزام بأي ضمان أو سعر.",
        "احسب التكلفة والهامش مع مراعاة مدة التنفيذ والضرائب والضمانات.",
        "لا تنتظر اليوم الأخير؛ أودع العرض قبل انقضاء الأجل واحتفظ بإثبات الإيداع.",
    ]
    if scoring:
        recommendations.append("اطّلع على شبكة التنقيط ووزن كل معيار قبل توزيع الجهد بين العرض التقني والمالي.")
    if required_documents:
        recommendations.append("تأكد من أن كل وثيقة مطلوبة تحمل التوقيع والختم والتاريخ المطلوبين.")

    summary_parts = [f"تتعلق الصفقة «{_text(deal.title)}» بـ{_authority_label(deal)}."]
    if nature:
        summary_parts.append(f"طبيعة الصفقة: {nature}.")
    if method:
        summary_parts.append(f"طريقة الإبرام: {method}{f' ({form})' if form else ''}.")
    if budget:
        summary_parts.append(f"الميزانية التقديرية: {budget}.")
    if deadline:
        summary_parts.append(f"آخر أجل لإيداع العروض: {deadline.strftime('%Y-%m-%d %H:%M')}.")
    if required_documents:
        summary_parts.append(f"يتضمن ملف الترشح {len(required_documents)} وثيقة محددة في دفتر الشروط.")
    if not specs:
        summary_parts.append("تنبيه: دفتر الشروط غير متاح حالياً، لذا يقتصر التحليل على بيانات الإعلان.")

    return {
        "deal": {
            "id": str(deal.id),
            "reference": _text(deal.reference_number),
            "title": _text(deal.title),
            "authority": _authority_label(deal),
            "wilaya": _text(getattr(deal, "wilaya", "")),
            "estimated_budget": _text(getattr(deal, "estimated_budget", "")),
            "submission_deadline": deadline.isoformat() if deadline else None,
            "current_stage": getattr(deal, "current_stage", None),
        },
        "summary": " ".join(summary_parts),
        "key_requirements": key_requirements,
        "points_of_attention": points_of_attention,
        "recommendations": recommendations,
        "legal_references": LEGAL_SOURCES,
        "is_advisory": True,
        "human_verification_required": True,
        "statutory_reference": "القانون 23-12 والمرسوم 15-247",
    }
