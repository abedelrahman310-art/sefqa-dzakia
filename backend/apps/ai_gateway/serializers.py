from rest_framework import serializers
from .models import AIInsight, AIConversation, AIMessage


class AIInsightSerializer(serializers.ModelSerializer):
    """
    Serializer للتوصيات الذكية — للقراءة والعرض.
    """
    severity_display = serializers.CharField(source="get_severity_display", read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    resolved_by_email = serializers.CharField(
        source="resolved_by.email", read_only=True, default=None
    )

    class Meta:
        model = AIInsight
        fields = [
            "id",
            "severity",
            "severity_display",
            "category",
            "category_display",
            "title",
            "description",
            "related_tenders",
            "related_authorities",
            "related_operators",
            "recommendation",
            "action_url",
            "confidence",
            "is_advisory",
            "human_verification_required",
            "is_resolved",
            "resolved_at",
            "resolved_by",
            "resolved_by_email",
            "resolution_notes",
            "generated_at",
            "expires_at",
        ]
        read_only_fields = ["id", "generated_at", "is_advisory", "human_verification_required"]


class AIInsightResolveSerializer(serializers.Serializer):
    """
    Serializer لعملية معالجة وإغلاق التوصية بشكل رسمي من المسؤول البشري.
    """
    resolution_notes = serializers.CharField(
        required=True,
        min_length=10,
        max_length=2000,
        error_messages={
            "required": "ملاحظات المعالجة إلزامية لأغراض التدقيق والتوثيق القانوني.",
            "min_length": "ملاحظات المعالجة يجب أن تحتوي على 10 أحرف كحد أدنى.",
        },
    )


class AIChatRequestSerializer(serializers.Serializer):
    """
    Serializer لطلب المحادثة الاستشارية الذكية.
    """
    conversation_id = serializers.UUIDField(required=False, allow_null=True)
    message = serializers.CharField(
        min_length=3,
        max_length=1000,
        error_messages={
            "min_length": "الرسالة يجب أن تحتوي على 3 أحرف كحد أدنى.",
            "max_length": "الرسالة تتجاوز الحد الأقصى المسموح به (1000 حرف).",
        },
    )


class AIMessageSerializer(serializers.ModelSerializer):
    """
    Serializer لرسالة واحدة في المحادثة الذكية.
    """
    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = AIMessage
        fields = [
            "id",
            "role",
            "role_display",
            "content",
            "sources",
            "is_advisory",
            "tokens_used",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "is_advisory"]


class AIConversationSerializer(serializers.ModelSerializer):
    """
    Serializer للمحادثة كاملة مع الرسائل المتضمنة.
    """
    messages = AIMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AIConversation
        fields = ["id", "title", "created_at", "updated_at", "messages"]
        read_only_fields = ["id", "created_at", "updated_at"]


class SmartAlertItemSerializer(serializers.Serializer):
    """
    Serializer لعنصر تنبيه واحد في لوحة المؤشرات.
    """
    value = serializers.IntegerField()
    alert = serializers.ChoiceField(choices=["low", "medium", "high", "critical"])
    trend = serializers.IntegerField(required=False, default=0)
    message = serializers.CharField(required=False, allow_blank=True)


class SmartAlertsSerializer(serializers.Serializer):
    """
    Serializer لمجموعة التنبيهات الذكية المصاحبة لمؤشرات الأداء.
    يستقبل dict ديناميكي بدون قيود صارمة على الحقول الإضافية.
    """
    compliance_rate = SmartAlertItemSerializer()
    objections = SmartAlertItemSerializer()
    critical_tenders = SmartAlertItemSerializer()
    delayed_tenders = SmartAlertItemSerializer()


class SuspicionItemSerializer(serializers.Serializer):
    """
    Serializer لعنصر شبهة مكتشف من محركات التحليل.
    """
    type = serializers.CharField()
    severity = serializers.CharField()
    confidence = serializers.FloatField(required=False, default=0.5)
    title = serializers.CharField()
    description = serializers.CharField()
    recommendation = serializers.CharField(required=False, allow_blank=True)
    authority_id = serializers.CharField(required=False, allow_null=True)
    deal_ids = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    operator_ids = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    statutory_violation = serializers.CharField(required=False, allow_blank=True)
