"""
test_algeria_69_wilayas_integrity.py
اختبار آلي صارم للتحقق من تكامل قائمة ولايات الجمهورية الجزائرية (69 ولاية).
وفق القانون والتنظيم الإقليمي المعتمد، والتأكد من مطابقة جميع الواجهات وقواعد البيانات ونقاط API.
"""

import pytest
from apps.reports.central_views import (
    ALGERIA_WILAYAS_CATALOG,
    WILAYA_NAME_TO_CODE,
    normalize_wilaya,
)
from apps.ai_gateway.management.commands.seed_market_prices import WILAYAS_DATA


@pytest.mark.django_db
class TestAlgeria69WilayasIntegrity:
    """مجموعة اختبارات التحقق من اكتمال وتطابق الـ 69 ولاية جزائرية"""

    def test_catalog_total_count_is_strictly_69(self):
        """التحقق من أن العدد الإجمالي للولايات في الكتالوج المركزي هو بالضبط 69 ولاية دون زيادة أو نقصان"""
        total = len(ALGERIA_WILAYAS_CATALOG)
        assert total == 69, f"عدد الولايات في الكتالوج المركزي هو {total} بينما يجب أن يكون 69 ولاية تماماً."

    def test_catalog_sequential_codes_01_to_69(self):
        """التحقق من أن جميع رموز الولايات من 01 إلى 69 موجودة ومتسلسلة دون أي فجوات"""
        expected_codes = [f"{i:02d}" for i in range(1, 70)]
        actual_codes = sorted(list(ALGERIA_WILAYAS_CATALOG.keys()))
        assert actual_codes == expected_codes, "رموز الولايات ليست متطابقة مع التسلسل المعياري (01 إلى 69)."

    def test_catalog_names_not_empty(self):
        """التحقق من أن كل ولاية تحمل اسماً عربياً واسماً فرنسياً معتمداً وغير فارغ"""
        for code, (ar_name, fr_name) in ALGERIA_WILAYAS_CATALOG.items():
            assert ar_name and isinstance(ar_name, str) and len(ar_name.strip()) > 0, (
                f"الاسم العربي للولاية رقم {code} فارغ أو غير صحيح."
            )
            assert fr_name and isinstance(fr_name, str) and len(fr_name.strip()) > 0, (
                f"الاسم الفرنسي للولاية رقم {code} فارغ أو غير صحيح."
            )

    def test_promoted_wilayas_59_to_69_presence(self):
        """التحقق المباشر من وجود الولايات المستحدثة الـ 11 (الرموز 59 إلى 69) بأسمائها الرسمية"""
        promoted = {
            "59": "أفلو",
            "60": "بريكة",
            "61": "القنطرة",
            "62": "بئر العاتر",
            "63": "العريشة",
            "64": "قصر الشلالة",
            "65": "عين وسارة",
            "66": "مسعد",
            "67": "قصر البخاري",
            "68": "بوسعادة",
            "69": "الأبيض سيدي الشيخ",
        }
        for code, expected_ar in promoted.items():
            assert code in ALGERIA_WILAYAS_CATALOG, f"الولاية المستحدثة {code} ({expected_ar}) غير موجودة في الكتالوج."
            actual_ar, _ = ALGERIA_WILAYAS_CATALOG[code]
            assert actual_ar == expected_ar, (
                f"الولاية {code}: الاسم المسجل '{actual_ar}' لا يطابق المتوقع '{expected_ar}'."
            )

    def test_normalize_wilaya_promoted_codes_and_names(self):
        """التحقق من قدرة دالة التطبيع على التعرف على الولايات الجديدة بالرمز وبالاسم"""
        # فحص بالرمز
        code, ar, fr = normalize_wilaya("64")
        assert code == "64"
        assert ar == "قصر الشلالة"
        assert fr == "Ksar Chellala"

        # فحص بالرمز 69
        code, ar, fr = normalize_wilaya("69")
        assert code == "69"
        assert ar == "الأبيض سيدي الشيخ"

        # فحص بالاسم مع كلمة ولاية
        code, ar, fr = normalize_wilaya("ولاية بوسعادة")
        assert code == "68"
        assert ar == "بوسعادة"

        code, ar, fr = normalize_wilaya("ولاية عين وسارة")
        assert code == "65"
        assert ar == "عين وسارة"

    def test_seed_market_prices_wilayas_count_is_strictly_69(self):
        """التحقق من أن بيانات الأسعار المرجعية تحتوي على 69 ولاية بالضبط مع معاملاتها الإقليمية"""
        assert len(WILAYAS_DATA) == 69, f"عدد الولايات في seed_market_prices هو {len(WILAYAS_DATA)} والمطلوب 69."
        seed_codes = [w["code"] for w in WILAYAS_DATA]
        expected_codes = [f"{i:02d}" for i in range(1, 70)]
        assert seed_codes == expected_codes, "رموز الولايات في seed_market_prices لا تطابق التسلسل 01-69."

    def test_wilaya_name_to_code_reverse_lookup_integrity(self):
        """التحقق من أن فهرس البحث العكسي يحتوي على جميع الأسماء العربية الـ 69"""
        assert len(WILAYA_NAME_TO_CODE) >= 69
        assert WILAYA_NAME_TO_CODE.get("الأبيض سيدي الشيخ") == "69"
        assert WILAYA_NAME_TO_CODE.get("أفلو") == "59"
        assert WILAYA_NAME_TO_CODE.get("بريكة") == "60"
