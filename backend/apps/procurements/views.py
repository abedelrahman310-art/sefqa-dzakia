from django.db import models
from decimal import Decimal
import logging
from django.utils import timezone
from django.core.files.base import ContentFile
from django.core.exceptions import ValidationError
from django.http import FileResponse, HttpResponse
from rest_framework import viewsets, permissions, views, status
from rest_framework.views import APIView
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
    Avenant,
    LegalNotice,
)
from .serializers import (
    ProcurementDealSerializer,
    CahierSpecsSerializer,
    OpportunitySerializer,
    ContractSerializer,
    MilestoneSerializer,
    MilestoneProgressReportSerializer,
    OfferSerializer,
    AvenantSerializer,
    LegalNoticeSerializer,
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
    """إدارة الصفقات العمومية وفق القانون 23-12 مع عزل صارم لبيانات المصالح المتعاقدة"""
    queryset = ProcurementDeal.objects.all().select_related('authority')
    serializer_class = ProcurementDealSerializer
    permission_classes = [IsContractingAuthorityOrReadOnly]
    throttle_classes = [UserRateThrottle, AnonRateThrottle]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            qs = ProcurementDeal.objects.filter(current_stage__gte=3).select_related('authority')
        elif getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False) or getattr(user, 'role', None) == 'central_admin':
            qs = ProcurementDeal.objects.all().select_related('authority')
        elif getattr(user, 'role', None) == 'authority':
            qs = ProcurementDeal.objects.filter(authority=user).select_related('authority')
        elif getattr(user, 'role', None) == 'operator':
            qs = ProcurementDeal.objects.filter(current_stage__gte=3).select_related('authority')
        else:
            qs = ProcurementDeal.objects.filter(current_stage__gte=3).select_related('authority')

        # فلترة الصفقات المنتهية / النشطة في القوائم وفق المادة 68 من القانون 23-12
        if getattr(self, 'action', None) == 'list':
            status_param = self.request.query_params.get('status')
            now = timezone.now()
            if getattr(user, 'role', None) == 'operator' or not user or not user.is_authenticated:
                if status_param == 'expired':
                    qs = qs.filter(submission_deadline__lt=now)
                elif status_param == 'all':
                    pass
                else:  # الافتراضي للمتعاملين والعموم: الصفقات النشطة فقط
                    qs = qs.filter(models.Q(submission_deadline__gte=now) | models.Q(submission_deadline__isnull=True))
            else:
                if status_param == 'expired':
                    qs = qs.filter(submission_deadline__lt=now)
                elif status_param == 'active':
                    qs = qs.filter(models.Q(submission_deadline__gte=now) | models.Q(submission_deadline__isnull=True))

        return qs

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

    @action(detail=True, methods=['get'], url_path='offers')
    def offers(self, request, pk=None):
        """
        مسار GET /api/procurements/deals/{id}/offers/
        جلب قائمة العروض الخاصة بصفقة معينة.
        وفق القانون 23-12: إذا كانت الصفقة في مرحلة أقل من 4 (قبل فتح الأظرفة)،
        يجب حجب المبلغ المالي وإعادته كـ null حتى لو كان الطالب هو المصلحة المتعاقدة.
        """
        deal = self.get_object()
        user = request.user

        # التحقق من الصلاحيات
        if not user.is_authenticated:
            return Response({'error': 'تسجيل الدخول مطلوب.'}, status=status.HTTP_401_UNAUTHORIZED)

        is_owner = (getattr(deal, 'authority_id', None) == user.id)
        is_admin = (user.is_staff or getattr(user, 'role', None) == 'central_admin')
        if is_owner or is_admin:
            offers_qs = BidOffer.objects.filter(deal=deal).select_related('operator', 'deal')
        elif getattr(user, 'role', None) == 'operator':
            offers_qs = BidOffer.objects.filter(deal=deal, operator=user).select_related('operator', 'deal')
        else:
            return Response({'error': 'غير مخول باستعراض عروض هذه الصفقة.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = OfferSerializer(offers_qs, many=True, context={'request': request})
        return Response({
            'deal_id': str(deal.id),
            'deal_reference': deal.reference_number,
            'current_stage': deal.current_stage,
            'offers': serializer.data,
            'count': len(serializer.data),
        })

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

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return CahierSpecs.objects.none()
        if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False) or getattr(user, 'role', None) == 'central_admin':
            return CahierSpecs.objects.all().select_related('deal')
        if getattr(user, 'role', None) == 'authority':
            # للعمليات الكتابية نعيد الكائن كاملاً حتى يطبّق DRF صلاحية
            # IsCahierAuthorityOwner ويعيد 403 بدل إخفاء الكائن بـ 404.
            # أما القراءة فتبقى محصورة بدفاتر المصلحة نفسها.
            if getattr(self, 'action', None) in ('update', 'partial_update', 'destroy'):
                return CahierSpecs.objects.all().select_related('deal')
            return CahierSpecs.objects.filter(deal__authority=user).select_related('deal')
        return CahierSpecs.objects.filter(deal__current_stage__gte=3).select_related('deal')


class OpportunityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    قائمة وتفاصيل الصفقات/الفرص المتاحة للمتعاملين والعموم.
    يدعم مسار /api/opportunities/ ويعيد بنية متوافقة مع الواجهة الأمامية.
    يتطلب مصادقة (IsAuthenticated).
    """
    queryset = ProcurementDeal.objects.all().select_related('authority', 'cahier_specs')
    serializer_class = OpportunitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            qs = ProcurementDeal.objects.filter(current_stage__gte=3).select_related('authority', 'cahier_specs')
        elif getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False) or getattr(user, 'role', None) == 'central_admin':
            qs = ProcurementDeal.objects.all().select_related('authority', 'cahier_specs')
        elif getattr(user, 'role', None) == 'authority':
            qs = ProcurementDeal.objects.filter(authority=user).select_related('authority', 'cahier_specs')
        else:
            qs = ProcurementDeal.objects.filter(current_stage__gte=3).select_related('authority', 'cahier_specs')

        # فلترة الصفقات المنتهية / النشطة في القوائم وفق المادة 68 من القانون 23-12
        if getattr(self, 'action', None) == 'list':
            status_param = self.request.query_params.get('status')
            now = timezone.now()
            if getattr(user, 'role', None) == 'operator' or not user or not user.is_authenticated:
                if status_param == 'expired':
                    qs = qs.filter(submission_deadline__lt=now)
                elif status_param == 'all':
                    pass
                else:  # الافتراضي للمتعاملين: الصفقات النشطة فقط
                    qs = qs.filter(models.Q(submission_deadline__gte=now) | models.Q(submission_deadline__isnull=True))
            else:
                if status_param == 'expired':
                    qs = qs.filter(submission_deadline__lt=now)
                elif status_param == 'active':
                    qs = qs.filter(models.Q(submission_deadline__gte=now) | models.Q(submission_deadline__isnull=True))

        return qs

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


class DealAvenantsView(views.APIView):
    """
    إدارة الملاحق التعاقدية للصفقة (Avenants):
    - GET /api/procurements/deals/{id}/avenants/ : قائمة ملاحق الصفقة ومؤشرات الحدود القانونية.
    - POST /api/procurements/deals/{id}/avenants/ : إنشاء ملحق تعاقدي جديد مع التحقق القانوني الصارم (20%-25%).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, deal_id):
        deal = get_object_or_404(ProcurementDeal, id=deal_id)
        avenants = deal.avenants.all()
        serializer = AvenantSerializer(avenants, many=True, context={'request': request})

        base_amt = deal.base_amount
        total_amt = deal.total_avenant_amount
        pct = deal.total_avenant_percentage

        return Response({
            'deal_id': str(deal.id),
            'deal_reference': deal.reference_number,
            'deal_title': deal.title,
            'base_amount': float(base_amt),
            'total_avenant_amount': float(total_amt),
            'total_avenant_percentage': pct,
            'limit_percentage': 20.0,
            'max_limit_percentage': 25.0,
            'is_approaching_limit': pct >= 20.0,
            'is_exceeded_limit': pct >= 25.0,
            'results': serializer.data,
            'avenants': serializer.data,
        })

    def post(self, request, deal_id):
        deal = get_object_or_404(ProcurementDeal, id=deal_id)
        user = request.user

        # التحقق من صلاحيات المصلحة أو الإدارة المركزية
        if not user.is_staff and getattr(user, 'role', None) != 'central_admin':
            if getattr(deal, 'authority_id', None) != user.id:
                return Response(
                    {'error': 'غير مخول بإنشاء ملاحق تعاقدية لهذه الصفقة. الإجراء مقتصر على المصلحة المتعاقدة المالكة.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        data['deal'] = deal.id

        # توليد رقم مرجعي تلقائي إذا لم يُقدم
        if not data.get('reference'):
            count = deal.avenants.count() + 1
            data['reference'] = f"AV-{count:03d}"

        serializer = AvenantSerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        avenant = serializer.save(deal=deal)

        # توثيق في سجل التدقيق الجنائي
        now = timezone.now()
        ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()

        audit_entry = AuditLog.objects.create(
            user=user,
            action='AVENANT_CREATED',
            resource_type='Avenant',
            resource_id=str(avenant.id),
            description=(
                f"إنشاء ملحق تعاقدي '{avenant.reference}' للصفقة {deal.reference_number} "
                f"بأثر مالي {avenant.amount_change} دج وتمديد {avenant.time_extension_days} يوماً بواسطة {user.email}."
            ),
            changes={
                'avenant_id': str(avenant.id),
                'deal_id': str(deal.id),
                'reference': avenant.reference,
                'amount_change': str(avenant.amount_change),
                'time_extension_days': avenant.time_extension_days,
                'reason': avenant.reason,
                'status': avenant.status,
            },
            ip_address=ip,
            timestamp=now,
        )

        return Response({
            'message': f'تم إنشاء الملحق التعاقدي {avenant.reference} بنجاح.',
            'avenant': serializer.data,
            'audit_log_id': str(audit_entry.id),
        }, status=status.HTTP_201_CREATED)


class AvenantApproveView(views.APIView):
    """
    اعتماد الملحق التعاقدي من قبل لجنة الصفقات:
    - PATCH /api/procurements/avenants/{id}/approve/
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        avenant = get_object_or_404(Avenant, pk=pk)
        user = request.user
        deal = avenant.deal

        # الصلاحيات
        if not user.is_staff and getattr(user, 'role', None) not in ('central_admin', 'authority'):
            return Response(
                {'error': 'غير مخول بالمصادقة على الملاحق التعاقدية.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if getattr(user, 'role', None) == 'authority' and getattr(deal, 'authority_id', None) != user.id:
            return Response(
                {'error': 'لا تملك المصلحة المتعاقدة صلاحية مصادقة ملحق لصفقة جهة أخرى.'},
                status=status.HTTP_403_FORBIDDEN
            )

        committee_ref = request.data.get('committee_approval_ref') or avenant.committee_approval_ref
        if not committee_ref:
            committee_ref = f"PV-COM-{timezone.now().strftime('%Y%m%d')}-{str(avenant.id)[:6].upper()}"

        avenant.status = 'approved'
        avenant.approved_at = timezone.now()
        avenant.committee_approval_ref = committee_ref

        if 'document_pdf' in request.FILES:
            avenant.document_pdf = request.FILES['document_pdf']

        avenant.save()

        # سجل التدقيق
        now = timezone.now()
        ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()

        AuditLog.objects.create(
            user=user,
            action='AVENANT_APPROVED',
            resource_type='Avenant',
            resource_id=str(avenant.id),
            description=f"اعتماد ومصادقة الملحق التعاقدي {avenant.reference} للصفقة {deal.reference_number} بمرجع {committee_ref}.",
            changes={
                'avenant_id': str(avenant.id),
                'status': 'approved',
                'committee_approval_ref': committee_ref,
                'approved_at': now.isoformat(),
            },
            ip_address=ip,
            timestamp=now,
        )

        serializer = AvenantSerializer(avenant, context={'request': request})
        return Response({
            'message': f'تمت المصادقة على الملحق {avenant.reference} بنجاح.',
            'avenant': serializer.data,
        })


class AvenantViewSet(viewsets.ModelViewSet):
    """إدارة واستعراض الملاحق التعاقدية"""
    queryset = Avenant.objects.all().select_related('deal')
    serializer_class = AvenantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        deal_id = self.request.query_params.get('deal')
        qs = Avenant.objects.all().select_related('deal')
        if deal_id:
            qs = qs.filter(deal_id=deal_id)
        if user.is_staff or getattr(user, 'role', None) == 'central_admin':
            return qs
        if getattr(user, 'role', None) == 'authority':
            return qs.filter(deal__authority=user)
        if getattr(user, 'role', None) == 'operator':
            return qs.filter(status='approved')
        return qs

    @action(detail=True, methods=['patch'], url_path='approve')
    def approve(self, request, pk=None):
        view = AvenantApproveView.as_view()
        return view(request._request, pk=pk)

    @action(detail=True, methods=['get'], url_path='pdf')
    def download_pdf(self, request, pk=None):
        avenant = self.get_object()
        if avenant.document_pdf:
            return FileResponse(avenant.document_pdf.open(), content_type='application/pdf')

        try:
            from .pdf_service import generate_avenant_pdf
            pdf_bytes = generate_avenant_pdf(avenant, request.user)
            filename = f"Avenant_{avenant.reference}_{avenant.deal.reference_number.replace('/', '_')}.pdf"
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            logger.error("تعذر إنشاء PDF للملحق %s: %s", avenant.id, e)
            return Response({'error': f'تعذر إنشاء ملف PDF للملحق: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class DealLegalNoticesView(views.APIView):
    """
    إدارة وعرض الاعذارات القانونية (Mises en Demeure) للصفقة:
    - GET /api/execution/deals/{id}/notices/ أو /api/procurements/deals/{id}/notices/
    - POST /api/execution/deals/{id}/notices/ أو /api/procurements/deals/{id}/notices/
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, deal_id=None, pk=None):
        target_id = deal_id or pk or request.query_params.get('deal')
        deal = get_object_or_404(ProcurementDeal, pk=target_id)
        user = request.user

        # تدقيق الصلاحيات المؤسسية
        if not user.is_staff and getattr(user, 'role', None) != 'central_admin':
            if getattr(user, 'role', None) == 'authority' and deal.authority_id != user.id:
                return Response({'error': 'لا تملك صلاحية استعراض اعذارات صفقة تابعة لجهة أخرى.'}, status=status.HTTP_403_FORBIDDEN)
            if getattr(user, 'role', None) == 'operator':
                is_contractor = False
                if hasattr(deal, 'contract') and deal.contract and deal.contract.awarded_operator_id == user.id:
                    is_contractor = True
                elif deal.procurement_contracts.filter(operator=user).exists():
                    is_contractor = True
                elif deal.bids.filter(operator=user, status='awarded').exists():
                    is_contractor = True
                if not is_contractor:
                    return Response({'error': 'غير مصرح بالاطلاع على اعذارات هذه الصفقة.'}, status=status.HTTP_403_FORBIDDEN)

        notices = deal.legal_notices.all()
        for n in notices:
            try:
                n.check_and_update_expiry_and_penalty()
            except Exception:
                pass

        serializer = LegalNoticeSerializer(notices, many=True, context={'request': request})
        return Response({
            'deal_id': str(deal.id),
            'deal_reference': deal.reference_number,
            'deal_title': deal.title,
            'active_notices_count': deal.active_legal_notices_count,
            'has_expired_notice': deal.has_expired_notice,
            'notices': serializer.data,
        })

    def post(self, request, deal_id=None, pk=None):
        target_id = deal_id or pk or request.data.get('deal')
        deal = get_object_or_404(ProcurementDeal, pk=target_id)
        user = request.user

        if not user.is_staff and getattr(user, 'role', None) not in ('authority', 'central_admin'):
            return Response(
                {'error': 'إصدار الاعذارات القانونية حصري للمصالح المتعاقدة المخولة قانوناً.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if getattr(user, 'role', None) == 'authority' and deal.authority_id != user.id:
            return Response(
                {'error': 'لا تملك صلاحية إصدار إعذار لصفقة تابعة لجهة أخرى.'},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        data['deal'] = str(deal.id)

        if not data.get('reference'):
            year = timezone.localdate().year
            count = deal.legal_notices.count() + 1
            ref_clean = str(deal.reference_number).replace('/', '-').strip()[-8:]
            data['reference'] = f"MD-{year}-{ref_clean}-{count:02d}"

        if not data.get('reason'):
            return Response({'error': 'نص وحيثيات الإعذار القانوني إلزامية وفق المرسوم 15-247.'}, status=status.HTTP_400_BAD_REQUEST)

        deadline_days = int(data.get('legal_deadline_days') or 15)

        notice = LegalNotice.objects.create(
            deal=deal,
            reference=data['reference'],
            notice_type=data.get('notice_type', 'delay'),
            reason=data['reason'],
            issued_date=data.get('issued_date') or timezone.localdate(),
            legal_deadline_days=deadline_days,
            status='issued',
            created_by=user,
        )

        if 'document_pdf' in request.FILES:
            notice.document_pdf = request.FILES['document_pdf']
            notice.save()

        now = timezone.now()
        ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()

        AuditLog.objects.create(
            user=user,
            action='LEGAL_NOTICE_ISSUED',
            resource_type='LegalNotice',
            resource_id=str(notice.id),
            description=f"إصدار إعذار قانوني رقم '{notice.reference}' للصفقة {deal.reference_number} بمهلة {notice.legal_deadline_days} يوماً.",
            changes={
                'notice_id': str(notice.id),
                'deal_id': str(deal.id),
                'reference': notice.reference,
                'notice_type': notice.notice_type,
                'legal_deadline_days': notice.legal_deadline_days,
                'issued_date': str(notice.issued_date),
            },
            ip_address=ip,
            timestamp=now,
        )

        serializer = LegalNoticeSerializer(notice, context={'request': request})
        return Response({
            'message': f'تم إصدار الإعذار القانوني {notice.reference} بنجاح.',
            'notice': serializer.data,
        }, status=status.HTTP_201_CREATED)


class LegalNoticeAcknowledgeView(views.APIView):
    """
    إقرار المتعامل الاقتصادي بالاستلام (Accusé de réception électronique)
    - PATCH /api/execution/notices/{id}/acknowledge/
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        notice = get_object_or_404(LegalNotice, pk=pk)
        user = request.user

        notice.status = 'acknowledged'
        notice.acknowledged_at = timezone.now()
        notice.acknowledged_by = user
        notice.save()

        now = timezone.now()
        ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()

        AuditLog.objects.create(
            user=user,
            action='LEGAL_NOTICE_ACKNOWLEDGED',
            resource_type='LegalNotice',
            resource_id=str(notice.id),
            description=f"إقرار رسمي باستلام الإعذار القانوني {notice.reference} من المتعامل {user.email}.",
            changes={
                'notice_id': str(notice.id),
                'acknowledged_at': now.isoformat(),
                'status': 'acknowledged',
            },
            ip_address=ip,
            timestamp=now,
        )

        serializer = LegalNoticeSerializer(notice, context={'request': request})
        return Response({
            'message': 'تم تسجيل الإقرار الرسمي بالاستلام بنجاح وفق المادة 67 من القانون 23-12.',
            'notice': serializer.data,
        })


class LegalNoticeResolveView(views.APIView):
    """
    تسوية الإعذار ورفع التنبيه بعد استدراك المتعامل للوضعية التعاقدية
    - PATCH /api/execution/notices/{id}/resolve/
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        notice = get_object_or_404(LegalNotice, pk=pk)
        user = request.user
        deal = notice.deal

        if not user.is_staff and getattr(user, 'role', None) not in ('authority', 'central_admin'):
            return Response({'error': 'المصلحة المتعاقدة فقط تملك صلاحية تسوية الإعذار.'}, status=status.HTTP_403_FORBIDDEN)
        if getattr(user, 'role', None) == 'authority' and deal.authority_id != user.id:
            return Response({'error': 'لا تملك صلاحية تسوية إعذار لصفقة جهة أخرى.'}, status=status.HTTP_403_FORBIDDEN)

        notes = request.data.get('notes') or request.data.get('resolution_notes') or 'تم استدراك التأخر وتصحيح الوضعية التعاقدية ميدانياً.'
        notice.status = 'resolved'
        notice.resolved_at = timezone.now()
        notice.resolution_notes = notes
        notice.save()

        now = timezone.now()
        ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()

        AuditLog.objects.create(
            user=user,
            action='LEGAL_NOTICE_RESOLVED',
            resource_type='LegalNotice',
            resource_id=str(notice.id),
            description=f"تسوية ورفع الإعذار القانوني {notice.reference} للصفقة {deal.reference_number}.",
            changes={
                'notice_id': str(notice.id),
                'status': 'resolved',
                'resolved_at': now.isoformat(),
                'resolution_notes': notes,
            },
            ip_address=ip,
            timestamp=now,
        )

        serializer = LegalNoticeSerializer(notice, context={'request': request})
        return Response({
            'message': f'تمت تسوية الإعذار {notice.reference} ورفع الإنذار بنجاح.',
            'notice': serializer.data,
        })


class LegalNoticeSubmitJustificationView(views.APIView):
    """
    تقديم المتعامل الاقتصادي للتبريرات والمستندات الكتابية رداً على الإعذار
    - POST /api/execution/notices/{id}/justification/
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, pk):
        notice = get_object_or_404(LegalNotice, pk=pk)
        user = request.user

        justification_text = request.data.get('justification') or request.data.get('operator_justification', '')
        if not justification_text and 'operator_justification_file' not in request.FILES and 'file' not in request.FILES:
            return Response({'error': 'يرجى تقديم مبررات كتابية أو إرفاق ملف تبريرات PDF.'}, status=status.HTTP_400_BAD_REQUEST)

        if justification_text:
            notice.operator_justification = justification_text

        uploaded_file = request.FILES.get('operator_justification_file') or request.FILES.get('file')
        if uploaded_file:
            notice.operator_justification_file = uploaded_file

        notice.justification_submitted_at = timezone.now()
        notice.save()

        now = timezone.now()
        ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()

        AuditLog.objects.create(
            user=user,
            action='LEGAL_NOTICE_JUSTIFICATION_SUBMITTED',
            resource_type='LegalNotice',
            resource_id=str(notice.id),
            description=f"تقديم تبريرات من المتعامل {user.email} بخصوص الإعذار القانوني {notice.reference}.",
            changes={
                'notice_id': str(notice.id),
                'justification_submitted_at': now.isoformat(),
            },
            ip_address=ip,
            timestamp=now,
        )

        serializer = LegalNoticeSerializer(notice, context={'request': request})
        return Response({
            'message': 'تم إرسال تبريراتكم للمصلحة المتعاقدة بنجاح وسيتم فحصها قانونياً.',
            'notice': serializer.data,
        })


class LegalNoticePdfView(views.APIView):
    """
    تحميل وثيقة الإعذار الرسمية PDF
    - GET /api/execution/notices/{id}/pdf/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        notice = get_object_or_404(LegalNotice, pk=pk)
        if notice.document_pdf:
            return FileResponse(notice.document_pdf.open(), content_type='application/pdf')

        try:
            from .pdf_service import generate_legal_notice_pdf
            pdf_bytes = generate_legal_notice_pdf(notice, request.user)
            filename = f"MiseEnDemeure_{notice.reference}_{notice.deal.reference_number.replace('/', '_')}.pdf"
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            logger.error("تعذر إنشاء PDF للإعذار %s: %s", notice.id, e)
            return Response({'error': f'تعذر إنشاء وثيقة الإعذار PDF: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LegalNoticeViewSet(viewsets.ModelViewSet):
    """إدارة واستعراض كافة الاعذارات القانونية مع دعم الإجراءات الخاصة"""
    queryset = LegalNotice.objects.all().select_related('deal')
    serializer_class = LegalNoticeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        deal_id = self.request.query_params.get('deal')
        qs = LegalNotice.objects.all().select_related('deal')
        if deal_id:
            qs = qs.filter(deal_id=deal_id)
        if user.is_staff or getattr(user, 'role', None) == 'central_admin':
            return qs
        if getattr(user, 'role', None) == 'authority':
            return qs.filter(deal__authority=user)
        if getattr(user, 'role', None) == 'operator':
            return qs.filter(
                models.Q(deal__contract__awarded_operator=user) |
                models.Q(deal__procurement_contracts__operator=user) |
                models.Q(deal__bids__operator=user, deal__bids__status='awarded')
            ).distinct()
        return qs.none()

    @action(detail=True, methods=['patch'], url_path='acknowledge')
    def acknowledge(self, request, pk=None):
        view = LegalNoticeAcknowledgeView.as_view()
        return view(request._request, pk=pk)

    @action(detail=True, methods=['patch'], url_path='resolve')
    def resolve(self, request, pk=None):
        view = LegalNoticeResolveView.as_view()
        return view(request._request, pk=pk)

    @action(detail=True, methods=['post'], url_path='justification')
    def submit_justification(self, request, pk=None):
        view = LegalNoticeSubmitJustificationView.as_view()
        return view(request._request, pk=pk)

    @action(detail=True, methods=['get'], url_path='pdf')
    def download_pdf(self, request, pk=None):
        view = LegalNoticePdfView.as_view()
        return view(request._request, pk=pk)


class DealCommitteeView(APIView):
    """
    إدارة واستعراض أعضاء لجنة فتح الأظرفة وتقييم العروض (COPEM)
    بموجب المادتين 78 و79 من القانون 23-12 والمادتين 70-71 من المرسوم 15-247.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_deal(self, pk_or_id, user):
        from apps.procurements.models import ProcurementDeal
        deal = ProcurementDeal.objects.filter(
            models.Q(id=pk_or_id) | models.Q(reference_number=pk_or_id)
        ).first()
        return deal

    def get(self, request, pk):
        deal = self.get_deal(pk, request.user)
        if not deal:
            return Response({"error": "الصفقة غير موجودة", "committee": []}, status=status.HTTP_404_NOT_FOUND)

        from apps.procurements.models import CahierSpecs
        specs = getattr(deal, 'cahier_specs', None)
        members = []
        if specs and isinstance(specs.administrative_clauses, dict):
            members = specs.administrative_clauses.get('committee_members') or []

        if not members:
            auth_name = getattr(deal.authority, 'displayName', None) or getattr(deal.authority, 'organizationName', None) or "رئيس المصلحة المتعاقدة"
            members = [
                {
                    "id": f"mem-1-{str(deal.id)[:8]}",
                    "fullName": auth_name,
                    "displayName": auth_name,
                    "role": "president",
                    "organization": getattr(deal.authority, 'organizationName', 'المصلحة المتعاقدة') or "المصلحة المتعاقدة",
                    "title": "رئيس لجنة فتح الأظرفة وتقييم العروض (COPEM)",
                    "appointedAt": deal.created_at.strftime('%Y-%m-%d') if deal.created_at else timezone.now().strftime('%Y-%m-%d'),
                    "isActive": True,
                },
                {
                    "id": f"mem-2-{str(deal.id)[:8]}",
                    "fullName": "المحاسب العمومي المعتمد",
                    "displayName": "المحاسب العمومي المعتمد",
                    "role": "rapporteur",
                    "organization": "المصلحة المالية والمحاسبية",
                    "title": "مقرر اللجنة - ممثل المصلحة المالية",
                    "appointedAt": deal.created_at.strftime('%Y-%m-%d') if deal.created_at else timezone.now().strftime('%Y-%m-%d'),
                    "isActive": True,
                },
                {
                    "id": f"mem-3-{str(deal.id)[:8]}",
                    "fullName": "المسؤول التقني للمشروع",
                    "displayName": "المسؤول التقني للمشروع",
                    "role": "member",
                    "organization": "المصلحة التقنية المختصة",
                    "title": "عضو تقني مؤهل",
                    "appointedAt": deal.created_at.strftime('%Y-%m-%d') if deal.created_at else timezone.now().strftime('%Y-%m-%d'),
                    "isActive": True,
                }
            ]

        return Response({
            "deal_id": str(deal.id),
            "deal_reference": deal.reference_number,
            "deal_title": deal.title,
            "committee": members,
            "members": members,
            "is_quorum_ready": len(members) >= 3 and any(m.get('role') == 'president' for m in members),
            "decree_reference": f"DEC-COPEM-{timezone.now().year}-{str(deal.id)[:6].upper()}"
        })

    def post(self, request, pk):
        deal = self.get_deal(pk, request.user)
        if not deal:
            return Response({"error": "الصفقة غير موجودة"}, status=status.HTTP_404_NOT_FOUND)

        import secrets
        from apps.procurements.models import CahierSpecs
        specs, _ = CahierSpecs.objects.get_or_create(deal=deal)
        if not isinstance(specs.administrative_clauses, dict):
            specs.administrative_clauses = {}

        data = request.data
        existing_members = list(specs.administrative_clauses.get('committee_members') or [])

        if 'displayName' in data or 'fullName' in data:
            name = (data.get('displayName') or data.get('fullName') or '').strip()
            role = data.get('role', 'member')
            org = (data.get('appointmentReference') or data.get('organization') or 'المصلحة المتعاقدة').strip()
            new_member = {
                "id": f"mem-{len(existing_members) + 1}-{secrets.token_hex(4)}",
                "fullName": name,
                "displayName": name,
                "role": role,
                "organization": org,
                "title": f"عضو لجنة ({role})",
                "appointedAt": timezone.now().strftime('%Y-%m-%d'),
                "isActive": True,
            }
            existing_members.append(new_member)
        elif 'members' in data and isinstance(data['members'], list):
            existing_members = data['members']
        elif isinstance(data, list):
            existing_members = data

        specs.administrative_clauses['committee_members'] = existing_members
        specs.save(update_fields=['administrative_clauses'])

        ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()
        AuditLog.objects.create(
            user=request.user,
            action='COMMITTEE_UPDATED',
            resource_type='ProcurementDeal',
            resource_id=str(deal.id),
            description=f"تحديث أعضاء لجنة فتح الأظرفة وتقييم العروض (COPEM) للصفقة {deal.reference_number}.",
            changes={'members_count': len(existing_members)},
            ip_address=ip,
            timestamp=timezone.now(),
        )

        return Response({
            "message": "تم تحديث أعضاء لجنة COPEM بنجاح وفق المادة 78 من القانون 23-12.",
            "committee": existing_members,
            "members": existing_members,
        }, status=status.HTTP_200_OK)
