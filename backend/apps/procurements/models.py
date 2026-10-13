import uuid
from django.db import models
from django.utils import timezone
from apps.users.models import CustomUser

class ProcurementDeal(models.Model):
    """نموذج الصفقة العمومية وفق القانون 23-12"""
    STAGE_CHOICES = (
        (1, '01 - التخطيط والاحتياج'),
        (2, '02 - إعداد دفتر الشروط'),
        (3, '03 - نشر الإعلان'),
        (4, '04 - استفسارات المتعاملين'),
        (5, '05 - استلام العروض'),
        (6, '06 - الفحص الإداري والفني والمالي'),
        (7, '07 - التقييم والمقارنة'),
        (8, '08 - الإسناد والطعون'),
        (9, '09 - إبرام العقد'),
        (10, '10 - التنفيذ والتعديلات'),
        (11, '11 - الاستلام المؤقت والنهائي'),
        (12, '12 - الأداء والدفع والإغلاق'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference_number = models.CharField('الرقم المرجعي للصفقة', max_length=100, unique=True)
    title = models.CharField('عنوان الصفقة أو المشروع', max_length=255)
    description = models.TextField('الوصف ونطاق الحاجة')
    authority = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='created_deals', verbose_name='المصلحة المتعاقدة')
    
    current_stage = models.IntegerField('المرحلة الحالية', choices=STAGE_CHOICES, default=1)
    estimated_budget = models.DecimalField('المبلغ التقديري (دج)', max_digits=15, decimal_places=2, null=True, blank=True)
    wilaya = models.CharField('الولاية', max_length=100, blank=True)
    
    submission_deadline = models.DateTimeField('آخر أجل لإيداع العروض', null=True, blank=True)
    created_at = models.DateTimeField('تاريخ الإنشاء', default=timezone.now)
    updated_at = models.DateTimeField('تاريخ التحديث', auto_now=True)

    class Meta:
        verbose_name = 'صفقة عمومية'
        verbose_name_plural = 'الصفقات العمومية'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reference_number} - {self.title}"

class CahierSpecs(models.Model):
    """دفتر الشروط الذكي"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal = models.OneToOneField(ProcurementDeal, on_delete=models.CASCADE, related_name='cahier_specs', verbose_name='الصفقة')
    administrative_clauses = models.JSONField('البنود الإدارية والتعاقدية', default=dict)
    technical_requirements = models.JSONField('المتطلبات التقنية والمواصفات', default=dict)
    financial_criteria = models.JSONField('معايير التقييم المالي والتنقيط', default=dict)
    is_validated = models.BooleanField('مؤشر من لجنة الصفقات', default=False)
    created_at = models.DateTimeField('تاريخ الإنشاء', default=timezone.now)

    class Meta:
        verbose_name = 'دفتر الشروط'
        verbose_name_plural = 'دفاتر الشروط'


class OpeningSession(models.Model):
    """
    جلسة فتح الأظرفة العلنية وفق المادة 70 وما بعدها من القانون 23-12.
    تحدد سياسة الحضور والبث المباشر ومجريات فتح العروض.
    """
    STATUS_CHOICES = (
        ('scheduled', 'مبرمجة'),
        ('live', 'جارية'),
        ('ended', 'منتهية'),
        ('cancelled', 'ملغاة'),
    )

    ACCESS_POLICY_CHOICES = (
        ('participants_only', 'المشاركون فقط (القانون 18-07)'),
        ('authority_only', 'المصلحة المتعاقدة فقط'),
        ('public', 'علنية للعموم'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tender = models.OneToOneField(
        ProcurementDeal,
        on_delete=models.CASCADE,
        related_name="opening_session",
        verbose_name="الصفقة",
    )
    scheduled_at = models.DateTimeField('تاريخ وتوقيت الجلسة المبرمج')
    started_at = models.DateTimeField('تاريخ وتوقيت البدء الفعلي', null=True, blank=True)
    ended_at = models.DateTimeField('تاريخ وتوقيت الاختتام الفعلي', null=True, blank=True)
    location = models.CharField('مكان انعقاد الجلسة', max_length=255)
    stream_url = models.URLField('رابط البث المباشر المشفر', blank=True)
    recording_url = models.URLField('رابط تسجيل الجلسة المؤرشف', blank=True)
    status = models.CharField(
        'حالة الجلسة',
        max_length=20,
        choices=STATUS_CHOICES,
        default='scheduled',
    )
    access_policy = models.CharField(
        'سياسة الحضور والاطلاع',
        max_length=30,
        choices=ACCESS_POLICY_CHOICES,
        default='participants_only',
    )
    total_offers = models.IntegerField('إجمالي العروض المستلمة', default=0)
    opened_count = models.IntegerField('عدد العروض المفتوحة', default=0)
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.PROTECT,
        related_name="created_opening_sessions",
        verbose_name="المسؤول المنشئ",
    )
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)

    class Meta:
        verbose_name = 'جلسة فتح أظرفة'
        verbose_name_plural = 'جلسات فتح الأظرفة'
        ordering = ['-scheduled_at']

    def __str__(self):
        return f"جلسة فتح: {self.tender.reference_number} ({self.get_status_display()})"


class SessionAccess(models.Model):
    """
    تصريح الحضور والاطلاع على الجلسة وفق ضوابط حماية البيانات (القانون 18-07).
    يضمن حصر البث والمحاضر على المتعاملين المعنيين فقط.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        OpeningSession,
        on_delete=models.CASCADE,
        related_name="accesses",
        verbose_name="جلسة الفتح",
    )
    operator = models.ForeignKey(
        CustomUser,
        on_delete=models.PROTECT,
        related_name="session_accesses",
        verbose_name="المتعامل الاقتصادي",
    )
    can_view_live = models.BooleanField('متابعة البث المباشر', default=True)
    can_view_recording = models.BooleanField('مشاهدة التسجيل المؤرشف', default=True)
    can_download_minutes = models.BooleanField('تحميل محضر جلسة الفتح', default=True)
    granted_at = models.DateTimeField('تاريخ منح الصلاحية', auto_now_add=True)
    revoked_at = models.DateTimeField('تاريخ سحب الصلاحية', null=True, blank=True)

    class Meta:
        verbose_name = 'صلاحية حضور جلسة'
        verbose_name_plural = 'صلاحيات حضور الجلسات'
        unique_together = [["session", "operator"]]

    def __str__(self):
        return f"صلاحية {self.operator.email} للجلسة ({self.session_id})"


class OpeningEvent(models.Model):
    """
    سجل وقائع وأحداث جلسة الفتح العلنية (فتح الأظرفة، الإعلان عن الأسعار، التحفظات).
    """
    EVENT_TYPE_CHOICES = (
        ('session_started', 'افتتاح وبدء الجلسة'),
        ('offer_opened', 'فتح عرض وإعلان السعر'),
        ('offer_rejected', 'إقصاء أو رفض عرض'),
        ('session_paused', 'تعليق مؤقت للجلسة'),
        ('session_resumed', 'استئناف الجلسة'),
        ('session_ended', 'اختتام الجلسة'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        OpeningSession,
        on_delete=models.CASCADE,
        related_name="events",
        verbose_name="جلسة الفتح",
    )
    offer = models.ForeignKey(
        'bids.BidOffer',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="opening_events",
        verbose_name="العرض المعني",
    )
    event_type = models.CharField(
        'نوع الحدث',
        max_length=30,
        choices=EVENT_TYPE_CHOICES,
    )
    order = models.IntegerField('ترتيب الإعلان أو الفتح', null=True, blank=True)
    announced_price = models.DecimalField(
        'المبلغ المالي المعلن (دج)',
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
    )
    is_accepted = models.BooleanField('مقبول مبدئياً لطور التقييم', default=True)
    notes = models.TextField('ملاحظات وتحفظات اللجنة', blank=True)
    created_at = models.DateTimeField('وقت توثيق الحدث', auto_now_add=True)
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.PROTECT,
        related_name="logged_opening_events",
        verbose_name="موثق الحدث",
    )

    class Meta:
        verbose_name = 'واقعة جلسة الفتح'
        verbose_name_plural = 'وقائع جلسات الفتح'
        ordering = ['created_at']

    def __str__(self):
        return f"حدث {self.get_event_type_display()} - جلسة {self.session_id}"
