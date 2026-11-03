from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExecutionMilestoneViewSet,
    ContractAmendmentViewSet,
    ReceptionProcessViewSet,
    PaymentSituationViewSet,
)
from apps.procurements.views import (
    DealLegalNoticesView,
    LegalNoticeAcknowledgeView,
    LegalNoticeResolveView,
    LegalNoticeSubmitJustificationView,
    LegalNoticePdfView,
    LegalNoticeViewSet,
)

router = DefaultRouter()
router.register(r'milestones', ExecutionMilestoneViewSet, basename='milestone')
router.register(r'amendments', ContractAmendmentViewSet, basename='amendment')
router.register(r'receptions', ReceptionProcessViewSet, basename='reception')
router.register(r'payments', PaymentSituationViewSet, basename='payment')
router.register(r'notices', LegalNoticeViewSet, basename='execution-notice')

urlpatterns = [
    path('deals/<str:deal_id>/notices/', DealLegalNoticesView.as_view(), name='execution-deal-notices'),
    path('deals/<str:deal_id>/notices', DealLegalNoticesView.as_view(), name='execution-deal-notices-no-slash'),
    path('notices/<uuid:pk>/acknowledge/', LegalNoticeAcknowledgeView.as_view(), name='execution-notice-acknowledge'),
    path('notices/<uuid:pk>/acknowledge', LegalNoticeAcknowledgeView.as_view(), name='execution-notice-acknowledge-no-slash'),
    path('notices/<uuid:pk>/resolve/', LegalNoticeResolveView.as_view(), name='execution-notice-resolve'),
    path('notices/<uuid:pk>/resolve', LegalNoticeResolveView.as_view(), name='execution-notice-resolve-no-slash'),
    path('notices/<uuid:pk>/justification/', LegalNoticeSubmitJustificationView.as_view(), name='execution-notice-justification'),
    path('notices/<uuid:pk>/justification', LegalNoticeSubmitJustificationView.as_view(), name='execution-notice-justification-no-slash'),
    path('notices/<uuid:pk>/pdf/', LegalNoticePdfView.as_view(), name='execution-notice-pdf'),
    path('notices/<uuid:pk>/pdf', LegalNoticePdfView.as_view(), name='execution-notice-pdf-no-slash'),
    path('', include(router.urls)),
]
