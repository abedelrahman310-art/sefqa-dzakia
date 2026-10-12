import uuid
from django.db import models
from django.utils import timezone
from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal
from apps.bids.models import BidOffer

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
        return f"إسناد {self.deal.reference_number} إلى {self.awarded_bid.operator.company_name or self.awarded_bid.operator.username}"


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
