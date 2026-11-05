import logging
from django.db import connection
from django.core.cache import cache
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

logger = logging.getLogger(__name__)


class HealthCheckView(APIView):
    """
    نقطة فحص الجاهزية والحالة الصحية (Health Check Endpoint)
    تستخدم للتحقق التلقائي لحاويات Docker Orchestration و Nginx Reverse Proxy.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        health_status = {
            "status": "healthy",
            "service": "safaqat-backend",
            "timestamp": timezone.now().isoformat(),
            "database": "unknown",
            "cache": "unknown",
        }

        # 1. فحص الاتصال بقاعدة البيانات
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                row = cursor.fetchone()
                if row and row[0] == 1:
                    health_status["database"] = "connected"
                else:
                    health_status["database"] = "unexpected_response"
        except Exception as e:
            logger.error("HealthCheck Database error: %s", str(e))
            health_status["database"] = "disconnected"
            health_status["status"] = "unhealthy"

        # 2. فحص الاتصال بذاكرة Redis / التخزين المؤقت
        try:
            cache.set("__health_check_ping__", "pong", timeout=5)
            pong = cache.get("__health_check_ping__")
            if pong == "pong":
                health_status["cache"] = "connected"
            else:
                health_status["cache"] = "unexpected_response"
        except Exception as e:
            logger.warning("HealthCheck Cache error: %s", str(e))
            health_status["cache"] = "degraded"

        http_code = (
            status.HTTP_200_OK
            if health_status["status"] == "healthy"
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )
        return Response(health_status, status=http_code)
