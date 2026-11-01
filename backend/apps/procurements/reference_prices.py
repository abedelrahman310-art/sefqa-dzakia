"""تطبيع أسماء المواد والولايات ومطابقة الأسعار المرجعية.

هذا الملف مستقل عن Django كي تستخدمه النماذج والمسلسلات (serializers)
وأوامر الإدارة والاختبارات دون أي استيراد دائري.

المبدأ:
- نطبّع النص العربي (التشكيل، التطويل، همزات الألف، التاء المربوطة، الألف المقصورة...)
  حتى يتطابق "كيس الإسمنت" مع "كيس إسمنت".
- نجرّب أولاً مطابقة تامة على (اسم المادة المطبّع + الولاية المطبّعة).
- عند عدم وجود مطابقة تامة نجرّب مطابقة تقريبية محافظة داخل نفس الولاية،
  تُرفض إذا كانت النتيجة غامضة (أكثر من مرشح متساوٍ).
"""

from __future__ import annotations

import re
import unicodedata
from decimal import Decimal, ROUND_HALF_UP

# عتبة التحذير الشديد المتفق عليها مع واجهة تقديم العرض:
# أقل من 60% من السعر المرجعي أو أكثر من 140% منه (أي تجاوز ±40%).
# هذا تحذير استشاري لا يمنع حفظ العرض أو إيداعه.
DEVIATION_THRESHOLD_PERCENT = Decimal("40.0")

# نسبة تداخل دنيا للمطابقة التقريبية. 0.5 تعني أن نصف كلمات الاستعلام
# على الأقل يجب أن تظهر في الاسم المرجعي، مع رفض التعادل بين مرشحين.
FUZZY_MATCH_MIN_OVERLAP = 0.5

# كلمات وحدات القياس لا تكفي وحدها لتحديد المادة، لذلك لا تُستخدم
# في المطابقة التقريبية (لكنها تبقى جزءاً من النص المطبّع).
GENERIC_UNIT_TOKENS = frozenset(
    {
        "كيس",
        "طن",
        "متر",
        "مكعب",
        "م",
        "سم",
        "مم",
        "م2",
        "م3",
        "لتر",
        "وحده",
        "يوم",
        "خدمه",
        "كغ",
        "كلغ",
        "غرام",
        "رحلة",
        "رحله",
        "شاحنة",
        "شاحنه",
    }
)

# خريطة أرقام عربية-هندية إلى أرقام لاتينية.
_ARABIC_INDIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")

_PUNCTUATION_RE = re.compile(r"[^\w\s]", flags=re.UNICODE)
_WHITESPACE_RE = re.compile(r"\s+", flags=re.UNICODE)

# مرادفات الولايات المدعومة في البيانات التجريبية (الجزائر ووهران).
# تُطبّع المفاتيح والقيم عند بناء الخريطة حتى تعمل الصيغ العربية والفرنسية والأرقام.
_RAW_WILAYA_ALIASES = {
    "16": "الجزائر",
    "016": "الجزائر",
    "الجزائر": "الجزائر",
    "الجزائر العاصمة": "الجزائر",
    "Alger": "الجزائر",
    "Algiers": "الجزائر",
    "31": "وهران",
    "031": "وهران",
    "وهران": "وهران",
    "Oran": "وهران",
    "Ouahran": "وهران",
}


def normalize_text(value: object) -> str:
    """يطبّع نصاً عربياً/لاتينياً للمقارنة البحثية.

    - يزيل التشكيل والحركات والتطويل.
    - يوحّد همزات الألف (أ إ آ ٱ) والألف المقصورة (ى) والتاء المربوطة (ة).
    - يحذف علامات الترقيم ويحوّلها إلى مسافات.
    - يزيل "ال" التعريف من بداية كل كلمة (مع مراعاة السوابق مثل وال/بال/كال/فال/لل).
    - يوحّد المسافات ويحوّل الحروف اللاتينية إلى صغيرة.
    """
    text = str(value or "")
    if not text:
        return ""

    # NFKD يفكّك الحروف المركّبة (مثل أ -> ا + همزة) والحركات،
    # ثم نحذف كل العلامات المدمجة.
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.replace("\u0640", "")  # التطويل
    text = text.translate(_ARABIC_INDIC_DIGITS)
    text = text.replace("ة", "ه").replace("ى", "ي").replace("ء", "")
    text = text.replace("_", " ")
    text = _PUNCTUATION_RE.sub(" ", text)
    text = text.lower()
    text = _WHITESPACE_RE.sub(" ", text).strip()

    tokens = []
    for token in text.split():
        # السوابق العربية الشائعة: وال، بال، كال، فال، لل
        for prefix in ("وال", "بال", "كال", "فال"):
            if token.startswith(prefix) and len(token) > len(prefix) + 2:
                token = token[len(prefix) :]
                break
        if token.startswith("لل") and len(token) > 3:
            token = token[2:]
        # نزيل "ال" التعريف بشكل متكرر: "الالمنيوم" -> "المنيوم" -> "منيوم".
        while token.startswith("ال") and len(token) > 3:
            token = token[2:]
        if token:
            tokens.append(token)

    return " ".join(tokens)


def normalize_item_name(value: object) -> str:
    """تطبيع اسم المادة أو الخدمة قبل تخزينه أو البحث عنه."""
    return normalize_text(value)


def normalize_wilaya(value: object) -> str:
    """تطبيع اسم الولاية أو رمزها إلى صيغة موحّدة."""
    text = normalize_text(value)
    if not text:
        return ""

    tokens = text.split()
    if tokens and tokens[0] in {"ولايه", "wilaya"}:
        tokens = tokens[1:]
    if tokens and tokens[0] in {"de", "d"}:
        tokens = tokens[1:]

    key = " ".join(tokens)
    return WILAYA_ALIASES.get(key, key)


WILAYA_ALIASES = {
    normalize_text(source): normalize_text(target)
    for source, target in _RAW_WILAYA_ALIASES.items()
}


def meaningful_tokens(normalized_name: str) -> set[str]:
    """كلمات الاسم التي تحمل دلالة، بعد استبعاد وحدات القياس العامة."""
    return {
        token
        for token in (normalized_name or "").split()
        if token not in GENERIC_UNIT_TOKENS
    }


def match_reference(normalized_name: str, candidates):
    """يبحث عن مرجع تقريبي محافظ بين المرشحين.

    يعيد كائن ReferencePrice إن وُجد مرشح واحد فقط في المرتبة الأولى،
    وإلا يعيد None (لا مطابقة أو مطابقة غامضة).
    """
    query_tokens = meaningful_tokens(normalized_name)
    if not query_tokens:
        return None

    scored = []
    for candidate in candidates:
        candidate_tokens = meaningful_tokens(candidate.normalized_name)
        if not candidate_tokens:
            continue

        overlap = query_tokens & candidate_tokens
        if not overlap:
            continue

        overlap_ratio = len(overlap) / min(len(query_tokens), len(candidate_tokens))
        jaccard = len(overlap) / len(query_tokens | candidate_tokens)
        scored.append((overlap_ratio, jaccard, candidate))

    if not scored:
        return None

    best_ratio, best_jaccard, _ = max(scored, key=lambda row: (row[0], row[1]))
    if best_ratio < FUZZY_MATCH_MIN_OVERLAP:
        return None

    top_candidates = [
        row for row in scored if row[0] == best_ratio and row[1] == best_jaccard
    ]
    if len(top_candidates) != 1:
        return None

    return top_candidates[0][2]


def compute_deviation(proposed_price, reference_price) -> Decimal | None:
    """يحسب نسبة الانحراف المئوية (المقترح - المرجع) / المرجع * 100."""
    proposed = Decimal(proposed_price)
    reference = Decimal(reference_price)
    if reference <= 0:
        return None

    return ((proposed - reference) / reference * Decimal("100")).quantize(
        Decimal("0.1"), rounding=ROUND_HALF_UP
    )


def classify_deviation(deviation: Decimal | None) -> str:
    """يصنّف الانحراف: normal / too_low / too_high / no_reference."""
    if deviation is None:
        return "no_reference"
    if abs(deviation) <= DEVIATION_THRESHOLD_PERCENT:
        return "normal"
    return "too_low" if deviation < 0 else "too_high"


def format_percent(value: Decimal) -> str:
    """ينسّق النسبة دون أصفار زائدة: 40.0 -> 40 و41.7 -> 41.7."""
    value = Decimal(value)
    if value == 0:
        value = abs(value)
    text = f"{value.quantize(Decimal('0.1'), rounding=ROUND_HALF_UP):f}"
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text or "0"


def format_signed_percent(value: Decimal) -> str:
    """ينسّق النسبة مع إشارة موجبة صريحة عند الارتفاع."""
    value = Decimal(value)
    if value > 0:
        return f"+{format_percent(value)}"
    return format_percent(value)


def build_recommendation(status: str, deviation: Decimal | None) -> str:
    """يبني توصية عربية واضحة لكل حالة سعرية."""
    if status == "too_low" and deviation is not None:
        return (
            f"السعر منخفض جداً بنسبة {format_percent(abs(deviation))}% عن السعر المرجعي؛ "
            "يُنصح بمراجعة بنود التكلفة قبل الاعتماد."
        )
    if status == "too_high" and deviation is not None:
        return (
            f"السعر مرتفع جداً بنسبة {format_percent(deviation)}% عن السعر المرجعي؛ "
            "يُنصح بتبرير الفارق أو تعديل السعر المقترح."
        )
    if status == "normal" and deviation is not None:
        return (
            f"السعر طبيعي ضمن هامش ±{format_percent(DEVIATION_THRESHOLD_PERCENT)}% "
            f"عن السعر المرجعي (انحراف {format_signed_percent(deviation)}%)."
        )
    return "لا يتوفر سعر مرجعي لهذه المادة؛ تعذّر تقييم السعر المقترح."
