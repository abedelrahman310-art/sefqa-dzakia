from rest_framework import serializers
from .models import CustomUser, Notification

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'display_name', 'organization_name', 'role', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=['operator', 'authority'])
    fullName = serializers.CharField(required=False, allow_blank=True, max_length=150)
    name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    company = serializers.CharField(required=False, allow_blank=True, max_length=255)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=50)
    wilaya = serializers.CharField(required=False, allow_blank=True, max_length=50)
    legalForm = serializers.CharField(required=False, allow_blank=True, max_length=50)
    rc = serializers.CharField(required=False, allow_blank=True, max_length=50)
    nif = serializers.CharField(required=False, allow_blank=True, max_length=50)
    nis = serializers.CharField(required=False, allow_blank=True, max_length=50)
    category = serializers.CharField(required=False, allow_blank=True, max_length=50)
    tutelle = serializers.CharField(required=False, allow_blank=True, max_length=150)
    code = serializers.CharField(required=False, allow_blank=True, max_length=50)
    address = serializers.CharField(required=False, allow_blank=True, max_length=255)

    def validate_email(self, value):
        normalized = value.strip().lower()
        if CustomUser.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError('البريد الإلكتروني مسجل بالفعل في المنصة')
        return normalized

    def validate_role(self, value):
        if value not in ['operator', 'authority']:
            raise serializers.ValidationError('الدور المحدد غير مسموح بالتسجيل الذاتي به')
        return value


class NotificationSerializer(serializers.ModelSerializer):
    """محدد بيانات الإشعارات للمستخدم مع التوافق الكامل مع الواجهة ثنائية اللغة"""
    titleAr = serializers.CharField(source='title', read_only=True)
    titleFr = serializers.CharField(source='title', read_only=True)
    descAr = serializers.CharField(source='text', read_only=True)
    descFr = serializers.CharField(source='text', read_only=True)
    description = serializers.CharField(source='text', read_only=True)
    message = serializers.CharField(source='text', read_only=True)
    isRead = serializers.BooleanField(source='is_read', read_only=True)
    date = serializers.DateTimeField(source='created_at', format='%Y-%m-%dT%H:%M:%S%z', read_only=True)
    type = serializers.CharField(source='notification_type', required=False)
    linkHref = serializers.CharField(source='link_href', required=False, allow_blank=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'title',
            'titleAr',
            'titleFr',
            'text',
            'descAr',
            'descFr',
            'description',
            'message',
            'is_read',
            'isRead',
            'notification_type',
            'type',
            'link_href',
            'linkHref',
            'created_at',
            'date',
        ]
        read_only_fields = ['id', 'created_at']


