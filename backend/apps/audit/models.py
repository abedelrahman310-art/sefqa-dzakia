import uuid
import hashlib
from django.db import models
from django.utils import timezone
from django.core.exceptions import PermissionDenied
from apps.users.models import CustomUser

class AuditLog(models.Model):
    """سجل التدقيق غير القابل للتعديل أو الحذف وفق متطلبات القانون 23-12"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_actions', verbose_name='المستخدم المنفذ')
    action = models.CharField('نوع العملية', max_length=100)
    resource_type = models.CharField('نوع الكيان أو الوثيقة', max_length=100)
    resource_id = models.CharField('معرف الكيان', max_length=100)
    description = models.TextField('بيان العملية الإدارية أو الرقابية')
    changes = models.JSONField('البيانات السابقة والجديدة', default=dict, blank=True)
    ip_address = models.GenericIPAddressField('عنوان IP', null=True, blank=True)
    timestamp = models.DateTimeField('ختم الوقت الرسمي', default=timezone.now, db_index=True)
    checksum = models.CharField('بصمة السلامة الرقمية (SHA-256)', max_length=64, blank=True)

    class Meta:
        verbose_name = 'سجل تدقيق قانوني'
        verbose_name_plural = 'سجلات التدقيق والتتبع'
        ordering = ['-timestamp']

    def save(self, *args, **kwargs):
        if self.pk and AuditLog.objects.filter(pk=self.pk).exists():
            raise PermissionDenied('سجلات التدقيق القانوني غير قابلة للتعديل بعد إنشائها وفق القانون 23-12.')
        if not self.checksum:
            content_to_hash = f"{self.id}:{self.action}:{self.resource_type}:{self.resource_id}:{self.timestamp.isoformat()}"
            self.checksum = hashlib.sha256(content_to_hash.encode('utf-8')).hexdigest()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionDenied('سجلات التدقيق القانوني غير قابلة للحذف نهائياً وفق القانون 23-12.')

    def __str__(self):
        return f"[{self.timestamp}] {self.action} on {self.resource_type} ({self.resource_id})"
