import uuid
import hashlib
from datetime import timedelta
from django.db import models
from django.utils import timezone
from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal
from apps.bids.models import BidOffer


class ObjectionType(models.TextChoices):
    ADMINISTRATIVE = "administrative", "طعن إداري"
    JUDICIAL = "judicial", "طعن قضائي"


class ObjectionGround(models.TextChoices):
    PROCEDURAL = "procedural", "مخالفة إجرائية"
    EVALUATION = "evaluation", "خطأ في التقييم"
    PRICE = "price", "سعر غير منطقي"
    CAPACITY = "capacity", "عدم استيفاء القدرات"
    CONFLICT = "conflict", "تنازع مصالح"
    DISCRIMINATION = "discrimination", "تمييز غير قانوني"
    OTHER = "other", "أسباب أخرى"


class ObjectionStatus(models.TextChoices):
    DRAFT = "draft", "مسودة"
    SUBMITTED = "submitted", "مُودع"
    UNDER_REVIEW = "under_review", "قيد الدراسة"
    ACCEPTED = "accepted", "مقبول"
    REJECTED = "rejected", "مرفوض"
    WITHDRAWN = "withdrawn", "مسحوب"
    ESCALATED = "escalated", "مُحال للقضاء"


class AwardObjection(models.Model):
    """
    طعن على قرار الإسناد المؤقت وفق المادة 72 من القانون 23-12.
    المهلة القانونية: 10 أيام من تاريخ الإعلان.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(
        max_length=50, unique=True, db_index=True,
        verbose_name="رقم الطعن"
    )

    # ═══ الروابط ═══
    tender = models.ForeignKey(
        "procurements.ProcurementDeal",
        on_delete=models.PROTECT,
        related_name="objections",
        verbose_name="الصفقة"
    )
    objector = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.PROTECT,
        related_name="objections_made",
        verbose_name="المتعامل المُطعِن"
    )
    contested_operator = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name="objections_received",
        verbose_name="المتعامل المُطعون عليه"
    )

    # ═══ التفاصيل ═══
    objection_type = models.CharField(
        max_length=20, choices=ObjectionType.choices,
        verbose_name="نوع الطعن"
    )
    grounds = models.JSONField(
        default=list,
        verbose_name="أسباب الطعن"
    )
    description = models.TextField(
        verbose_name="تفاصيل الطعن"
    )

    # ═══ التوقيت (حرج قانونياً!) ═══
    award_announced_at = models.DateTimeField(
        verbose_name="تاريخ الإعلان عن الإسناد"
    )
    deadline_at = models.DateTimeField(
        verbose_name="آخر أجل للطعن (10 أيام)"
    )
    submitted_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name="تاريخ الإيداع الفعلي"
    )

    # ═══ الحالة ═══
    status = models.CharField(
        max_length=20, choices=ObjectionStatus.choices,
        default=ObjectionStatus.DRAFT,
        verbose_name="الحالة"
    )

    # ═══ الجهة الناظرة ═══
    reviewer = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name="objections_reviewing",
        verbose_name="الجهة الناظرة"
    )
    review_started_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name="بدء الدراسة"
    )
    review_ended_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name="انتهاء الدراسة"
    )
    decision = models.CharField(
        max_length=20, blank=True,
        verbose_name="القرار (accepted/rejected)"
    )
    decision_reason = models.TextField(
        blank=True,
        verbose_name="تبرير القرار"
    )

    # ═══ للطعن القضائي ═══
    judicial_reference = models.CharField(
        max_length=100, blank=True,
        verbose_name="رقم القضية"
    )
    judicial_court = models.CharField(
        max_length=200, blank=True,
        verbose_name="المحكمة"
    )

    # ═══ الأمان (قانون 18-07) ═══
    checksum = models.CharField(
        max_length=64, blank=True,
        verbose_name="بصمة SHA-256"
    )
    objector_ip = models.GenericIPAddressField(
        null=True, blank=True,
        verbose_name="عنوان IP"
    )

    # ═══ Metadata ═══
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "طعن على الإسناد"
        verbose_name_plural = "الطعون على الإسناد"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tender", "status"]),
            models.Index(fields=["objector", "status"]),
            models.Index(fields=["deadline_at"]),
        ]

    def save(self, *args, **kwargs):
        # Auto-generate reference
        if not self.reference:
            year = timezone.now().year
            count = AwardObjection.objects.filter(
                created_at__year=year
            ).count() + 1
            self.reference = f"OBJ-{year}-{count:04d}"

        # Auto-calculate deadline (10 days)
        if not self.deadline_at and self.award_announced_at:
            self.deadline_at = self.award_announced_at + timedelta(days=10)

        # SHA-256 checksum
        if not self.checksum:
            content = f"{self.reference}|{self.tender_id}|{self.objector_id}|{self.description}"
            self.checksum = hashlib.sha256(content.encode("utf-8")).hexdigest()

        super().save(*args, **kwargs)

    def is_within_deadline(self):
        return self.days_remaining() > 0 or (self.deadline_at and timezone.now() <= self.deadline_at)

    def days_remaining(self):
        """
        حقل محسوب يعيد عدد الأيام المتبقية من أصل 10 بناءً على تاريخ تقديم الطعن.
        وفقاً لأحكام المادة 72 والمادة 82 من القانون رقم 23-12.
        """
        submission_date = self.submitted_at or getattr(self, "created_at", None)
        if submission_date:
            elapsed_days = (timezone.now() - submission_date).days
            return max(0, min(10, 10 - elapsed_days))
        if self.deadline_at:
            delta = self.deadline_at - timezone.now()
            return max(0, delta.days)
        return 0

    def __str__(self):
        return f"{self.reference} - {self.tender.reference_number}"


class ObjectionTimeline(models.Model):
    """سجل زمني لكل حدث في الطعن"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    objection = models.ForeignKey(
        AwardObjection,
        on_delete=models.CASCADE,
        related_name="timeline",
        verbose_name="الطعن"
    )
    event = models.CharField(
        max_length=50,
        verbose_name="الحدث"
    )
    actor = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.PROTECT,
        verbose_name="الفاعل"
    )
    notes = models.TextField(
        blank=True,
        verbose_name="ملاحظات"
    )
    metadata = models.JSONField(
        default=dict,
        verbose_name="بيانات إضافية"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "حدث الطعن"
        verbose_name_plural = "أحداث الطعون"
        ordering = ["created_at"]


class AwardDecision(models.Model):
    """قرار الإسناد المؤقت والطعون (المرحلة 08)"""
    APPEAL_STATUS_CHOICES = (
        ('none', 'لا توجد طعون'),
        ('pending', 'طعن قيد الدراسة أمام لجنة الصفقات'),
        ('accepted', 'تم قبول الطعن وإلغاء الإسناد المؤقت'),
        ('rejected', 'تم رفض الطعن وتثبيت الإسناد'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal = models.OneToOneField(ProcurementDeal, on_delete=models.CASCADE, related_name='award_decision', verbose_name='الصفقة')
    awarded_bid = models.ForeignKey(BidOffer, on_delete=models.CASCADE, related_name='awards', verbose_name='العرض الفائز بالإسناد')
    publication_date = models.DateField('تاريخ نشر الإسناد المؤقت', default=timezone.now)
    appeal_window_days = models.IntegerField('أجل الطعن القانوني (أيام)', default=10)
    appeal_status = models.CharField('وضعية الطعون', max_length=20, choices=APPEAL_STATUS_CHOICES, default='none')
    is_definitive = models.BooleanField('إسناد نهائي نافذ', default=False)
    justification = models.TextField('مبررات اختيار العرض الأفضل اقتصادياً', blank=True)
    created_at = models.DateTimeField('تاريخ التسجيل', default=timezone.now)

    class Meta:
        verbose_name = 'قرار إسناد'
        verbose_name_plural = 'قرارات الإسناد والطعون'

    def __str__(self):
        return f"إسناد {self.deal.reference_number} إلى {self.awarded_bid.operator.company_name or self.awarded_bid.operator.email}"


class Contract(models.Model):
    """العقد المبرم والالتزام المالي (المرحلة 09)"""
    STATUS_CHOICES = (
        ('draft', 'مسودة مشروع العقد'),
        ('signed_operator', 'موقع من المتعامل الاقتصادي'),
        ('signed_authority', 'موقع من المصلحة المتعاقدة'),
        ('approved_control', 'مؤشر من هيئة الرقابة الخارجية'),
        ('notified', 'مبلّغ بالأمر ببداية الخدمة (ODS)'),
        ('active', 'قيد التنفيذ والمتابعة'),
        ('completed', 'مستلم ومنجز كلياً'),
        ('terminated', 'مفسوخ تعاقدياً'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal = models.OneToOneField(ProcurementDeal, on_delete=models.CASCADE, related_name='contract', verbose_name='الصفقة المبرمة')
    awarded_operator = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='executed_contracts', verbose_name='المتعامل المتعاقد')
    contract_number = models.CharField('رقم العقد الرسمي', max_length=100, unique=True)
    signed_amount = models.DecimalField('المبلغ الإجمالي للصفقة (دج)', max_digits=15, decimal_places=2)
    duration_months = models.PositiveIntegerField('أجل الإنجاز بالشهور', default=12)
    ods_date = models.DateField('تاريخ الأمر ببداية الخدمة (ODS)', null=True, blank=True)
    status = models.CharField('وضعية العقد', max_length=30, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField('تاريخ التحرير', default=timezone.now)
    updated_at = models.DateTimeField('آخر تحديث', auto_now=True)

    class Meta:
        verbose_name = 'عقد صفقة'
        verbose_name_plural = 'العقود والصفقات المبرمة'

    def __str__(self):
        return f"عقد {self.contract_number} ({self.deal.reference_number})"
