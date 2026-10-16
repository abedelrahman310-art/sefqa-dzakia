import os
from django.core.exceptions import ValidationError

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_EXTENSIONS = {
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.png',
    '.jpg',
    '.jpeg',
}

DANGEROUS_EXTENSIONS = {
    '.exe',
    '.sh',
    '.bat',
    '.cmd',
    '.vbs',
    '.js',
    '.php',
    '.py',
    '.dll',
    '.so',
    '.bin',
    '.msi',
}


def validate_document_upload(file_obj, max_size=MAX_UPLOAD_SIZE):
    """
    التحقق الصارم من سلامة الوثائق المرفوعة (الملف الإداري، التقني والمالي)
    وفق معايير الأمن السيبراني ومنصة صفقات:
    1. عدم قبول الملفات الفارغة (0 بايت).
    2. عدم تجاوز الحد الأقصى المسموح للحجم (10 ميغابايت افتراضياً).
    3. حظر الملفات التنفيذية والبرمجيات الخبيثة.
    4. قصر الملفات على الامتدادات الوثائقية المعتمدة (.pdf, .docx, إلخ).
    """
    if file_obj is None:
        raise ValidationError("الملف مطلوب.")

    # 1. فحص الحجم
    file_size = getattr(file_obj, 'size', None)
    if file_size is None and hasattr(file_obj, 'read'):
        pos = file_obj.tell() if hasattr(file_obj, 'tell') else 0
        content = file_obj.read()
        file_size = len(content)
        if hasattr(file_obj, 'seek'):
            file_obj.seek(pos)

    if file_size is None or file_size == 0:
        raise ValidationError("لا يمكن إيداع ملف فارغ (0 بايت).")

    if file_size > max_size:
        raise ValidationError(
            f"حجم الملف ({file_size / (1024 * 1024):.2f} ميغابايت) يتجاوز الحد الأقصى المسموح به ({max_size / (1024 * 1024):.0f} ميغابايت)."
        )

    # 2. فحص الامتداد
    filename = getattr(file_obj, 'name', '') or ''
    _, ext = os.path.splitext(filename.lower())

    if not ext:
        raise ValidationError("الملف يجب أن يحتوي على امتداد محدد وصحيح.")

    if ext in DANGEROUS_EXTENSIONS:
        raise ValidationError(f"الملفات ذات الامتداد ({ext}) محظورة لأسباب أمنية.")

    if ext not in ALLOWED_EXTENSIONS:
        allowed_list = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise ValidationError(f"نوع الملف ({ext}) غير مدعوم. الصيغ المسموحة هي: {allowed_list}")

    return True
