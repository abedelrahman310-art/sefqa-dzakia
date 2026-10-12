from django.urls import path
from .views import DashboardMetricsView, PublicTransparencyView

urlpatterns = [
    path('dashboard/', DashboardMetricsView.as_view(), name='reports-dashboard'),
    path('transparency/', PublicTransparencyView.as_view(), name='reports-transparency'),
]
