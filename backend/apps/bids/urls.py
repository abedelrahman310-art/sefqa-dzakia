from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BidOfferViewSet, OfferViewSet

router = DefaultRouter()
router.register(r'offers', OfferViewSet, basename='bid-offer')

urlpatterns = [
    path('', include(router.urls)),
]
