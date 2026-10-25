from django.urls import path
from .central_views import (
    CentralHeatmapView,
    CentralDashboardView,
    CentralSuspicionsView,
    CentralReportsView,
)

urlpatterns = [
    # 1. الخريطة الحرارية (Heatmap API)
    path('heatmap/', CentralHeatmapView.as_view(), name='central-heatmap'),
    path('heatmap', CentralHeatmapView.as_view(), name='central-heatmap-no-slash'),

    # 2. لوحة القيادة والمؤشرات (KPIs Dashboard API)
    path('dashboard/', CentralDashboardView.as_view(), name='central-dashboard'),
    path('dashboard', CentralDashboardView.as_view(), name='central-dashboard-no-slash'),

    # 3. وكيل اكتشاف التلاعب (Suspicion Detector API)
    path('suspicions/', CentralSuspicionsView.as_view(), name='central-suspicions'),
    path('suspicions', CentralSuspicionsView.as_view(), name='central-suspicions-no-slash'),

    # 4. التقارير الوطنية (Reports API)
    path('reports/', CentralReportsView.as_view(), name='central-reports'),
    path('reports', CentralReportsView.as_view(), name='central-reports-no-slash'),
]
