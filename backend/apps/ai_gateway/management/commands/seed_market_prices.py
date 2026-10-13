import logging
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.ai_gateway.models import MarketPriceReference

logger = logging.getLogger(__name__)

# قائمة الولايات الـ 69 للجمهورية الجزائرية الديمقراطية الشعبية مع المعاملات الإقليمية
WILAYAS_DATA = [
    {"code": "01", "name_ar": "أدرار", "name_fr": "Adrar", "coef": "0.85"},
    {"code": "02", "name_ar": "الشلف", "name_fr": "Chlef", "coef": "1.00"},
    {"code": "03", "name_ar": "الأغواط", "name_fr": "Laghouat", "coef": "0.95"},
    {"code": "04", "name_ar": "أم البواقي", "name_fr": "Oum El Bouaghi", "coef": "0.95"},
    {"code": "05", "name_ar": "باتنة", "name_fr": "Batna", "coef": "0.95"},
    {"code": "06", "name_ar": "بجاية", "name_fr": "Béjaïa", "coef": "1.00"},
    {"code": "07", "name_ar": "بسكرة", "name_fr": "Biskra", "coef": "0.95"},
    {"code": "08", "name_ar": "بشار", "name_fr": "Béchar", "coef": "0.90"},
    {"code": "09", "name_ar": "البليدة", "name_fr": "Blida", "coef": "1.10"},
    {"code": "10", "name_ar": "البويرة", "name_fr": "Bouira", "coef": "1.00"},
    {"code": "11", "name_ar": "تمنراست", "name_fr": "Tamanrasset", "coef": "1.25"},
    {"code": "12", "name_ar": "تبسة", "name_fr": "Tébessa", "coef": "0.95"},
    {"code": "13", "name_ar": "تلمسان", "name_fr": "Tlemcen", "coef": "1.00"},
    {"code": "14", "name_ar": "تيارت", "name_fr": "Tiaret", "coef": "0.95"},
    {"code": "15", "name_ar": "تيزي وزو", "name_fr": "Tizi Ouzou", "coef": "1.05"},
    {"code": "16", "name_ar": "الجزائر", "name_fr": "Alger", "coef": "1.15"},
    {"code": "17", "name_ar": "الجلفة", "name_fr": "Djelfa", "coef": "0.95"},
    {"code": "18", "name_ar": "جيجل", "name_fr": "Jijel", "coef": "1.00"},
    {"code": "19", "name_ar": "سطيف", "name_fr": "Sétif", "coef": "1.00"},
    {"code": "20", "name_ar": "سعيدة", "name_fr": "Saïda", "coef": "0.95"},
    {"code": "21", "name_ar": "سكيكدة", "name_fr": "Skikda", "coef": "0.95"},
    {"code": "22", "name_ar": "سيدي بلعباس", "name_fr": "Sidi Bel Abbès", "coef": "0.98"},
    {"code": "23", "name_ar": "عنابة", "name_fr": "Annaba", "coef": "1.00"},
    {"code": "24", "name_ar": "قالمة", "name_fr": "Guelma", "coef": "0.95"},
    {"code": "25", "name_ar": "قسنطينة", "name_fr": "Constantine", "coef": "1.05"},
    {"code": "26", "name_ar": "المدية", "name_fr": "Médéa", "coef": "1.00"},
    {"code": "27", "name_ar": "مستغانم", "name_fr": "Mostaganem", "coef": "1.00"},
    {"code": "28", "name_ar": "المسيلة", "name_fr": "M'Sila", "coef": "0.95"},
    {"code": "29", "name_ar": "معسكر", "name_fr": "Mascara", "coef": "0.98"},
    {"code": "30", "name_ar": "ورقلة", "name_fr": "Ouargla", "coef": "0.95"},
    {"code": "31", "name_ar": "وهران", "name_fr": "Oran", "coef": "1.10"},
    {"code": "32", "name_ar": "البيض", "name_fr": "El Bayadh", "coef": "0.90"},
    {"code": "33", "name_ar": "إليزي", "name_fr": "Illizi", "coef": "1.20"},
    {"code": "34", "name_ar": "برج بوعريريج", "name_fr": "Bordj Bou Arréridj", "coef": "0.98"},
    {"code": "35", "name_ar": "بومرداس", "name_fr": "Boumerdès", "coef": "1.08"},
    {"code": "36", "name_ar": "الطارف", "name_fr": "El Tarf", "coef": "0.95"},
    {"code": "37", "name_ar": "تندوف", "name_fr": "Tindouf", "coef": "1.20"},
    {"code": "38", "name_ar": "تسمسيلت", "name_fr": "Tissemsilt", "coef": "0.95"},
    {"code": "39", "name_ar": "الوادي", "name_fr": "El Oued", "coef": "0.95"},
    {"code": "40", "name_ar": "خنشلة", "name_fr": "Khenchela", "coef": "0.95"},
    {"code": "41", "name_ar": "سوق أهراس", "name_fr": "Souk Ahras", "coef": "0.95"},
    {"code": "42", "name_ar": "تيبازة", "name_fr": "Tipaza", "coef": "1.05"},
    {"code": "43", "name_ar": "ميلة", "name_fr": "Mila", "coef": "0.95"},
    {"code": "44", "name_ar": "عين الدفلى", "name_fr": "Aïn Defla", "coef": "0.98"},
    {"code": "45", "name_ar": "النعامة", "name_fr": "Naâma", "coef": "0.90"},
    {"code": "46", "name_ar": "عين تموشنت", "name_fr": "Aïn Témouchent", "coef": "0.95"},
    {"code": "47", "name_ar": "غرداية", "name_fr": "Ghardaïa", "coef": "0.95"},
    {"code": "48", "name_ar": "غليزان", "name_fr": "Relizane", "coef": "0.98"},
    {"code": "49", "name_ar": "تيميمون", "name_fr": "Timimoun", "coef": "0.90"},
    {"code": "50", "name_ar": "برج باجي مختار", "name_fr": "Bordj Badji Mokhtar", "coef": "1.25"},
    {"code": "51", "name_ar": "أولاد جلال", "name_fr": "Ouled Djellal", "coef": "0.95"},
    {"code": "52", "name_ar": "بني عباس", "name_fr": "Béni Abbès", "coef": "0.90"},
    {"code": "53", "name_ar": "عين صالح", "name_fr": "In Salah", "coef": "1.15"},
    {"code": "54", "name_ar": "عين قزام", "name_fr": "In Guezzam", "coef": "1.25"},
    {"code": "55", "name_ar": "توقرت", "name_fr": "Touggourt", "coef": "0.95"},
    {"code": "56", "name_ar": "جانت", "name_fr": "Djanet", "coef": "1.25"},
    {"code": "57", "name_ar": "المغير", "name_fr": "El M'Ghair", "coef": "0.95"},
    {"code": "58", "name_ar": "المنيعة", "name_fr": "El Menia", "coef": "0.95"},
    {"code": "59", "name_ar": "أفلو", "name_fr": "Aflou", "coef": "0.90"},
    {"code": "60", "name_ar": "بريكة", "name_fr": "Barika", "coef": "0.95"},
    {"code": "61", "name_ar": "القنطرة", "name_fr": "El Kantara", "coef": "1.00"},
    {"code": "62", "name_ar": "بئر العاتر", "name_fr": "Bir El Ater", "coef": "0.90"},
    {"code": "63", "name_ar": "العريشة", "name_fr": "El Aricha", "coef": "0.90"},
    {"code": "64", "name_ar": "قصر الشلالة", "name_fr": "Ksar Chellala", "coef": "0.95"},
    {"code": "65", "name_ar": "عين وسارة", "name_fr": "Aïn Oussara", "coef": "0.95"},
    {"code": "66", "name_ar": "مسعد", "name_fr": "Messaad", "coef": "0.95"},
    {"code": "67", "name_ar": "قصر البخاري", "name_fr": "Ksar El Boukhari", "coef": "0.95"},
    {"code": "68", "name_ar": "بوسعادة", "name_fr": "Bou Saâda", "coef": "0.95"},
    {"code": "69", "name_ar": "الأبيض سيدي الشيخ", "name_fr": "El Abiodh Sidi Cheikh", "coef": "0.90"},
]

# الفئات الـ 20 الأساسية للأسعار المرجعية
CATEGORIES_DATA = [
    # WORKS (7 فئات أشغال عمومية)
    {
        "template_type": "works",
        "category": "بناء — هياكل خرسانية",
        "subcategory": "هياكل خرسانية",
        "unit": "م²",
        "base_price": "35000.00",
    },
    {
        "template_type": "works",
        "category": "بناء — جدران",
        "subcategory": "جدران وبناء",
        "unit": "م²",
        "base_price": "12000.00",
    },
    {
        "template_type": "works",
        "category": "بناء — تسقيف",
        "subcategory": "تسقيف وعزل",
        "unit": "م²",
        "base_price": "18000.00",
    },
    {
        "template_type": "works",
        "category": "طرق — سفلتة",
        "subcategory": "أشغال الطرق والتهيئة",
        "unit": "م²",
        "base_price": "4500.00",
    },
    {
        "template_type": "works",
        "category": "طرق — أرصفة",
        "subcategory": "أرصفة وتهيئة حضرية",
        "unit": "م²",
        "base_price": "3200.00",
    },
    {
        "template_type": "works",
        "category": "مياه — مد شبكة",
        "subcategory": "شبكات مياه صالحة للشرب وتطهير",
        "unit": "متر",
        "base_price": "8500.00",
    },
    {
        "template_type": "works",
        "category": "كهرباء — تمديد شبكة",
        "subcategory": "إنارة وشبكات كهرباء",
        "unit": "متر",
        "base_price": "6500.00",
    },

    # SUPPLIES (5 فئات لوازم وتجهيزات)
    {
        "template_type": "supplies",
        "category": "حواسيب مكتبية",
        "subcategory": "تجهيزات إعلام آلي",
        "unit": "وحدة",
        "base_price": "85000.00",
        "standard_item": True,
    },
    {
        "template_type": "supplies",
        "category": "طابعات ليزر",
        "subcategory": "أجهزة طباعة ومسح",
        "unit": "وحدة",
        "base_price": "45000.00",
        "standard_item": True,
    },
    {
        "template_type": "supplies",
        "category": "أثاث مكتبي",
        "subcategory": "تأثيث ومكاتب إدارية",
        "unit": "وحدة",
        "base_price": "35000.00",
    },
    {
        "template_type": "supplies",
        "category": "ورق A4",
        "subcategory": "أدوات ومستهلكات مكتبية",
        "unit": "علبة",
        "base_price": "850.00",
        "standard_item": True,
    },
    {
        "template_type": "supplies",
        "category": "معدات تصوير",
        "subcategory": "آلات نسخ ومعدات تصوير",
        "unit": "وحدة",
        "base_price": "120000.00",
    },

    # SERVICES (4 فئات خدمات وصيانة)
    {
        "template_type": "services",
        "category": "نظافة — مبنى إداري",
        "subcategory": "خدمات النظافة والصيانة العامة",
        "unit": "م²/شهر",
        "base_price": "250.00",
    },
    {
        "template_type": "services",
        "category": "أمن — حراسة",
        "subcategory": "خدمات الحراسة والأمن",
        "unit": "ساعة",
        "base_price": "450.00",
    },
    {
        "template_type": "services",
        "category": "صيانة — تكييف",
        "subcategory": "صيانة أنظمة التكييف والتهوية",
        "unit": "وحدة/سنة",
        "base_price": "25000.00",
    },
    {
        "template_type": "services",
        "category": "نقل — شاحنة",
        "subcategory": "خدمات النقل واللوجستيك",
        "unit": "يوم",
        "base_price": "45000.00",
    },

    # STUDIES (4 فئات دراسات واستشارات)
    {
        "template_type": "studies",
        "category": "دراسة تقنية — GED",
        "subcategory": "دراسات تقنية وإشراف هندسي",
        "unit": "مشروع",
        "base_price": "450000.00",
    },
    {
        "template_type": "studies",
        "category": "دراسة جدوى",
        "subcategory": "استشارات ودراسات اقتصادية",
        "unit": "مشروع",
        "base_price": "800000.00",
    },
    {
        "template_type": "studies",
        "category": "متابعة أشغال",
        "subcategory": "متابعة ومراقبة الورشات",
        "unit": "مشروع",
        "base_price": "350000.00",
    },
    {
        "template_type": "studies",
        "category": "استشارة قانونية",
        "subcategory": "استشارات قانونية وتحكيم",
        "unit": "ساعة",
        "base_price": "8500.00",
    },
]


class Command(BaseCommand):
    help = "بذر أسعار السوق المرجعية الوطنية (20 فئة × 69 ولاية = 1380 سجلاً) وفق القانون 23-12"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="حذف كافة الأسعار المرجعية السابقة وإعادة بذرها من الصفر",
        )
        parser.add_argument(
            "--allow-production",
            action="store_true",
            help="السماح الصريح بالتنفيذ حتى في البيئات الإنتاجية (DEBUG=False)",
        )

    def handle(self, *args, **options):
        # 1. التحقق من أمان بيئة التشغيل
        if not settings.DEBUG and not options.get("allow_production"):
            raise CommandError(
                "تم رفض التنفيذ: بيئة التشغيل إنتاجية (DEBUG=False). "
                "لا يمكن بذر الأسعار إلا بتمرير الراية --allow-production صراحة."
            )

        # 2. معالجة خيار --reset
        if options.get("reset"):
            deleted_count, _ = MarketPriceReference.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"تم حذف {deleted_count} سجلاً مرجعياً سابقاً بنجاح."))

        # 3. إعداد السجلات الجماعية عبر bulk_create
        source_title = "أسعار السوق المحلي — تقديرات ميدانية 2026"
        source_date_val = date(2026, 10, 1)

        major_wilayas = {"16", "31", "25", "09", "19", "23"}

        records_to_create = []

        for wilaya in WILAYAS_DATA:
            wilaya_code = wilaya["code"]
            coef = Decimal(wilaya["coef"])

            for cat in CATEGORIES_DATA:
                # حساب السعر الوحدوي بدقة Decimal وفق المعامل الإقليمي
                base_price = Decimal(cat["base_price"])
                unit_price = (base_price * coef).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

                # تحديد مستوى الثقة الإحصائي
                if cat.get("standard_item"):
                    confidence = 0.90
                elif wilaya_code in major_wilayas:
                    confidence = 0.85
                elif int(wilaya_code) >= 59:
                    confidence = 0.75
                else:
                    confidence = 0.80

                sample_size = 5 if wilaya_code in major_wilayas else 3

                record = MarketPriceReference(
                    template_type=cat["template_type"],
                    category=cat["category"],
                    subcategory=cat["subcategory"],
                    unit=cat["unit"],
                    unit_price=unit_price,
                    wilaya=wilaya_code,
                    wilaya_name_ar=wilaya["name_ar"],
                    wilaya_name_fr=wilaya["name_fr"],
                    source=source_title,
                    source_date=source_date_val,
                    sample_size=sample_size,
                    confidence=confidence,
                )
                records_to_create.append(record)

        # 4. التنفيذ الجماعي bulk_create لضمان السرعة والكفاءة
        MarketPriceReference.objects.bulk_create(records_to_create, batch_size=500)

        total_created = len(records_to_create)
        self.stdout.write(
            self.style.SUCCESS(
                f"✅ تم بنجاح بذر {total_created} سجلاً مرجعياً تغطي 69 ولاية و20 فئة للمشتريات العمومية."
            )
        )
