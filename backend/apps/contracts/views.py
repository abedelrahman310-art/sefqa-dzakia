from rest_framework import viewsets, permissions, exceptions
from .models import AwardDecision, Contract
from .serializers import AwardDecisionSerializer, ContractSerializer

class AwardDecisionViewSet(viewsets.ModelViewSet):
    """إدارة قرارات الإسناد والطعون"""
    queryset = AwardDecision.objects.all().select_related('deal', 'awarded_bid__operator')
    serializer_class = AwardDecisionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'authority':
            return self.queryset.filter(deal__authority=user)
        elif user.role == 'operator':
            return self.queryset.filter(awarded_bid__operator=user)
        return self.queryset

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == 'central_admin':
            raise exceptions.PermissionDenied('جهة الرقابة المركزية دورها رقابي وتدقيقي ولا يحق لها تعديل نتائج التقييم والإسناد.')
        if user.role != 'authority':
            raise exceptions.PermissionDenied('المصلحة المتعاقدة صاحبة الصفقة فقط مخولة بتعديل قرار الإسناد.')
        serializer.save()

class ContractViewSet(viewsets.ModelViewSet):
    """إدارة العقود المبرمة والتنفيذ"""
    queryset = Contract.objects.all().select_related('deal', 'awarded_operator')
    serializer_class = ContractSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'authority':
            return self.queryset.filter(deal__authority=user)
        elif user.role == 'operator':
            return self.queryset.filter(awarded_operator=user)
        return self.queryset
