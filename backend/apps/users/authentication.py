from rest_framework.authentication import SessionAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    جلسة مصادقة معفية من فحص CSRF لواجهات البرمجة التطبيقية (API)
    التي تعتمد على الرموز المشفرة JWT والمصادقة الرأسية (Bearer Tokens).
    تمنع فشل تسجيل الدخول عند وجود ملفات تعريف ارتباط متبقية من جلسات سابقة.
    """
    def enforce_csrf(self, request):
        return  # تجاوز فحص CSRF لواجهات REST API
