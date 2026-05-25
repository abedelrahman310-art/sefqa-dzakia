from django.db import models
from django.conf import settings


class PDFDocument(models.Model):
    """Model for storing uploaded PDF documents."""
    
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='analysis/pdfs/')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    file_size = models.BigIntegerField(help_text='File size in bytes')
    page_count = models.IntegerField(default=0)
    analysis_status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ], default='pending')
    analysis_result = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = 'PDF Document'
        verbose_name_plural = 'PDF Documents'
        ordering = ['-uploaded_at']
