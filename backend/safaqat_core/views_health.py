import os
import time
import logging
from datetime import timedelta
from django.db import connection
from django.core.cache import cache
from django.utils import timezone
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from apps.users.permissions import IsCentralAdmin

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


class PlatformHealthDetailView(APIView):
    """
    لوحة صحة المنصة التشغيلية الكاملة (Platform Operations Dashboard).
    حصرية لموظفي ومسؤولي الإدارة المركزية والرقابة والمشرف العام (Law 23-12).
    """
    permission_classes = [IsAuthenticated, IsCentralAdmin]
    throttle_classes = []

    def get(self, request):
        checks = {}

        # 1. فحص قاعدة البيانات
        db_start = time.perf_counter()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                row = cursor.fetchone()
            db_latency = round((time.perf_counter() - db_start) * 1000, 2)
            checks['database'] = {
                'status': 'operational' if row and row[0] == 1 else 'degraded',
                'latency_ms': db_latency,
                'engine': connection.vendor,
                'name': connection.settings_dict.get('NAME', 'unknown'),
            }
        except Exception as e:
            logger.error("PlatformHealth: DB check failed: %s", str(e))
            checks['database'] = {
                'status': 'down',
                'error': str(e),
                'latency_ms': None,
                'engine': getattr(connection, 'vendor', 'unknown'),
            }

        # 2. فحص ذاكرة التخزين المؤقت (Redis / Cache)
        cache_start = time.perf_counter()
        try:
            cache.set('__safaqat_ops_health__', 'ok', timeout=10)
            cache_ok = cache.get('__safaqat_ops_health__') == 'ok'
            cache_latency = round((time.perf_counter() - cache_start) * 1000, 2)
            checks['cache'] = {
                'status': 'operational' if cache_ok else 'degraded',
                'latency_ms': cache_latency,
                'backend': settings.CACHES.get('default', {}).get('BACKEND', '').split('.')[-1],
            }
        except Exception as e:
            logger.warning("PlatformHealth: Cache check failed: %s", str(e))
            checks['cache'] = {
                'status': 'down',
                'error': str(e),
                'latency_ms': None,
            }

        # 3. محرك الذكاء الاصطناعي (AI Gateway)
        try:
            from apps.ai_gateway.services.llm_client import get_llm_client
            ai_client = get_llm_client()
            provider_type = ai_client.__class__.__name__
            provider_names = {
                'GeminiProvider': 'Google Gemini (Cloud)',
                'AnthropicProvider': 'Anthropic Claude (Cloud)',
                'OpenAIProvider': 'OpenAI GPT (Cloud)',
                'RuleBasedFallback': 'محرك القواعد الرقابية المحلي (Rule-Based Engine)',
            }
            provider_label = provider_names.get(provider_type, provider_type)

            ai_start = time.perf_counter()
            ai_ok = ai_client.test_connection()
            ai_latency = round((time.perf_counter() - ai_start) * 1000, 2)

            checks['ai_engine'] = {
                'status': 'operational' if ai_ok else 'degraded',
                'provider': provider_label,
                'provider_key': provider_type,
                'latency_ms': ai_latency,
            }
        except Exception as e:
            logger.warning("PlatformHealth: AI check failed: %s", str(e))
            checks['ai_engine'] = {
                'status': 'degraded',
                'error': str(e),
                'provider': 'محرك القواعد الرقابية المحلي (Rule-Based Fallback)',
            }

        # 4. موارد خادم التطبيق (Application Server Resources)
        try:
            import psutil
            root_path = os.path.abspath(os.sep)
            disk_info = psutil.disk_usage(root_path)
            vm = psutil.virtual_memory()

            checks['server'] = {
                'status': 'operational',
                'cpu_percent': psutil.cpu_percent(interval=None),
                'cpu_cores': psutil.cpu_count(logical=True),
                'ram_percent': vm.percent,
                'ram_used_gb': round((vm.total - vm.available) / (1024 ** 3), 2),
                'ram_total_gb': round(vm.total / (1024 ** 3), 2),
                'disk_percent': disk_info.percent,
                'disk_free_gb': round(disk_info.free / (1024 ** 3), 2),
                'disk_total_gb': round(disk_info.total / (1024 ** 3), 2),
                'platform': os.name,
            }
            if (
                checks['server']['cpu_percent'] > 95
                or checks['server']['ram_percent'] > 95
                or checks['server']['disk_percent'] > 95
            ):
                checks['server']['status'] = 'degraded'
        except Exception as e:
            logger.warning("PlatformHealth: Server stats failed: %s", str(e))
            checks['server'] = {'status': 'unknown', 'error': str(e)}

        # 5. طبقة الاتصال الفوري والمهام الخلفية (Channels / Celery)
        try:
            from channels.layers import get_channel_layer
            layer = get_channel_layer()
            if layer is not None:
                checks['realtime_channels'] = {
                    'status': 'operational',
                    'backend': layer.__class__.__name__,
                }
            else:
                checks['realtime_channels'] = {
                    'status': 'not_configured',
                    'backend': 'None',
                }
        except Exception:
            checks['realtime_channels'] = {'status': 'not_configured'}

        # Celery (اختياري في حال تم تفعيله بوجود Broker)
        try:
            if hasattr(settings, 'CELERY_BROKER_URL'):
                from celery import current_app
                stats = current_app.control.inspect(timeout=0.2).stats()
                workers = len(stats) if stats else 0
                checks['celery'] = {
                    'status': 'operational' if workers > 0 else 'degraded',
                    'workers': workers,
                }
            else:
                checks['celery'] = {'status': 'not_configured', 'note': 'مُستبدل بـ Django Channels'}
        except Exception:
            checks['celery'] = {'status': 'not_configured', 'note': 'مُستبدل بـ Django Channels'}

        # 6. آخر الحوادث وسجلات التدقيق (Incidents & Audit Log 24h)
        since_24h = timezone.now() - timedelta(hours=24)
        recent_incidents = 0
        total_actions_24h = 0
        critical_ai_insights = 0

        # لا نحاول الاستعلام عن السجلات إذا كانت قاعدة البيانات متعطلة لتجنب انتظار مهلة الاتصال
        if checks.get('database', {}).get('status') == 'operational':
            try:
                from apps.audit.models import AuditLog
                total_actions_24h = AuditLog.objects.filter(timestamp__gte=since_24h).count()
                recent_incidents = AuditLog.objects.filter(
                    timestamp__gte=since_24h,
                    action__in=['error', 'critical', 'revoked', 'excluded', 'security_violation', 'tampering_detected'],
                ).count()
            except Exception as e:
                logger.warning("PlatformHealth: AuditLog query failed: %s", str(e))

            try:
                from apps.ai_gateway.models import AIInsight
                critical_ai_insights = AIInsight.objects.filter(
                    is_resolved=False,
                    severity='critical',
                ).count()
            except Exception as e:
                logger.debug("PlatformHealth: AIInsight query failed: %s", str(e))

        # 7. التقييم الإجمالي لصحة المنصة
        overall = 'operational'
        # Ignore celery in overall status since Celery is optional/replaced by channels
        eval_checks = {k: v for k, v in checks.items() if k != 'celery'}
        statuses = [c.get('status') for c in eval_checks.values() if isinstance(c, dict)]
        if any(s == 'down' for s in statuses):
            overall = 'critical'
        elif any(s == 'degraded' for s in statuses):
            overall = 'degraded'

        return Response({
            'overall_status': overall,
            'checks': checks,
            'recent_incidents_24h': recent_incidents,
            'critical_ai_insights': critical_ai_insights,
            'total_actions_24h': total_actions_24h,
            'server_time': timezone.now().isoformat(),
            'platform_version': 'Safaqat v2.0 (Law 23-12)',
            'environment': 'development' if settings.DEBUG else 'production',
        })
