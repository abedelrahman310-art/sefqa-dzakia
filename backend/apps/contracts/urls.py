from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AwardDecisionViewSet, ContractViewSet

router = DefaultRouter()
router.register(r'awards', AwardDecisionViewSet, basename='award-decision')
router.register(r'agreements', ContractViewSet, basename='contract')

urlpatterns = [
    path('', include(router.urls)),
]
