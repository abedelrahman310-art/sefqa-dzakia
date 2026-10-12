from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # OpenAPI Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Modular Domain APIs
    path('api/auth/', include('apps.users.urls')),
    path('api/procurements/', include('apps.procurements.urls')),
    path('api/bids/', include('apps.bids.urls')),
    path('api/contracts/', include('apps.contracts.urls')),
    path('api/execution/', include('apps.execution.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/ai/', include('apps.ai_gateway.urls')),
]
