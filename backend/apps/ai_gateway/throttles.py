from rest_framework.throttling import UserRateThrottle


class AIChatThrottle(UserRateThrottle):
    """
    تحديد معدل استهلاك خدمة المحادثة الذكية.
    20 طلب / ساعة للمستخدم الواحد.
    """
    scope = "ai_chat"
    rate = "20/hour"


class AIInsightsThrottle(UserRateThrottle):
    """
    تحديد معدل استهلاك خدمة توليد التوصيات الذكية.
    10 طلبات / ساعة لتجنب استنزاف موارد الحوسبة.
    """
    scope = "ai_insights"
    rate = "10/hour"
