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
        if user.role == 'central_admin':
            return self.queryset
        return self.queryset.filter(user=user)
