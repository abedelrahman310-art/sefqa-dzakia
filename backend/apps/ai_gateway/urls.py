from django.urls import path
from .views import (
    AICheckComplianceView,
    AISummarizeTenderView,
    AnalyzeTenderView,
    OperatorLegalChatView,
)
from .views_admin import (
    CentralInsightsView,
    GenerateInsightsView,
    ResolveInsightView,
    SuspicionsView,
    AdminChatView,
    SmartAlertsView,
    AIHealthView,
    AuthorityInsightsView,
    PriceEstimateView,
    OperatorRecommendationsView,
    ProjectDelayRiskView,
    AuthorityBOQEstimateView,
)

urlpatterns = [
    # ─── الموجود — AI عام ─────────────────────────────────────────────────
    path("compliance-check/", AICheckComplianceView.as_view(), name="ai-compliance-check"),
    path("summarize/", AISummarizeTenderView.as_view(), name="ai-summarize-tender"),
    path("legal-chat/", OperatorLegalChatView.as_view(), name="ai-operator-legal-chat"),
    path("legal-chat", OperatorLegalChatView.as_view(), name="ai-operator-legal-chat-no-slash"),
    path("analyze-tender/", AnalyzeTenderView.as_view(), name="ai-operator-analyze-tender"),
    path("analyze-tender", AnalyzeTenderView.as_view(), name="ai-operator-analyze-tender-no-slash"),
    path("price-estimate/", PriceEstimateView.as_view(), name="ai-price-estimate"),

    # ─── Central Admin (الرقابة الوطنية) ──────────────────────────────────
    path("central/insights/", CentralInsightsView.as_view(), name="ai-central-insights"),
    path("central/insights/generate/", GenerateInsightsView.as_view(), name="ai-generate-insights"),
    path("central/insights/<uuid:pk>/resolve/", ResolveInsightView.as_view(), name="ai-resolve-insight"),
    path("central/suspicions/", SuspicionsView.as_view(), name="ai-central-suspicions"),
    path("central/project-risks/", ProjectDelayRiskView.as_view(), name="ai-central-project-risks"),
    path("central/chat/", AdminChatView.as_view(), name="ai-central-chat"),
    path("central/alerts/", SmartAlertsView.as_view(), name="ai-central-alerts"),
    path("health/", AIHealthView.as_view(), name="ai-health"),

    # ─── Authority Portal (بوابة المصلحة المتعاقدة) ──────────────────────
    path("authority/insights/", AuthorityInsightsView.as_view(), name="ai-authority-insights"),
    path("authority/estimate-boq/", AuthorityBOQEstimateView.as_view(), name="ai-authority-estimate-boq"),
    path("authority/estimate-boq", AuthorityBOQEstimateView.as_view(), name="ai-authority-estimate-boq-no-slash"),

    # ─── Operator Portal (بوابة المتعامل الاقتصادي) ───────────────────────
    path("operator/recommendations/", OperatorRecommendationsView.as_view(), name="ai-operator-recommendations"),
]

