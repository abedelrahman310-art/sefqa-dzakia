from rest_framework import viewsets, permissions, mixins
from .models import AuditLog
from .serializers import AuditLogSerializer

class AuditLogViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """سجل التدقيق غير القابل للتعديل (قراءة وتصفح فقط)"""
    queryset = AuditLog.objects.all().select_related('user')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return AuditLog.objects.none()
        qs = AuditLog.objects.all().select_related('user')
        if getattr(user, 'role', None) == 'central_admin' or user.is_staff:
            return qs
        return qs.filter(user=user)
