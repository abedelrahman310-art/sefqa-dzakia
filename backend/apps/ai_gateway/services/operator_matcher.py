"""
Operator Matcher Service
خدمة التوفيق الذكي لفرص الصفقات العمومية للمتعامل الاقتصادي
وفق أحكام القانون 23-12 (المادة 17) والمبادئ التوجيهية للشفافية وتكافؤ الفرص
تعتمد على OperatorProfile مع دعم الـ Fallback الكامل
ملاحظة: هذه الخدمة استشارية وتوجيهية فقط (Advisory Only)
"""

import datetime
import logging
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional

from django.utils import timezone

logger = logging.getLogger(__name__)

# خريطة الولايات الجزائرية (69 ولاية) للتحقق والمطابقة
WILAYA_MAP = {
    "01": "أدرار", "02": "الشلف", "03": "الأغواط", "04": "أم البواقي", "05": "باتنة",
    "06": "بجاية", "07": "بسكرة", "08": "بشار", "09": "البليدة", "10": "البويرة",
    "11": "تمنراست", "12": "تبسة", "13": "تلمسان", "14": "تيارت", "15": "تيزي وزو",
    "16": "الجزائر", "17": "الجلفة", "18": "جيجل", "19": "سطيف", "20": "سعيدة",
    "21": "سكيكدة", "22": "سيدي بلعباس", "23": "عنابة", "24": "قالمة", "25": "قسنطينة",
    "26": "المدية", "27": "مستغانم", "28": "المسيلة", "29": "معسكر", "30": "ورقلة",
    "31": "وهران", "32": "البيض", "33": "إليزي", "34": "برج بوعريريج", "35": "بومرداس",
    "36": "الطارف", "37": "تندوف", "38": "تسمسيلت", "39": "الوادي", "40": "خنشلة",
    "41": "سوق أهراس", "42": "تيبازة", "43": "ميلة", "44": "عين الدفلى", "45": "النعامة",
    "46": "عين تموشنت", "47": "غرداية", "48": "غليزان", "49": "تيميمون", "50": "برج باجي مختار",
    "51": "أولاد جلال", "52": "بني عباس", "53": "عين صالح", "54": "عين قزام", "55": "توقرت",
    "56": "جانت", "57": "المغير", "58": "المنيعة", "59": "العريشة", "60": "قصر الشلالة",
    "61": "عين وسارة", "62": "مسعد", "63": "بريكة", "64": "بوسعادة", "65": "الأبيض سيدي الشيخ",
    "66": "أفلو", "67": "سيدي خالد", "68": "عين الصفراء", "69": "فرندة"
}

# تصنيف الكلمات المفتاحية للقطاعات
SECTOR_KEYWORDS = {
    "works": ["أشغال", "بناء", "تهيئة", "طرق", "صيانة", "منشأة", "إنجاز", "خرسانة", "ترميم", "works", "construction"],
    "supplies": ["توريد", "تجهيز", "لوازم", "اقتناء", "شراء", "حواسيب", "طابعات", "أثاث", "supplies", "fournitures"],
    "services": ["خدمات", "حراسة", "نظافة", "نقل", "تأمين", "صيانة دورية", "إطعام", "services", "prestation"],
    "studies": ["دراسة", "متابعة", "هندسة", "إشراف", "مراقبة فنية", "مخططات", "استشارة", "studies", "etudes"],
}


def _get_val(obj: Any, key: str, default: Any = None) -> Any:
    """استخراج قيمة من كائن أو قاموس بأمان"""
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def _normalize_wilaya(val: Any) -> str:
    """توحيد اسم أو رمز الولاية للمقارنة"""
    if not val:
        return ""
    s = str(val).strip().lower()
    s = s.replace("ولاية ", "").replace("wilaya ", "").strip()
    if s.isdigit():
        code = s.zfill(2)
        return WILAYA_MAP.get(code, code)
    for code, name in WILAYA_MAP.items():
        if s == name.lower() or s == code:
            return name
    return s


def _is_wilaya_match(op_wilaya: str, tender_wilaya: str) -> bool:
    """فحص تطابق الولاية بين المتعامل والصفقة"""
    norm_op = _normalize_wilaya(op_wilaya)
    norm_td = _normalize_wilaya(tender_wilaya)
    if not norm_op or not norm_td:
        return False
    if norm_op == norm_td:
        return True
    return norm_op in norm_td or norm_td in norm_op


def _infer_tender_sector(tender: Any) -> str:
    """استنتاج قطاع الصفقة من الحقول الصريحة أو من العنوان والوصف"""
    explicit = _get_val(tender, "sector", "") or _get_val(tender, "template_type", "")
    if explicit:
        return str(explicit).strip().lower()
    
    title = str(_get_val(tender, "title", "") or "")
    desc = str(_get_val(tender, "description", "") or "")
    text = f"{title} {desc}".lower()
    
    for sec_key, keywords in SECTOR_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return sec_key
            
    return ""


def _count_operator_experience(operator: Any, sector: str) -> int:
    """حساب عدد الصفقات والعقود السابقة للمتعامل في نفس القطاع"""
    # 1. إذا تم تمرير القيمة مباشرة في الكائن أو القاموس
    exp_direct = _get_val(operator, "previous_deals_count", None)
    if exp_direct is None:
        exp_direct = _get_val(operator, "experience_count", None)
    if exp_direct is not None:
        try:
            return int(exp_direct)
        except (ValueError, TypeError):
            pass

    # 2. الاستعلام من قاعدة البيانات إن كان كائناً من CustomUser
    op_id = _get_val(operator, "id", None)
    if not op_id:
        return 0

    try:
        from apps.contracts.models import Contract
        from apps.bids.models import BidOffer
        
        contracts_count = Contract.objects.filter(awarded_operator_id=op_id).count()
        awarded_bids_count = BidOffer.objects.filter(operator_id=op_id, status="awarded").count()
        return max(contracts_count, awarded_bids_count)
    except Exception as exc:
        logger.debug("تعذر احتساب خبرة المتعامل من قاعدة البيانات: %s", exc)
        return 0


def score_tender_for_operator(operator: Any, tender: Any) -> Dict[str, Any]:
    """
    حساب درجة الملاءمة والتوافق بين المتعامل الاقتصادي والصفقة (0-100)
    وفق 5 معايير محددة بنظام أوزان دقيق.
    
    المعايير:
    a) القطاع (30 نقطة)
    b) الولاية (25 نقطة)
    c) الميزانية والقدرة المالية (20 نقطة)
    d) الأجل الزمني للإيداع (15 نقطة)
    e) الخبرة السابقة في القطاع (10 نقاط)
    """
    logger.debug("بدء احتساب ملاءمة الصفقة للمتعامل: %s", getattr(operator, "email", "operator"))
    
    reasons: List[str] = []
    warnings: List[str] = []

    # -------------------------------------------------------------
    # استخراج OperatorProfile إن وُجد مع fallback آمن
    # -------------------------------------------------------------
    profile = None
    try:
        from apps.users.models import OperatorProfile
        if hasattr(operator, "operator_profile"):
            try:
                profile = operator.operator_profile
            except OperatorProfile.DoesNotExist:
                profile = None
    except Exception as exc:
        logger.debug("تعذر جلب ملف المتعامل: %s", exc)
        profile = None

    # -------------------------------------------------------------
    # a) Sector match (30 نقطة)
    # -------------------------------------------------------------
    if profile and profile.sector:
        op_sector = profile.sector.strip().lower()
    else:
        op_sector_raw = _get_val(operator, "sector", "")
        if op_sector_raw is None or str(op_sector_raw).strip() == "":
            op_sector = "any"
        else:
            op_sector = str(op_sector_raw).strip().lower()
        
    tender_sector = _infer_tender_sector(tender)
    
    if op_sector in ["any", "", "all", "*"]:
        sector_score = 15
    elif tender_sector and (op_sector == tender_sector or op_sector in tender_sector or tender_sector in op_sector):
        sector_score = 30
        reasons.append("قطاع مطابق")
    else:
        tender_text = f"{_get_val(tender, 'title', '')} {_get_val(tender, 'description', '')}".lower()
        if op_sector in SECTOR_KEYWORDS and any(kw in tender_text for kw in SECTOR_KEYWORDS[op_sector]):
            sector_score = 30
            reasons.append("قطاع مطابق")
        else:
            sector_score = 0
            warnings.append("قطاع مختلف")

    # -------------------------------------------------------------
    # b) Wilaya match (25 نقطة)
    # -------------------------------------------------------------
    if profile and profile.available_wilayas is not None:
        op_wilayas = profile.available_wilayas
    else:
        op_wilayas = _get_val(operator, "available_wilayas", None)
        if op_wilayas is None:
            op_wilayas = _get_val(operator, "wilaya", "")

    tender_wilaya_raw = str(_get_val(tender, "wilaya", "") or "").strip().lower()
    
    is_national = False
    matched_wilaya = False

    if isinstance(op_wilayas, list):
        if not op_wilayas:  # قائمة فارغة = كل الولايات
            is_national = True
        else:
            for w in op_wilayas:
                w_str = str(w).strip().lower()
                if w_str in ["all", "any", "00", "*", "كل الولايات", "جميع الولايات"]:
                    is_national = True
                    break
                if _is_wilaya_match(w_str, tender_wilaya_raw):
                    matched_wilaya = True
                    break
    elif isinstance(op_wilayas, str):
        s = op_wilayas.strip().lower()
        if not s or s in ["all", "any", "00", "كل الولايات", "جميع الولايات", "national", "وطني", "*"]:
            is_national = True
        elif _is_wilaya_match(s, tender_wilaya_raw):
            matched_wilaya = True
    else:
        is_national = True

    if is_national:
        wilaya_score = 15
    elif matched_wilaya:
        wilaya_score = 25
        reasons.append("ولاية مطابقة")
    else:
        wilaya_score = 5

    # -------------------------------------------------------------
    # c) Budget match (20 نقطة)
    # -------------------------------------------------------------
    tender_budget_raw = _get_val(tender, "budget", None)
    if tender_budget_raw is None:
        tender_budget_raw = _get_val(tender, "estimated_budget", None)
        
    if profile and profile.max_capacity is not None:
        op_capacity_raw = profile.max_capacity
    else:
        op_capacity_raw = _get_val(operator, "max_capacity", None)
    
    if tender_budget_raw is None:
        budget_score = 20
        reasons.append("الميزانية في نطاق قدرتك")
    elif op_capacity_raw is None or str(op_capacity_raw).strip() == "" or op_capacity_raw == 0:
        budget_score = 20
        reasons.append("الميزانية في نطاق قدرتك")
    else:
        try:
            tender_budget = Decimal(str(tender_budget_raw))
            op_capacity = Decimal(str(op_capacity_raw))
            
            if tender_budget <= op_capacity:
                budget_score = 20
                reasons.append("الميزانية في نطاق قدرتك")
            else:
                warnings.append("الميزانية أعلى من قدرتك")
                ratio = op_capacity / tender_budget if tender_budget > Decimal("0") else Decimal("1.0")
                if ratio >= Decimal("0.80"):
                    budget_score = 15
                elif ratio >= Decimal("0.50"):
                    budget_score = 10
                else:
                    budget_score = 5
        except (InvalidOperation, ValueError, TypeError) as exc:
            logger.warning("خطأ في احتساب ميزانية الصفقة: %s", exc)
            budget_score = 20
            reasons.append("الميزانية في نطاق قدرتك")

    # -------------------------------------------------------------
    # d) Deadline (15 نقطة)
    # -------------------------------------------------------------
    deadline = _get_val(tender, "submission_deadline", None) or _get_val(tender, "deadline", None)
    
    if deadline is None:
        deadline_score = 15
        reasons.append("أجل كافٍ للتحضير")
    else:
        now = timezone.now()
        if isinstance(deadline, datetime.datetime):
            if timezone.is_naive(deadline):
                deadline = timezone.make_aware(deadline)
            days_remaining = (deadline - now).total_seconds() / 86400.0
        elif isinstance(deadline, datetime.date):
            days_remaining = float((deadline - now.date()).days)
        else:
            days_remaining = 30.0
            
        if days_remaining > 15:
            deadline_score = 15
            reasons.append("أجل كافٍ للتحضير")
        elif days_remaining >= 7:
            deadline_score = 10
            reasons.append("أجل كافٍ للتحضير")
        elif days_remaining >= 3:
            deadline_score = 5
            warnings.append("أجل قصير — تحضير سريع مطلوب")
        else:
            deadline_score = 0
            warnings.append("أجل قصير — تحضير سريع مطلوب")

    # -------------------------------------------------------------
    # e) Category experience (10 نقاط)
    # -------------------------------------------------------------
    deals_count = _count_operator_experience(operator, tender_sector)
    
    if deals_count >= 5:
        experience_score = 10
        reasons.append("خبرة سابقة في نفس القطاع")
    elif deals_count >= 2:
        experience_score = 7
        reasons.append("خبرة سابقة في نفس القطاع")
    elif deals_count == 1:
        experience_score = 3
        reasons.append("خبرة سابقة في نفس القطاع")
    else:
        experience_score = 0

    # النتيجة الإجمالية وتصنيف المستوى
    total_score = sector_score + wilaya_score + budget_score + deadline_score + experience_score
    match_score = max(0, min(100, int(total_score)))
    
    if match_score >= 80:
        match_level = "excellent"
    elif match_score >= 60:
        match_level = "good"
    elif match_score >= 40:
        match_level = "fair"
    else:
        match_level = "low"

    tender_id = str(_get_val(tender, "id", "") or "")
    reference = str(_get_val(tender, "reference_number", "") or _get_val(tender, "reference", "") or "")
    title = str(_get_val(tender, "title", "") or "")

    return {
        "tender_id": tender_id,
        "reference": reference,
        "title": title,
        "match_score": match_score,
        "match_level": match_level,
        "score_breakdown": {
            "sector": sector_score,
            "wilaya": wilaya_score,
            "budget": budget_score,
            "deadline": deadline_score,
            "experience": experience_score,
        },
        "reasons": reasons,
        "warnings": warnings,
        "is_advisory": True,
    }


def recommend_tenders(operator: Any, limit: int = 10) -> List[Dict[str, Any]]:
    """
    جلب الصفقات المنشورة وترتيبها تنازلياً حسب درجة الملاءمة للمتعامل.
    المراحل 3، 4، 5 تمثل الصفقات المنشورة الجارية لإيداع العروض وفق القانون 23-12.
    """
    logger.info("جلب التوصيات الذكية للصفقات للمتعامل (حد أقصى: %d)", limit)
    
    try:
        from apps.procurements.models import ProcurementDeal
        # الصفقات المنشورة الجارية فقط لإيداع العروض (المراحل 3، 4، 5) مع استبعاد الصفقات المنتهية وفق القانون 23-12
        from django.utils import timezone
        now = timezone.now()
        deals = list(
            ProcurementDeal.objects.filter(
                current_stage__in=[3, 4, 5],
                submission_deadline__gt=now,
            )
            .exclude(
                status__in=['CANCELLED', 'INFRACTED', 'closed', 'cancelled', 'rejected']
            )
            .order_by('submission_deadline')
        )
    except Exception as exc:
        logger.error("تعذر استعلام الصفقات المنشورة من قاعدة البيانات: %s", exc)
        deals = []

    scored_tenders: List[Dict[str, Any]] = []
    for deal in deals:
        try:
            scored = score_tender_for_operator(operator, deal)
            scored_tenders.append(scored)
        except Exception as e:
            logger.warning("تعذر تقييم الصفقة %s: %s", getattr(deal, "id", "unknown"), e)

    scored_tenders.sort(key=lambda item: item.get("match_score", 0), reverse=True)
    return scored_tenders[:limit]
