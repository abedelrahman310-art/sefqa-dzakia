import uuid
from django.db import models
from apps.users.models import CustomUser


class AIInsight(models.Model):
    """توصية ذكية مُولّدة بواسطة الذكاء الاصطناعي وفق الإطار القانوني 23-12 و18-07"""

    class Severity(models.TextChoices):
        CRITICAL = "critical", "حرجة"
        HIGH = "high", "عالية"
        MEDIUM = "medium", "متوسطة"
        LOW = "low", "منخفضة"
        INFO = "info", "معلومات"

    class Category(models.TextChoices):
        FRAUD_SUSPICION = "fraud_suspicion", "شبهة فساد"
        PRICE_ANOMALY = "price_anomaly", "سعر شاذ"
        DELAY = "delay", "تأخير"
        COMPLIANCE = "compliance", "امتثال"
        PATTERN = "pattern", "نمط مشبوه"
        RECOMMENDATION = "recommendation", "توصية"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    severity = models.CharField("مستوى الخطورة", max_length=20, choices=Severity.choices)
    category = models.CharField("التصنيف الرقابي", max_length=20, choices=Category.choices)
    title = models.CharField("عنوان التوصية أو التنبيه", max_length=200)
    description = models.TextField("التفاصيل والتحليل الاستشاري")

    # المصادر والارتباطات
    related_tenders = models.JSONField("الصفقات المرتبطة", default=list, blank=True)
    related_authorities = models.JSONField("المصالح المتعاقدة المرتبطة", default=list, blank=True)
    related_operators = models.JSONField("المتعاملون الاقتصاديون المرتبطون", default=list, blank=True)

    # المصلحة المستهدفة بالتحليل (اختياري للتحليلات الموجهة لبوابة المصلحة المتعاقدة)
    target_authority = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="targeted_ai_insights",
        verbose_name="المصلحة المستهدفة",
    )

    # التوصيات والإجراءات المقترحة
    recommendation = models.TextField("التوصية الإجرائية المقترحة", blank=True)
    action_url = models.URLField("رابط الإجراء الميداني", blank=True)

    # الثقة والمحددات القانونية الصارمة
    confidence = models.FloatField("درجة الثقة الخوارزمية", default=0.5)
    is_advisory = models.BooleanField("طابع استشاري حصري (لا يقرر)", default=True)
    human_verification_required = models.BooleanField("يتطلب تحققاً بشرياً إلزامياً", default=True)

    # حالة المعالجة والمتابعة الرقابية
    is_resolved = models.BooleanField("تمت المعالجة أو التدقيق", default=False)
    resolved_at = models.DateTimeField("تاريخ المعالجة", null=True, blank=True)
    resolved_by = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="resolved_insights",
        verbose_name="المسؤول المدقق",
    )
    resolution_notes = models.TextField("ملاحظات المعالجة والتدقيق البشري", blank=True)

    # Metadata
    generated_at = models.DateTimeField("تاريخ التوليد", auto_now_add=True)
    expires_at = models.DateTimeField("تاريخ انتهاء الصلاحية", null=True, blank=True)

    class Meta:
        verbose_name = "توصية ذكية"
        verbose_name_plural = "التوصيات الذكية"
        ordering = ["-generated_at"]
        indexes = [
            models.Index(fields=["severity", "is_resolved"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self):
        return f"[{self.get_severity_display()}] {self.title} ({self.get_category_display()})"


class AIConversation(models.Model):
    """محادثة ذكية للإدارة المركزية أو المصلحة المتعاقدة"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="ai_conversations",
        verbose_name="المستخدم",
    )
    title = models.CharField("عنوان المحادثة", max_length=200, blank=True)

    created_at = models.DateTimeField("تاريخ البدء", auto_now_add=True)
    updated_at = models.DateTimeField("آخر تحديث", auto_now=True)

    class Meta:
        verbose_name = "محادثة ذكية"
        verbose_name_plural = "المحادثات الذكية"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"محادثة: {self.title or str(self.id)[:8]} ({self.user.email})"


class AIMessage(models.Model):
    """رسالة في محادثة الذكاء الاصطناعي"""

    class Role(models.TextChoices):
        USER = "user", "مستخدم"
        ASSISTANT = "assistant", "مساعد"
        SYSTEM = "system", "نظام"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        AIConversation,
        on_delete=models.CASCADE,
        related_name="messages",
        verbose_name="المحادثة",
    )
    role = models.CharField("الدور", max_length=20, choices=Role.choices)
    content = models.TextField("محتوى الرسالة")

    # للردود الصادرة وسجل التدقيق
    context_used = models.JSONField("السياق والبيانات المستخرجة", default=dict, blank=True)
    sources = models.JSONField("المراجع والصفقات المستند إليها", default=list, blank=True)
    tokens_used = models.IntegerField("عدد الرموز المستهلكة", default=0)
    is_advisory = models.BooleanField("طابع استشاري حصري", default=True)

    created_at = models.DateTimeField("تاريخ الإنشاء", auto_now_add=True)

    class Meta:
        verbose_name = "رسالة ذكية"
        verbose_name_plural = "الرسائل الذكية"
        ordering = ["created_at"]

    def __str__(self):
        return f"[{self.get_role_display()}] {self.content[:40]}..."
