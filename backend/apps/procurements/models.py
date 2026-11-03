import uuid
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from apps.users.models import CustomUser

from .reference_prices import normalize_item_name, normalize_wilaya

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
    status = models.CharField('حالة الصفقة', max_length=50, default='DRAFT', blank=True)
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

    @property
    def base_amount(self) -> Decimal:
        """المبلغ الأصلي للصفقة من العقد المبرم أو الميزانية التقديرية"""
        try:
            if hasattr(self, 'contract') and self.contract and self.contract.signed_amount:
                return self.contract.signed_amount
        except Exception:
            pass
        contract = self.procurement_contracts.first()
        if contract and contract.amount and contract.amount > 0:
            return contract.amount
        if self.estimated_budget and self.estimated_budget > 0:
            return self.estimated_budget
        return Decimal('0.00')

    @property
    def total_avenant_amount(self) -> Decimal:
        """مجموع مبالغ الملاحق المعتمدة وقيد الاعتماد"""
        qs = self.avenants.filter(status__in=['approved', 'pending_approval'])
        total = sum((a.amount_change for a in qs), Decimal('0.00'))
        return total

    @property
    def total_avenant_percentage(self) -> float:
        """نسبة مجموع الملاحق إلى المبلغ الأصلي (%)"""
        base = self.base_amount
        if not base or base <= 0:
            return 0.0
        total_amt = self.total_avenant_amount
        return float(round((total_amt / base) * 100, 2))


class CahierSpecs(models.Model):
    """دفتر الشروط الذكي"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal = models.OneToOneField(ProcurementDeal, on_delete=models.CASCADE, related_name='cahier_specs', verbose_name='الصفقة')
    file = models.FileField(upload_to='cahier_specs/', null=True, blank=True, verbose_name='ملف دفتر الشروط الرسمي (PDF)')
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
        ('pending', 'قيد الانتظار'),
        ('scheduled', 'مبرمجة'),
        ('live', 'جارية'),
        ('closed', 'مغلقة'),
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

    @property
    def deal(self):
        return self.tender

    @deal.setter
    def deal(self, value):
        self.tender = value

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
    has_access = models.BooleanField('صلاحية الدخول للجلسة', default=True)
    joined_at = models.DateTimeField('تاريخ الانضمام للجلسة', null=True, blank=True)
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
        ('opened_technical', 'فتح الظرف التقني'),
        ('opened_financial', 'فتح الظرف المالي وإعلان السعر'),
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
    announced_amount = models.DecimalField(
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

    @property
    def timestamp(self):
        return self.created_at

    def save(self, *args, **kwargs):
        if self.announced_amount is not None and self.announced_price is None:
            self.announced_price = self.announced_amount
        elif self.announced_price is not None and self.announced_amount is None:
            self.announced_amount = self.announced_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"حدث {self.get_event_type_display()} - جلسة {self.session_id}"


class OfferDocument(models.Model):
    """
    وثيقة العرض المقدمة من المتعامل الاقتصادي وفق متطلبات الصفقات العمومية.
    تحتفظ بملف العرض المرفوع وتاريخ الرفع وارتباطه بالعرض المودع.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    offer = models.ForeignKey(
        'bids.BidOffer',
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name='العرض المعني',
    )
    file = models.FileField(
        'ملف الوثيقة',
        upload_to='offer_documents/%Y/%m/',
    )
    is_encrypted = models.BooleanField(
        'هل الوثيقة مشفرة ومختومة',
        default=True,
    )
    uploaded_at = models.DateTimeField(
        'تاريخ الرفع',
        auto_now_add=True,
    )

    class Meta:
        verbose_name = 'وثيقة العرض'
        verbose_name_plural = 'وثائق العروض'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"وثيقة العرض ({self.offer_id}) - {self.file.name}"


class Contract(models.Model):
    """
    نموذج العقد الإداري والالتزام القانوني وفق أحكام القانون 23-12.
    يربط الصفقة بالمتعامل الفائز والوثيقة الموقعة.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal = models.ForeignKey(
        ProcurementDeal,
        on_delete=models.CASCADE,
        related_name='procurement_contracts',
        verbose_name='الصفقة المعنية'
    )
    operator = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='procurement_contracts',
        verbose_name='المتعامل الاقتصادي المتعاقد'
    )
    contract_number = models.CharField('رقم العقد الرسمي', max_length=100, blank=True)
    contract_pdf = models.FileField('وثيقة العقد الرسمية (PDF)', upload_to='contracts/%Y/%m/', null=True, blank=True)
    signed_at = models.DateTimeField('تاريخ توقيع وإبرام العقد', null=True, blank=True)
    status = models.CharField('وضعية العقد', max_length=50, default='signed')
    amount = models.DecimalField('مبلغ العقد الإجمالي (دج)', max_digits=15, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)
    updated_at = models.DateTimeField('تاريخ التحديث', auto_now=True)

    class Meta:
        verbose_name = 'عقد صفقة'
        verbose_name_plural = 'عقود الصفقات'
        ordering = ['-created_at']

    def __str__(self):
        return f"عقد {self.contract_number or self.id} - {self.deal.reference_number}"


class Milestone(models.Model):
    """
    مراحل ومحطات تنفيذ الصفقة العمومية وفق الجدول الزمني التعاقدي (القانون 23-12).
    """
    STATUS_CHOICES = (
        ('pending', 'قيد الانتظار'),
        ('in_progress', 'قيد التنفيذ'),
        ('completed', 'مكتملة ومستلمة'),
        ('delayed', 'متأخرة عن الأجل'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal = models.ForeignKey(
        ProcurementDeal,
        on_delete=models.CASCADE,
        related_name='milestones',
        verbose_name='الصفقة المعنية'
    )
    title = models.CharField('عنوان المرحلة أو الورشة', max_length=255)
    description = models.TextField('تفاصيل الأعمال المطلوبة', blank=True)
    amount = models.DecimalField('المبلغ المالي المخصص للمرحلة (دج)', max_digits=15, decimal_places=2, default=0)
    due_date = models.DateField('تاريخ الاستحقاق التعاقدي', null=True, blank=True)
    status = models.CharField('حالة المرحلة', max_length=50, choices=STATUS_CHOICES, default='pending')
    completion_date = models.DateField('تاريخ الإنجاز الفعلي', null=True, blank=True)
    progress_percentage = models.PositiveIntegerField('نسبة التقدم المادي (%)', default=0)
    created_at = models.DateTimeField('تاريخ التسجيل', auto_now_add=True)
    updated_at = models.DateTimeField('آخر تحديث', auto_now=True)

    class Meta:
        verbose_name = 'مرحلة تنفيذ'
        verbose_name_plural = 'مراحل التنفيذ'
        ordering = ['due_date', 'created_at']

    def __str__(self):
        return f"{self.title} - {self.deal.reference_number} ({self.get_status_display()})"


class MilestoneProgressReport(models.Model):
    """
    تقرير إنجاز مرحلة التنفيذ المرفوع من المتعامل الاقتصادي.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    milestone = models.ForeignKey(
        Milestone,
        on_delete=models.CASCADE,
        related_name='progress_reports',
        verbose_name='مرحلة التنفيذ'
    )
    operator = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='progress_reports',
        verbose_name='المتعامل الاقتصادي'
    )
    progress_percentage = models.PositiveIntegerField('نسبة الإنجاز المصرح بها (%)', default=0)
    report_text = models.TextField('بيان الأعمال المنجزة والملاحظات الميدانية')
    report_file = models.FileField('ملف أو محضر المعاينة (PDF/صور)', upload_to='progress_reports/%Y/%m/', null=True, blank=True)
    submitted_at = models.DateTimeField('تاريخ تقديم التقرير', auto_now_add=True)

    class Meta:
        verbose_name = 'تقرير إنجاز مرحلة'
        verbose_name_plural = 'تقارير إنجاز المراحل'
        ordering = ['-submitted_at']

    def __str__(self):
        return f"تقرير {self.milestone.title} ({self.progress_percentage}%) - {self.operator.email}"


class ReferencePrice(models.Model):
    """سعر مرجعي استشاري لمادة أو خدمة داخل ولاية معيّنة.

    يُستخدم لمساعدة المتعامل أثناء ملء الجداول المالية (BPU/DQE)،
    وليس قاعدة قانونية ملزمة. تتم المطابقة على الاسم والولاية بعد تطبيعهما.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField('اسم المادة أو الخدمة', max_length=255)
    normalized_name = models.CharField(
        'اسم المادة المطبّع للبحث',
        max_length=255,
        editable=False,
    )
    unit = models.CharField('وحدة القياس', max_length=50)
    reference_price = models.DecimalField(
        'السعر المرجعي (دج)',
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    wilaya = models.CharField('الولاية', max_length=100, db_index=True)
    normalized_wilaya = models.CharField(
        'الولاية المطبّعة للبحث',
        max_length=100,
        editable=False,
    )
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)
    updated_at = models.DateTimeField('تاريخ آخر تحديث', auto_now=True)

    class Meta:
        verbose_name = 'سعر مرجعي'
        verbose_name_plural = 'الأسعار المرجعية'
        ordering = ['wilaya', 'name']
        constraints = [
            models.UniqueConstraint(
                fields=['normalized_name', 'normalized_wilaya'],
                name='uniq_reference_price_name_wilaya',
            ),
            models.CheckConstraint(
                condition=models.Q(reference_price__gt=0),
                name='reference_price_positive',
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.unit}) - {self.wilaya}: {self.reference_price} دج"

    def clean(self):
        super().clean()
        if not (self.name or '').strip():
            raise ValidationError({'name': 'اسم المادة أو الخدمة مطلوب.'})
        if not (self.unit or '').strip():
            raise ValidationError({'unit': 'وحدة القياس مطلوبة.'})
        if not (self.wilaya or '').strip():
            raise ValidationError({'wilaya': 'الولاية مطلوبة.'})
        if self.reference_price is not None and self.reference_price <= 0:
            raise ValidationError({'reference_price': 'السعر المرجعي يجب أن يكون أكبر من صفر.'})

    def save(self, *args, **kwargs):
        self.name = (self.name or '').strip()
        self.unit = (self.unit or '').strip()
        self.wilaya = (self.wilaya or '').strip()
        self.normalized_name = normalize_item_name(self.name)
        self.normalized_wilaya = normalize_wilaya(self.wilaya)

        update_fields = kwargs.get('update_fields')
        if update_fields is not None:
            kwargs['update_fields'] = set(update_fields) | {
                'name',
                'unit',
                'wilaya',
                'normalized_name',
                'normalized_wilaya',
                'updated_at',
            }

        super().save(*args, **kwargs)


class Avenant(models.Model):
    """
    نموذج الملحق التعاقدي (Avenant) وفق القانون 23-12 والمرسوم الرئاسي 15-247 (المادتان 138 و139).
    يخضع الملحق لسقف أقصى لا يتجاوز 20% إلى 25% من المبلغ الأصلي للصفقة مع وجوب موافقة لجنة الصفقات.
    """
    STATUS_CHOICES = (
        ('draft', 'مسودة قيد الإعداد'),
        ('pending_approval', 'قيد موافقة لجنة الصفقات'),
        ('approved', 'معتمد ومبرم رسمياً'),
        ('rejected', 'مرفوض من اللجنة'),
    )

    REASON_CHOICES = (
        ('time_extension', 'تمديد الآجال التعاقدية'),
        ('quantity_change', 'تعديل في الكميات والأشغال'),
        ('emergency_circumstances', 'ظروف طارئة وقوة قاهرة'),
        ('technical_modification', 'تعديل تقني في المواصفات'),
        ('unforeseen_works', 'أشغال إضافية غير متوقعة'),
        ('other', 'أسباب أخرى مبررة قانوناً'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal = models.ForeignKey(
        ProcurementDeal,
        on_delete=models.CASCADE,
        related_name='avenants',
        verbose_name='الصفقة الأصلية'
    )
    reference = models.CharField('رقم الملحق التعاقدي', max_length=100)
    reason = models.TextField('سبب الملحق ومبرراته التقنية والإدارية')
    amount_change = models.DecimalField('الأثر المالي (دج)', max_digits=15, decimal_places=2, default=0)
    time_extension_days = models.PositiveIntegerField('عدد أيام التمديد التعاقدي', default=0)
    status = models.CharField('حالة الملحق', max_length=30, choices=STATUS_CHOICES, default='draft')
    committee_approval_ref = models.CharField('مرجع موافقة لجنة الصفقات', max_length=200, blank=True, default='')
    document_pdf = models.FileField('وثيقة الملحق المعتمدة (PDF)', upload_to='avenants/%Y/%m/', null=True, blank=True)
    created_at = models.DateTimeField('تاريخ التحرير', default=timezone.now)
    approved_at = models.DateTimeField('تاريخ المصادقة والاعتماد', null=True, blank=True)

    class Meta:
        verbose_name = 'ملحق تعاقدي'
        verbose_name_plural = 'الملاحق التعاقدية (Avenants)'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reference} - {self.deal.reference_number} ({self.get_status_display()})"

    @property
    def percentage_impact(self) -> float:
        """نسبة الأثر المالي لهذا الملحق مقارنة بالمبلغ الأصلي للصفقة"""
        base = self.deal.base_amount
        if not base or base <= 0:
            return 0.0
        return float(round((self.amount_change / base) * 100, 2))



