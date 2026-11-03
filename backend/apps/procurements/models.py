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
    specs_price = models.DecimalField(
        'سعر سحب دفتر الشروط (دج)',
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text='رسوم غير قابلة للاسترداد لسحب دفتر الشروط وفقاً للمرسوم 15-247'
    )
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

    @property
    def active_legal_notices_count(self) -> int:
        """عدد الاعذارات القانونية النشطة أو المنتهية"""
        return self.legal_notices.filter(status__in=['issued', 'acknowledged', 'expired']).count()


    @property
    def is_specs_free(self) -> bool:
        """هل سحب دفتر الشروط مجاني"""
        return not self.specs_price or self.specs_price <= Decimal('0.00')

    @property
    def specs_purchases_count(self) -> int:
        """عدد المتعاملين الذين سحبوا دفتر الشروط"""
        return self.specs_purchases.filter(status='paid').count()

    @property
    def total_specs_revenue(self) -> Decimal:
        """إجمالي مداخيل بيع دفاتر الشروط"""
        return sum((p.amount for p in self.specs_purchases.filter(status='paid')), Decimal('0.00'))

    @property
    def has_active_injunction(self) -> bool:
        """هل توجد إعذارات إدارية رقابية نشطة أو محالة للقضاء ضد هذه الصفقة"""
        return self.administrative_injunctions.filter(status__in=['issued', 'acknowledged', 'escalated_to_court']).exists()

    @property
    def has_expired_notice(self) -> bool:
        """هل توجد اعذارات قانونية منتهية المهلة مع تطبيق غرامات"""
        return self.legal_notices.filter(status='expired').exists()

    @property
    def is_expired(self) -> bool:
        """هل انتهى الأجل القانوني لإيداع العروض وفقاً للمادة 68 من القانون 23-12"""
        if not self.submission_deadline:
            return False
        return self.submission_deadline < timezone.now()

    @property
    def days_left(self) -> int:
        """عدد الأيام المتبقية حتى آخر أجل لإيداع العروض (0 إذا انقضى الأجل)"""
        if not self.submission_deadline:
            return 0
        diff = (self.submission_deadline - timezone.now()).total_seconds()
        if diff <= 0:
            return 0
        return int(diff // 86400)



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
    # التشفير التعددي العتباتي (Threshold Multi-Party Sealing / Shamir's Secret Sharing)
    threshold_k = models.PositiveSmallIntegerField('عتبة النصاب القانوني لفك الأظرفة (k)', default=2)
    threshold_n = models.PositiveSmallIntegerField('إجمالي حصص مفاتيح اللجنة (n)', default=3)
    ceremony_status = models.CharField(
        'حالة مراسم فك الأظرفة التعددية',
        max_length=25,
        default='pending_quorum',
        choices=(
            ('pending_quorum', 'في انتظار اكتمال النصاب القانوني'),
            ('quorum_reached', 'اكتمل النصاب القانوني'),
            ('unlocked', 'تم فك الختم التعددي بنجاح'),
        ),
    )
    session_key_hash = models.CharField('بصمة مفتاح الجلسة التشفيرية SHA-256', max_length=64, blank=True, default='')
    unlocked_at = models.DateTimeField('تاريخ وتوقيت فك الختم التعددي', null=True, blank=True)
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


class OpeningCommitteeShare(models.Model):
    """
    حصص التشفير التعددي لأعضاء لجنة فتح الأظرفة وتقييم العروض
    وفق المادة 70 من القانون 23-12 والمادتين 70-71 من المرسوم الرئاسي 15-247.
    مبنية على خوارزمية Shamir's Secret Sharing (k-of-n).
    """
    MEMBER_ROLE_CHOICES = (
        ('president', 'رئيس المصلحة المتعاقدة / رئيس اللجنة'),
        ('finance_rep', 'ممثل المصلحة المالية / المحاسب العمومي'),
        ('technical_rep', 'ممثل المصلحة التقنية المختصة'),
        ('member', 'عضو ممثل قانوني'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        OpeningSession,
        on_delete=models.CASCADE,
        related_name='committee_shares',
        verbose_name='جلسة الفتح'
    )
    member_name = models.CharField('اسم عضو اللجنة', max_length=150)
    member_role = models.CharField('الصفة في اللجنة', max_length=50, choices=MEMBER_ROLE_CHOICES)
    share_index = models.PositiveSmallIntegerField('رقم الحصة x')
    share_token = models.CharField('رمز الحصة التشفيرية y', max_length=128)
    
    is_submitted = models.BooleanField('تم تأكيد الحضور وتقديم الحصة', default=False)
    submitted_at = models.DateTimeField('تاريخ وتوقيت تقديم الحصة', null=True, blank=True)
    submitted_by = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='submitted_opening_shares',
        verbose_name='المستخدم المؤكد'
    )
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)

    class Meta:
        verbose_name = 'حصة تشفير عضو اللجنة'
        verbose_name_plural = 'حصص تشفير أعضاء اللجنة'
        ordering = ['share_index']
        unique_together = ('session', 'share_index')

    def __str__(self):
        return f"حصة {self.get_member_role_display()} ({self.member_name}) - جلسة {self.session_id}"


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





class LegalNotice(models.Model):
    """
    نموذج الإعذار القانوني (Mise en Demeure) وفق المرسوم الرئاسي 15-247 (المادتان 147 و148)
    والقانون 23-12 (المادة 67 الخاصة بالتبليغ الإلكتروني والإخطارات الرسمية).
    يمكّن المصلحة المتعاقدة من إخطار المتعامل المتأخر أو المخل بالتزاماته بمهلة قانونية (افتراضياً 15 يوماً)،
    مع احتساب آلي لغرامات التأخير اليومية في حال انقضاء المهلة دون تسوية.
    """
    NOTICE_TYPES = (
        ('delay', 'تأخر في وتيرة التنفيذ والإنجاز'),
        ('quality', 'إخلال بمعايير الجودة والمواصفات التعاقدية'),
        ('abandonment', 'توقف غير مبرر للورشة والأشغال'),
        ('non_compliance', 'عدم الامتثال للأوامر المصلحية والتعليمات'),
    )

    STATUS_CHOICES = (
        ('draft', 'مسودة قيد المراجعة'),
        ('issued', 'مبلّغ رسمياً (نشط)'),
        ('acknowledged', 'مستلم ومقر به من المتعامل'),
        ('expired', 'منتهي المهلة (غرامة تأخير مفروضة)'),
        ('resolved', 'تم تدارك الوضع وتسوية الإعذار'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal = models.ForeignKey(
        ProcurementDeal,
        on_delete=models.CASCADE,
        related_name='legal_notices',
        verbose_name='الصفقة المعنية'
    )
    reference = models.CharField('رقم الإعذار الرسمي', max_length=100)
    notice_type = models.CharField('نوع الإعذار والمخالفة', max_length=30, choices=NOTICE_TYPES, default='delay')
    reason = models.TextField('نص الإعذار والحيثيات القانونية والتقنية')
    issued_date = models.DateField('تاريخ الإصدار والتبليغ', default=timezone.localdate)
    legal_deadline_days = models.PositiveIntegerField('المهلة القانونية الممنوحة (بالأيام)', default=15)
    status = models.CharField('وضعية الإعذار', max_length=30, choices=STATUS_CHOICES, default='issued')
    penalty_amount = models.DecimalField('غرامة التأخير المحسوبة (دج)', max_digits=15, decimal_places=2, default=Decimal('0.00'))

    # دفوعات ومبررات المتعامل
    operator_justification = models.TextField('تبريرات ودفوعات المتعامل الاقتصادي', blank=True, default='')
    operator_justification_file = models.FileField('ملف مبررات المتعامل (PDF)', upload_to='notices/justifications/%Y/%m/', null=True, blank=True)
    justification_submitted_at = models.DateTimeField('تاريخ تقديم التبريرات', null=True, blank=True)

    # أطراف التبليغ والتسوية
    created_by = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='issued_legal_notices',
        verbose_name='المحرر / المصلحة المتعاقدة'
    )
    acknowledged_at = models.DateTimeField('تاريخ الإقرار بالاستلام', null=True, blank=True)
    acknowledged_by = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='acknowledged_legal_notices',
        verbose_name='المتعامل المقر بالاستلام'
    )
    resolved_at = models.DateTimeField('تاريخ التسوية ورفع الإعذار', null=True, blank=True)
    resolution_notes = models.TextField('ملاحظات المصلحة عند تسوية الإعذار', blank=True, default='')

    # الوثيقة الرسمية
    document_pdf = models.FileField('وثيقة الإعذار الرسمية (PDF)', upload_to='notices/official/%Y/%m/', null=True, blank=True)

    created_at = models.DateTimeField('تاريخ الإنشاء', default=timezone.now)
    updated_at = models.DateTimeField('تاريخ التحديث', auto_now=True)

    class Meta:
        verbose_name = 'إعذار قانوني'
        verbose_name_plural = 'الاعذارات القانونية (Mises en Demeure)'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reference} - {self.deal.reference_number} ({self.get_status_display()})"

    @property
    def deadline_date(self):
        """تاريخ انقضاء المهلة القانونية للإعذار"""
        if not self.issued_date:
            return None
        from datetime import timedelta
        return self.issued_date + timedelta(days=self.legal_deadline_days)

    @property
    def days_remaining(self) -> int:
        """عدد الأيام المتبقية قبل انقضاء المهلة القانونية"""
        if self.status in ['resolved', 'draft']:
            return 0
        dl = self.deadline_date
        if not dl:
            return 0
        today = timezone.localdate()
        diff = (dl - today).days
        return max(0, diff)

    @property
    def is_expired(self) -> bool:
        """هل انقضت المهلة القانونية دون تسوية"""
        if self.status == 'resolved':
            return False
        dl = self.deadline_date
        if not dl:
            return False
        return timezone.localdate() > dl

    def check_and_update_expiry_and_penalty(self) -> bool:
        """
        التحقق الآلي وتحديث حالة الإعذار واحتساب غرامة التأخير وفقاً للمادة 147 من المرسوم الرئاسي 15-247.
        - نسبة الغرامة اليومية: 1/1000 من المبلغ الأصلي للصفقة لكل يوم تأخير بعد انقضاء المهلة.
        - السقف القانوني الأقصى: 10% من المبلغ الأصلي للصفقة.
        """
        if self.status == 'resolved':
            return False

        today = timezone.localdate()
        dl = self.deadline_date
        if not dl:
            return False

        has_changed = False
        if today > dl:
            if self.status in ['issued', 'acknowledged']:
                self.status = 'expired'
                has_changed = True

            delay_days = (today - dl).days
            base_amt = self.deal.base_amount
            if base_amt and base_amt > 0 and delay_days > 0:
                daily_rate = base_amt / Decimal(1000)
                calculated_penalty = daily_rate * Decimal(delay_days)
                max_penalty = base_amt * Decimal('0.10')
                new_penalty = min(calculated_penalty, max_penalty).quantize(Decimal('0.01'))
                if new_penalty != self.penalty_amount:
                    self.penalty_amount = new_penalty
                    has_changed = True

        if has_changed:
            self.save(update_fields=['status', 'penalty_amount', 'updated_at'])
            return True
        return False


class AdministrativeNotice(models.Model):
    """
    نموذج الإعذار الإداري الرقابي (Administrative Injunction) من الإدارة المركزية (عين الصقر) للمصلحة المتعاقدة
    وفقاً لأحكام القانون رقم 23-12 (لا سيما المواد 13، 67، 75) والمرسوم الرئاسي 15-247.
    يُصدر عند رصد مخالفة جسيمة (تجزئة صفقات، تجاوز ملاحق، إشراك شركات مقصاة، إلخ)
    ويلزم المصلحة بتصحيح الوضع خلال مهلة قانونية (افتراضياً 15 يوماً)، وإلا يُحال الملف تلقائياً للجهات القضائية ومجلس المحاسبة.
    """
    VIOLATION_TYPES = (
        ('tender_splitting', 'تجزئة الصفقات العمومية للتهرب من الرقابة (المادة 13 من القانون 23-12)'),
        ('avenant_excess', 'تجاوز السقف القانوني الأقصى للملاحق التعاقدية (المادتان 138 و139)'),
        ('blacklist_violation', 'منح أو إشراك متعامل اقتصادي مقصى في القائمة السوداء (المادة 75)'),
        ('deadline_breach', 'إخلال بالآجال والمهل القانونية الملزمة المحددة بالتنظيم'),
        ('hawk_eye_ignored', 'تجاهل إنذارات وتنبيهات عين الصقر المسبقة حول شبهات التلاعب'),
        ('procedural_violation', 'مخالفات إجرائية وقانونية في شروط إبرام وتقييم العروض'),
        ('other', 'مخالفات إدارية وتنظيمية أخرى'),
    )

    STATUS_CHOICES = (
        ('issued', 'صادر وقيد المهلة (نشط)'),
        ('acknowledged', 'مستلم ومقر به من المصلحة'),
        ('resolved', 'تم تقديم تقرير التصحيح واعتماده'),
        ('escalated_to_court', 'محال للجهات القضائية ومجلس المحاسبة (انقضاء المهلة)'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField('الرقم المرجعي للإعذار الرقابي', max_length=100, unique=True)
    authority = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='received_injunctions',
        verbose_name='المصلحة المتعاقدة المستهدفة'
    )
    deal = models.ForeignKey(
        ProcurementDeal,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='administrative_injunctions',
        verbose_name='الصفقة المعنية إن وجدت'
    )
    violation_type = models.CharField('نوع المخالفة القانونية', max_length=50, choices=VIOLATION_TYPES, default='tender_splitting')
    legal_reference = models.CharField('المادة والسند القانوني المخالف', max_length=255, default='المادة 13 من القانون 23-12')
    directive_text = models.TextField('نص الأمر الإداري الملزم بالتصحيح والتسوية')
    violation_details = models.TextField('حيثيات ووقائع المخالفة المثبتة لدى الرقابة المركزية', blank=True, default='')
    issued_date = models.DateField('تاريخ الإصدار والتبليغ', default=timezone.localdate)
    deadline_days = models.PositiveIntegerField('المهلة الممنوحة للتصحيح (بالأيام)', default=15)
    status = models.CharField('وضعية الإعذار الإداري', max_length=40, choices=STATUS_CHOICES, default='issued')
    
    issued_by = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='issued_injunctions',
        verbose_name='المفتش المركزي / الآمر بالإعذار'
    )

    # رد المصلحة وتقرير التصحيح
    authority_response = models.TextField('تقرير التصحيح ورد المصلحة المتعاقدة', blank=True, default='')
    authority_response_file = models.FileField('ملف تقرير التصحيح المرفق (PDF)', upload_to='injunctions/responses/%Y/%m/', null=True, blank=True)
    responded_at = models.DateTimeField('تاريخ تقديم تقرير التصحيح', null=True, blank=True)
    responded_by = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='submitted_injunction_responses',
        verbose_name='المسؤول المقر بالتصحيح'
    )

    acknowledged_at = models.DateTimeField('تاريخ تأكيد استلام الإعذار', null=True, blank=True)
    escalated_at = models.DateTimeField('تاريخ الإحالة القضائية', null=True, blank=True)
    escalation_reason = models.TextField('حيثيات الإحالة القضائية', blank=True, default='')

    # الوثيقة الرسمية
    document_pdf = models.FileField('وثيقة الإعذار الإداري الرسمية (PDF)', upload_to='injunctions/official/%Y/%m/', null=True, blank=True)

    created_at = models.DateTimeField('تاريخ التسجيل', default=timezone.now)
    updated_at = models.DateTimeField('آخر تحديث', auto_now=True)

    class Meta:
        verbose_name = 'إعذار إداري رقابي'
        verbose_name_plural = 'الإعذارات الإدارية الرقابية (Administrative Injunctions)'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reference} - {self.authority.full_name} ({self.get_status_display()})"

    @property
    def deadline_date(self):
        """تاريخ انقضاء المهلة المحددة بالأمر الإداري"""
        if not self.issued_date:
            return None
        from datetime import timedelta
        return self.issued_date + timedelta(days=self.deadline_days)

    @property
    def days_remaining(self) -> int:
        """عدد الأيام المتبقية قبل انقضاء مهلة التصحيح والإحالة للقضاء"""
        if self.status == 'resolved':
            return 0
        dl = self.deadline_date
        if not dl:
            return 0
        today = timezone.localdate()
        diff = (dl - today).days
        return max(0, diff)

    @property
    def is_expired(self) -> bool:
        """هل انقضت المهلة دون تقديم تقرير التصحيح"""
        if self.status == 'resolved':
            return False
        dl = self.deadline_date
        if not dl:
            return False
        return timezone.localdate() > dl

    def check_and_update_escalation(self) -> bool:
        """
        التحقق الآلي: إذا انقضت مهلة الـ 15 يوماً دون رد المصلحة وتقديم تقرير التصحيح،
        يتحول الوضع تلقائياً إلى 'escalated_to_court' وتُرسل إخطارات عاجلة لمفتشي عين الصقر والمصلحة.
        """
        if self.status in ['resolved', 'escalated_to_court']:
            return False

        today = timezone.localdate()
        dl = self.deadline_date
        if not dl:
            return False

        if today > dl:
            self.status = 'escalated_to_court'
            self.escalated_at = timezone.now()
            self.escalation_reason = (
                f"انقضاء المهلة القانونية ({self.deadline_days} يوماً) المحددة في الإعذار الإداري رقم {self.reference} "
                f"دون تقديم المصلحة المتعاقدة لتقرير التصحيح. تمت الإحالة الآلية للجهات القضائية ومجلس المحاسبة."
            )
            self.save(update_fields=['status', 'escalated_at', 'escalation_reason', 'updated_at'])

            try:
                from apps.users.models import Notification
                inspectors = CustomUser.objects.filter(models.Q(role='central_admin') | models.Q(is_staff=True))
                auth_name = getattr(self.authority, 'entity_name', None) or getattr(self.authority, 'full_name', None) or self.authority.email
                for inspector in inspectors:
                    Notification.objects.create(
                        user=inspector,
                        title=f"إحالة قضائية عاجلة: انقضاء مهلة الإعذار الإداري {self.reference}",
                        text=(
                            f"انقضت المهلة الممنوحة للمصلحة ({auth_name}) لتصحيح مخالفة '{self.get_violation_type_display()}'. "
                            f"تم تصعيد الملف رسمياً للإحالة القضائية ومجلس المحاسبة وفق المادة 13 من القانون 23-12."
                        ),
                        link_href="/central/injunctions",
                        notification_type="urgent",
                    )
                Notification.objects.create(
                    user=self.authority,
                    title=f"إحالة للمتابعة القضائية: إعذار إداري رقم {self.reference}",
                    text=(
                        f"نحيطكم علماً بأنه نظراً لانقضاء المهلة دون تسوية المخالفة، "
                        f"تم تصعيد الملف آلياً للإحالة إلى الجهات القضائية المختصة ومجلس المحاسبة."
                    ),
                    link_href="/authority/settings",
                    notification_type="urgent",
                )
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning("تعذر إرسال إشعار الإحالة القضائية للإعذار %s: %s", self.id, e)

            return True
        return False

class SpecsPurchase(models.Model):
    """
    سجل سحب دفتر الشروط والدفع الإلكتروني (Paid Specs Download)
    وفقاً لأحكام القانون 23-12 والمرسوم الرئاسي 15-247.
    """
    STATUS_CHOICES = (
        ('pending', 'قيد انتظار الدفع'),
        ('paid', 'تم الدفع وسحب الدفتر'),
        ('failed', 'فشلت عملية الدفع'),
        ('refunded', 'مسترد'),
    )

    GATEWAY_CHOICES = (
        ('chargily', 'Chargily Pay (البطاقة الذهبية / CIB)'),
        ('satim', 'SATIM Interbancaire'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal = models.ForeignKey(
        ProcurementDeal,
        on_delete=models.CASCADE,
        related_name='specs_purchases',
        verbose_name='الصفقة'
    )
    operator = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='specs_purchases',
        verbose_name='المتعامل الاقتصادي'
    )
    amount = models.DecimalField('المبلغ المدفوع (دج)', max_digits=10, decimal_places=2)
    payment_gateway = models.CharField('بوابة الدفع', max_length=50, choices=GATEWAY_CHOICES, default='chargily')
    payment_id = models.CharField('معرف المعاملة لدى البوابة', max_length=255, blank=True, db_index=True)
    checkout_url = models.URLField('رابط صفحة الدفع', max_length=1000, blank=True, null=True)
    status = models.CharField('حالة الدفع', max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    receipt_number = models.CharField('رقم وصل السحب الرقمي', max_length=100, unique=True, null=True, blank=True, db_index=True)
    receipt_pdf = models.FileField('ملف وصل السحب الرقمي (PDF)', upload_to='specs_receipts/', null=True, blank=True)
    payment_method = models.CharField('طريقة الدفع (EDAHABIA / CIB)', max_length=50, blank=True, default='EDAHABIA')
    metadata = models.JSONField('بيانات إضافية للمعاملة', default=dict, blank=True)
    created_at = models.DateTimeField('تاريخ إنشاء الطلب', default=timezone.now)
    paid_at = models.DateTimeField('تاريخ الدفع الفعلي', null=True, blank=True)
    updated_at = models.DateTimeField('تاريخ التحديث', auto_now=True)

    class Meta:
        verbose_name = 'عملية سحب دفتر الشروط'
        verbose_name_plural = 'سجل سحب دفاتر الشروط'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.receipt_number or self.id} - {self.deal.reference_number} ({self.operator.email})"

    def generate_receipt_number(self) -> str:
        """توليد رقم وصل سحب رقمي رسمي فريد"""
        clean_ref = "".join(c for c in self.deal.reference_number if c.isalnum() or c == '-')
        clean_ref = clean_ref[:12]
        suffix = uuid.uuid4().hex[:6].upper()
        year = timezone.now().year
        return f"REC-{year}-{clean_ref}-{suffix}"

    def mark_as_paid(self, payment_id=None, metadata=None, payment_method=None):
        """تأكيد الدفع واعتماد السحب وتوليد الوصل والإشعارات"""
        if self.status == 'paid':
            return False

        self.status = 'paid'
        self.paid_at = timezone.now()
        if payment_id:
            self.payment_id = payment_id
        if payment_method:
            self.payment_method = payment_method
        if metadata:
            self.metadata.update(metadata)

        if not self.receipt_number:
            self.receipt_number = self.generate_receipt_number()

        self.save()

        # توليد ملف PDF للوصل وحفظه
        try:
            from .pdf_service import generate_specs_withdrawal_receipt_pdf
            from django.core.files.base import ContentFile
            pdf_bytes = generate_specs_withdrawal_receipt_pdf(self)
            if pdf_bytes:
                filename = f"Receipt_{self.receipt_number}.pdf"
                self.receipt_pdf.save(filename, ContentFile(pdf_bytes), save=False)
                self.save(update_fields=['receipt_pdf'])
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning("تعذر توليد أو حفظ ملف PDF لوصل السحب %s: %s", self.id, e)

        # تسجيل في سجل التدقيق الجنائي
        try:
            from apps.audit.models import AuditLog
            AuditLog.objects.create(
                user=self.operator,
                action='SPECS_WITHDRAWAL_PAID',
                resource_type='SpecsPurchase',
                resource_id=str(self.id),
                description=f"سحب دفتر الشروط وسداد الرسوم ({self.amount} دج) للصفقة {self.deal.reference_number} - وصل رقم {self.receipt_number}.",
                changes={
                    'purchase_id': str(self.id),
                    'receipt_number': self.receipt_number,
                    'deal_id': str(self.deal.id),
                    'amount': str(self.amount),
                    'payment_method': self.payment_method,
                },
            )
        except Exception:
            pass

        # إرسال إشعار للمتعامل
        try:
            from apps.users.models import Notification
            Notification.objects.create(
                user=self.operator,
                title="✅ تم تأكيد سحب دفتر الشروط بنجاح",
                text=f"تم استلام رسوم سحب دفتر الشروط ({self.amount} دج) للصفقة '{self.deal.title}'. رقم وصل السحب الرسمي: {self.receipt_number}. يمكنك الآن تحميل دفتر الشروط وإعداد العرض.",
                link_href=f"/operator/deals/{self.deal.id}",
                notification_type="urgent",
            )
            # إشعار للمصلحة المتعاقدة
            Notification.objects.create(
                user=self.deal.authority,
                title="سحب دفتر شروط جديد",
                text=f"قام المتعامل ({getattr(self.operator, 'organization_name', None) or getattr(self.operator, 'full_name', None) or self.operator.email}) بسحب دفتر الشروط للصفقة '{self.deal.title}' بوصل رقم {self.receipt_number}.",
                link_href=f"/authority/deals/{self.deal.id}",
                notification_type="update",
            )
        except Exception:
            pass

        return True


class Authority(models.Model):
    """
    نموذج المصلحة المتعاقدة (الهيئة العمومية الخاضعة لأحكام القانون 23-12).
    يدعم نظام التسجيل الذاتي والاعتماد المسبق من قبل الإدارة المركزية (عين الصقر).
    القيمة الافتراضية للحالة هي 'approved' لضمان استمرارية جميع المصالح الحالية (Zero Breaking Changes).
    """
    STATUS_CHOICES = (
        ('pending_approval', 'قيد المراجعة والاعتماد'),
        ('approved', 'معتمدة ونشطة'),
        ('rejected', 'مرفوضة'),
        ('suspended', 'معلقة مؤقتاً'),
    )

    ENTITY_TYPE_CHOICES = (
        ('ministry', 'وزارة أو هيئة سيادية'),
        ('wilaya', 'ولاية'),
        ('commune', 'بلدية'),
        ('public_institution', 'مؤسسة عمومية ذات طابع إداري (EPA)'),
        ('epic', 'مؤسسة عمومية ذات طابع صناعي وتجاري (EPIC)'),
        ('health_sector', 'قطاع الصحة والمستشفيات'),
        ('university', 'جامعة أو مركز بحث علمي'),
        ('other', 'هيئة عمومية أخرى'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField('اسم المصلحة المتعاقدة', max_length=255, db_index=True)
    wilaya = models.CharField('الولاية', max_length=100, blank=True, default='')
    entity_type = models.CharField('طبيعة الهيئة', max_length=50, choices=ENTITY_TYPE_CHOICES, default='public_institution', blank=True)
    
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='authority',
        null=True,
        blank=True,
        verbose_name='حساب المستخدم المرتبط (الآمر بالصرف)'
    )

    logo = models.ImageField('شعار المصلحة الرسمي', upload_to='authorities/logos/%Y/%m/', null=True, blank=True)
    status = models.CharField(
        'حالة الاعتماد',
        max_length=30,
        choices=STATUS_CHOICES,
        default='approved',
        db_index=True,
        help_text='حالة المصلحة في المنظومة (المصالح السابقة معتمدة افتراضياً)'
    )

    ordonnateur_name = models.CharField('اسم الآمر بالصرف أو المفوض', max_length=150, blank=True, default='')
    ordonnateur_title = models.CharField('الصفة أو الوظيفة الرسمية', max_length=150, blank=True, default='')
    ordonnateur_email = models.EmailField('البريد الإلكتروني الرسمي للآمر بالصرف', blank=True, default='')
    ordonnateur_phone = models.CharField('رقم الهاتف الرسمي', max_length=30, blank=True, default='')
    appointment_proof = models.FileField(
        'سند التعيين أو التفويض الرسمي (PDF/صورة)',
        upload_to='authorities/appointments/%Y/%m/',
        null=True,
        blank=True
    )

    approved_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_authorities',
        verbose_name='المسؤول المعتمد'
    )
    approved_at = models.DateTimeField('تاريخ الاعتماد الرسمي', null=True, blank=True)

    created_at = models.DateTimeField('تاريخ التسجيل', default=timezone.now)
    updated_at = models.DateTimeField('تاريخ التحديث', auto_now=True)

    class Meta:
        verbose_name = 'مصلحة متعاقدة'
        verbose_name_plural = 'المصالح المتعاقدة'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"


