"""
خدمة توليد الوثائق الرسمية والمحاضر بصيغة PDF وفق القانون 23-12 والمرسوم الرئاسي 15-247
Safaqat PDF Generation Service for Opening Minutes (PV) and Cahier des Charges.
"""

import io
import os
import hashlib
from datetime import datetime
from django.utils import timezone
from django.conf import settings

import arabic_reshaper
from bidi.algorithm import get_display

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


# ==============================================================================
# 1. إعداد وتسجيل الخطوط العربية واللاتينية (Font Management & Caching)
# ==============================================================================

_FONTS_REGISTERED = False

def ensure_arabic_fonts():
    """تسجيل الخطوط العربية من النظام مع بدائل متعددة للبيئات المختلفة (Windows/Linux/Docker)"""
    global _FONTS_REGISTERED
    if _FONTS_REGISTERED:
        return

    # قائمة الخطوط المرشحة للبحث
    font_candidates = [
        # Windows Fonts
        ("ArabicRegular", r"C:\Windows\Fonts\arial.ttf"),
        ("ArabicBold", r"C:\Windows\Fonts\arialbd.ttf"),
        ("ArabicRegular", r"C:\Windows\Fonts\tahoma.ttf"),
        ("ArabicBold", r"C:\Windows\Fonts\tahomabd.ttf"),
        ("ArabicRegular", r"C:\Windows\Fonts\segoeui.ttf"),
        ("ArabicBold", r"C:\Windows\Fonts\segoeuib.ttf"),
        # Linux / Debian / Docker
        ("ArabicRegular", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        ("ArabicBold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        ("ArabicRegular", "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf"),
        ("ArabicBold", "/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf"),
        ("ArabicRegular", "/usr/share/fonts/truetype/freefont/FreeSans.ttf"),
        ("ArabicBold", "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf"),
    ]

    registered_regular = False
    registered_bold = False

    for name, path in font_candidates:
        if os.path.exists(path):
            try:
                if name == "ArabicRegular" and not registered_regular:
                    pdfmetrics.registerFont(TTFont("ArabicRegular", path))
                    registered_regular = True
                elif name == "ArabicBold" and not registered_bold:
                    pdfmetrics.registerFont(TTFont("ArabicBold", path))
                    registered_bold = True
            except Exception:
                pass

    # إذا توفر العادي ولم يتوفر العريض، نستخدم العادي لكلا الاسمين
    if registered_regular and not registered_bold:
        pdfmetrics.registerFont(TTFont("ArabicBold", pdfmetrics.getFont("ArabicRegular").fileName))
        registered_bold = True

    _FONTS_REGISTERED = registered_regular


def ar(text):
    """تهيئة النص العربي وتوصيل حروفه وعكس اتجاهه للعرض السليم RTL"""
    if text is None:
        return ""
    text_str = str(text).strip()
    if not text_str:
        return ""
    try:
        reshaped = arabic_reshaper.reshape(text_str)
        return get_display(reshaped)
    except Exception:
        return text_str


# ==============================================================================
# 2. ترقيم الصفحات والترويسة والتذييل المعتمد (Custom Numbered Canvas)
# ==============================================================================

class SafaqatNumberedCanvas(canvas.Canvas):
    """كانفاس يتيح حساب إجمالي الصفحات ورسم التذييل والترويسة الرسمية"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_decorations(self, page_count):
        self.saveState()
        font_name = "ArabicRegular" if _FONTS_REGISTERED else "Helvetica"
        bold_name = "ArabicBold" if _FONTS_REGISTERED else "Helvetica-Bold"

        # 1. إطار خفيف للصفحة
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.rect(26, 26, 543, 790, stroke=1, fill=0)

        # 2. خط تذييل الصفحة
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.75)
        self.line(36, 42, 559, 42)

        # 3. محتوى التذييل
        self.setFont(font_name, 7.5)
        self.setFillColor(colors.HexColor("#64748b"))

        # اليمين: المرجعية القانونية واسم المنصة
        legal_text = ar("منصة «صفقات ذكية» الموحدة — وثيقة رقمية معتمدة وفق القانون 23-12 والمرسوم الرئاسي 15-247")
        self.drawRightString(555, 30, legal_text)

        # اليسار: رقم الصفحة
        page_text = ar(f"صفحة {self._pageNumber} من {page_count}")
        self.drawString(40, 30, page_text)

        self.restoreState()


# ==============================================================================
# 3. إعداد الأنماط الطباعية (Styles Factory)
# ==============================================================================

def get_pdf_styles():
    ensure_arabic_fonts()
    regular_font = "ArabicRegular" if _FONTS_REGISTERED else "Helvetica"
    bold_font = "ArabicBold" if _FONTS_REGISTERED else "Helvetica-Bold"

    base_styles = getSampleStyleSheet()

    styles = {
        "HeaderRepublic": ParagraphStyle(
            "HeaderRepublic",
            parent=base_styles["Normal"],
            fontName=bold_font,
            fontSize=11,
            leading=15,
            alignment=1,  # Center
            textColor=colors.HexColor("#0f172a"),
        ),
        "HeaderSub": ParagraphStyle(
            "HeaderSub",
            parent=base_styles["Normal"],
            fontName=regular_font,
            fontSize=9.5,
            leading=13,
            alignment=1,
            textColor=colors.HexColor("#334155"),
        ),
        "DocTitle": ParagraphStyle(
            "DocTitle",
            parent=base_styles["Normal"],
            fontName=bold_font,
            fontSize=13,
            leading=17,
            alignment=1,
            textColor=colors.HexColor("#1e3a8a"),
        ),
        "DocSubtitle": ParagraphStyle(
            "DocSubtitle",
            parent=base_styles["Normal"],
            fontName=regular_font,
            fontSize=8.5,
            leading=12,
            alignment=1,
            textColor=colors.HexColor("#475569"),
        ),
        "SectionHeading": ParagraphStyle(
            "SectionHeading",
            parent=base_styles["Normal"],
            fontName=bold_font,
            fontSize=10.5,
            leading=14,
            alignment=2,  # Right
            textColor=colors.HexColor("#1e3a8a"),
        ),
        "BodyText": ParagraphStyle(
            "BodyText",
            parent=base_styles["Normal"],
            fontName=regular_font,
            fontSize=8.5,
            leading=12.5,
            alignment=2,  # Right
            textColor=colors.HexColor("#1e293b"),
        ),
        "BodyBold": ParagraphStyle(
            "BodyBold",
            parent=base_styles["Normal"],
            fontName=bold_font,
            fontSize=8.5,
            leading=12.5,
            alignment=2,  # Right
            textColor=colors.HexColor("#0f172a"),
        ),
        "Preamble": ParagraphStyle(
            "Preamble",
            parent=base_styles["Normal"],
            fontName=regular_font,
            fontSize=8.5,
            leading=13,
            alignment=2,  # Right
            textColor=colors.HexColor("#334155"),
        ),
        "TableCell": ParagraphStyle(
            "TableCell",
            parent=base_styles["Normal"],
            fontName=regular_font,
            fontSize=8,
            leading=11,
            alignment=1,  # Center
            textColor=colors.HexColor("#0f172a"),
        ),
        "TableCellRight": ParagraphStyle(
            "TableCellRight",
            parent=base_styles["Normal"],
            fontName=regular_font,
            fontSize=8,
            leading=11,
            alignment=2,  # Right
            textColor=colors.HexColor("#0f172a"),
        ),
        "TableHeader": ParagraphStyle(
            "TableHeader",
            parent=base_styles["Normal"],
            fontName=bold_font,
            fontSize=8.5,
            leading=11,
            alignment=1,  # Center
            textColor=colors.white,
        ),
        "MetaLabel": ParagraphStyle(
            "MetaLabel",
            parent=base_styles["Normal"],
            fontName=bold_font,
            fontSize=8,
            leading=11,
            alignment=2,
            textColor=colors.HexColor("#1e3a8a"),
        ),
        "MetaValue": ParagraphStyle(
            "MetaValue",
            parent=base_styles["Normal"],
            fontName=regular_font,
            fontSize=8,
            leading=11,
            alignment=2,
            textColor=colors.HexColor("#0f172a"),
        ),
        "StampText": ParagraphStyle(
            "StampText",
            parent=base_styles["Normal"],
            fontName=regular_font,
            fontSize=7.5,
            leading=10,
            alignment=1,
            textColor=colors.HexColor("#475569"),
        ),

        "StampBold": ParagraphStyle(
            "StampBold",
            parent=base_styles["Normal"],
            fontName=bold_font,
            fontSize=8,
            leading=11,
            alignment=1,
            textColor=colors.HexColor("#0f172a"),
        ),
    }

    # Aliases for template compatibility
    styles["RepubTitle"] = styles["HeaderRepublic"]
    styles["MinistrySub"] = styles["HeaderSub"]
    styles["SectionH2"] = styles["SectionHeading"]
    styles["BodyNormal"] = styles["BodyText"]
    styles["MetaText"] = styles["MetaValue"]
    styles["MetaBold"] = styles["MetaLabel"]
    styles["DocHeader"] = styles["DocTitle"]
    styles["SubHeader"] = styles["DocSubtitle"]

    return styles

build_safaqat_styles = get_pdf_styles



# ==============================================================================
# 4. توليد محضر جلسة فتح الأظرفة العلنية (Opening Session Minutes PDF)
# ==============================================================================

def generate_opening_session_pdf(session, requesting_user) -> bytes:
    """
    توليد محضر جلسة فتح الأظرفة العلنية بصيغة PDF قابلة للطباعة والتوقيع
    وفق أحكام المادة 70 وما بعدها من القانون 23-12 والمرسوم الرئاسي 15-247.
    """
    ensure_arabic_fonts()
    styles = get_pdf_styles()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=48,
    )

    story = []

    tender = session.tender
    authority = tender.authority
    authority_title = authority.organization_name or authority.display_name or "المصلحة المتعاقدة"

    # 1. الترويسة الرسمية للجمهورية
    story.append(Paragraph(ar("الجمهورية الجزائرية الديمقراطية الشعبية"), styles["HeaderRepublic"]))
    story.append(Paragraph(ar("وزارة المالية — المرصد الوطني للطلب العمومي والصفقات"), styles["HeaderSub"]))
    story.append(Paragraph(ar(f"المصلحة المتعاقدة: {authority_title}"), styles["HeaderSub"]))
    if tender.wilaya:
        story.append(Paragraph(ar(f"ولاية: {tender.wilaya}"), styles["HeaderSub"]))
    story.append(Spacer(1, 10))

    # 2. بطاقة العنوان المعتمد
    title_data = [
        [
            Paragraph(ar("محضر جلسة فتح الأظرفة العلنية (عروض المتعهدين)"), styles["DocTitle"]),
        ],
        [
            Paragraph(
                ar("سنداً للمادة 70 وما بعدها من القانون 23-12 والمادة 72 من المرسوم الرئاسي 15-247"),
                styles["DocSubtitle"],
            ),
        ],
    ]
    title_table = Table(title_data, colWidths=[523])
    title_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(title_table)
    story.append(Spacer(1, 10))

    # 3. جدول البيانات الأساسية للصفقة والجلسة
    def fmt_dt(dt):
        if not dt:
            return "—"
        try:
            return dt.strftime("%Y/%m/%d %H:%M")
        except Exception:
            return str(dt)

    status_ar = session.get_status_display()
    policy_ar = session.get_access_policy_display()

    meta_rows = [
        [
            Paragraph(ar(tender.reference_number), styles["MetaValue"]),
            Paragraph(ar("الرقم المرجعي للصفقة:"), styles["MetaLabel"]),
            Paragraph(ar(tender.title), styles["MetaValue"]),
            Paragraph(ar("موضوع الصفقة:"), styles["MetaLabel"]),
        ],
        [
            Paragraph(ar(fmt_dt(session.scheduled_at)), styles["MetaValue"]),
            Paragraph(ar("تاريخ الانعقاد المبرمج:"), styles["MetaLabel"]),
            Paragraph(ar(session.location or "المقر الرسمي للمصلحة المتعاقدة"), styles["MetaValue"]),
            Paragraph(ar("مكان انعقاد الجلسة:"), styles["MetaLabel"]),
        ],
        [
            Paragraph(ar(fmt_dt(session.started_at)), styles["MetaValue"]),
            Paragraph(ar("وقت الافتتاح الفعلي:"), styles["MetaLabel"]),
            Paragraph(ar(fmt_dt(session.ended_at)), styles["MetaValue"]),
            Paragraph(ar("وقت الاختتام الفعلي:"), styles["MetaLabel"]),
        ],
        [
            Paragraph(ar(f"{session.opened_count} عرض من أصل {session.total_offers}"), styles["MetaValue"]),
            Paragraph(ar("العروض المفتوحة:"), styles["MetaLabel"]),
            Paragraph(ar(f"{status_ar} ({policy_ar})"), styles["MetaValue"]),
            Paragraph(ar("حالة الجلسة والسياسة:"), styles["MetaLabel"]),
        ],
    ]
    meta_table = Table(meta_rows, colWidths=[150, 110, 160, 103])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ffffff")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # 4. ديباجة وقائع الجلسة
    preamble_text = (
        "في اليوم والتاريخ والمكان المحددين أعلاه، اجتمعت لجنة فتح الأظرفة وتقييم العروض المنشأة قانوناً لدى المصلحة المتعاقدة، "
        "بحضور ممثلي المصلحة والمتعهدين المشاركين، حضورياً أو عبر الفضاء الرقمي المباشر لمنصة «صفقات ذكية». "
        "وبعد التحقق من استيفاء الآجال القانونية لإيداع العروض وسلامة التشفير والأختام الرقمية الزمنية، شرعت اللجنة في فتح أظرفة العروض تباعاً "
        "وقراءة المبالغ المالية علناً وتدوين التحفظات وفقاً لأحكام القانون، حيث سُجلت الوقائع كالتالي:"
    )
    story.append(Paragraph(ar(preamble_text), styles["Preamble"]))
    story.append(Spacer(1, 10))

    # 5. جدول وقائع العروض المفتوحة
    story.append(Paragraph(ar("جدول العروض المالية والقرارات المبدئية للجنة"), styles["SectionHeading"]))
    story.append(Spacer(1, 4))

    # ترويسة الجدول (من اليمين لليسار: الرقم | اسم المتعهد | وقت الإيداع | المبلغ المعلن | القرار | ملاحظات)
    table_data = [[
        Paragraph(ar("ملاحظات وتحفظات اللجنة"), styles["TableHeader"]),
        Paragraph(ar("القرار المبدئي"), styles["TableHeader"]),
        Paragraph(ar("المبلغ المالي المعلن (د.ج)"), styles["TableHeader"]),
        Paragraph(ar("ختم الإيداع الرقمي"), styles["TableHeader"]),
        Paragraph(ar("هوية المتعامل الاقتصادي"), styles["TableHeader"]),
        Paragraph(ar("الرقم"), styles["TableHeader"]),
    ]]

    events = session.events.select_related("offer", "offer__operator").order_by("order", "created_at")
    
    is_operator = getattr(requesting_user, "role", None) == "operator" and not requesting_user.is_staff

    count = 0
    for ev in events:
        if ev.event_type not in ["offer_opened", "offer_rejected"]:
            continue
        count += 1
        order_num = ev.order or count
        
        # حماية البيانات (قانون 18-07): حجب هوية المنافسين إذا كان الطالب متعهداً
        bidder_name = "متعهد مشارك"
        if ev.offer and ev.offer.operator:
            op = ev.offer.operator
            if is_operator and op.id != requesting_user.id:
                bidder_name = "متعامل منافس (محجوب - القانون 18-07)"
            else:
                bidder_name = op.organization_name or op.display_name or op.email
        
        # التاريخ
        deposit_time = "—"
        if ev.offer and ev.offer.submission_timestamp:
            deposit_time = ev.offer.submission_timestamp.strftime("%Y/%m/%d %H:%M")
        elif ev.created_at:
            deposit_time = ev.created_at.strftime("%Y/%m/%d %H:%M")

        # المبلغ
        price_str = "—"
        if ev.announced_price is not None:
            price_str = f"{float(ev.announced_price):,.2f}"

        # القرار
        decision = "مقبول مبدئياً" if ev.is_accepted else "مرفوض لعدم المطابقة"
        notes = ev.notes or "استوفى الشروط الشكلية" if ev.is_accepted else (ev.notes or "مرفوض")

        row = [
            Paragraph(ar(notes), styles["TableCellRight"]),
            Paragraph(ar(decision), styles["TableCell"]),
            Paragraph(ar(price_str), styles["TableCell"]),
            Paragraph(ar(deposit_time), styles["TableCell"]),
            Paragraph(ar(bidder_name), styles["TableCellRight"]),
            Paragraph(ar(str(order_num)), styles["TableCell"]),
        ]
        table_data.append(row)

    if count == 0:
        table_data.append([
            Paragraph(ar("لا توجد وقائع مسجلة أو أظرفة مفتوحة بعد في هذه الجلسة"), styles["TableCellRight"]),
            Paragraph(ar("—"), styles["TableCell"]),
            Paragraph(ar("—"), styles["TableCell"]),
            Paragraph(ar("—"), styles["TableCell"]),
            Paragraph(ar("—"), styles["TableCell"]),
            Paragraph(ar("1"), styles["TableCell"]),
        ])

    events_table = Table(table_data, colWidths=[120, 80, 95, 80, 120, 28])
    events_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#ffffff"), colors.HexColor("#f8fafc")]),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(events_table)
    story.append(Spacer(1, 14))

    # 6. البصمة الرقمية وبيانات التحقق الأمني
    raw_hash_source = f"{session.id}:{session.status}:{session.opened_count}:{session.tender.reference_number}"
    digest_sha256 = hashlib.sha256(raw_hash_source.encode("utf-8")).hexdigest()

    now_str = timezone.now().strftime("%Y/%m/%d %H:%M:%S UTC")
    audit_data = [
        [
            Paragraph(
                ar(f"البصمة الرقمية للتوثيق (SHA-256 Checksum): {digest_sha256}\n"
                   f"الرمز المرجعي للتحقق الإلكتروني: SAF-PV-{str(session.id).replace('-', '')[:12].upper()} | "
                   f"تاريخ وتوقيت التصدير: {now_str}"),
                styles["StampText"],
            )
        ]
    ]
    audit_table = Table(audit_data, colWidths=[523])
    audit_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#94a3b8")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(audit_table)
    story.append(Spacer(1, 14))

    # 7. خانات التوقيع والاعتماد الرسمي للجنة (Signatures Box)
    sig_headers = [
        Paragraph(ar("ممثل المصلحة المتعاقدة الآمرة بالصرف\n(الاسم، الصفة، الختم والتوقيع)"), styles["StampBold"]),
        Paragraph(ar("كاتب الجلسة ومقرر اللجنة\n(الاسم والصفة والتوقيع)"), styles["StampBold"]),
        Paragraph(ar("رئيس لجنة فتح الأظرفة وتقييم العروض\n(الاسم والصفة، التأشيرة والتوقيع)"), styles["StampBold"]),
    ]
    sig_space = [
        Paragraph(ar("<br/><br/><br/><br/>"), styles["StampText"]),
        Paragraph(ar("<br/><br/><br/><br/>"), styles["StampText"]),
        Paragraph(ar("<br/><br/><br/><br/>"), styles["StampText"]),
    ]
    sig_table = Table([sig_headers, sig_space], colWidths=[174, 174, 175])
    sig_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
        ("GRID", (0, 0), (-1, -1), 0.75, colors.HexColor("#64748b")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    story.append(KeepTogether([sig_table]))

    doc.build(story, canvasmaker=SafaqatNumberedCanvas)
    return buffer.getvalue()



# ==============================================================================
# 5. توليد دفتر الشروط والمواصفات المعتمد (Cahier des Charges PDF)
# ==============================================================================

def generate_cahier_specs_pdf(deal, requesting_user) -> bytes:
    """
    توليد وثيقة دفتر الشروط والمواصفات العامة والتقنية المعتمدة
    وفق دفاتر الشروط النموذجية للقانون 23-12 والمرسوم الرئاسي 15-247.
    """
    ensure_arabic_fonts()
    styles = get_pdf_styles()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=48,
    )

    story = []

    authority = deal.authority
    authority_title = authority.organization_name or authority.display_name or "المصلحة المتعاقدة"

    # الحصول على دفتر الشروط إن وجد
    cahier = getattr(deal, "cahier_specs", None)

    # 1. الترويسة الرسمية
    story.append(Paragraph(ar("الجمهورية الجزائرية الديمقراطية الشعبية"), styles["HeaderRepublic"]))
    story.append(Paragraph(ar("الصفقات العمومية وتفويضات المرفق العام"), styles["HeaderSub"]))
    story.append(Paragraph(ar(f"المصلحة المتعاقدة: {authority_title}"), styles["HeaderSub"]))
    if deal.wilaya:
        story.append(Paragraph(ar(f"ولاية: {deal.wilaya}"), styles["HeaderSub"]))
    story.append(Spacer(1, 10))

    # 2. بطاقة العنوان المعتمد
    title_data = [
        [
            Paragraph(ar("دفتر الشروط والتعليمات للمكتتبين (Cahier des Charges)"), styles["DocTitle"]),
        ],
        [
            Paragraph(
                ar(f"الصفقة العمومية رقم: {deal.reference_number} — موضوع: {deal.title}"),
                styles["DocSubtitle"],
            ),
        ],
    ]
    title_table = Table(title_data, colWidths=[523])
    title_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#1e3a8a")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(title_table)
    story.append(Spacer(1, 12))

    # 3. جدول بطاقة تعريف الصفقة والاعتماد القانوني
    def fmt_val(v):
        if v is None:
            return "غير محدد"
        return f"{float(v):,.2f} د.ج"

    deadline_str = deal.submission_deadline.strftime("%Y/%m/%d %H:%M") if deal.submission_deadline else "حسب الإعلان الرسمي"
    is_validated = cahier.is_validated if cahier else False
    status_label = "مؤشر ومعتمد قانوناً من لجنة الصفقات" if is_validated else "مسودة معتمدة قيد المصادقة النهائية"

    raw_digest = f"{deal.id}:{deal.reference_number}:{is_validated}"
    frozen_digest = hashlib.sha256(raw_digest.encode("utf-8")).hexdigest()

    deal_info = [
        [
            Paragraph(ar(deal.reference_number), styles["MetaValue"]),
            Paragraph(ar("الرقم المرجعي:"), styles["MetaLabel"]),
            Paragraph(ar(authority_title), styles["MetaValue"]),
            Paragraph(ar("المصلحة المتعاقدة:"), styles["MetaLabel"]),
        ],
        [
            Paragraph(ar(fmt_val(deal.estimated_budget)), styles["MetaValue"]),
            Paragraph(ar("المبلغ التقديري:"), styles["MetaLabel"]),
            Paragraph(ar(deal.wilaya or "كامل التراب الوطني"), styles["MetaValue"]),
            Paragraph(ar("الولاية / النطاق:"), styles["MetaLabel"]),
        ],
        [
            Paragraph(ar(deadline_str), styles["MetaValue"]),
            Paragraph(ar("آخر أجل للإيداع:"), styles["MetaLabel"]),
            Paragraph(ar(status_label), styles["MetaValue"]),
            Paragraph(ar("حالة الدفتر:"), styles["MetaLabel"]),
        ],
    ]
    info_table = Table(deal_info, colWidths=[150, 100, 173, 100])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 10))

    # شريط البصمة المشفرة
    digest_table = Table([[
        Paragraph(
            ar(f"البصمة التشفيرية لتجميد دفتر الشروط (SHA-256 Digest): {frozen_digest}\n"
               f"المرجعية النظامية: القانون رقم 23-12 المؤرخ في 5 أوت 2023 والمرسوم الرئاسي رقم 15-247"),
            styles["StampText"],
        )
    ]], colWidths=[523])
    digest_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ecfdf5")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#10b981")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(digest_table)
    story.append(Spacer(1, 12))

    # ديباجة الالتزام بالقانون 23-12
    charter_text = (
        "مبادئ وحرية المنافسة: تلتزم المصلحة المتعاقدة والمتعهدون بالمبادئ الأساسية للطلب العمومي المنصوص عليها في المادة 5 "
        "من القانون 23-12، وتشمل حرية الوصول للطلبات، والمساواة في معاملة المترشحين، وشفافية الإجراءات، مع حظر أي اشتراطات تمييزية أو محددة لعلامات تجارية."
    )
    story.append(Paragraph(ar(charter_text), styles["Preamble"]))
    story.append(Spacer(1, 12))

    # 4. الأقسام الثلاثة لدفتر الشروط
    sections_defs = [
        ("الفصل الأول: الشروط الإدارية والتعاقدية العامة (Clauses Administratives)", cahier.administrative_clauses if cahier else None, [
            ("شروط الأهلية والترشح", "يتعين على كل متعهد تقديم ملف الترشح مستوفياً للسجل التجاري والشهادات الجبائية وشبه الجبائية ومراجع الإنجازات المهنية المماثلة."),
            ("الضمانات البنكية والتأمينات", "يلتزم صاحب الصفقة بتقديم كفالة التعهد عند الإيداع، وكفالة حسن التنفيذ بنسبة 5% من مبلغ الصفقة خلال 30 يوماً من التبليغ بالإسناد، وفقاً للمادة 53 من المرسوم الرئاسي 15-247."),
            ("آجال الإنجاز وغرامات التأخير", "تُحدد مدة التنفيذ بصرامة وفق جدول الأعمال المتفق عليه. تُطبق غرامة تأخير جزائية عن كل يوم تأخير بنسبة محددة قانوناً لا تتجاوز السقف الإجمالي للمرسوم 15-247."),
            ("طريقة الدفع والتسوية المالية", "يتم تسديد المستحقات بناءً على كشوف الحساب الدورية والتقارير المعتمدة من رئيس المشروع، في أجل أقصاه 30 يوماً من المصادقة."),
        ]),
        ("الفصل الثاني: المتطلبات الفنية والمواصفات التقنية (Spécifications Techniques)", cahier.technical_requirements if cahier else None, [
            ("نطاق وموضوع الأشغال أو التوريدات", f"يشمل نطاق المشروع تنفيذ كافة البنود والمتطلبات المتعلقة بـ «{deal.title}» وفق المواصفات القياسية الجزائرية والدولية المعمول بها."),
            ("المعايير والمطابقة التقنية", "يتعين أن تتطابق جميع المواد والتجهيزات المستخدمة مع المواصفات الفنية الوطنية الصادرة عن المعهد الجزائري للتقييس (IANOR)."),
            ("مراقبة الجودة والتجارب الفنية", "تخضع كافة مراحل التنفيذ للتجارب المخبرية والفحص الدوري تحت إشراف هيئة المراقبة التقنية المعتمدة."),
            ("التسليم والاستلام المؤقت والنهائي", "يتم الاستلام المؤقت بعد التحقق الميداني من خلو الأشغال من أي عيوب، وتبدأ منه فترة الضمان التعاقدية لمدة 12 شهراً قبل الاستلام النهائي."),
        ]),
        ("الفصل الثالث: معايير التقييم المالي ومنهجية التنقيط (Critères d'Évaluation)", cahier.financial_criteria if cahier else None, [
            ("منهجية الفحص والتنقيط", "تخضع العروض للفحص الإداري والتقني على أساس سلم تنقيط من 100 نقطة، ويُقصى كل عرض يحصل على أقل من الحد الأدنى التأهيلي."),
            ("معيار الإسناد والمقارنة", "يتم اختيار العرض الأقل ثمناً من بين العروض التقنية المؤهلة المقبولة، أو العرض الأفضل اقتصادياً بحسب طبيعة الصفقة."),
            ("صيغة مراجعة وتعديل الأسعار", "تطبق صيغة المراجعة المنصوص عليها في الملحق المالي وفق مؤشرات الأسعار الوطنية الصادرة عن الهيئات الرسمية للإحصاء."),
        ]),
    ]

    for title, custom_data, defaults in sections_defs:
        story.append(Paragraph(ar(title), styles["SectionHeading"]))
        story.append(Spacer(1, 4))

        # إذا كانت هناك بنود مخصصة في الحقل JSONField
        rendered_any = False
        if custom_data:
            if isinstance(custom_data, dict):
                for k, v in custom_data.items():
                    k_str = str(k).replace("_", " ").title()
                    v_str = str(v)
                    story.append(Paragraph(ar(f"• {k_str}:"), styles["BodyBold"]))
                    story.append(Paragraph(ar(v_str), styles["BodyText"]))
                    story.append(Spacer(1, 3))
                    rendered_any = True
            elif isinstance(custom_data, list):
                for item in custom_data:
                    if isinstance(item, dict):
                        t_item = item.get("title") or item.get("code") or "بند تعاقدي"
                        c_item = item.get("content") or item.get("description") or ""
                        story.append(Paragraph(ar(f"• {t_item}:"), styles["BodyBold"]))
                        story.append(Paragraph(ar(c_item), styles["BodyText"]))
                        story.append(Spacer(1, 3))
                        rendered_any = True

        if not rendered_any:
            for clause_title, clause_body in defaults:
                story.append(Paragraph(ar(f"• {clause_title}:"), styles["BodyBold"]))
                story.append(Paragraph(ar(clause_body), styles["BodyText"]))
                story.append(Spacer(1, 3))

        story.append(Spacer(1, 8))

    # 5. خانات التأشير والاعتماد الرسمي (Signature & Visa Box)
    sig_headers = [
        Paragraph(ar("تأشيرة لجنة الصفقات العمومية المختصة\n(التاريخ ورقم التأشيرة والختم)"), styles["StampBold"]),
        Paragraph(ar("المصلحة المتعاقدة الآمرة بالصرف\n(الاعتماد، الختم والتوقيع الرسمي)"), styles["StampBold"]),
    ]
    sig_space = [
        Paragraph(ar("<br/><br/><br/><br/>"), styles["StampText"]),
        Paragraph(ar("<br/><br/><br/><br/>"), styles["StampText"]),
    ]
    sig_table = Table([sig_headers, sig_space], colWidths=[261, 262])
    sig_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
        ("GRID", (0, 0), (-1, -1), 0.75, colors.HexColor("#64748b")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    story.append(KeepTogether([sig_table]))

    doc.build(story, canvasmaker=SafaqatNumberedCanvas)
    return buffer.getvalue()


def generate_avenant_pdf(avenant, user=None) -> bytes:
    """
    توليد وثيقة الملحق التعاقدي الرسمي (Avenant Contractuel) بصيغة PDF
    وفقاً لأحكام المرسوم الرئاسي 15-247 (المادتان 138 و139) والقانون 23-12.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=40,
        title=f"Avenant_{avenant.reference}",
        author="Safaqat Dhakia Platform",
    )

    styles = build_safaqat_styles()
    deal = avenant.deal
    story = []

    # 1. الترويسة الرسمية للجمهورية
    story.append(Paragraph(ar("الجمهورية الجزائرية الديمقراطية الشعبية"), styles["RepubTitle"]))
    story.append(Paragraph(ar("وزارة المالية — المنظومة الوطنية للصفقات العمومية"), styles["MinistrySub"]))
    auth_name = getattr(deal.authority, 'entity_name', None) or getattr(deal.authority, 'full_name', None) or 'المصلحة المتعاقدة'
    story.append(Paragraph(ar(f"المصلحة المتعاقدة: {auth_name}"), styles["BodyBold"]))
    story.append(Spacer(1, 10))

    # 2. عنوان الوثيقة وشارة السند القانوني
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#006233"), spaceAfter=8))
    story.append(Paragraph(ar(f"ملحق تعاقدي رسمي رقم: {avenant.reference}"), styles["DocHeader"]))
    story.append(Paragraph(ar("وفقاً لأحكام المادتين 138 و139 من المرسوم الرئاسي 15-247 والقانون رقم 23-12"), styles["SubHeader"]))
    story.append(Spacer(1, 10))

    # 3. جدول بيانات الصفقة الأصلية والملحق
    deal_base = deal.base_amount
    amt_change = avenant.amount_change
    pct = avenant.percentage_impact

    info_data = [
        [Paragraph(ar(f"<b>الصفقة الأصلية:</b> {deal.reference_number}"), styles["BodyText"]), Paragraph(ar(f"<b>الولاية:</b> {deal.wilaya or 'الجزائر'}"), styles["BodyText"])],
        [Paragraph(ar(f"<b>موضوع الصفقة:</b> {deal.title}"), styles["BodyText"]), Paragraph(ar(f"<b>المبلغ الأصلي:</b> {deal_base:,.2f} دج"), styles["BodyText"])],
        [Paragraph(ar(f"<b>رقم الملحق:</b> {avenant.reference}"), styles["BodyBold"]), Paragraph(ar(f"<b>تاريخ التحرير:</b> {avenant.created_at.strftime('%Y-%m-%d')}"), styles["BodyText"])],
        [Paragraph(ar(f"<b>الأثر المالي للملحق:</b> {amt_change:,.2f} دج"), styles["BodyBold"]), Paragraph(ar(f"<b>نسبة الأثر المالي:</b> {pct:.2f}%"), styles["BodyBold"])],
        [Paragraph(ar(f"<b>تمديد الآجال التعاقدية:</b> {avenant.time_extension_days} يوماً"), styles["BodyText"]), Paragraph(ar(f"<b>حالة الملحق:</b> {avenant.get_status_display()}"), styles["BodyText"])],
        [Paragraph(ar(f"<b>مرجع موافقة لجنة الصفقات:</b> {avenant.committee_approval_ref or 'قيد الاستيفاء'}"), styles["BodyBold"]), Paragraph(ar(f"<b>تاريخ المصادقة:</b> {avenant.approved_at.strftime('%Y-%m-%d') if avenant.approved_at else 'قيد الاعتماد'}"), styles["BodyText"])],
    ]

    t_info = Table(info_data, colWidths=[261, 262])
    t_info.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 12))

    # 4. أسباب ومبررات الملحق
    story.append(Paragraph(ar("الأسباب والمبررات التقنية والإدارية للملحق:"), styles["SectionTitle"]))
    story.append(Paragraph(ar(avenant.reason or "لا توجد تفاصيل إضافية مسجلة."), styles["BodyText"]))
    story.append(Spacer(1, 14))

    # 5. التعهد والرقابة القانونية على الحدود
    legal_text = (
        f"تشهد المصلحة المتعاقدة بأن هذا الملحق التعاقدي لا يتجاوز الحدود القصوى المنصوص عليها في المادتين 138 و139 "
        f"من المرسوم الرئاسي 15-247 (سقف 20% أو 25% من المبلغ الأصلي)، حيث بلغت النسبة التراكمية لملاحق هذه الصفقة "
        f"{deal.total_avenant_percentage:.2f}% من المبلغ الأصلي."
    )
    story.append(Paragraph(ar(legal_text), styles["StampText"]))
    story.append(Spacer(1, 15))

    # 6. خانات التوقيع والمصادقة
    sig_headers = [
        Paragraph(ar("تأشيرة ومصادقة لجنة الصفقات العمومية المختصة"), styles["StampBold"]),
        Paragraph(ar("المصلحة المتعاقدة (الآمر بالصرف)"), styles["StampBold"]),
    ]
    sig_space = [
        Paragraph(ar("<br/><br/><br/>مرجع: " + (avenant.committee_approval_ref or "........................")), styles["StampText"]),
        Paragraph(ar("<br/><br/><br/>الختم والتوقيع: ........................"), styles["StampText"]),
    ]
    sig_table = Table([sig_headers, sig_space], colWidths=[261, 262])
    sig_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
        ("GRID", (0, 0), (-1, -1), 0.75, colors.HexColor("#64748b")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(KeepTogether([sig_table]))

    doc.build(story, canvasmaker=SafaqatNumberedCanvas)
    return buffer.getvalue()




def generate_legal_notice_pdf(notice, user=None) -> bytes:
    """
    توليد وثيقة الإعذار القانوني الرسمي (Mise en Demeure Officielle) بصيغة PDF
    وفقاً لأحكام المرسوم الرئاسي 15-247 (المادتان 147 و148) والقانون 23-12 (المادة 67).
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=40,
        title=f"MiseEnDemeure_{notice.reference}",
        author="Safaqat Dhakia Platform",
    )

    styles = get_pdf_styles()
    deal = notice.deal
    story = []

    # 1. الترويسة الرسمية للجمهورية
    story.append(Paragraph(ar("الجمهورية الجزائرية الديمقراطية الشعبية"), styles["HeaderRepublic"]))
    story.append(Paragraph(ar("وزارة المالية — المنظومة الوطنية الرقمية للصفقات العمومية"), styles["HeaderSub"]))
    auth_name = getattr(deal.authority, 'entity_name', None) or getattr(deal.authority, 'full_name', None) or 'المصلحة المتعاقدة'
    story.append(Paragraph(ar(f"المصلحة المتعاقدة: {auth_name}"), styles["BodyBold"]))
    story.append(Spacer(1, 10))

    # 2. خط فاصل وعنوان الإعذار الرسمي
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#991b1b"), spaceAfter=10))

    banner_style = ParagraphStyle(
        "NoticeBanner",
        parent=styles["DocTitle"],
        textColor=colors.HexColor("#991b1b"),
        fontSize=15,
        leading=20,
    )
    story.append(Paragraph(ar("إعــذار رسـمـي (MISE EN DEMEURE)"), banner_style))
    story.append(Paragraph(
        ar(f"رقم الإعذار: {notice.reference} — تبليغ رسمي لتدارك التأخر والإخلال بالالتزامات"),
        styles["MetaValue"]
    ))
    story.append(Spacer(1, 10))

    # 3. الأسانيد والمراجع القانونية الآمرة (فقرات منفصلة)
    story.append(Paragraph(ar("• بمقتضى القانون رقم 23-12 المؤرخ في 5 أوت 2023 المحدد للقواعد العامة للصفقات العمومية، لا سيما المادة 67 (التبليغ الإلكتروني والإخطارات الرسمية)؛"), styles["MetaValue"]))
    story.append(Paragraph(ar("• بمقتضى المرسوم الرئاسي رقم 15-247 المؤرخ في 16 سبتمبر 2015 المنظم للصفقات العمومية، لا سيما المادتين 147 و148 (آجال الإعذار، غرامات التأخير اليومية، والفسخ)؛"), styles["MetaValue"]))
    story.append(Paragraph(ar("• وبناءً على أحكام دفتر الشروط والعقد المبرم والتقارير الميدانية المثبتة لمعاينة الورشة."), styles["MetaValue"]))
    story.append(Spacer(1, 10))

    # 4. جدول المعطيات والطرف المعني
    operator_name = ""
    try:
        if hasattr(deal, 'contract') and deal.contract and deal.contract.awarded_operator:
            op = deal.contract.awarded_operator
            operator_name = getattr(op, 'company_name', None) or getattr(op, 'full_name', None) or op.email
        elif deal.procurement_contracts.exists():
            contract = deal.procurement_contracts.first()
            if contract and contract.operator:
                operator_name = getattr(contract.operator, 'company_name', None) or getattr(contract.operator, 'full_name', None) or contract.operator.email
    except Exception:
        pass
    if not operator_name:
        operator_name = "المتعامل الاقتصادي المتعاقد"

    table_data = [
        [Paragraph(ar("الصفقة العمومية المعنية:"), styles["MetaLabel"]), Paragraph(ar(f"{deal.reference_number} — {deal.title}"), styles["MetaValue"])],
        [Paragraph(ar("المتعامل الموجه إليه الإعذار:"), styles["MetaLabel"]), Paragraph(ar(operator_name), styles["MetaValue"])],
        [Paragraph(ar("طبيعة المخالفة المسجلة:"), styles["MetaLabel"]), Paragraph(ar(notice.get_notice_type_display()), styles["MetaValue"])],
        [Paragraph(ar("تاريخ التبليغ الرسمي:"), styles["MetaLabel"]), Paragraph(ar(str(notice.issued_date)), styles["MetaValue"])],
        [Paragraph(ar("المهلة القانونية الممنوحة:"), styles["MetaLabel"]), Paragraph(ar(f"{notice.legal_deadline_days} يوماً تقويمياً (تاريخ الانتهاء: {notice.deadline_date})"), styles["MetaValue"])],
        [Paragraph(ar("الوضعية الحالية:"), styles["MetaLabel"]), Paragraph(ar(notice.get_status_display()), styles["MetaValue"])],
    ]

    info_table = Table(table_data, colWidths=[160, 363])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#fef2f2")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fecaca")),
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 12))

    # 5. الحيثيات ونص الإعذار الرسمي
    story.append(Paragraph(ar("حيثيات الإعذار والوقائع المعاينة:"), styles["SectionHeading"]))
    reason_lines = str(notice.reason).split('\n')
    for r_line in reason_lines:
        if r_line.strip():
            story.append(Paragraph(ar(r_line.strip()), styles["BodyText"]))
            story.append(Spacer(1, 2))
    story.append(Spacer(1, 10))

    # 6. التنبيه القانوني الصارم والآثار المترتبة
    penalties_box_title = Paragraph(ar("الآثار القانونية والمالية المترتبة في حال عدم الامتثال:"), styles["StampBold"])
    penalties_lines = [
        Paragraph(ar(f"يُلزم المتعامل باتخاذ التدابير الفورية الكفيلة بتدارك التأخر خلال المهلة المحددة أعلاه ({notice.legal_deadline_days} يوماً)."), styles["StampText"]),
        Paragraph(ar("وفي حال انقضاء هذه المهلة دون تسوية مقبولة:"), styles["StampText"]),
        Paragraph(ar("1. تُطبّق تلقائياً غرامات التأخير اليومية بنسبة 1/1000 من المبلغ الإجمالي للصفقة لكل يوم تأخير وفق المادة 147 من المرسوم الرئاسي 15-247 (سقف 10%)."), styles["StampText"]),
        Paragraph(ar("2. يحق للمصلحة المتعاقدة الشروع الفوري في إجراءات الفسخ التعاقدي على عاتق المتعامل (Résiliation aux torts exclusifs) وفق المادة 148."), styles["StampText"]),
    ]
    penalties_content = [penalties_box_title] + penalties_lines
    penalties_table = Table([[item] for item in penalties_content], colWidths=[523])
    penalties_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fff1f2")),
        ("BOX", (0, 0), (-1, -1), 1.2, colors.HexColor("#e11d48")),
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(penalties_table)
    story.append(Spacer(1, 14))

    # 7. التوقيعات والأختام الرقمية
    sig_headers = [
        Paragraph(ar("المتعامل الاقتصادي (تأكيد الاستلام والاطلاع)"), styles["StampBold"]),
        Paragraph(ar("المصلحة المتعاقدة (الآمر بالصرف)"), styles["StampBold"]),
    ]
    ack_text = f"تم الاستلام: {notice.acknowledged_at.strftime('%Y-%m-%d %H:%M')}" if notice.acknowledged_at else "قيد التبليغ عبر المنصة الرقمية"
    sig_space = [
        Paragraph(ar(f"المتعامل المقر بالاستلام: {ack_text}"), styles["StampText"]),
        Paragraph(ar(f"ختم وتوقيع الآمر بالصرف — مؤشر إلكترونياً بتاريخ: {notice.issued_date}"), styles["StampText"]),
    ]
    sig_table = Table([sig_headers, sig_space], colWidths=[261, 262])
    sig_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("GRID", (0, 0), (-1, -1), 0.75, colors.HexColor("#64748b")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(KeepTogether([sig_table]))

    doc.build(story, canvasmaker=SafaqatNumberedCanvas)
    return buffer.getvalue()



def generate_administrative_injunction_pdf(injunction, user=None) -> bytes:
    """
    توليد وثيقة الإعذار الإداري الرقابي الرسمي (Injonction Administrative de Contrôle)
    الصادر عن الإدارة المركزية (المفتشية العامة للرقابة) وفقاً للقانون 23-12 والمرسوم 15-247.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=40,
        title=f"Injonction_{injunction.reference}",
        author="Safaqat Dhakia Central Oversight",
    )

    styles = get_pdf_styles()
    story = []

    # 1. الترويسة الرسمية للجمهورية والإدارة المركزية
    story.append(Paragraph(ar("الجمهورية الجزائرية الديمقراطية الشعبية"), styles["HeaderRepublic"]))
    story.append(Paragraph(ar("وزارة المالية — المفتشية العامة للصفقات العمومية وتفويضات المرفق العام"), styles["HeaderSub"]))
    story.append(Paragraph(ar("المنظومة المركزية للرقابة والنزاهة التعاقدية"), styles["BodyBold"]))
    story.append(Spacer(1, 8))

    # 2. خط أحمر فاصل وعنوان الإعذار الرقابي
    story.append(HRFlowable(width="100%", thickness=2.5, color=colors.HexColor("#7f1d1d"), spaceAfter=10))

    banner_style = ParagraphStyle(
        "InjunctionBanner",
        parent=styles["DocTitle"],
        textColor=colors.HexColor("#991b1b"),
        fontSize=15,
        leading=20,
    )
    story.append(Paragraph(ar("إعـذار إداري رقـابـي مـلـزم (INJONCTION ADMINISTRATIVE)"), banner_style))
    story.append(Paragraph(
        ar(f"الرقم المرجعي المركزي: {injunction.reference} — أمر بتدارك وتصحيح المخالفات القانونية"),
        styles["MetaValue"]
    ))
    story.append(Spacer(1, 10))

    # 3. الأسانيد القانونية الآمرة
    story.append(Paragraph(ar("• بمقتضى القانون رقم 23-12 المؤرخ في 5 أوت 2023 المحدد للقواعد العامة للصفقات العمومية، لا سيما المواد 13 (حظر تجزئة الصفقات)، 67 (التبليغ الإلكتروني)، و75 (إقصاء المخالفين)؛"), styles["MetaValue"]))
    story.append(Paragraph(ar("• بمقتضى المرسوم الرئاسي رقم 15-247 المؤرخ في 16 سبتمبر 2015 المنظم للصفقات العمومية، لا سيما المادتين 138 و139 (ضوابط الملاحق)؛"), styles["MetaValue"]))
    story.append(Paragraph(ar("• وبناءً على مخرجات التدقيق الرقابي الآلي والتحريات المنجزة عبر منظومة الرقابة المركزية."), styles["MetaValue"]))
    story.append(Spacer(1, 10))

    # 4. جدول بيانات المصلحة والصفقة المعنية
    auth = injunction.authority
    auth_name = getattr(auth, 'organization_name', None) or getattr(auth, 'entity_name', None) or getattr(auth, 'full_name', None) or auth.email
    deal_info = f"{injunction.deal.reference_number} — {injunction.deal.title}" if injunction.deal else "مخالفة عامة غير مقترنة بصفقة واحدة"

    table_data = [
        [Paragraph(ar("المصلحة المتعاقدة المستهدفة:"), styles["MetaLabel"]), Paragraph(ar(auth_name), styles["MetaValue"])],
        [Paragraph(ar("الولاية / النطاق الإقليمي:"), styles["MetaLabel"]), Paragraph(ar(getattr(auth, 'wilaya', '') or (injunction.deal.wilaya if injunction.deal else 'الجزائر')), styles["MetaValue"])],
        [Paragraph(ar("الصفقة أو المشروع المعني:"), styles["MetaLabel"]), Paragraph(ar(deal_info), styles["MetaValue"])],
        [Paragraph(ar("طبيعة المخالفة المسجلة:"), styles["MetaLabel"]), Paragraph(ar(injunction.get_violation_type_display()), styles["MetaValue"])],
        [Paragraph(ar("السند القانوني المخالف:"), styles["MetaLabel"]), Paragraph(ar(injunction.legal_reference), styles["MetaValue"])],
        [Paragraph(ar("تاريخ صدور الإعذار:"), styles["MetaLabel"]), Paragraph(ar(str(injunction.issued_date)), styles["MetaValue"])],
        [Paragraph(ar("المهلة القانونية الممنوحة:"), styles["MetaLabel"]), Paragraph(ar(f"{injunction.deadline_days} يوماً تقويمياً (تاريخ الانتهاء: {injunction.deadline_date})"), styles["MetaValue"])],
        [Paragraph(ar("الوضعية الرقابية الحالية:"), styles["MetaLabel"]), Paragraph(ar(injunction.get_status_display()), styles["MetaValue"])],
    ]

    info_table = Table(table_data, colWidths=[150, 373])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#fff1f2")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#fecaca")),
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 10))

    # 5. وقائع وحيثيات المخالفة
    if injunction.violation_details:
        story.append(Paragraph(ar("وقائع وحيثيات المخالفة المثبتة لدى الرقابة المركزية:"), styles["SectionHeading"]))
        v_lines = str(injunction.violation_details).split('\n')
        for v_line in v_lines:
            if v_line.strip():
                story.append(Paragraph(ar(v_line.strip()), styles["BodyText"]))
                story.append(Spacer(1, 2))
        story.append(Spacer(1, 8))

    # 6. نص الأمر بالتصحيح والتسوية (Directive Text)
    story.append(Paragraph(ar("الأمر الإداري الآمر بالتصحيح والتسوية الفورية:"), styles["SectionHeading"]))
    d_lines = str(injunction.directive_text).split('\n')
    for d_line in d_lines:
        if d_line.strip():
            story.append(Paragraph(ar(d_line.strip()), styles["BodyBold"]))
            story.append(Spacer(1, 2))
    story.append(Spacer(1, 10))

    # 7. التنبيه القانوني بالإحالة للقضاء ومجلس المحاسبة
    warning_box_title = Paragraph(ar("الإنذار الصارم بالآثار القضائية والمحاسبية المترتبة:"), styles["StampBold"])
    warning_box_lines = [
        Paragraph(ar(f"يُلزم السيد الآمر بالصرف باتخاذ كافة التدابير التصحيحية وموافاة الإدارة المركزية بتقرير تصحيحي مفصل خلال مهلة {injunction.deadline_days} يوماً."), styles["StampText"]),
        Paragraph(ar("وفي حال انقضاء هذه المهلة دون تسوية مقبولة قانوناً:"), styles["StampText"]),
        Paragraph(ar("1. يُحال الملف تلقائياً إلى النيابة العامة المختصة إقليمياً للمتابعة القضائية بموجب أحكام القانون 23-12 وقانون الوقاية من الفساد."), styles["StampText"]),
        Paragraph(ar("2. إخطار مجلس المحاسبة (Cour des Comptes) لإعمال تدابير الرقابة البعدية وتحديد المسؤوليات الفردية والمادية."), styles["StampText"]),
    ]
    warning_content = [warning_box_title] + warning_box_lines
    warning_table = Table([[item] for item in warning_content], colWidths=[523])
    warning_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fff1f2")),
        ("BOX", (0, 0), (-1, -1), 1.2, colors.HexColor("#b91c1c")),
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(warning_table)
    story.append(Spacer(1, 12))

    # 8. التوقيع والأختام الرسمية
    sig_headers = [
        Paragraph(ar("المصلحة المتعاقدة الآمرة بالصرف (التسلم والاطلاع الرسمي)"), styles["StampBold"]),
        Paragraph(ar("المفتشية العامة للرقابة والنزاهة (الاعتماد والختم الرقمي)"), styles["StampBold"]),
    ]
    ack_info = f"تم الاستلام: {injunction.acknowledged_at.strftime('%Y-%m-%d %H:%M')}" if injunction.acknowledged_at else "مبلّغ إلكترونياً عبر المنصة الرقمية"
    sig_space = [
        Paragraph(ar(f"<br/><br/>{ack_info}"), styles["StampText"]),
        Paragraph(ar(f"<br/><br/>مفتش الرقابة المركزية<br/>مؤشر رقمياً بتاريخ: {injunction.issued_date}"), styles["StampText"]),
    ]
    sig_table = Table([sig_headers, sig_space], colWidths=[261, 262])
    sig_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("GRID", (0, 0), (-1, -1), 0.75, colors.HexColor("#64748b")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(KeepTogether([sig_table]))

    doc.build(story, canvasmaker=SafaqatNumberedCanvas)
    return buffer.getvalue()



def generate_specs_withdrawal_receipt_pdf(purchase, user=None) -> bytes:
    """
    توليد وصل سحب رقمي رسمي لدفتر الشروط (Reçu de Retrait Dématérialisé du Cahier des Charges)
    وفقاً لأحكام القانون 23-12 والمرسوم الرئاسي 15-247.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=40,
        title=f"Receipt_{purchase.receipt_number or purchase.id}",
        author="Safaqat Dhakia National Procurement Platform",
    )

    styles = get_pdf_styles()
    story = []

    # 1. الترويسة السيادية الرسمية
    story.append(Paragraph(ar("الجمهورية الجزائرية الديمقراطية الشعبية"), styles["HeaderRepublic"]))
    story.append(Paragraph(ar("وزارة المالية — المديرية العامة للصفقات العمومية وتفويضات المرفق العام"), styles["HeaderSub"]))
    story.append(Paragraph(ar("المنظومة الوطنية لإدارة وسحب دفاتر الشروط إلكترونياً (صفقات ذكية)"), styles["BodyBold"]))
    story.append(Spacer(1, 8))

    # 2. خط أخضر/ذهبي فاصل وعنوان الوصل
    story.append(HRFlowable(width="100%", thickness=2.5, color=colors.HexColor("#1b4332"), spaceAfter=10))

    banner_style = ParagraphStyle(
        "ReceiptBanner",
        parent=styles["DocTitle"],
        textColor=colors.HexColor("#1b4332"),
        fontSize=15,
        leading=20,
    )
    story.append(Paragraph(ar("وصـل سـحـب رقـمـي رسـمـي لـدفـتـر الـشـروط"), banner_style))
    story.append(Paragraph(
        ar(f"رقم الوصل: {purchase.receipt_number or 'REC-PENDING'} — إثبات سداد الرسوم القانونية والتأهيل للمشاركة"),
        styles["MetaValue"]
    ))
    story.append(Spacer(1, 10))

    # 3. الأسانيد القانونية
    story.append(Paragraph(ar("• بمقتضى القانون رقم 23-12 المؤرخ في 18 محرم 1445هـ (5 أوت 2023) المحدد للقواعد العامة للصفقات العمومية، لا سيما المادة 67 الخاصة بالرقمنة والتبادل الإلكتروني؛"), styles["MetaValue"]))
    story.append(Paragraph(ar("• بمقتضى المرسوم الرئاسي رقم 15-247 المؤرخ في 16 سبتمبر 2015 المنظم للصفقات العمومية، لا سيما المواد المنظمة لحق سحب دفاتر الشروط وسداد الرسوم المقررة؛"), styles["MetaValue"]))
    story.append(Paragraph(ar("• بناءً على عملية الدفع الإلكتروني المؤكدة عبر بوابة الدفع الوطنية المعتمدة."), styles["MetaValue"]))
    story.append(Spacer(1, 10))

    # 4. جدول بيانات العملية (الصفقة، المصلحة، المتعامل، المعاملة المالية)
    deal = purchase.deal
    operator = purchase.operator
    auth = deal.authority

    auth_name = getattr(auth, 'entity_name', None) or getattr(auth, 'full_name', None) or auth.email
    op_name = getattr(operator, 'organization_name', None) or getattr(operator, 'full_name', None) or operator.email
    op_nif = getattr(operator, 'tax_id', None) or getattr(operator, 'nif', None) or 'مسجل بالنظام'
    op_rc = getattr(operator, 'commercial_register', None) or 'مقيد'
    paid_time_str = purchase.paid_at.strftime('%Y-%m-%d %H:%M:%S') if purchase.paid_at else purchase.created_at.strftime('%Y-%m-%d %H:%M:%S')

    info_data = [
        [
            Paragraph(ar("المصلحة المتعاقدة (صاحبة المشروع):"), styles["MetaLabel"]),
            Paragraph(ar(f"<b>{auth_name}</b>"), styles["MetaValue"]),
        ],
        [
            Paragraph(ar("الرقم المرجعي للصفقة:"), styles["MetaLabel"]),
            Paragraph(ar(deal.reference_number), styles["MetaValue"]),
        ],
        [
            Paragraph(ar("موضوع الصفقة / المشروع:"), styles["MetaLabel"]),
            Paragraph(ar(deal.title), styles["MetaValue"]),
        ],
        [
            Paragraph(ar("المتعامل الاقتصادي (المشتري):"), styles["MetaLabel"]),
            Paragraph(ar(f"<b>{op_name}</b>"), styles["MetaValue"]),
        ],
        [
            Paragraph(ar("المعرف الجبائي (NIF) / السجل التجاري:"), styles["MetaLabel"]),
            Paragraph(ar(f"{op_nif} / {op_rc}"), styles["MetaValue"]),
        ],
        [
            Paragraph(ar("البريد الإلكتروني المعتمد للمتعامل:"), styles["MetaLabel"]),
            Paragraph(operator.email, styles["MetaValue"]),
        ],
        [
            Paragraph(ar("الرسوم المسددة (غير قابلة للاسترداد):"), styles["MetaLabel"]),
            Paragraph(ar(f"<b>{purchase.amount:,.2f} دج</b> ({purchase.payment_method or 'EDAHABIA / CIB'})"), styles["MetaValue"]),
        ],
        [
            Paragraph(ar("بوابة الدفع الإلكتروني والمعاملة:"), styles["MetaLabel"]),
            Paragraph(ar(f"Chargily Pay — معرف المعاملة: {purchase.payment_id or 'CH-MOCK'}"), styles["MetaValue"]),
        ],
        [
            Paragraph(ar("تاريخ وساعة السحب المؤكدة:"), styles["MetaLabel"]),
            Paragraph(paid_time_str, styles["MetaValue"]),
        ],
        [
            Paragraph(ar("الحالة القانونية للوصل:"), styles["MetaLabel"]),
            Paragraph(ar("<b>مؤكد ومقبول نظامياً (QUITUS DE RETRAIT VALIDÉ)</b>"), styles["MetaValue"]),
        ],
    ]

    info_table = Table(info_data, colWidths=[180, 343])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f8fafc")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 12))

    # 5. الشهادة والإقرار القانوني
    cert_style = ParagraphStyle(
        "CertBlock",
        parent=styles["BodyText"],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#1b4332"),
    )
    cert_text = (
        "يشهد هذا الوصل الرقمي الصادر إلكترونياً عن منصة «صفقات ذكية» بأن المتعامل الاقتصادي المذكور أعلاه قد استوفى "
        "سداد الرسوم القانونية المقررة لسحب دفتر الشروط، ويُعتبر مؤهلاً نظامياً وقانونياً لتقديم عرضه والمشاركة "
        "في هذه الصفقة وفق الآجال والشروط المحددة في الإعلان ودفتر الشروط."
    )
    cert_box = Table(
        [[Paragraph(ar(cert_text), cert_style)]],
        colWidths=[523]
    )
    cert_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ecfdf5")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#10b981")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(cert_box)
    story.append(Spacer(1, 14))

    # 6. البصمة الرقمية والختم
    import hashlib
    raw_sig = f"{purchase.receipt_number}:{purchase.deal_id}:{purchase.operator_id}:{purchase.amount}:{paid_time_str}"
    checksum = hashlib.sha256(raw_sig.encode()).hexdigest()

    story.append(Paragraph(ar(f"البصمة الرقمية للتحقق من سلامة الوصل (SHA-256):"), styles["MetaLabel"]))
    story.append(Paragraph(checksum, styles["MetaValue"]))
    story.append(Spacer(1, 10))

    # 7. التوقيع والأختام
    sig_headers = [
        Paragraph(ar("المتعامل الاقتصادي (حامل الوصل)"), styles["StampBold"]),
        Paragraph(ar("المصلحة المتعاقدة والمنصة الرقمية (الاعتماد)"), styles["StampBold"]),
    ]
    sig_content = [
        Paragraph(f"{ar('تم سحب دفتر الشروط إلكترونياً')}<br/>{ar(f'رقم القيد: {purchase.receipt_number}')}", styles["StampText"]),
        Paragraph(f"{ar('معتمد ومسجل بالخزينة')}<br/>{ar(f'بتاريخ: {paid_time_str}')}", styles["StampText"]),
    ]
    sig_table = Table([sig_headers, sig_content], colWidths=[261, 262])
    sig_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("GRID", (0, 0), (-1, -1), 0.75, colors.HexColor("#64748b")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(KeepTogether([sig_table]))

    doc.build(story, canvasmaker=SafaqatNumberedCanvas)
    return buffer.getvalue()

