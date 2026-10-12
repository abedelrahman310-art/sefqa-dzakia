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
