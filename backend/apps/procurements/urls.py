from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProcurementDealViewSet, CahierSpecsViewSet
from .views_opening import (
    SessionListView,
    SessionScheduleView,
    SessionDetailView,
    SessionStartView,
    SessionOpenOfferView,
    SessionEndView,
    SessionOffersView,
)

router = DefaultRouter()
router.register(r'deals', ProcurementDealViewSet, basename='procurement-deal')
router.register(r'specs', CahierSpecsViewSet, basename='cahier-specs')

urlpatterns = [
    path("sessions/", SessionListView.as_view(), name="session-list"),
    path("sessions/schedule/", SessionScheduleView.as_view(), name="session-schedule"),
    path("sessions/<uuid:pk>/", SessionDetailView.as_view(), name="session-detail"),
    path("sessions/<uuid:pk>/offers/", SessionOffersView.as_view(), name="session-offers"),
    path("sessions/<uuid:pk>/start/", SessionStartView.as_view(), name="session-start"),
    path("sessions/<uuid:pk>/open-offer/", SessionOpenOfferView.as_view(), name="session-open-offer"),
    path("sessions/<uuid:pk>/end/", SessionEndView.as_view(), name="session-end"),
    path('', include(router.urls)),
]
