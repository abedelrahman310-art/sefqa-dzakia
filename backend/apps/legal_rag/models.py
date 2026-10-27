from django.db import models
from pgvector.django import VectorField


class LegalArticle(models.Model):
    """
    نموذج المادة القانونية في المنظومة التشريعية الجزائرية للصفقات العمومية
    (القانون رقم 23-12 والمرسوم الرئاسي رقم 15-247)
    مهيأ للبحث الدلالي والتقاطيع الشعاعية (Vector Search & RAG).
    """
    law_source = models.CharField(
        "المصدر القانوني",
        max_length=255,
        db_index=True,
        help_text="مثال: القانون رقم 23-12 أو المرسوم الرئاسي رقم 15-247",
    )
    article_number = models.CharField(
        "رقم المادة",
        max_length=100,
        db_index=True,
        help_text="مثال: المادة 67 أو Article 1er",
    )
    title = models.CharField(
        "عنوان أو موضوع المادة",
        max_length=255,
        blank=True,
        default="",
    )
    chapter = models.CharField(
        "الباب أو الفصل",
        max_length=255,
        blank=True,
        default="",
    )
    content = models.TextField("النص الأصلي الكامل للمادة")
    embedding = VectorField(
        "التضمين الشعاعي (Vector Embedding)",
        dimensions=384,
        null=True,
        blank=True,
        help_text="تضمين شعاعي من 384 بعداً لمطابقة التشابه الدلالي (Cosine Similarity)",
    )

    created_at = models.DateTimeField("تاريخ الإنشاء", auto_now_add=True)
    updated_at = models.DateTimeField("تاريخ التحديث", auto_now=True)

    class Meta:
        verbose_name = "مادة قانونية"
        verbose_name_plural = "المواد القانونية"
        ordering = ["law_source", "id"]
        indexes = [
            models.Index(fields=["law_source", "article_number"]),
        ]

    def __str__(self):
        return f"{self.law_source} - {self.article_number}"
