from apps.procurements.views_injunctions import CentralInjunctionsView, InjunctionPdfView
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.users.views import ExcludedOperatorViewSet
from apps.users.central_staff_views import (
    CentralStaffListView,
    CentralStaffInviteView,
    CentralStaffRevokeToggleView,
    CentralStaffAcceptInviteView,
)
from .central_views import (
    CentralHeatmapView,
    CentralDashboardView,
    CentralSuspicionsView,
    CentralReportsView,
    CentralReportPdfView,
    CentralAuthoritiesView,
    CentralOperatorsView,
    CentralDealsView,
)

excluded_router = DefaultRouter()
excluded_router.register(r'excluded-operators', ExcludedOperatorViewSet, basename='central-excluded-operators')

urlpatterns = [
    # 11. إدارة الموظفين والصلاحيات (Staff & Role Management API)
    path('staff/', CentralStaffListView.as_view(), name='central-staff-list'),
    path('staff', CentralStaffListView.as_view(), name='central-staff-list-no-slash'),
    path('staff/invite/', CentralStaffInviteView.as_view(), name='central-staff-invite'),
    path('staff/invite', CentralStaffInviteView.as_view(), name='central-staff-invite-no-slash'),
    path('staff/<uuid:pk>/revoke/', CentralStaffRevokeToggleView.as_view(), name='central-staff-revoke'),
    path('staff/<uuid:pk>/revoke', CentralStaffRevokeToggleView.as_view(), name='central-staff-revoke-no-slash'),
    path('staff/accept-invite/<uuid:token>/', CentralStaffAcceptInviteView.as_view(), name='central-staff-accept-invite'),
    path('staff/accept-invite/<uuid:token>', CentralStaffAcceptInviteView.as_view(), name='central-staff-accept-invite-no-slash'),
    path('staff/verify-invite/<uuid:token>/', CentralStaffAcceptInviteView.as_view(), name='central-staff-verify-invite'),
    path('staff/verify-invite/<uuid:token>', CentralStaffAcceptInviteView.as_view(), name='central-staff-verify-invite-no-slash'),

    # 10. الإعذارات الإدارية الرقابية (Administrative Injunctions API)
    path('injunctions/', CentralInjunctionsView.as_view(), name='central-injunctions'),
    path('injunctions', CentralInjunctionsView.as_view(), name='central-injunctions-no-slash'),
    path('injunctions/<uuid:pk>/pdf/', InjunctionPdfView.as_view(), name='central-injunction-pdf'),
    path('injunctions/<uuid:pk>/pdf', InjunctionPdfView.as_view(), name='central-injunction-pdf-no-slash'),
    
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

    # 5. تصدير التقرير الوطني بصيغة PDF قابلة للأرشفة (Server-side PDF)
    path('reports/<str:report_id>/pdf/', CentralReportPdfView.as_view(), name='central-report-pdf'),
    path('reports/<str:report_id>/pdf', CentralReportPdfView.as_view(), name='central-report-pdf-no-slash'),

    # 6. قائمة المصالح المتعاقدة الحقيقية (Real Authorities API)
    path('authorities/', CentralAuthoritiesView.as_view(), name='central-authorities'),
    path('authorities', CentralAuthoritiesView.as_view(), name='central-authorities-no-slash'),

    # 7. قائمة المتعاملين الاقتصاديين الحقيقيين (Real Operators API)
    path('operators/', CentralOperatorsView.as_view(), name='central-operators'),
    path('operators', CentralOperatorsView.as_view(), name='central-operators-no-slash'),

    # 8. السجل الوطني للصفقات الحقيقية (Real Deals API)
    path('deals/', CentralDealsView.as_view(), name='central-deals'),
    path('deals', CentralDealsView.as_view(), name='central-deals-no-slash'),

    # 9. القائمة السوداء للمتعاملين الاقتصاديين المقصيين (Excluded Operators API)
    path('', include(excluded_router.urls)),
    path('excluded-operators', ExcludedOperatorViewSet.as_view({'get': 'list', 'post': 'create'}), name='central-excluded-operators-no-slash'),
    path('excluded-operators/<str:pk>', ExcludedOperatorViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'}), name='central-excluded-operators-detail-no-slash'),
]
