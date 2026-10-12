from rest_framework import viewsets, permissions, exceptions
from django.utils import timezone
from .models import BidOffer
from .serializers import BidOfferSerializer

class BidOfferViewSet(viewsets.ModelViewSet):
    """إدارة عروض المتعاملين الاقتصاديين (المرحلة 05 و 06 و 07) مع الامتثال للقانون 23-12"""
    queryset = BidOffer.objects.all().select_related('deal', 'operator')
    serializer_class = BidOfferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return self.queryset.none()
        if user.role == 'operator':
            return self.queryset.filter(operator=user)
        elif user.role == 'authority':
            return self.queryset.filter(deal__authority=user)
        elif user.role == 'central_admin':
            return self.queryset
        return self.queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'operator':
            raise exceptions.PermissionDenied('إيداع العروض مخصص حصراً لحسابات المتعاملين الاقتصاديين المؤهلين.')
        deal = serializer.validated_data.get('deal')
        now = timezone.now()
        if deal.submission_deadline and now > deal.submission_deadline:
            raise exceptions.ValidationError('انقضى الأجل القانوني لإيداع العروض لهذه الصفقة.')
        if deal.current_stage > 5:
            raise exceptions.ValidationError('مرحلة استلام العروض مغلقة حالياً في هذه الصفقة.')
        serializer.save(operator=user, submission_timestamp=now)

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()
        if user.role == 'authority':
            raise exceptions.PermissionDenied('المصلحة المتعاقدة لا يحق لها تعديل عروض المتعاملين الاقتصاديين.')
        if user.role != 'operator' or instance.operator != user:
            raise exceptions.PermissionDenied('تعديل العرض مخصص حصراً للمتعامل صاحب العرض.')
        deal = instance.deal
        now = timezone.now()
        if deal.submission_deadline and now > deal.submission_deadline:
            raise exceptions.ValidationError('انقضى الأجل القانوني لإيداع وتعديل العروض لهذه الصفقة وفق القانون 23-12.')
        if deal.current_stage > 5:
            raise exceptions.ValidationError('انتهت مرحلة استلام العروض وانطلقت أعمال الفحص والتقييم؛ يمنع تعديل العطاء.')
        if instance.status not in ['draft']:
            raise exceptions.ValidationError('لا يمكن تعديل عرض بعد إيداعه الرسمي وتشفيره.')
        serializer.save()

