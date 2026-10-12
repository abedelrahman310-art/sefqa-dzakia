from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProcurementDealViewSet, CahierSpecsViewSet

router = DefaultRouter()
router.register(r'deals', ProcurementDealViewSet, basename='procurement-deal')
router.register(r'specs', CahierSpecsViewSet, basename='cahier-specs')

urlpatterns = [
    path('', include(router.urls)),
]
