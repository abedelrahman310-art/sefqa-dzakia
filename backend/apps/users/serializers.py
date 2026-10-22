from rest_framework import serializers
from .models import CustomUser

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

