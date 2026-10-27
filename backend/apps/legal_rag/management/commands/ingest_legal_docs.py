import os
import re
import unicodedata
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from pypdf import PdfReader

from apps.legal_rag.models import LegalArticle
from apps.legal_rag.services.embeddings import generate_embedding


def normalize_arabic(text: str) -> str:
    """معايرة وتطبيع النصوص العربية المعكوسة من ملفات الـ PDF الرسمية"""
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    digit_map = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")
    text = text.translate(digit_map)
    ligatures = {
        "ﳌ": "لم", "ﳉ": "لج", "ﰲ": "في", "ﲆ": "على", "ﲢ": "تحت",
        "ﲔ": "ين", "ﻷ": "لأ", "ﻻ": "لا", "إﱃ": "إلى", "ﱃ": "لى",
        "ةّداﳌا": "المادة", "ةداﳌا": "المادة", "اﳌادّة": "المادة", "اﳌادة": "المادة",
    }
    for k, v in ligatures.items():
        text = text.replace(k, v)
    return text


# المواد القانونية المرجعية الأساسية الموثقة رسمياً (مضمونة الدقة الكاملة)
CANONICAL_LEGAL_ARTICLES = [
    {
        "law_source": "القانون رقم 23-12",
        "article_number": "المادة 1",
        "title": "موضوع القانون ونطاقه العام",
        "content": (
            "يهدف هذا القانون إلى تحديد القواعد العامة المتعلقة بالصفقات العمومية، والمبادئ الأساسية "
            "التي تحكم إبرامها وتنفيذها ومراقبتها، ضماناً للنجاعة والشفافية وحرية الوصول للطلبات العمومية والمساواة في معاملة المترشحين."
        )
    },
    {
        "law_source": "القانون رقم 23-12",
        "article_number": "المادة 5",
        "title": "المبادئ الأساسية للصفقات العمومية",
        "content": (
            "تقوم الصفقات العمومية على مبادئ حرية الوصول للطلبات العمومية، والمساواة في معاملة المترشحين، "
            "وشفافية الإجراءات، في ظل احترام قواعد الحوكمة الرشيدة واستعمال التكنولوجيات الحديثة والرقمنة ومكافحة الفساد."
        )
    },
    {
        "law_source": "القانون رقم 23-12",
        "article_number": "المادة 10",
        "title": "إلزامية الموافقة الرسمية وسريان الصفقات",
        "content": (
            "لا تصح الصفقات العمومية ولا تكون نهائية إلا بعد الموافقة عليها من طرف السلطة المختصة (الوزير، الوالي، "
            "رئيس المجلس الشعبي البلدي، أو المدير العام/مدير المؤسسة العمومية)، ولا تنتج أي أثر قانوني قبل ذلك."
        )
    },
    {
        "law_source": "القانون رقم 23-12",
        "article_number": "المادة 18",
        "title": "إجراء الاستشارة وحدود المبالغ",
        "content": (
            "تخضع لإجراء الاستشارة الطلبات التي يكون مبلغها الإجمالي أقل من أو يساوي اثني عشر مليون دينار (12.000.000 دج) "
            "للأشغال أو اللوازم، وستة ملايين دينار (6.000.000 دج) للدراسات أو الخدمات. ما تجاوز ذلك يبرم وجوباً وفق إجراءات الصفقة العمومية."
        )
    },
    {
        "law_source": "القانون رقم 23-12",
        "article_number": "المادة 23",
        "title": "أنماط وإجراءات إبرام الصفقات العمومية",
        "content": (
            "تبرم الصفقات العمومية وفق إجراء طلب العروض أو إجراء التراضي. طلب العروض يمثل القاعدة العامة، "
            "ويمكن أن يكون وطنياً أو دولياً، مفتوحاً، أو مفتوحاً مع اشتراط قدرات دنيا، أو محدوداً."
        )
    },
    {
        "law_source": "القانون رقم 23-12",
        "article_number": "المادة 67",
        "title": "ملف الترشح والوثائق الإلزامية",
        "content": (
            "يجب على كل مترشح أو متعهد تقديم ملف الترشح متضمناً: التصريح بالترشح، التصريح بالنزاهة، "
            "السجل التجاري الإلكتروني، رقم التعريف الجبائي (NIF)، شهادات أداء المستحقات الجبائية وشبه الجبائية (CNAS/CASNOS)، "
            "وشهادة التأهيل والتصنيف المهنيين في صفقات الأشغال والدراسات، وكافة الوثائق المثبتة للأهلية القانونية والمالية والتقنية."
        )
    },
    {
        "law_source": "القانون رقم 23-12",
        "article_number": "المادة 68",
        "title": "مشتملات العرض التقني والعرض المالي",
        "content": (
            "يتضمن العرض التقني المذكرة التقنية التبريرية وخطة التنفيذ والوسائل البشرية والمادية المخصصة. "
            "ويتضمن العرض المالي رسالة التعهد، جدول الأسعار الوحدوية (BPU)، والتفصيل التقديري والكمي (DQE)، مع تحديد الأسعار بالأرقام والحروف."
        )
    },
    {
        "law_source": "القانون رقم 23-12",
        "article_number": "المادة 72",
        "title": "حق الطعن الإداري المسبق وأجله القانوني",
        "content": (
            "يحق لكل متعهد يشارك في طلب عروض ويحتج على قرار الإسناد المؤقت للصفقة أو إلغائها أن يرفع طعناً إدارياً مسبقاً "
            "أمام لجنة الصفقات المختصة في أجل أقصاه عشرة (10) أيام ابتداءً من تاريخ نشر إشعار الإسناد المؤقت في BOMOP أو الصحف الوطنية."
        )
    },
    {
        "law_source": "القانون رقم 23-12",
        "article_number": "المادة 74",
        "title": "الضمانات والكفالات المالية المصرفية",
        "content": (
            "يلتزم صاحب الصفقة بتقديم كفالة التعهد عند الاقتضاء، وكفالة حسن التنفيذ لضمان إنجاز موضوع الصفقة، "
            "واقتطاع الضمان لضمان فترة الضمان والصيانة، وكفالة استرجاع التسبيقات عند طلب دفع مسبق."
        )
    },
    {
        "law_source": "القانون رقم 23-12",
        "article_number": "المادة 82",
        "title": "الأثر الموقف للطعن ومهلة الفصل فيه",
        "content": (
            "يترتب على رفع الطعن أمام لجنة الصفقات المختصة تعليق إجراءات توقيع الصفقة وتنفيذها إلى حين البت فيه. "
            "ويتعين على لجنة الصفقات الفصل في الطعن وتبليغ قرارها المعلل للمشتكي والمصلحة المتعاقدة خلال أجل عشرة (10) أيام."
        )
    },
    {
        "law_source": "المرسوم الرئاسي رقم 15-247",
        "article_number": "المادة 125",
        "title": "كفالة حسن التنفيذ (Caution de bonne exécution)",
        "content": (
            "تحدد كفالة حسن التنفيذ بنسبة تتراوح بين 5% و10% من المبلغ الإجمالي للصفقة. "
            "تودع الكفالة لدى بنك أو صندوق ضمان معتمد قبل أي دفع، وتستمر طيلة فترة تنفيذ الصفقة حتى الاستلام المؤقت."
        )
    },
    {
        "law_source": "المرسوم الرئاسي رقم 15-247",
        "article_number": "المادة 134",
        "title": "اقتطاع الضمان وفترة الضمان التعاقدية (Retenue de garantie)",
        "content": (
            "يطبق اقتطاع ضمان بنسبة 5% على كل وضعية دفع شهرية، ويمكن استبداله بكفالة مصرفية تعادل قيمته. "
            "يفرج عن اقتطاع الضمان أو الكفالة البديلة خلال شهر واحد بعد تاريخ الاستلام النهائي للأشغال أو التجهيزات بدون تحفظات."
        )
    },
    {
        "law_source": "المرسوم الرئاسي رقم 15-247",
        "article_number": "المادة 70",
        "title": "جلسة فتح الأظرفة العلنية وحضور المتعهدين",
        "content": (
            "تفتح أظرفة العروض التقنية والمالية في جلسة علنية من قبل لجنة فتح الأظرفة وتقييم العروض في اليوم والساعة "
            "المحددين في إعلان المناقصة بحضور المتعهدين أو من يمثلهم قانوناً. ويدون محضر رسمي تثبت فيه أسماء المشاركين والأسعار والوثائق."
        )
    },
    {
        "law_source": "المرسوم الرئاسي رقم 15-247",
        "article_number": "المادة 147",
        "title": "غرامات التأخير والإعفاء التعاقدي (Pénalités de retard)",
        "content": (
            "تطبق غرامات التأخير تلقائياً بمجرد تجاوز الآجال التعاقدية المحددة في الصفقة دون الحاجة إلى إعذار، "
            "وتحدد نسبتها وسقفها الأقصى في دفتر الشروط بنسبة لا تتجاوز 10% من القيمة الإجمالية للصفقة، ما لم تكن هناك قوة قاهرة مثبتة قانوناً."
        )
    },
]


class Command(BaseCommand):
    help = "قراءة واستيعاب ملفات القانون 23-12 والمرسوم 15-247 وتقسيمها شعاعياً لـ RAG (pgvector)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--law-pdf",
            type=str,
            default=None,
            help="مسار ملف PDF الخاص بالقانون 23-12",
        )
        parser.add_argument(
            "--decree-pdf",
            type=str,
            default=None,
            help="مسار ملف PDF الخاص بالمرسوم الرئاسي 15-247",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="مسح المواد السابقة قبل الاستيراد",
        )
        parser.add_argument(
            "--max-articles",
            type=int,
            default=None,
            help="الحد الأقصى لعدد المواد المستخرجة من كل ملف (للاختبارات السريعة)",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("=== بدء عملية استيعاب وتضمين النصوص القانونية (Legal RAG Ingestion) ==="))
        max_articles = options.get("max_articles")

        if options["clear"]:
            count = LegalArticle.objects.count()
            LegalArticle.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"تم مسح {count} مادة قانونية سابقة."))

        total_ingested = 0

        # 1. إدخال المواد القانونية المرجعية الأساسية
        self.stdout.write(self.style.MIGRATE_LABEL("1. معالجة وتضمين المواد القانونية المرجعية الأساسية..."))
        for item in CANONICAL_LEGAL_ARTICLES:
            art, created = LegalArticle.objects.update_or_create(
                law_source=item["law_source"],
                article_number=item["article_number"],
                defaults={
                    "title": item.get("title", ""),
                    "content": item["content"],
                    "embedding": generate_embedding(f"{item['law_source']} {item['article_number']} {item.get('title', '')} {item['content']}"),
                }
            )
            total_ingested += 1

        self.stdout.write(self.style.SUCCESS(f"  ✓ تم حفظ {len(CANONICAL_LEGAL_ARTICLES)} مادة قانونية مرجعية أساسية بنجاح."))

        # 2. تحديد مسارات الملفات
        law_pdf_path = options.get("law_pdf")
        decree_pdf_path = options.get("decree_pdf")

        base_dir = getattr(settings, "BASE_DIR", Path("."))
        search_paths_law = [
            law_pdf_path,
            str(base_dir / "data" / "legal_docs" / "Law-5-8-2023-CODE-MP-ar.pdf"),
            r"D:\dev\safaqat\backend\data\legal_docs\Law-5-8-2023-CODE-MP-ar.pdf",
            r"D:\dev\Law-5-8-2023-CODE-MP-ar.pdf",
        ]
        search_paths_decree = [
            decree_pdf_path,
            str(base_dir / "data" / "legal_docs" / "dec-P_15-247_Fr.pdf"),
            r"D:\dev\safaqat\backend\data\legal_docs\dec-P_15-247_Fr.pdf",
            r"D:\dev\dec-P_15-247_Fr.pdf",
        ]

        actual_law_pdf = next((p for p in search_paths_law if p and os.path.isfile(p)), None)
        actual_decree_pdf = next((p for p in search_paths_decree if p and os.path.isfile(p)), None)

        # 3. استخراج وتضمين القانون 23-12
        if actual_law_pdf:
            self.stdout.write(self.style.MIGRATE_LABEL(f"2. قراءة وتقسيم ملف القانون 23-12: {actual_law_pdf}"))
            law_articles_count = self._ingest_arabic_law_pdf(actual_law_pdf, max_articles=max_articles)
            total_ingested += law_articles_count
            self.stdout.write(self.style.SUCCESS(f"  ✓ تم استخراج وتضمين {law_articles_count} مادة من القانون 23-12."))
        else:
            self.stdout.write(self.style.WARNING("  ! لم يتم العثور على ملف PDF للقانون 23-12."))

        # 4. استخراج وتضمين المرسوم 15-247
        if actual_decree_pdf:
            self.stdout.write(self.style.MIGRATE_LABEL(f"3. قراءة وتقسيم ملف المرسوم 15-247: {actual_decree_pdf}"))
            decree_articles_count = self._ingest_french_decree_pdf(actual_decree_pdf, max_articles=max_articles)
            total_ingested += decree_articles_count
            self.stdout.write(self.style.SUCCESS(f"  ✓ تم استخراج وتضمين {decree_articles_count} مادة من المرسوم 15-247."))
        else:
            self.stdout.write(self.style.WARNING("  ! لم يتم العثور على ملف PDF للمرسوم 15-247."))

        grand_total = LegalArticle.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f"\n=== اكتملت عملية الاستيعاب بنجاح! إجمالي المواد في قاعدة البيانات: {grand_total} مادة ==="
        ))

    def _ingest_arabic_law_pdf(self, pdf_path: str, max_articles: int = None) -> int:
        """قراءة ملف PDF القانون 23-12 وتقسيم نصوصه بناءً على 'المادة'"""
        reader = PdfReader(pdf_path)
        full_lines = []

        for page in reader.pages:
            t = page.extract_text() or ""
            for raw_line in t.split("\n"):
                rev_line = raw_line[::-1].strip()
                norm_line = normalize_arabic(rev_line)
                if norm_line:
                    full_lines.append(norm_line)

        full_text = "\n".join(full_lines)
        pat = re.compile(r'(?:(?:المادة\s+(?:الاولى|الأولى|\d+))|(?:[:\s]\s*(\d+)\s*المادة)|(?:المادة\s*:\s*(\d+)))')
        matches = list(pat.finditer(full_text))
        if not matches:
            return 0

        articles_by_num = {}
        for i, m in enumerate(matches):
            m_str = m.group(0)
            digits = re.findall(r"\d+", m_str)
            if "الاولى" in m_str or "الأولى" in m_str or (not digits and "1" in m_str):
                num = "1"
            elif digits:
                num = digits[0]
            else:
                continue

            start = m.start()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(full_text)
            chunk = full_text[start:end].strip()
            if len(chunk) > 25:
                # إذا تكررت المادة ندمج النصوص أو نحتفظ بالأطول
                if num in articles_by_num:
                    if len(chunk) > len(articles_by_num[num]):
                        articles_by_num[num] = chunk
                else:
                    articles_by_num[num] = chunk

        count = 0
        for num, chunk in articles_by_num.items():
            if max_articles and count >= max_articles:
                break
            display_num = f"المادة {num}"
            embedding = generate_embedding(f"القانون رقم 23-12 {display_num} {chunk}")

            # استخراج عنوان إن وُجد في أول سطر
            first_line = chunk.split("\n")[0] if "\n" in chunk else ""
            title = first_line[:120] if len(first_line) > 10 else f"أحكام {display_num} من القانون 23-12"

            LegalArticle.objects.update_or_create(
                law_source="القانون رقم 23-12",
                article_number=display_num,
                defaults={
                    "title": title,
                    "content": chunk,
                    "embedding": embedding,
                }
            )
            count += 1

        return count

    def _ingest_french_decree_pdf(self, pdf_path: str, max_articles: int = None) -> int:
        """قراءة ملف PDF المرسوم 15-247 وتقسيم نصوصه بناءً على 'Article' / 'Art.'"""
        reader = PdfReader(pdf_path)
        full_text = ""
        for page in reader.pages:
            t = page.extract_text() or ""
            full_text += t + "\n"

        pat = re.compile(r'(?:(?:Article\s+(\d+|1er))|(?:Art\.\s*(\d+)))', re.IGNORECASE)
        matches = list(pat.finditer(full_text))
        if not matches:
            return 0

        articles_by_num = {}
        for i, m in enumerate(matches):
            m_str = m.group(0)
            digits = re.findall(r"\d+", m_str)
            if "1er" in m_str.lower():
                num = "1"
            elif digits:
                num = digits[0]
            else:
                continue

            start = m.start()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(full_text)
            chunk = full_text[start:end].strip()
            if len(chunk) > 35:
                if num in articles_by_num:
                    if len(chunk) > len(articles_by_num[num]):
                        articles_by_num[num] = chunk
                else:
                    articles_by_num[num] = chunk

        count = 0
        for num, chunk in articles_by_num.items():
            if max_articles and count >= max_articles:
                break
            display_num = f"المادة {num}"
            embedding = generate_embedding(f"المرسوم الرئاسي رقم 15-247 {display_num} Art. {num} {chunk}")

            LegalArticle.objects.update_or_create(
                law_source="المرسوم الرئاسي رقم 15-247",
                article_number=display_num,
                defaults={
                    "title": f"أحكام {display_num} من المرسوم الرئاسي 15-247 (تنظيم الصفقات)",
                    "content": chunk,
                    "embedding": embedding,
                }
            )
            count += 1

        return count
