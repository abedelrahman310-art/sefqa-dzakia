from apps.procurements.views_injunctions import CentralInjunctionsView, InjunctionPdfView
from django.urls import path
from .views import DashboardMetricsView, PublicTransparencyView

urlpatterns = [
    path('central/injunctions/', CentralInjunctionsView.as_view(), name='reports-central-injunctions'),
    path('central/injunctions', CentralInjunctionsView.as_view(), name='reports-central-injunctions-no-slash'),
    path('central/injunctions/<uuid:pk>/pdf/', InjunctionPdfView.as_view(), name='reports-central-injunction-pdf'),
    path('central/injunctions/<uuid:pk>/pdf', InjunctionPdfView.as_view(), name='reports-central-injunction-pdf-no-slash'),
    path('dashboard/', DashboardMetricsView.as_view(), name='reports-dashboard'),
    path('transparency/', PublicTransparencyView.as_view(), name='reports-transparency'),
]
