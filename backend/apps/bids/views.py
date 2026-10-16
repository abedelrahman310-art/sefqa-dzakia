from rest_framework import viewsets, permissions, exceptions
from django.utils import timezone
from apps.audit.models import AuditLog
from apps.procurements.models import OpeningSession
from .models import BidOffer
from .serializers import BidOfferSerializer

# الحالات التي يحق للمتعامل تعيينها عند الإيداع/التعديل — أي تصعيد (مقبول/حائز)
# عبر الواجهة مرفوض ويُسجَّل كمخالفة صلاحيات
OPERATOR_SETTABLE_STATUSES = ('draft', 'submitted')

# حالات الجلسة التي تُقفل فيها العروض نهائياً أمام أي إيداع أو تعديل أو حذف
LOCKED_SESSION_STATUSES = ('live', 'ended')

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
            qs = self.queryset.filter(operator=user)
        elif user.role == 'authority':
            qs = self.queryset.filter(deal__authority=user)
        elif user.role == 'central_admin':
            qs = self.queryset
        else:
            return self.queryset.none()

        params = getattr(self.request, 'query_params', getattr(self.request, 'GET', {}))
        deal_param = (
            params.get('deal')
            or params.get('deal_id')
            or params.get('tender_id')
            or params.get('tender')
        )
        if deal_param:
            qs = qs.filter(deal_id=deal_param)
        return qs

    def _session_lock(self, deal):
        """إرجاع الجلسة المقفِلة للعروض إن وُجدت (جارية أو مختتمة)، وإلا None"""
        session = OpeningSession.objects.filter(tender=deal).first()
        if session and session.status in LOCKED_SESSION_STATUSES:
            return session
        return None

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
        if self._session_lock(deal):
            raise exceptions.ValidationError('انطلقت جلسة فتح الأظرفة؛ أُغلق باب إيداع العروض نهائياً.')
        requested_status = serializer.validated_data.get('status', 'draft')
        if requested_status not in OPERATOR_SETTABLE_STATUSES:
            raise exceptions.ValidationError('حالة العرض المطلوبة غير مسموح بها عند الإيداع (مسموح: مسودة/مودَع فقط).')
        # العلامة التقنية تمنحها لجنة التقييم حصراً — تُتجاهل أي قيمة مرسلة من المتعامل
        serializer.validated_data.pop('technical_score', None)
        bid = serializer.save(operator=user, submission_timestamp=now)
        AuditLog.objects.create(
            user=user,
            action='bid_submitted',
            resource_type='BidOffer',
            resource_id=str(bid.id),
            description=f"إيداع عرض المتعامل {user.email} في الصفقة {deal.reference_number}",
            changes={
                'deal_id': str(deal.id),
                'status': bid.status,
                'financial_amount': str(bid.financial_amount),
                'submission_timestamp': bid.submission_timestamp.isoformat(),
            },
        )

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
        if self._session_lock(deal):
            raise exceptions.ValidationError('انطلقت جلسة فتح الأظرفة؛ العروض مقفلة ومختومة ولا يمكن تعديلها.')
        if instance.status not in ['draft']:
            raise exceptions.ValidationError('لا يمكن تعديل عرض بعد إيداعه الرسمي وتشفيره.')
        new_status = serializer.validated_data.get('status')
        if new_status and new_status not in OPERATOR_SETTABLE_STATUSES:
            raise exceptions.ValidationError('حالة العرض المطلوبة غير مسموح بها (مسموح: مسودة/مودَع فقط).')
        serializer.validated_data.pop('technical_score', None)
        bid = serializer.save()
        AuditLog.objects.create(
            user=user,
            action='bid_updated',
            resource_type='BidOffer',
            resource_id=str(bid.id),
            description=f"تعديل مسودة عرض المتعامل {user.email} في الصفقة {deal.reference_number}",
            changes={
                'deal_id': str(deal.id),
                'status': bid.status,
                'financial_amount': str(bid.financial_amount),
            },
        )

    def perform_destroy(self, instance):
        """حذف العروض: مسموح لصاحبها فقط ما دامت مسودة قبل الأجل وقبل انطلاق الجلسة.
        العروض المودعة أدلة موثقة لا تُحذف — والمصلحة لا تحذف عروض المتعاملين إطلاقاً."""
        user = self.request.user
        if user.role != 'operator' or instance.operator_id != user.id:
            raise exceptions.PermissionDenied('حذف العرض مخصص حصراً للمتعامل صاحب العرض.')
        if instance.status != 'draft':
            raise exceptions.ValidationError('لا يمكن حذف عرض بعد إيداعه الرسمي؛ العروض المودعة أدلة موثقة في سجل التدقيق.')
        deal = instance.deal
        now = timezone.now()
        if deal.submission_deadline and now > deal.submission_deadline:
            raise exceptions.ValidationError('انقضى الأجل القانوني؛ لا يمكن حذف العرض.')
        if self._session_lock(deal):
            raise exceptions.ValidationError('انطلقت جلسة فتح الأظرفة؛ العروض مقفلة ولا يمكن حذفها.')
        bid_id = str(instance.id)
        deal_ref = deal.reference_number
        deal_id = str(deal.id)
        AuditLog.objects.create(
            user=user,
            action='bid_deleted',
            resource_type='BidOffer',
            resource_id=bid_id,
            description=f"حذف مسودة عرض المتعامل {user.email} في الصفقة {deal_ref}",
            changes={'deal_id': deal_id},
        )
        instance.delete()

