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


class ElectronicSignature(models.Model):
    """
    التوقيع الإلكتروني المؤهل وفق أحكام القانون رقم 15-04
    المؤرخ في 11 ربيع الثاني عام 1436 الموافق 01 فبراير 2015
    المحدد للقواعد العامة المتعلقة بالتوقيع والتصديق الإلكترونيين.
    """
    ALGORITHM_CHOICES = (
        ('RSA-PSS-SHA256', 'RSA-PSS-SHA256 (معياري PKI)'),
        ('ECDSA-SHA256', 'ECDSA-SHA256 (منحنيات بيضاوية)'),
        ('ED25519', 'Ed25519 (عالي الأمان)'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bid = models.ForeignKey(
        BidOffer,
        on_delete=models.CASCADE,
        related_name='signatures',
        verbose_name='العرض الموقع'
    )
    signer = models.ForeignKey(
        CustomUser,
        on_delete=models.PROTECT,
        related_name='digital_signatures',
        verbose_name='الموقع'
    )
    signer_name = models.CharField('الاسم الكامل للموقع', max_length=200)
    signer_role = models.CharField('الصفة التمثيلية للموقع', max_length=150, default='الممثل القانوني للمتعامل الاقتصادي')
    signer_nif = models.CharField('الرقم التعريفي الجبائي NIF', max_length=30, blank=True, default='')
    
    certificate_serial = models.CharField('الرقم التسلسلي لشهادة التصديق', max_length=120)
    certificate_issuer = models.CharField(
        'جهة إصدار الشهادة (السلطة الوطنية للتصديق)',
        max_length=255,
        default='السلطة الوطنية للتصديق الإلكتروني (ARPECE / سلطة التصديق الحكومية)'
    )
    
    signed_data_hash = models.CharField('بصمة البيانات الموقعة SHA-256', max_length=64)
    signature_value = models.TextField('قيمة التوقيع الرقمي المشفر (Base64)')
    signature_algorithm = models.CharField('خوارزمية التوقيع', max_length=30, choices=ALGORITHM_CHOICES, default='RSA-PSS-SHA256')
    
    timestamp_token = models.TextField('رمز الختم الزمني المعتمد (Time-Stamp Token)')
    legal_framework = models.CharField(
        'السند القانوني للتوقيع',
        max_length=255,
        default='القانون رقم 15-04 المؤرخ في 01 فبراير 2015 يحدد القواعد العامة المتعلقة بالتوقيع والتصديق الإلكترونيين'
    )
    
    is_valid = models.BooleanField('صحة وسلامة التوقيع', default=True)
    verification_metadata = models.JSONField('بيانات التحقق والتدقيق', default=dict, blank=True)
    created_at = models.DateTimeField('تاريخ وتوقيت التوقيع الرقمي', default=timezone.now)

    class Meta:
        verbose_name = 'توقيع إلكتروني مؤهل'
        verbose_name_plural = 'التواقيع الإلكترونية المؤهلة'
        ordering = ['-created_at']

    def __str__(self):
        return f"توقيع {self.signer_name} على العرض {self.bid_id} ({self.certificate_serial})"
