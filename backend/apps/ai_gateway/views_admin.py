import logging

from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import AIInsight, MarketPriceReference
from .serializers import (
    AIInsightSerializer,
    AIInsightResolveSerializer,
    AIChatRequestSerializer,
    SmartAlertsSerializer,
    PriceEstimateRequestSerializer,
)
from rest_framework.permissions import IsAuthenticated
from .permissions import IsAdminCenter, IsAuthorityOrAdmin
from .throttles import AIChatThrottle, AIInsightsThrottle
from .services.central_insights import generate_central_insights, generate_authority_insights
from .services.suspicion_detector import get_all_suspicions
from .services.admin_assistant import chat_with_admin
from .services.smart_alerts import generate_smart_alerts
from .services.llm_client import get_llm_client
from .services.price_estimator import (
    estimate_price,
    estimate_from_description,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Central Admin (الرقابة الوطنية) Views
# ─────────────────────────────────────────────────────────────────────────────

class CentralInsightsView(APIView):
    """
    GET /api/ai/central/insights/
    قائمة التوصيات الذكية النشطة للإدارة المركزية والرقابة الوطنية.
    يدعم الفلترة بـ ?severity=critical&category=fraud_suspicion
    """
    permission_classes = [IsAdminCenter]

    def get(self, request):
        queryset = AIInsight.objects.filter(
            target_authority__isnull=True,  # خاص بالرقابة المركزية (ليست موجهة لمصلحة بعينها)
            is_resolved=False,
        )

        severity = request.query_params.get("severity")
        category = request.query_params.get("category")
        if severity:
            queryset = queryset.filter(severity=severity)
        if category:
            queryset = queryset.filter(category=category)

        queryset = queryset.order_by("-generated_at")[:50]
        return Response(AIInsightSerializer(queryset, many=True).data)


class GenerateInsightsView(APIView):
    """
    POST /api/ai/central/insights/generate/
    تشغيل تحليل المنصة وتوليد توصيات ذكية جديدة.
    مقيد بـ AIInsightsThrottle (10 طلبات/ساعة).
    """
    permission_classes = [IsAdminCenter]
    throttle_classes = [AIInsightsThrottle]

    def post(self, request):
        insights = generate_central_insights()
        return Response(
            {
                "generated": len(insights),
                "is_advisory": True,
                "insights": AIInsightSerializer(insights, many=True).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ResolveInsightView(APIView):
    """
    POST /api/ai/central/insights/{id}/resolve/
    معالجة وإغلاق توصية ذكية بعد التدقيق البشري الإلزامي.
    """
    permission_classes = [IsAdminCenter]

    def post(self, request, pk):
        insight = get_object_or_404(AIInsight, pk=pk)

        if insight.is_resolved:
            return Response(
                {"detail": "هذه التوصية تمت معالجتها مسبقاً من قِبل المسؤول المختص."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AIInsightResolveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        insight.is_resolved = True
        insight.resolved_at = timezone.now()
        insight.resolved_by = request.user
        insight.resolution_notes = serializer.validated_data["resolution_notes"]
        insight.save()

        logger.info(
            f"تمت معالجة التوصية الذكية [{insight.id}] من قِبل المسؤول [{request.user.email}]"
        )

        return Response(AIInsightSerializer(insight).data)


class SuspicionsView(APIView):
    """
    GET /api/ai/central/suspicions/
    قائمة مؤشرات الشبهات المكتشفة (تواطؤ، أسعار، منافسة وهمية، تنازع مصالح).
    جميع النتائج استشارية وتستلزم تحققاً بشرياً.
    """
    permission_classes = [IsAdminCenter]

    def get(self, request):
        suspicions = get_all_suspicions()
        total = sum(len(v) for v in suspicions.values())
        return Response({
            "is_advisory": True,
            "human_verification_required": True,
            "statutory_reference": "القانون 23-12 — مبدأ الشفافية والمنافسة الحرة",
            "total_suspicions": total,
            "suspicions": suspicions,
        })


class AdminChatView(APIView):
    """
    POST /api/ai/central/chat/
    المحادثة الاستشارية الذكية للإدارة المركزية.
    مقيدة بـ AIChatThrottle (20 طلب/ساعة).
    """
    permission_classes = [IsAdminCenter]
    throttle_classes = [AIChatThrottle]

    def post(self, request):
        serializer = AIChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = chat_with_admin(
                user=request.user,
                conversation_id=serializer.validated_data.get("conversation_id"),
                message=serializer.validated_data["message"],
            )
            return Response(result)
        except Exception:
            logger.exception(f"خطأ في محادثة AI للمستخدم [{request.user.email}]")
            return Response(
                {
                    "detail": "تعذر إتمام المحادثة في الوقت الحالي. يرجى المحاولة مجدداً.",
                    "is_advisory": True,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SmartAlertsView(APIView):
    """
    GET /api/ai/central/alerts/
    مؤشرات التنبيه الذكية المصاحبة لـ KPIs لوحة التحكم.
    """
    permission_classes = [IsAdminCenter]

    def get(self, request):
        alerts = generate_smart_alerts()
        return Response({
            "is_advisory": True,
            "alerts": alerts,
        })


class AIHealthView(APIView):
    """
    GET /api/ai/health/
    فحص حالة وتوفر مزود الذكاء الاصطناعي المستخدم.
    """
    permission_classes = [IsAdminCenter]

    def get(self, request):
        client = get_llm_client()
        return Response({
            "provider": client.__class__.__name__,
            "is_available": client.test_connection(),
            "is_advisory": True,
            "human_verification_required": True,
        })


# ─────────────────────────────────────────────────────────────────────────────
# Authority Portal (بوابة المصلحة المتعاقدة) Views
# ─────────────────────────────────────────────────────────────────────────────

class AuthorityInsightsView(APIView):
    """
    GET  /api/ai/authority/insights/ → قائمة توصيات المصلحة المتعاقدة النشطة.
    POST /api/ai/authority/insights/ → توليد توصيات جديدة خاصة بالمصلحة.
    """
    permission_classes = [IsAuthorityOrAdmin]

    def get(self, request):
        queryset = AIInsight.objects.filter(
            target_authority=request.user,
            is_resolved=False,
        ).order_by("-generated_at")[:20]
        return Response(AIInsightSerializer(queryset, many=True).data)

    def post(self, request):
        insights = generate_authority_insights(request.user.id)
        return Response(
            {
                "generated": len(insights),
                "is_advisory": True,
                "insights": AIInsightSerializer(insights, many=True).data,
            },
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Price Estimate (تقدير الأسعار المرجعية والميزانية) Views
# ─────────────────────────────────────────────────────────────────────────────

class PriceEstimateView(APIView):
    """
    POST /api/ai/price-estimate/
    تقدير الميزانية من السوق المحلي
    """
    permission_classes = [IsAuthorityOrAdmin]
    throttle_classes = [AIInsightsThrottle]

    def post(self, request):
        serializer = PriceEstimateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        try:
            # إن وُجد description فقط → استخدم estimate_from_description
            if data.get("description") and not data.get("category"):
                result = estimate_from_description(
                    description=data["description"],
                    wilaya=data.get("wilaya", "16"),
                )
            else:
                result = estimate_price(
                    template_type=data["template_type"],
                    category=data["category"],
                    quantity=data.get("quantity"),
                    unit=data.get("unit"),
                    wilaya=data.get("wilaya", "16"),
                    description=data.get("description", ""),
                )

            return Response(result, status=status.HTTP_200_OK)

        except MarketPriceReference.DoesNotExist:
            # اقتراحات بديلة
            suggestions = list(
                MarketPriceReference.objects.filter(
                    template_type=data["template_type"],
                    wilaya=data.get("wilaya", "16"),
                ).values_list("category", flat=True).distinct()[:5]
            )

            return Response({
                "detail": "لا توجد أسعار مرجعية لهذه الفئة في هذه الولاية",
                "suggestion": "جرّب إحدى الفئات التالية:",
                "available_categories": suggestions,
            }, status=status.HTTP_404_NOT_FOUND)

        except ValueError as e:
            return Response({
                "detail": "تعذر استخراج البيانات من الوصف",
                "suggestion": "وضّح الفئة والكمية في النص",
                "error": str(e),
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.exception("Price estimate error")
            return Response({
                "detail": "تعذر إتمام التقدير، حاول لاحقاً",
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OperatorRecommendationsView(APIView):
    """
    GET /api/ai/operator/recommendations/
    توصيات ذكية للفرص للمتعامل الحالي
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [AIInsightsThrottle]
    
    def get(self, request):
        # تحقق من الدور
        if request.user.role != "operator":
            return Response(
                {"detail": "هذه الميزة متاحة للمتعاملين الاقتصاديين فقط"},
                status=status.HTTP_403_FORBIDDEN,
            )
        
        try:
            limit = int(request.query_params.get("limit", 10))
        except (ValueError, TypeError):
            limit = 10
        limit = min(max(limit, 1), 50)
        
        from .services.operator_matcher import recommend_tenders
        
        try:
            recommendations = recommend_tenders(
                operator=request.user,
                limit=limit,
            )
            return Response({
                "recommendations": recommendations,
                "count": len(recommendations),
                "is_advisory": True,
                "human_verification_required": True,
            })
        except Exception as e:
            logger.exception("Recommendations error")
            return Response(
                {"detail": "تعذر جلب التوصيات، حاول لاحقاً"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


