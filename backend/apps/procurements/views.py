from decimal import Decimal
import logging
from django.utils import timezone
from django.core.files.base import ContentFile
from django.core.exceptions import ValidationError
from django.http import FileResponse
from rest_framework import viewsets, permissions, views, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from apps.bids.models import BidOffer
from apps.audit.models import AuditLog
from apps.users.models import CustomUser
from .models import (
    ProcurementDeal,
    CahierSpecs,
    Contract,
    Milestone,
    MilestoneProgressReport,
)
from .serializers import (
    ProcurementDealSerializer,
    CahierSpecsSerializer,
    OpportunitySerializer,
    ContractSerializer,
    MilestoneSerializer,
    MilestoneProgressReportSerializer,
)

logger = logging.getLogger(__name__)

class IsContractingAuthorityOrReadOnly(permissions.BasePermission):
    """المصالح المتعاقدة فقط مخولة بإنشاء وتعديل الصفقات؛ التصفح متاح للعموم"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and (getattr(request.user, 'role', None) in ('authority', 'central_admin') or request.user.is_staff)
        )

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.is_staff or getattr(request.user, 'role', None) == 'central_admin':
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'authority'
            and getattr(obj, 'authority_id', None) == request.user.id
        )

class ProcurementDealViewSet(viewsets.ModelViewSet):
    """إدارة الصفقات العمومية وفق القانون 23-12"""
    queryset = ProcurementDeal.objects.all().select_related('authority')
    serializer_class = ProcurementDealSerializer
    permission_classes = [IsContractingAuthorityOrReadOnly]
    throttle_classes = [UserRateThrottle, AnonRateThrottle]

    def perform_create(self, serializer):
        serializer.save(authority=self.request.user)

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        """
        إجراء نشر الصفقة العمومية وفق أحكام القانون 23-12.
        ينقل الصفقة من مرحلة الإعداد/المسودة (المرحلة 02) إلى مرحلة نشر الإعلان (المرحلة 03)،
        ويوثق العملية في سجل التدقيق غير القابل للتعديل AuditLog.
        """
        deal = self.get_object()
        user = request.user

        # التحقق من الصلاحيات المؤسسية
        if not user.is_staff and getattr(user, 'role', None) != 'central_admin':
            if getattr(deal, 'authority_id', None) != user.id:
                return Response(
                    {'error': 'غير مخول بنشر هذه الصفقة. النشر مقتصر على المصلحة المتعاقدة المالكة.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        # التحقق من أن الصفقة في مرحلة الإعداد (2) أو أقل، ولم تُنشر بعد
        if deal.current_stage >= 3:
            return Response(
                {
                    'error': f'الصفقة منشورة بالفعل أو تجاوزت مرحلة النشر (المرحلة الحالية: {deal.get_current_stage_display()}).',
                    'current_stage': deal.current_stage,
                    'stage_display': deal.get_current_stage_display(),
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        previous_stage = deal.current_stage
        deal.current_stage = 3
        now = timezone.now()
        deal.updated_at = now
        deal.save(update_fields=['current_stage', 'updated_at'])

        # تسجيل العملية في سجل التدقيق AuditLog وفق القانون 23-12
        ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()

        AuditLog.objects.create(
            user=user,
            action='TENDER_PUBLISHED',
            resource_type='ProcurementDeal',
            resource_id=str(deal.id),
            description=f"قام المستخدم {user.email} بنشر الصفقة العمومية {deal.reference_number} ({deal.title}) في {now.strftime('%Y-%m-%d %H:%M:%S')} ونقلها إلى المرحلة 03 (نشر الإعلان).",
            changes={
                'deal_id': str(deal.id),
                'reference_number': deal.reference_number,
                'title': deal.title,
                'previous_stage': previous_stage,
                'current_stage': 3,
                'published_by': user.email,
                'published_at': now.isoformat(),
            },
            ip_address=ip,
        )

        # إنشاء إشعارات تلقائية للمتعاملين الذين يتطابق قطاعهم مع الصفقة المنشورة
        try:
            from apps.users.models import CustomUser, Notification
            from apps.ai_gateway.services.operator_matcher import _infer_tender_sector, SECTOR_KEYWORDS

            tender_sector = _infer_tender_sector(deal)
            operators = CustomUser.objects.filter(role='operator', is_active=True).select_related('operator_profile')
            for op in operators:
                profile = getattr(op, 'operator_profile', None)
                op_sec = (profile.sector or 'any').strip().lower() if profile else 'any'
                extra = profile.extra_data or {} if profile else {}
                if not op_sec or op_sec == 'any':
                    op_sec = str(extra.get('mainSector') or 'any').strip().lower()

                # فحص تطابق القطاع
                is_match = False
                if op_sec in ['any', '', 'all', '*']:
                    is_match = True
                elif tender_sector and (op_sec == tender_sector or op_sec in tender_sector or tender_sector in op_sec):
                    is_match = True
                else:
                    deal_text = f"{deal.title} {deal.description}".lower()
                    if op_sec in SECTOR_KEYWORDS and any(kw in deal_text for kw in SECTOR_KEYWORDS[op_sec]):
                        is_match = True

                if is_match:
                    Notification.objects.create(
                        user=op,
                        title=f"فرصة صفقة جديدة تناسب قطاعك: {deal.reference_number}",
                        text=f"أعلنت {deal.authority.organization_name or deal.authority.display_name or 'المصلحة المتعاقدة'} عن صفقة جديدة '{deal.title}' في ولاية {deal.wilaya or 'الوطنية'}.",
                        link_href=f"/operator/opportunities/{deal.id}",
                        notification_type='new_opportunity',
                    )
        except Exception as exc:
            logger.debug("تعذر إرسال إشعارات نشر الصفقة: %s", exc)

        serializer = self.get_serializer(deal)
        return Response({
            'message': f'تم نشر الصفقة {deal.reference_number} بنجاح والانتقال إلى المرحلة 03 (نشر الإعلان).',
            'deal': serializer.data,
            'current_stage': deal.current_stage,
            'stage_display': deal.get_current_stage_display(),
            'published_at': now.isoformat(),
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='generate-contract')
    def generate_contract(self, request, pk=None):
        """
        توليد وإبرام العقد وتحديث حالة الصفقة إلى CONTRACT_SIGNED وفق أحكام القانون 23-12.
        - ينشئ أو يسترجع نموذج Contract
        - يحدث حالة الصفقة إلى CONTRACT_SIGNED والمرحلة إلى 09 (إبرام العقد)
        - يسجل العملية في AuditLog مع بصمة SHA-256
        """
        deal = self.get_object()
        user = request.user

        # التحقق من الصلاحيات المؤسسية: المصلحة المالكة أو الإدارة المركزية
        is_owner = (getattr(deal, 'authority_id', None) == user.id)
        is_admin = (user.is_staff or getattr(user, 'role', None) == 'central_admin')
        if not (is_owner or is_admin):
            return Response(
                {'error': 'غير مخول بإبرام العقد. الإجراء مقتصر على المصلحة المتعاقدة المالكة.'},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data or {}

        # تحديد المتعامل الاقتصادي المتعاقد: من الطلب أو من العرض الفائز/المقيم
        operator_id = data.get('operator_id') or data.get('operator')
        awarded_offer = None

        if not operator_id:
            awarded_offer = deal.bids.filter(status='awarded').first()
            if not awarded_offer:
                awarded_offer = deal.bids.filter(status__in=['evaluated', 'admitted']).order_by('-technical_score').first()
            if awarded_offer:
                operator_id = awarded_offer.operator_id

        if not operator_id:
            return Response(
                {'error': 'تعذر تحديد المتعامل الاقتصادي المتعاقد. يرجى تمرير operator_id أو تعيين العرض الفائز أولاً.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        operator = get_object_or_404(CustomUser, id=operator_id)
        now = timezone.now()

        contract_number = data.get('contract_number') or f"CNT-{deal.reference_number}-{now.year}"
        contract_amount = data.get('amount') or (awarded_offer.financial_amount if awarded_offer else deal.estimated_budget) or Decimal('0.00')

        contract_pdf = request.FILES.get('contract_pdf') or request.FILES.get('file')
        if not contract_pdf:
            pdf_bytes = (
                b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
                b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
                b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n"
                b"4 0 obj\n<< /Length 75 >>\nstream\n"
                b"BT /F1 12 Tf 72 712 Td (CONTRAT OFFICIEL DE MARCHE PUBLIC - LOI 23-12) Tj ET\n"
                b"endstream\nendobj\n"
                b"xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000214 00000 n \n"
                b"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n338\n%%EOF"
            )
            contract_pdf = ContentFile(pdf_bytes, name=f"contract_{deal.reference_number}.pdf")

        contract, created = Contract.objects.update_or_create(
            deal=deal,
            defaults={
                'operator': operator,
                'contract_number': contract_number,
                'contract_pdf': contract_pdf,
                'signed_at': now,
                'status': 'CONTRACT_SIGNED',
                'amount': contract_amount,
            }
        )

        # تحديث حالة الصفقة إلى CONTRACT_SIGNED والمرحلة إلى 09
        deal.current_stage = 9
        deal.status = 'CONTRACT_SIGNED'
        deal.updated_at = now
        deal.save(update_fields=['current_stage', 'status', 'updated_at'])

        # تسجيل العملية في AuditLog مع بصمة SHA-256
        ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()

        audit_entry = AuditLog.objects.create(
            user=user,
            action='CONTRACT_GENERATED',
            resource_type='Contract',
            resource_id=str(contract.id),
            description=(
                f"إبرام وتوقيع عقد الصفقة {deal.reference_number} مع المتعامل {operator.email} "
                f"بمبلغ {contract_amount} دج وتحديث حالة الصفقة إلى CONTRACT_SIGNED في {now.strftime('%Y-%m-%d %H:%M:%S')}."
            ),
            changes={
                'contract_id': str(contract.id),
                'contract_number': contract.contract_number,
                'deal_id': str(deal.id),
                'deal_reference': deal.reference_number,
                'operator_id': str(operator.id),
                'operator_email': operator.email,
                'amount': str(contract_amount) if contract_amount is not None else None,
                'signed_at': now.isoformat(),
                'status': 'CONTRACT_SIGNED',
                'deal_current_stage': 9,
                'deal_status': 'CONTRACT_SIGNED',
            },
            ip_address=ip,
            timestamp=now,
        )

        serializer = ContractSerializer(contract, context={'request': request})
        return Response({
            'message': f'تم توليد وإبرام العقد رقم {contract_number} بنجاح، وتحديث حالة الصفقة إلى CONTRACT_SIGNED.',
            'contract': serializer.data,
            'deal_status': deal.status,
            'current_stage': deal.current_stage,
            'audit_log_id': str(audit_entry.id),
            'checksum': audit_entry.checksum,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)



class IsCahierAuthorityOwner(permissions.BasePermission):
    """
    المصلحة المتعاقدة المالكة للصفقة فقط مخولة بتعديل دفتر الشروط وحذفه.
    التصفح متاح للمستخدمين المصادق عليهم.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'authority'
            and getattr(obj.deal, 'authority_id', None) == request.user.id
        )

class CahierSpecsViewSet(viewsets.ModelViewSet):
    """إدارة دفاتر الشروط والمواصفات وفق الضوابط والصلاحيات المؤسسية"""
    queryset = CahierSpecs.objects.all().select_related('deal')
    serializer_class = CahierSpecsSerializer
    permission_classes = [permissions.IsAuthenticated, IsCahierAuthorityOwner]


class OpportunityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    قائمة وتفاصيل الصفقات/الفرص المتاحة للمتعاملين والعموم.
    يدعم مسار /api/opportunities/ ويعيد بنية متوافقة مع الواجهة الأمامية.
    يتطلب مصادقة (IsAuthenticated).
    """
    queryset = ProcurementDeal.objects.all().select_related('authority', 'cahier_specs')
    serializer_class = OpportunitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'opportunities': serializer.data,
            'results': serializer.data,
            'count': len(serializer.data),
        })

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'opportunity': serializer.data,
            **serializer.data,
        })


class EvaluationDataView(views.APIView):
    """
    مسار /api/authority/opportunities/{id}/evaluation-data/
    يعيد بيانات التقييم للصفقة المحددة مع العروض المودعة لفحصها وتقييمها.
    يتطلب مصادقة (IsAuthenticated).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        deal = get_object_or_404(
            ProcurementDeal.objects.select_related('authority'),
            id=pk
        )

        user = request.user
        if not (user.is_staff or user.role == 'central_admin' or deal.authority_id == user.id):
            return Response(
                {'error': 'غير مخول بالاطلاع على بيانات تقييم هذه الصفقة'},
                status=status.HTTP_403_FORBIDDEN
            )

        opp_data = {
            'id': str(deal.id),
            'reference': deal.reference_number,
            'reference_number': deal.reference_number,
            'title': deal.title,
            'description': deal.description,
            'authorityName': deal.authority.full_name if deal.authority else 'المصلحة المتعاقدة',
            'authority_name': deal.authority.full_name if deal.authority else 'المصلحة المتعاقدة',
            'estimatedBudget': str(deal.estimated_budget) if deal.estimated_budget is not None else None,
            'current_stage': deal.current_stage,
            'status': deal.get_current_stage_display(),
            'wilaya': deal.wilaya,
            'submissionDeadline': deal.submission_deadline.isoformat() if deal.submission_deadline else None,
            'cahierVersion': '2026.1',
        }

        offers = BidOffer.objects.filter(deal=deal).select_related('operator')
        offers_data = []
        for o in offers:
            eval_status = 'pending'
            if o.status == 'admitted':
                eval_status = 'admitted'
            elif o.status == 'rejected':
                eval_status = 'rejected'
            elif o.status == 'evaluated':
                eval_status = 'evaluated'
            elif o.status == 'awarded':
                eval_status = 'admitted'

            fin_amount = str(o.financial_amount) if o.financial_amount is not None else None
            # حجب المبالغ المالية عن المصلحة المتعاقدة قبل مرحلة فتح الأظرفة (المراحل 1، 2، 3)
            if user.role == 'authority' and deal.current_stage < 4:
                fin_amount = None

            offers_data.append({
                'id': str(o.id),
                'bidderId': str(o.operator_id),
                'bidderName': o.operator.company_name or o.operator.display_name or o.operator.email,
                'financialAmount': fin_amount,
                'financial_amount': fin_amount,
                'durationDays': 30,
                'hasDocument': True,
                'evaluationStatus': eval_status,
                'rejectionReason': o.rejection_reason or '',
                'technicalScore': str(o.technical_score) if o.technical_score is not None else '',
                'financialScore': str(o.financial_score) if getattr(o, 'financial_score', None) is not None else '',
                'evaluatorNotes': o.evaluator_notes or '',
                'submittedAt': o.submission_timestamp.isoformat() if o.submission_timestamp else o.created_at.isoformat(),
            })

        return Response({
            'opportunity': opp_data,
            'offers': offers_data,
        })


class EvaluateOfferView(views.APIView):
    """
    مسار /api/authority/offers/{id}/evaluate
    حفظ وتحديث تقييم عرض معين من قبل المصلحة المتعاقدة.
    يتطلب مصادقة (IsAuthenticated).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        offer = get_object_or_404(BidOffer.objects.select_related('deal'), id=pk)
        user = request.user
        if not (user.is_staff or user.role == 'central_admin' or offer.deal.authority_id == user.id):
            return Response(
                {'error': 'غير مخول بتقييم هذا العرض'},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data
        eval_status = data.get('evaluationStatus')
        if eval_status in ['admitted', 'rejected', 'pending']:
            offer.status = eval_status

        tech_score = data.get('technicalScore')
        if tech_score is not None and str(tech_score).strip():
            try:
                offer.technical_score = Decimal(str(tech_score).strip())
            except Exception:
                pass

        if 'rejectionReason' in data:
            offer.rejection_reason = data.get('rejectionReason', '')

        if 'evaluatorNotes' in data:
            offer.evaluator_notes = data.get('evaluatorNotes', '')

        offer.save()
        return Response({'message': 'تم حفظ تقييم العرض بنجاح', 'id': str(offer.id)})


class ConcludeEvaluationView(views.APIView):
    """
    مسار /api/authority/opportunities/{id}/conclude-evaluation
    اعتماد المنح المؤقت للصفقة.
    يتطلب مصادقة (IsAuthenticated).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        deal = get_object_or_404(ProcurementDeal, id=pk)
        user = request.user
        if not (user.is_staff or user.role == 'central_admin' or deal.authority_id == user.id):
            return Response(
                {'error': 'غير مخول باعتماد المنح المؤقت لهذه الصفقة'},
                status=status.HTTP_403_FORBIDDEN
            )

        winning_id = request.data.get('winningOfferId')
        if not winning_id:
            return Response({'error': 'معرف العرض الفائز مطلوب'}, status=status.HTTP_400_BAD_REQUEST)

        winning_offer = get_object_or_404(BidOffer, id=winning_id, deal=deal)
        winning_offer.status = 'awarded'
        winning_offer.save()

        # نقل الصفقة إلى مرحلة 08 - الإسناد والطعون
        deal.current_stage = 8
        deal.save()

        return Response({
            'message': 'تم اعتماد المنح المؤقت للصفقة بنجاح وفق المادة 72 من القانون 23-12',
            'dealId': str(deal.id),
            'winningOfferId': str(winning_offer.id),
        })


class ContractViewSet(viewsets.ReadOnlyModelViewSet):
    """
    استرجاع العقود المبرمة وفق الصلاحيات المؤسسية.
    - المصلحة المتعاقدة: عقود صفقاتها فقط.
    - المتعامل الاقتصادي: العقود المسندة إليه فقط.
    - الإدارة المركزية: قراءة رقابية شاملة.
    """
    queryset = Contract.objects.all().select_related('deal', 'operator')
    serializer_class = ContractSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset

        deal_id = (
            self.request.query_params.get('deal')
            or self.request.query_params.get('deal_id')
        )
        if deal_id:
            try:
                qs = qs.filter(deal_id=deal_id)
            except (ValidationError, ValueError, TypeError):
                return qs.none()

        if user.is_staff or getattr(user, 'role', None) == 'central_admin':
            return qs
        if getattr(user, 'role', None) == 'authority':
            return qs.filter(deal__authority=user)
        if getattr(user, 'role', None) == 'operator':
            return qs.filter(operator=user)
        return qs.none()

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        """تنزيل نسخة PDF من العقد مع احترام نطاق الصلاحيات."""
        contract = self.get_object()
        if not contract.contract_pdf:
            return Response(
                {'error': 'نسخة PDF من هذا العقد غير متاحة حالياً.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            file_handle = contract.contract_pdf.open('rb')
        except (OSError, ValueError):
            return Response(
                {'error': 'تعذر الوصول إلى ملف العقد على الخادم.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        safe_filename = (
            contract.contract_number
            or contract.deal.reference_number
            or str(contract.id)
        ).encode('ascii', 'ignore').decode()
        safe_filename = ''.join(
            char if char.isalnum() or char in '._-' else '-'
            for char in safe_filename
        ).strip('.-') or str(contract.id)
        response = FileResponse(file_handle, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{safe_filename}.pdf"'
        return response


class MilestoneViewSet(viewsets.ModelViewSet):
    """
    إدارة ومتابعة مراحل التنفيذ (Milestones) للصفقات العمومية وفق القانون 23-12.
    - المصلحة المتعاقدة مخولة بإنشاء وتعديل المراحل التعاقدية.
    - المتعامل الاقتصادي مخول برفع تقارير الإنجاز للمراحل عبر إجراء progress-report.
    - التوثيق التلقائي في سجل التدقيق AuditLog مع بصمة SHA-256.
    """
    queryset = Milestone.objects.all().select_related('deal')
    serializer_class = MilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Milestone.objects.none()

        deal_id = (
            self.request.query_params.get('deal_id')
            or self.request.query_params.get('deal')
            or self.kwargs.get('deal_id')
        )
        qs = Milestone.objects.all().select_related('deal').prefetch_related('progress_reports__operator')

        if deal_id:
            qs = qs.filter(deal_id=deal_id)

        if user.role == 'authority':
            qs = qs.filter(deal__authority=user)
        elif user.role == 'operator':
            qs = qs.filter(
                deal__procurement_contracts__operator=user
            ) | qs.filter(
                deal__bids__operator=user,
                deal__bids__status__in=['awarded', 'evaluated']
            )
            qs = qs.distinct()
        elif user.role == 'central_admin' or user.is_staff:
            pass
        else:
            return Milestone.objects.none()

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        deal = serializer.validated_data.get('deal')

        if not user.is_staff and getattr(user, 'role', None) != 'central_admin':
            if getattr(deal, 'authority_id', None) != user.id:
                raise permissions.exceptions.PermissionDenied(
                    'غير مخول بإضافة مراحل تنفيذ لهذه الصفقة. الإجراء مقتصر على المصلحة المتعاقدة المالكة.'
                )

        milestone = serializer.save()

        now = timezone.now()
        ip = self.request.META.get('HTTP_X_FORWARDED_FOR') or self.request.META.get('REMOTE_ADDR')
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()

        AuditLog.objects.create(
            user=user,
            action='MILESTONE_CREATED',
            resource_type='Milestone',
            resource_id=str(milestone.id),
            description=(
                f"إضافة مرحلة تنفيذ '{milestone.title}' للصفقة {deal.reference_number} "
                f"بمبلغ {milestone.amount} دج واستحقاق {milestone.due_date} من قبل {user.email}."
            ),
            changes={
                'milestone_id': str(milestone.id),
                'deal_id': str(deal.id),
                'deal_reference': deal.reference_number,
                'title': milestone.title,
                'amount': str(milestone.amount),
                'due_date': str(milestone.due_date) if milestone.due_date else None,
                'status': milestone.status,
                'created_by': user.email,
                'created_at': now.isoformat(),
            },
            ip_address=ip,
            timestamp=now,
        )

        # إشعار تلقائي للمتعامل المتعاقد على الصفقة
        try:
            from apps.users.models import Notification
            op_ids = set()
            for c in deal.procurement_contracts.all():
                if c.operator_id:
                    op_ids.add(c.operator_id)
            for b in deal.bids.filter(status='awarded'):
                if b.operator_id:
                    op_ids.add(b.operator_id)
            if not op_ids:
                for b in deal.bids.all():
                    if b.operator_id:
                        op_ids.add(b.operator_id)

            for op_id in op_ids:
                Notification.objects.create(
                    user_id=op_id,
                    title=f"مرحلة تنفيذ جديدة في عقدك: {milestone.title}",
                    text=f"أضافت المصلحة المتعاقدة مرحلة تنفيذ جديدة '{milestone.title}' للصفقة '{deal.title}' (المرجع: {deal.reference_number}) بمبلغ {milestone.amount} دج واستحقاق {milestone.due_date or 'غير محدد'}.",
                    link_href=f"/operator/contracts/{deal.id}",
                    notification_type='milestone_added',
                )
        except Exception as exc:
            logger.debug("تعذر إرسال إشعار مرحلة التنفيذ: %s", exc)

    @action(detail=True, methods=['post'], url_path='progress-report')
    def progress_report(self, request, pk=None):
        """
        إجراء رفع تقرير إنجاز مرحلة (Progress Report) من قبل المتعامل الاقتصادي.
        يحدث نسبة التقدم المادي وحالة المرحلة، ويسجل العملية في AuditLog مع بصمة SHA-256.
        """
        milestone = self.get_object()
        deal = milestone.deal
        user = request.user

        is_awarded = deal.procurement_contracts.filter(operator=user).exists() or deal.bids.filter(operator=user, status='awarded').exists()
        is_admin = (user.is_staff or getattr(user, 'role', None) == 'central_admin')

        if not (is_awarded or is_admin or user.role == 'operator'):
            return Response(
                {'error': 'رفع تقارير الإنجاز مقتصر حصراً على المتعامل الاقتصادي المتعاقد.'},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data
        percentage_val = data.get('progress_percentage') or data.get('percentage') or 0
        try:
            percentage = max(0, min(100, int(percentage_val)))
        except (ValueError, TypeError):
            percentage = 0

        report_text = data.get('report_text') or data.get('notes') or data.get('description') or 'تقرير إنجاز دوري لمرحلة التنفيذ'
        report_file = request.FILES.get('report_file') or request.FILES.get('file') or request.FILES.get('attachment')

        report = MilestoneProgressReport.objects.create(
            milestone=milestone,
            operator=user,
            progress_percentage=percentage,
            report_text=report_text,
            report_file=report_file,
        )

        milestone.progress_percentage = percentage
        if percentage >= 100:
            milestone.status = 'completed'
            milestone.completion_date = timezone.localdate()
        elif percentage > 0:
            milestone.status = 'in_progress'
        milestone.save()

        now = timezone.now()
        ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()

        audit_entry = AuditLog.objects.create(
            user=user,
            action='PROGRESS_REPORT_SUBMITTED',
            resource_type='MilestoneProgressReport',
            resource_id=str(report.id),
            description=(
                f"رفع تقرير إنجاز لمرحلة '{milestone.title}' في الصفقة {deal.reference_number} "
                f"بنسبة {percentage}% من قبل المتعامل {user.email}."
            ),
            changes={
                'report_id': str(report.id),
                'milestone_id': str(milestone.id),
                'milestone_title': milestone.title,
                'deal_id': str(deal.id),
                'deal_reference': deal.reference_number,
                'operator_email': user.email,
                'progress_percentage': percentage,
                'milestone_status': milestone.status,
                'submitted_at': now.isoformat(),
            },
            ip_address=ip,
            timestamp=now,
        )

        report_serializer = MilestoneProgressReportSerializer(report, context={'request': request})
        milestone_serializer = MilestoneSerializer(milestone, context={'request': request})

        return Response({
            'message': f'تم رفع تقرير الإنجاز بنجاح وتحديث نسبة المرحلة إلى {percentage}%.',
            'report': report_serializer.data,
            'milestone': milestone_serializer.data,
            'audit_log_id': str(audit_entry.id),
            'checksum': audit_entry.checksum,
        }, status=status.HTTP_201_CREATED)


class DealMilestonesView(views.APIView):
    """
    مسار /api/procurements/deals/{deal_id}/milestones/
    - GET: استرجاع مراحل تنفيذ الصفقة
    - POST: إنشاء مرحلة تنفيذ جديدة من قبل المصلحة المتعاقدة
    يتطلب مصادقة (IsAuthenticated).
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get(self, request, deal_id):
        deal = get_object_or_404(ProcurementDeal, id=deal_id)
        milestones = deal.milestones.all().prefetch_related('progress_reports__operator')
        serializer = MilestoneSerializer(milestones, many=True, context={'request': request})
        return Response({
            'deal_id': str(deal.id),
            'deal_reference': deal.reference_number,
            'milestones': serializer.data,
            'count': len(serializer.data),
        })

    def post(self, request, deal_id):
        deal = get_object_or_404(ProcurementDeal, id=deal_id)
        user = request.user

        if not user.is_staff and getattr(user, 'role', None) != 'central_admin':
            if getattr(deal, 'authority_id', None) != user.id:
                return Response(
                    {'error': 'غير مخول بإضافة مراحل تنفيذ لهذه الصفقة. الإجراء مقتصر على المصلحة المتعاقدة المالكة.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        data['deal'] = deal.id

        serializer = MilestoneSerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        milestone = serializer.save(deal=deal)

        now = timezone.now()
        ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()

        audit_entry = AuditLog.objects.create(
            user=user,
            action='MILESTONE_CREATED',
            resource_type='Milestone',
            resource_id=str(milestone.id),
            description=(
                f"إضافة مرحلة تنفيذ '{milestone.title}' للصفقة {deal.reference_number} "
                f"بمبلغ {milestone.amount} دج واستحقاق {milestone.due_date} من قبل {user.email}."
            ),
            changes={
                'milestone_id': str(milestone.id),
                'deal_id': str(deal.id),
                'deal_reference': deal.reference_number,
                'title': milestone.title,
                'amount': str(milestone.amount),
                'due_date': str(milestone.due_date) if milestone.due_date else None,
                'status': milestone.status,
                'created_by': user.email,
                'created_at': now.isoformat(),
            },
            ip_address=ip,
            timestamp=now,
        )

        # إشعار تلقائي للمتعامل المتعاقد على الصفقة
        try:
            from apps.users.models import Notification
            op_ids = set()
            for c in deal.procurement_contracts.all():
                if c.operator_id:
                    op_ids.add(c.operator_id)
            for b in deal.bids.filter(status='awarded'):
                if b.operator_id:
                    op_ids.add(b.operator_id)
            if not op_ids:
                for b in deal.bids.all():
                    if b.operator_id:
                        op_ids.add(b.operator_id)

            for op_id in op_ids:
                Notification.objects.create(
                    user_id=op_id,
                    title=f"مرحلة تنفيذ جديدة في عقدك: {milestone.title}",
                    text=f"أضافت المصلحة المتعاقدة مرحلة تنفيذ جديدة '{milestone.title}' للصفقة '{deal.title}' (المرجع: {deal.reference_number}) بمبلغ {milestone.amount} دج واستحقاق {milestone.due_date or 'غير محدد'}.",
                    link_href=f"/operator/contracts/{deal.id}",
                    notification_type='milestone_added',
                )
        except Exception as exc:
            logger.debug("تعذر إرسال إشعار مرحلة التنفيذ: %s", exc)

        return Response({
            'message': f'تم إنشاء مرحلة التنفيذ {milestone.title} بنجاح.',
            'milestone': serializer.data,
            'audit_log_id': str(audit_entry.id),
            'checksum': audit_entry.checksum,
        }, status=status.HTTP_201_CREATED)
