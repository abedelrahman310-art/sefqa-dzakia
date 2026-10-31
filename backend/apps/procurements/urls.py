from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProcurementDealViewSet,
    CahierSpecsViewSet,
    OpportunityViewSet,
    EvaluationDataView,
    EvaluateOfferView,
    ConcludeEvaluationView,
    MilestoneViewSet,
    DealMilestonesView,
    ContractViewSet,
)
from apps.bids.views import OfferViewSet
from .views_opening import (
    SessionListView,
    SessionScheduleView,
    SessionDetailView,
    SessionStartView,
    SessionOpenEnvelopeView,
    SessionOpenOfferView,
    SessionEndView,
    SessionEventsView,
    SessionOffersView,
)
from .views_pdf import OpeningSessionPdfView, CahierSpecsPdfView
from .views_reference_prices import CheckPricesView
from apps.reports.views import DashboardMetricsView

router = DefaultRouter()
router.register(r'deals', ProcurementDealViewSet, basename='procurement-deal')
router.register(r'specs', CahierSpecsViewSet, basename='cahier-specs')
router.register(r'opportunities', OpportunityViewSet, basename='opportunity')
router.register(r'milestones', MilestoneViewSet, basename='milestone')
router.register(r'contracts', ContractViewSet, basename='procurement-contract')

urlpatterns = [
    path("authority/dashboard/", DashboardMetricsView.as_view(), name="authority-dashboard"),
    path("authority/dashboard", DashboardMetricsView.as_view(), name="authority-dashboard-no-slash"),
    path("check-prices/", CheckPricesView.as_view(), name="check-prices"),
    path("check-prices", CheckPricesView.as_view(), name="check-prices-no-slash"),
    path("authority/opportunities/<str:pk>/evaluation-data/", EvaluationDataView.as_view(), name="authority-evaluation-data"),
    path("authority/opportunities/<str:pk>/evaluation-data", EvaluationDataView.as_view(), name="authority-evaluation-data-no-slash"),
    path("authority/opportunities/<str:pk>/conclude-evaluation/", ConcludeEvaluationView.as_view(), name="authority-conclude-evaluation"),
    path("authority/opportunities/<str:pk>/conclude-evaluation", ConcludeEvaluationView.as_view(), name="authority-conclude-evaluation-no-slash"),
    path("authority/offers/<str:pk>/evaluate/", OfferViewSet.as_view({'post': 'evaluate'}), name="authority-evaluate-offer"),
    path("authority/offers/<str:pk>/evaluate", OfferViewSet.as_view({'post': 'evaluate'}), name="authority-evaluate-offer-no-slash"),
    path("sessions/", SessionListView.as_view(), name="session-list"),
    path("sessions/schedule/", SessionScheduleView.as_view(), name="session-schedule"),
    path("sessions/<uuid:pk>/", SessionDetailView.as_view(), name="session-detail"),
    path("sessions/<uuid:pk>/offers/", SessionOffersView.as_view(), name="session-offers"),
    path("sessions/<uuid:pk>/start/", SessionStartView.as_view(), name="session-start"),
    path("sessions/<uuid:pk>/open-envelope/", SessionOpenEnvelopeView.as_view(), name="session-open-envelope"),
    path("sessions/<uuid:pk>/open-offer/", SessionOpenOfferView.as_view(), name="session-open-offer"),
    path("sessions/<uuid:pk>/end/", SessionEndView.as_view(), name="session-end"),
    path("sessions/<uuid:pk>/events/", SessionEventsView.as_view(), name="session-events"),
    path("sessions/<uuid:pk>/pdf/", OpeningSessionPdfView.as_view(), name="session-pdf"),
    path("deals/<uuid:pk>/specs-pdf/", CahierSpecsPdfView.as_view(), name="deal-specs-pdf"),
    path("specs/<uuid:pk>/pdf/", CahierSpecsPdfView.as_view(), name="cahier-specs-pdf"),
    path("deals/<str:pk>/publish/", ProcurementDealViewSet.as_view({'post': 'publish'}), name="deal-publish"),
    path("deals/<str:pk>/publish", ProcurementDealViewSet.as_view({'post': 'publish'}), name="deal-publish-no-slash"),
    path("deals/<str:pk>/generate-contract/", ProcurementDealViewSet.as_view({'post': 'generate_contract'}), name="deal-generate-contract"),
    path("deals/<str:pk>/generate-contract", ProcurementDealViewSet.as_view({'post': 'generate_contract'}), name="deal-generate-contract-no-slash"),
    path("deals/<str:deal_id>/milestones/", DealMilestonesView.as_view(), name="deal-milestones"),
    path("deals/<str:deal_id>/milestones", DealMilestonesView.as_view(), name="deal-milestones-no-slash"),
    path('', include(router.urls)),
]
