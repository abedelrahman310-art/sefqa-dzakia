from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from apps.procurements.views import (
    OpportunityViewSet,
    EvaluationDataView,
    EvaluateOfferView,
    ConcludeEvaluationView,
)
from apps.bids.views import OfferViewSet
from apps.contracts.views import ObjectionViewSet
from apps.ai_gateway.views import AILegalChatView, AIAnalyzeTenderView
from apps.users.views import (
    OperatorProfileView,
    NotificationViewSet,
    OperatorRecommendedDealsView,
    OperatorCheckComplianceView,
)
from apps.procurements.views_secure_media import SecureDocumentDownloadView
from apps.procurements.views_pricing import AuthorityPriceAnalysisView

# Routers for direct top-level endpoints
opportunities_router = DefaultRouter()
opportunities_router.register(r'', OpportunityViewSet, basename='opportunity')

offers_router = DefaultRouter()
offers_router.register(r'', OfferViewSet, basename='offer')

notifications_router = DefaultRouter()
notifications_router.register(r'', NotificationViewSet, basename='notification')

objections_router = DefaultRouter()
objections_router.register(r'', ObjectionViewSet, basename='direct-objection')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # OpenAPI Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Direct Frontend Expected Endpoints (Authentication Required)
    # 1. Opportunities: /api/opportunities/ & /api/opportunities
    path('api/opportunities/', include(opportunities_router.urls)),
    path('api/opportunities', include(opportunities_router.urls)),

    # 2. Offers: /api/offers/ & /api/offers
    path('api/offers/', include(offers_router.urls)),
    path('api/offers', include(offers_router.urls)),

    # 3. Notifications: /api/notifications/ & /api/notifications
    path('api/notifications/', include(notifications_router.urls)),
    path('api/notifications', include(notifications_router.urls)),

    # 3.1 Objections: /api/objections/ & /api/objections
    path('api/objections/', include(objections_router.urls)),
    path('api/objections', include(objections_router.urls)),

    # 4. Operator Profile: /api/operator/profile/ & /api/operator/profile
    path('api/operator/profile/', OperatorProfileView.as_view(), name='direct_operator_profile'),
    path('api/operator/profile', OperatorProfileView.as_view(), name='direct_operator_profile_no_slash'),

    # 4.1 Operator 2.0 Intelligence: Matcher & Compliance APIs
    path('api/operator/recommended-deals/', OperatorRecommendedDealsView.as_view(), name='direct_operator_recommended_deals'),
    path('api/operator/recommended-deals', OperatorRecommendedDealsView.as_view(), name='direct_operator_recommended_deals_no_slash'),
    path('api/operator/check-compliance/', OperatorCheckComplianceView.as_view(), name='direct_operator_check_compliance'),
    path('api/operator/check-compliance', OperatorCheckComplianceView.as_view(), name='direct_operator_check_compliance_no_slash'),

    # 5. Authority Evaluation Workspace: /api/authority/opportunities/{id}/evaluation-data/
    path('api/authority/opportunities/<str:pk>/evaluation-data/', EvaluationDataView.as_view(), name='direct_authority_eval_data'),
    path('api/authority/opportunities/<str:pk>/evaluation-data', EvaluationDataView.as_view(), name='direct_authority_eval_data_no_slash'),
    path('api/authority/opportunities/<str:pk>/conclude-evaluation/', ConcludeEvaluationView.as_view(), name='direct_authority_conclude_eval'),
    path('api/authority/opportunities/<str:pk>/conclude-evaluation', ConcludeEvaluationView.as_view(), name='direct_authority_conclude_eval_no_slash'),
    path('api/authority/offers/<str:pk>/evaluate/', OfferViewSet.as_view({'post': 'evaluate'}), name='direct_authority_eval_offer'),
    path('api/authority/offers/<str:pk>/evaluate', OfferViewSet.as_view({'post': 'evaluate'}), name='direct_authority_eval_offer_no_slash'),

    # 5.1 التحليل المالي الذكي لعروض الصفقة (استشاري)
    path('api/authority/analyze-prices/', AuthorityPriceAnalysisView.as_view(), name='direct_authority_analyze_prices'),
    path('api/authority/analyze-prices', AuthorityPriceAnalysisView.as_view(), name='direct_authority_analyze_prices_no_slash'),

    # 6. AI Intelligence: Legal Chat & Tender Document Analysis
    path('api/ai/legal-chat/', AILegalChatView.as_view(), name='direct_ai_legal_chat'),
    path('api/ai/legal-chat', AILegalChatView.as_view(), name='direct_ai_legal_chat_no_slash'),
    path('api/ai/analyze-tender/', AIAnalyzeTenderView.as_view(), name='direct_ai_analyze_tender'),
    path('api/ai/analyze-tender', AIAnalyzeTenderView.as_view(), name='direct_ai_analyze_tender_no_slash'),

    # 7. Central Hawk Eye (عين الصقر - الرقابة والإدارة المركزية)
    path('api/central/', include('apps.reports.central_urls')),

    # 8. Remote Opening Sessions (WebSockets / SSE / Events API)
    path('api/opening/', include('apps.procurements.urls_opening')),

    # 9. Secure Media & Document Download (RBAC Protected according to Law 23-12)
    path('media/<path:relative_path>', SecureDocumentDownloadView.as_view(), name='secure_media_download'),
    path('api/documents/<str:document_id>/download/', SecureDocumentDownloadView.as_view(), name='secure_document_download'),

    # Modular Domain APIs
    path('api/auth/', include('apps.users.urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/procurements/', include('apps.procurements.urls')),
    path('api/bids/', include('apps.bids.urls')),
    path('api/contracts/', include('apps.contracts.urls')),
    path('api/execution/', include('apps.execution.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/ai/', include('apps.ai_gateway.urls')),
]

