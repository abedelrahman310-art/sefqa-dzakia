"""
نظام المصادقة الرسمي لمنصة صفقات ذكية وفق المعايير الأمنية.
تم إلغاء CsrfExemptSessionAuthentication نهائياً والاعتماد الحصري على الرموز المشفرة JWT
(JSON Web Tokens) عبر Bearer Authentication لحماية المنصة من ثغرات CSRF.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication

__all__ = ['JWTAuthentication']
