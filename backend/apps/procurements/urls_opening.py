from django.urls import path
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
    SessionSSEStreamView,
)

urlpatterns = [
    # المسار المعياري لبوابة جلسة فتح الأظرفة: /api/opening/sessions/...
    path('sessions/', SessionListView.as_view(), name='opening-session-list'),
    path('sessions/schedule/', SessionScheduleView.as_view(), name='opening-session-schedule'),
    path('sessions/<str:pk>/', SessionDetailView.as_view(), name='opening-session-detail'),
    path('sessions/<str:pk>/start/', SessionStartView.as_view(), name='opening-session-start'),
    path('sessions/<str:pk>/open-envelope/', SessionOpenEnvelopeView.as_view(), name='opening-session-open-envelope'),
    path('sessions/<str:pk>/open-offer/', SessionOpenOfferView.as_view(), name='opening-session-open-offer'),
    path('sessions/<str:pk>/end/', SessionEndView.as_view(), name='opening-session-end'),
    path('sessions/<str:pk>/events/', SessionEventsView.as_view(), name='opening-session-events'),
    path('sessions/<str:pk>/offers/', SessionOffersView.as_view(), name='opening-session-offers'),
    path('sessions/<str:pk>/stream/', SessionSSEStreamView.as_view(), name='opening-session-stream'),
]
