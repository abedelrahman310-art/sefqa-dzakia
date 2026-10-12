from rest_framework import viewsets, permissions
from .models import ExecutionMilestone, ContractAmendment, ReceptionProcess, PaymentSituation
from .serializers import (
    ExecutionMilestoneSerializer,
    ContractAmendmentSerializer,
    ReceptionProcessSerializer,
    PaymentSituationSerializer
)

class ExecutionMilestoneViewSet(viewsets.ModelViewSet):
    """إدارة محطات الإنجاز والتنفيذ"""
    queryset = ExecutionMilestone.objects.all().select_related('contract')
    serializer_class = ExecutionMilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]

class ContractAmendmentViewSet(viewsets.ModelViewSet):
    """إدارة ملاحق الصفقات (Avenants)"""
    queryset = ContractAmendment.objects.all().select_related('contract')
    serializer_class = ContractAmendmentSerializer
    permission_classes = [permissions.IsAuthenticated]

class ReceptionProcessViewSet(viewsets.ModelViewSet):
    """إدارة محاضر الاستلام المؤقت والنهائي"""
    queryset = ReceptionProcess.objects.all().select_related('contract')
    serializer_class = ReceptionProcessSerializer
    permission_classes = [permissions.IsAuthenticated]

class PaymentSituationViewSet(viewsets.ModelViewSet):
    """إدارة كشوف الحساب ووضعيات الدفع"""
    queryset = PaymentSituation.objects.all().select_related('contract')
    serializer_class = PaymentSituationSerializer
    permission_classes = [permissions.IsAuthenticated]
