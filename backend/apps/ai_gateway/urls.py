from django.urls import path
from .views import AICheckComplianceView, AISummarizeTenderView

urlpatterns = [
    path('compliance-check/', AICheckComplianceView.as_view(), name='ai-compliance-check'),
    path('summarize/', AISummarizeTenderView.as_view(), name='ai-summarize-tender'),
]
