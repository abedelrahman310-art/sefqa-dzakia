from rest_framework import viewsets, permissions
from .models import ProcurementDeal, CahierSpecs
from .serializers import ProcurementDealSerializer, CahierSpecsSerializer

class IsContractingAuthorityOrReadOnly(permissions.BasePermission):
    """المصالح المتعاقدة فقط مخولة بإنشاء وتعديل الصفقات؛ التصفح متاح للعموم"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'authority')

class ProcurementDealViewSet(viewsets.ModelViewSet):
    """إدارة الصفقات العمومية وفق القانون 23-12"""
    queryset = ProcurementDeal.objects.all().select_related('authority')
    serializer_class = ProcurementDealSerializer
    permission_classes = [IsContractingAuthorityOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(authority=self.request.user)

class CahierSpecsViewSet(viewsets.ModelViewSet):
    """إدارة دفاتر الشروط والمواصفات"""
    queryset = CahierSpecs.objects.all().select_related('deal')
    serializer_class = CahierSpecsSerializer
    permission_classes = [permissions.IsAuthenticated]

