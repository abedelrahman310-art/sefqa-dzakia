import uuid
from decimal import Decimal
from django.db import models
from django.utils import timezone
from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal
from apps.bids.security import encrypt_data, decrypt_data

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
    encrypted_financial_amount = models.TextField('مبلغ العرض المشفر بـ AES-256', null=True, blank=True)
    is_encrypted = models.BooleanField('هل العرض مشفر ومختوم', default=True)
    
    technical_score = models.DecimalField('العلامة التقنية الممنوحة', max_digits=5, decimal_places=2, null=True, blank=True)
    financial_score = models.DecimalField('العلامة المالية الممنوحة', max_digits=5, decimal_places=2, null=True, blank=True)
    rejection_reason = models.TextField('سبب الرفض أو عدم المطابقة', blank=True, default='')
    evaluator_notes = models.TextField('ملاحظات لجنة التقييم', blank=True, default='')
    submission_timestamp = models.DateTimeField('ختم وقت الإيداع الرقمي', null=True, blank=True)
    created_at = models.DateTimeField('تاريخ الإنشاء', default=timezone.now)

    class Meta:
        verbose_name = 'عرض أو عطاء'
        verbose_name_plural = 'العروض والعطاءات'

    def save(self, *args, **kwargs):
        # الختم التشفيري بـ AES-256 قبل الحفظ في قاعدة البيانات
        if self.financial_amount is not None:
            try:
                self.encrypted_financial_amount = encrypt_data(str(self.financial_amount))
            except Exception:
                pass
        super().save(*args, **kwargs)

    def decrypt_financial_amount(self):
        """فك تشفير المبلغ المالي AES-256 عند فتح الأظرفة"""
        if self.encrypted_financial_amount:
            try:
                decrypted = decrypt_data(self.encrypted_financial_amount)
                return Decimal(decrypted)
            except Exception:
                pass
        return self.financial_amount
