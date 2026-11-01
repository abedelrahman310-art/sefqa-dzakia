from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExecutionMilestoneViewSet,
    ContractAmendmentViewSet,
    ReceptionProcessViewSet,
    PaymentSituationViewSet
)

router = DefaultRouter()
router.register(r'milestones', ExecutionMilestoneViewSet, basename='milestone')
router.register(r'amendments', ContractAmendmentViewSet, basename='amendment')
router.register(r'receptions', ReceptionProcessViewSet, basename='reception')
router.register(r'payments', PaymentSituationViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
]
