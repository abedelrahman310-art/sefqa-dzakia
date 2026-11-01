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
    50 طلب / ساعة لتجنب أخطاء 429 أثناء العروض التقديمية.
    """
    scope = "ai_insights"
    rate = "50/hour"


class AIAnalyzeTenderThrottle(UserRateThrottle):
    """
    تحديد معدل استهلاك خدمة تحليل دفتر الشروط للمتعامل (Analyze Tender).
    50 طلب / ساعة لتجنب أخطاء 429 أثناء العروض التقديمية والعمليات المكثفة.
    """
    scope = "ai_analyze_tender"
    rate = "50/hour"
