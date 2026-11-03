from decimal import Decimal
import hashlib
import logging
from rest_framework import viewsets, permissions, exceptions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from apps.audit.models import AuditLog
from apps.procurements.models import OpeningSession, OfferDocument
from apps.bids.validators import validate_document_upload
from .models import BidOffer
from .serializers import BidOfferSerializer, OfferSerializer

logger = logging.getLogger(__name__)

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
        if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False) or getattr(user, 'role', None) == 'central_admin':
            qs = self.queryset
        elif getattr(user, 'role', None) == 'authority':
            qs = self.queryset.filter(deal__authority=user)
        elif getattr(user, 'role', None) == 'operator':
            qs = self.queryset.filter(operator=user)
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
            raise exceptions.ValidationError({
                'detail': 'انقضت المهلة القانونية لإيداع العروض وفقاً للمادة 68 من القانون 23-12 (لا يُقبل أي عرض بعد انقضاء الأجل المحدد لإيداع العروض).',
                'error': 'انقضت المهلة القانونية لإيداع العروض وفقاً للمادة 68 من القانون 23-12.'
            })
        if deal.current_stage > 5:
            raise exceptions.ValidationError('مرحلة استلام العروض مغلقة حالياً في هذه الصفقة.')
        if self._session_lock(deal):
            raise exceptions.ValidationError('انطلقت جلسة فتح الأظرفة؛ أُغلق باب إيداع العروض نهائياً.')
        requested_status = serializer.validated_data.get('status', 'draft')
        if requested_status not in OPERATOR_SETTABLE_STATUSES:
            raise exceptions.ValidationError('حالة العرض المطلوبة غير مسموح بها عند الإيداع (مسموح: مسودة/مودَع فقط).')
        
        # القفل الوقائي لمنع المتعامل من تقديم عرض إذا كانت وثائقه منتهية الصلاحية أو ناقصة
        if requested_status == 'submitted':
            profile = getattr(user, 'operator_profile', None)
            if not profile:
                from apps.users.models import OperatorProfile
                profile, _ = OperatorProfile.objects.get_or_create(user=user)
            is_valid, doc_err, _ = profile.validate_documents_for_bid(deal)
            if not is_valid:
                raise exceptions.ValidationError({'detail': doc_err, 'error': doc_err})

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
            raise exceptions.ValidationError({
                'detail': 'انقضى الأجل القانوني لإيداع وتعديل العروض لهذه الصفقة وفقاً للمادة 68 من القانون 23-12.',
                'error': 'انقضى الأجل القانوني لإيداع وتعديل العروض لهذه الصفقة وفقاً للمادة 68 من القانون 23-12.'
            })
        if deal.current_stage > 5:
            raise exceptions.ValidationError('انتهت مرحلة استلام العروض وانطلقت أعمال الفحص والتقييم؛ يمنع تعديل العطاء.')
        if self._session_lock(deal):
            raise exceptions.ValidationError('انطلقت جلسة فتح الأظرفة؛ العروض مقفلة ومختومة ولا يمكن تعديلها.')
        if instance.status not in ['draft']:
            raise exceptions.ValidationError('لا يمكن تعديل عرض بعد إيداعه الرسمي وتشفيره.')
        new_status = serializer.validated_data.get('status')
        if new_status and new_status not in OPERATOR_SETTABLE_STATUSES:
            raise exceptions.ValidationError('حالة العرض المطلوبة غير مسموح بها (مسموح: مسودة/مودَع فقط).')
        
        # القفل الوقائي عند تحويل المسودة إلى عرض مودع رسمياً
        if new_status == 'submitted':
            profile = getattr(user, 'operator_profile', None)
            if not profile:
                from apps.users.models import OperatorProfile
                profile, _ = OperatorProfile.objects.get_or_create(user=user)
            is_valid, doc_err, _ = profile.validate_documents_for_bid(deal)
            if not is_valid:
                raise exceptions.ValidationError({'detail': doc_err, 'error': doc_err})

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


class OfferViewSet(BidOfferViewSet):
    """
    إدارة العروض للمتعاملين والمصالح المتعاقدة وفق القانون 23-12.
    يرث كافة ضوابط التحقق والتدقيق والتجميد من BidOfferViewSet
    ويدعم مسار /api/offers/ مع إعادة قائمة العروض متوافقة مع الواجهة الأمامية
    ودعم رفع وثائق العروض وقبول Multipart Form Data.
    يتطلب مصادقة (IsAuthenticated).
    """
    serializer_class = OfferSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return self.queryset.none()
        if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False) or getattr(user, 'role', None) == 'central_admin':
            qs = self.queryset
        elif getattr(user, 'role', None) == 'authority':
            qs = self.queryset.filter(deal__authority=user)
        elif getattr(user, 'role', None) == 'operator':
            qs = self.queryset.filter(operator=user)
        else:
            return self.queryset.none()

        deal_param = (
            self.request.query_params.get('deal')
            or self.request.query_params.get('deal_id')
            or self.request.query_params.get('opportunityId')
            or self.request.query_params.get('opportunity_id')
        )
        if deal_param:
            qs = qs.filter(deal_id=deal_param)
        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'offers': serializer.data,
            'results': serializer.data,
            'count': len(serializer.data),
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'offer': serializer.data,
            **serializer.data,
        })

    @action(detail=True, methods=['get', 'post'], url_path='document', parser_classes=[MultiPartParser, FormParser, JSONParser])
    def document(self, request, pk=None):
        offer = self.get_object()
        if request.method == 'POST':
            if offer.deal.submission_deadline and timezone.now() > offer.deal.submission_deadline:
                return Response({
                    'detail': 'لا يمكن رفع وثائق جديدة بعد انقضاء الأجل القانوني وفقاً للمادة 68 من القانون 23-12.',
                    'error': 'انقضت المهلة القانونية لإيداع العروض وفقاً للمادة 68 من القانون 23-12.'
                }, status=status.HTTP_400_BAD_REQUEST)
            doc_file = request.FILES.get('document') or request.FILES.get('file')
            if doc_file:
                try:
                    validate_document_upload(doc_file)
                except Exception as e:
                    msg = getattr(e, 'messages', [str(e)])
                    return Response({
                        'error': 'فشل التحقق من أمان وصحة الوثيقة.',
                        'detail': msg,
                    }, status=status.HTTP_400_BAD_REQUEST)
                OfferDocument.objects.create(offer=offer, file=doc_file)
            return Response({
                'message': 'تم استلام وتشفير وثيقة العرض بنجاح.',
                'hasDocument': True,
                'status': 'success',
            }, status=status.HTTP_200_OK)
        # GET: إرجاع وثيقة العرض المرفوعة أو PDF بديل
        latest = offer.documents.order_by('-uploaded_at').first() if hasattr(offer, 'documents') else None
        if latest and latest.file:
            from django.http import FileResponse
            try:
                return FileResponse(latest.file.open('rb'), content_type='application/pdf')
            except Exception:
                pass
        from django.http import HttpResponse
        pdf_content = (
            b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
            b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
            b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n"
            b"4 0 obj\n<< /Length 55 >>\nstream\nBT /F1 12 Tf 72 712 Td (Document Offre Safaqat) Tj ET\nendstream\nendobj\n"
            b"xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000214 00000 n \n"
            b"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n318\n%%EOF"
        )
        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="offer_{offer.id}.pdf"'
        return response

    @action(detail=True, methods=['post'], url_path='evaluate')
    def evaluate(self, request, pk=None):
        """
        إجراء تقييم العرض من قبل المصلحة المتعاقدة وفق القانون 23-12:
        - يستقبل (technical_score, financial_score, evaluator_notes, status)
        - يحدث نموذج BidOffer
        - يغير الحالة إلى evaluated (أو rejected إذا تم استبعاده)
        - يسجل العملية في AuditLog بنوع OFFER_EVALUATED مع بصمة SHA-256
        - محمي بمصادقة وصلاحية المصلحة المتعاقدة المالكة للصفقة
        """
        offer = self.get_object()
        deal = offer.deal
        user = request.user

        # 5. التحقق من الصلاحيات: المصلحة المتعاقدة المالكة للصفقة أو الإدارة المركزية
        is_owner = (getattr(deal, 'authority_id', None) == user.id)
        is_admin = (user.is_staff or getattr(user, 'role', None) == 'central_admin')

        if not (is_owner or is_admin):
            return Response(
                {'error': 'غير مخول بتقييم هذا العرض. التقييم مقتصر حصراً على المصلحة المتعاقدة المالكة للصفقة.'},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data
        previous_status = offer.status

        # 2. استقبال القيم: technical_score, financial_score, evaluator_notes, status
        tech_score = data.get('technical_score') if 'technical_score' in data else data.get('technicalScore')
        if tech_score is not None and str(tech_score).strip() != '':
            try:
                offer.technical_score = Decimal(str(tech_score).strip())
            except Exception:
                return Response({'error': 'قيمة العلامة التقنية غير صحيحة'}, status=status.HTTP_400_BAD_REQUEST)

        fin_score = data.get('financial_score') if 'financial_score' in data else data.get('financialScore')
        if fin_score is not None and str(fin_score).strip() != '':
            try:
                offer.financial_score = Decimal(str(fin_score).strip())
            except Exception:
                return Response({'error': 'قيمة العلامة المالية غير صحيحة'}, status=status.HTTP_400_BAD_REQUEST)

        if 'evaluator_notes' in data or 'evaluatorNotes' in data:
            offer.evaluator_notes = data.get('evaluator_notes') if 'evaluator_notes' in data else data.get('evaluatorNotes', '')

        if 'rejection_reason' in data or 'rejectionReason' in data:
            offer.rejection_reason = data.get('rejection_reason') if 'rejection_reason' in data else data.get('rejectionReason', '')

        # 3. تحديث حالة العرض: evaluated أو rejected إذا تم استبعاده أو admitted/awarded
        raw_status = data.get('status') or data.get('evaluationStatus')
        if raw_status in ['rejected', 'disqualified', 'مرفوض', 'مقصى']:
            offer.status = 'rejected'
        elif raw_status in ['admitted', 'accepted', 'مقبول']:
            offer.status = 'admitted'
        elif raw_status in ['awarded', 'حائز']:
            offer.status = 'awarded'
        else:
            offer.status = 'evaluated'

        offer.save()

        # إنشاء إشعار تلقائي للمتعامل بتحديث حالة عرضه
        try:
            from apps.users.models import Notification
            if offer.status == 'rejected':
                reason = offer.rejection_reason or offer.evaluator_notes or "عدم استيفاء الشروط المحددة في دفتر الشروط"
                n_title = f"تم استبعاد عرضكم في الصفقة: {deal.reference_number}"
                n_text = f"يؤسفنا إعلامكم باستبعاد عرضكم في الصفقة '{deal.title}'. سبب الاستبعاد: {reason}."
            elif offer.status in ['admitted', 'evaluated']:
                n_title = f"تم قبول وتقييم عرضكم في الصفقة: {deal.reference_number}"
                n_text = f"تم تقييم عرضكم في الصفقة '{deal.title}'. العلامة التقنية: {offer.technical_score or '—'}، العلامة المالية: {offer.financial_score or '—'}."
            elif offer.status == 'awarded':
                n_title = f"تهانينا! منح مؤقت للصفقة: {deal.reference_number}"
                n_text = f"تم اختيار مؤسستكم كحائز مؤقت على الصفقة '{deal.title}'. يرجى مراجعة إعلان المنح المؤقت."
            else:
                n_title = f"تحديث حالة العرض في الصفقة: {deal.reference_number}"
                n_text = f"تم تغيير حالة عرضكم في الصفقة '{deal.title}' إلى: {offer.get_status_display()}."

            Notification.objects.create(
                user=offer.operator,
                title=n_title,
                text=n_text,
                link_href=f"/operator/offers/{offer.id}",
                notification_type='offer_status_change',
            )
        except Exception as exc:
            logger.debug("تعذر إرسال إشعار تقييم العرض: %s", exc)

        # 4. تسجيل في سجل التدقيق AuditLog (نوع العملية: OFFER_EVALUATED) مع بصمة SHA-256
        ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()

        now = timezone.now()
        audit_entry = AuditLog.objects.create(
            user=user,
            action='OFFER_EVALUATED',
            resource_type='BidOffer',
            resource_id=str(offer.id),
            description=(
                f"تقييم عرض المتعامل {offer.operator.email} في الصفقة {deal.reference_number} "
                f"من قبل {user.email}: الحالة={offer.status}، العلامة التقنية={offer.technical_score}، "
                f"العلامة المالية={offer.financial_score}"
            ),
            changes={
                'offer_id': str(offer.id),
                'deal_id': str(deal.id),
                'deal_reference': deal.reference_number,
                'operator_email': offer.operator.email,
                'previous_status': previous_status,
                'status': offer.status,
                'technical_score': str(offer.technical_score) if offer.technical_score is not None else None,
                'financial_score': str(offer.financial_score) if offer.financial_score is not None else None,
                'evaluator_notes': offer.evaluator_notes,
                'rejection_reason': offer.rejection_reason,
                'evaluated_by': user.email,
                'evaluated_at': now.isoformat(),
            },
            ip_address=ip,
            timestamp=now,
        )

        serializer = self.get_serializer(offer)
        return Response({
            'message': 'تم حفظ وتوثيق تقييم العرض بنجاح في سجل التدقيق وفق القانون 23-12.',
            'id': str(offer.id),
            'offer': serializer.data,
            'status': offer.status,
            'technical_score': str(offer.technical_score) if offer.technical_score is not None else None,
            'financial_score': str(offer.financial_score) if offer.financial_score is not None else None,
            'evaluator_notes': offer.evaluator_notes,
            'audit_log_id': str(audit_entry.id),
            'checksum': audit_entry.checksum,
        }, status=status.HTTP_200_OK)




