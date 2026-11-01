import uuid
from django.db import models
from django.utils import timezone
from apps.contracts.models import Contract

class ExecutionMilestone(models.Model):
    """محطات ومراحل الإنجاز الفعلي (المرحلة 10)"""
    STATUS_CHOICES = (
        ('pending', 'قيد الانتظار'),
        ('in_progress', 'جارية الإنجاز'),
        ('submitted_for_review', 'مقدمة للمعاينة'),
        ('approved', 'معتمدة ومستلمة جزئياً'),
        ('delayed', 'متأخرة عن الجدول التعاقدي'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='milestones', verbose_name='العقد')
    title = models.CharField('عنوان المرحلة أو الورشة', max_length=200)
    description = models.TextField('تفاصيل الأعمال المطلوبة', blank=True)
    planned_completion_date = models.DateField('تاريخ الإنجاز المخطط')
    actual_completion_date = models.DateField('تاريخ الإنجاز الفعلي', null=True, blank=True)
    progress_percentage = models.PositiveIntegerField('نسبة التقدم المادي (%)', default=0)
    status = models.CharField('حالة الإنجاز', max_length=30, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField('تاريخ التسجيل', default=timezone.now)

    class Meta:
        verbose_name = 'محطة إنجاز'
        verbose_name_plural = 'محطات الإنجاز والمتابعة'
        ordering = ['planned_completion_date']


class ContractAmendment(models.Model):
    """ملاحق الصفقة (Avenants) وفق القانون 23-12 (المرحلة 10)"""
    STATUS_CHOICES = (
        ('draft', 'مشروع ملحق قيد الصياغة'),
        ('submitted_committee', 'معروض على لجنة الصفقات المختصة'),
        ('approved', 'مصادق عليه ومبرم رسمياً'),
        ('rejected', 'مرفوض من هيئة الرقابة'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='amendments', verbose_name='العقد الأصلي')
    amendment_number = models.PositiveIntegerField('رقم الملحق التعاقدي', default=1)
    object_clause = models.CharField('موضوع الملحق', max_length=255)
    financial_impact = models.DecimalField('الأثر المالي بالزيادة أو النقصان (دج)', max_digits=15, decimal_places=2, default=0)
    duration_extension_days = models.IntegerField('أثر المدة الزمنية (بالأيام)', default=0)
    justification = models.TextField('الأسباب القانونية والتقنية الطارئة للملحق')
    status = models.CharField('وضعية الملحق', max_length=30, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField('تاريخ التحرير', default=timezone.now)

    class Meta:
        verbose_name = 'ملحق صفقة'
        verbose_name_plural = 'ملاحق الصفقات (Avenants)'


class ReceptionProcess(models.Model):
    """محاضر الاستلام المؤقت والنهائي (المرحلة 11)"""
    RECEPTION_TYPES = (
        ('provisional', 'استلام مؤقت (PV de réception provisoire)'),
        ('final', 'استلام نهائي وإبراء الضمان (PV de réception définitive)'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='receptions', verbose_name='العقد')
    reception_type = models.CharField('نوع محضر الاستلام', max_length=20, choices=RECEPTION_TYPES, default='provisional')
    reception_date = models.DateField('تاريخ المعاينة والاستلام', default=timezone.localdate)
    committee_members = models.TextField('أعضاء لجنة المعاينة والاستلام', blank=True)
    reservations = models.TextField('التحفظات والملاحظات المسجلة إن وجدت', blank=True)
    is_accepted_without_reservation = models.BooleanField('استلام بدون تحفظ', default=True)
    guarantee_release_approved = models.BooleanField('رفع اليد عن كفالة الضمان / حسن التنفيذ', default=False)
    created_at = models.DateTimeField('تاريخ المحضر', default=timezone.now)

    class Meta:
        verbose_name = 'محضر استلام'
        verbose_name_plural = 'محاضر الاستلام المؤقت والنهائي'


class PaymentSituation(models.Model):
    """كشوف الحساب ووضعيات الدفع والأداء المالي (المرحلة 12)"""
    STATUS_CHOICES = (
        ('submitted_by_operator', 'مقدمة من المتعامل الاقتصادي'),
        ('verified_by_cpc', 'معاينة ومثبتة من مكتب الدراسات/المصلحة'),
        ('mandated_treasury', 'تم إصدار الحوالة للدفع (Mandatement)'),
        ('paid', 'تم الدفع الفعلي من الخزينة'),
        ('disputed', 'محل اعتراض أو تصحيح محاسبي'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='payments', verbose_name='العقد')
    situation_number = models.PositiveIntegerField('رقم وضعية الدفع', default=1)
    period_start = models.DateField('بداية الفترة المحاسبية')
    period_end = models.DateField('نهاية الفترة المحاسبية')
    gross_amount = models.DecimalField('المبلغ الإجمالي المنجز (دج)', max_digits=15, decimal_places=2)
    deductions = models.DecimalField('الخصومات واقتطاعات الضمان (دج)', max_digits=15, decimal_places=2, default=0)
    net_payable_amount = models.DecimalField('المبلغ الصافي المستحق للدفع (دج)', max_digits=15, decimal_places=2)
    status = models.CharField('حالة الوضعية والدفع', max_length=30, choices=STATUS_CHOICES, default='submitted_by_operator')
    payment_reference = models.CharField('رقم حوالة الخزينة العمومية', max_length=100, blank=True)
    created_at = models.DateTimeField('تاريخ التقديم', default=timezone.now)

    class Meta:
        verbose_name = 'وضعية دفع'
        verbose_name_plural = 'كشوف الحساب ووضعيات الدفع'
