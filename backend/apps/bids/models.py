import uuid
from django.db import models
from django.utils import timezone
from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal

class BidOffer(models.Model):
    """عرض المتعامل الاقتصادي"""
    STATUS_CHOICES = (
        ('draft', 'مسودة عرض'),
        ('submitted', 'تم الإيداع'),
        ('admitted', 'مقبول إدارياً وتقنياً'),
        ('evaluated', 'تم التقييم'),
        ('rejected', 'مرفوض لعدم المطابقة'),
        ('awarded', 'حائز على الصفقة'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    deal = models.ForeignKey(ProcurementDeal, on_delete=models.CASCADE, related_name='bids', verbose_name='الصفقة')
    operator = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='my_bids', verbose_name='المتعامل الاقتصادي')
    status = models.CharField('حالة العرض', max_length=30, choices=STATUS_CHOICES, default='draft')
    
    financial_amount = models.DecimalField('مبلغ العرض المالي (دج)', max_digits=15, decimal_places=2, null=True, blank=True)
    technical_score = models.DecimalField('العلامة التقنية الممنوحة', max_digits=5, decimal_places=2, null=True, blank=True)
    financial_score = models.DecimalField('العلامة المالية الممنوحة', max_digits=5, decimal_places=2, null=True, blank=True)
    rejection_reason = models.TextField('سبب الرفض أو عدم المطابقة', blank=True, default='')
    evaluator_notes = models.TextField('ملاحظات لجنة التقييم', blank=True, default='')
    submission_timestamp = models.DateTimeField('ختم وقت الإيداع الرقمي', null=True, blank=True)
    created_at = models.DateTimeField('تاريخ الإنشاء', default=timezone.now)

    class Meta:
        verbose_name = 'عرض أو عطاء'
        verbose_name_plural = 'العروض والعطاءات'
