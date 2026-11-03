import logging
from django.db import models
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.http import HttpResponse, FileResponse
from rest_framework import views, status, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from apps.users.models import CustomUser, Notification
from apps.users.permissions import CanIssueInjunctions
from apps.audit.models import AuditLog
from .models import AdministrativeNotice, ProcurementDeal
from .serializers import AdministrativeNoticeSerializer

logger = logging.getLogger(__name__)


class CentralInjunctionsView(views.APIView):
    """
    إدارة واستعراض الإعذارات الإدارية الرقابية من قبل الإدارة المركزية (عين الصقر):
    - GET /api/reports/central/injunctions/ و /api/central/injunctions/
    - POST /api/reports/central/injunctions/ و /api/central/injunctions/
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        user = request.user
        if not user.is_staff and getattr(user, 'role', None) != 'central_admin':
            return Response(
                {'error': 'استعراض سجل الإعذارات المركزية مقصور على مسؤولي ومفتشي عين الصقر.'},
                status=status.HTTP_403_FORBIDDEN
            )

        qs = AdministrativeNotice.objects.all().select_related('authority', 'deal', 'issued_by')

        # Filters
        authority_id = request.query_params.get('authority')
        if authority_id:
            qs = qs.filter(authority_id=authority_id)

        deal_id = request.query_params.get('deal')
        if deal_id:
            qs = qs.filter(deal_id=deal_id)

        violation_type = request.query_params.get('violation_type')
        if violation_type:
            qs = qs.filter(violation_type=violation_type)

        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        # Auto-check escalation for expired injunctions
        for item in qs:
            try:
                item.check_and_update_escalation()
            except Exception:
                pass

        total = qs.count()
        active = qs.filter(status__in=['issued', 'acknowledged']).count()
        resolved = qs.filter(status='resolved').count()
        escalated = qs.filter(status='escalated_to_court').count()

        serializer = AdministrativeNoticeSerializer(qs, many=True, context={'request': request})
        return Response({
            'count': total,
            'stats': {
                'total': total,
                'active': active,
                'resolved': resolved,
                'escalated': escalated,
            },
            'results': serializer.data,
            'injunctions': serializer.data,
        })

    def post(self, request):
        user = request.user
        if not CanIssueInjunctions().has_permission(request, self):
            return Response(
                {'error': 'إصدار الإعذارات الإدارية الرقابية مقصور حصرياً على المفتش العام والمفتشين المعتمدين.'},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)

        authority_id = data.get('authority')
        if not authority_id:
            return Response({'error': 'المصلحة المتعاقدة المستهدفة مطلوبة إلزامياً.'}, status=status.HTTP_400_BAD_REQUEST)

        authority = get_object_or_404(CustomUser, pk=authority_id)

        deal = None
        deal_id = data.get('deal')
        if deal_id:
            try:
                deal = ProcurementDeal.objects.filter(pk=deal_id).first()
            except Exception:
                deal = None

        violation_type = data.get('violation_type', 'tender_splitting')
        legal_reference = data.get('legal_reference')
        if not legal_reference:
            ref_map = {
                'tender_splitting': 'المادة 13 من القانون 23-12',
                'avenant_excess': 'المادتان 138 و139 من المرسوم الرئاسي 15-247',
                'blacklist_violation': 'المادة 75 من القانون 23-12',
                'deadline_breach': 'أحكام المادتين 65 و66 من القانون 23-12',
                'hawk_eye_ignored': 'المادة 10 من القانون 23-12 (النزاهة والرقابة)',
            }
            legal_reference = ref_map.get(violation_type, 'أحكام القانون 23-12 والمرسوم 15-247')

        directive_text = data.get('directive_text')
        if not directive_text:
            return Response({'error': 'نص الأمر الإداري بالتصحيح والتسوية مطلوب إلزامياً.'}, status=status.HTTP_400_BAD_REQUEST)

        deadline_days = int(data.get('deadline_days') or 15)

        ref = data.get('reference')
        if not ref:
            year = timezone.localdate().year
            count = AdministrativeNotice.objects.count() + 1
            ref = f"INJ-{year}-{count:03d}"

        notice = AdministrativeNotice.objects.create(
            reference=ref,
            authority=authority,
            deal=deal,
            violation_type=violation_type,
            legal_reference=legal_reference,
            directive_text=directive_text,
            violation_details=data.get('violation_details', ''),
            issued_date=data.get('issued_date') or timezone.localdate(),
            deadline_days=deadline_days,
            status='issued',
            issued_by=user,
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
            action='ADMINISTRATIVE_INJUNCTION_ISSUED',
            resource_type='AdministrativeNotice',
            resource_id=str(notice.id),
            description=f"إصدار إعذار إداري رقابي {notice.reference} ضد المصلحة {authority.full_name} بخصوص '{notice.get_violation_type_display()}'.",
            changes={
                'injunction_id': str(notice.id),
                'reference': notice.reference,
                'authority_id': str(authority.id),
                'deal_id': str(deal.id) if deal else None,
                'violation_type': notice.violation_type,
                'deadline_days': notice.deadline_days,
            },
            ip_address=ip,
            timestamp=now,
        )

        try:
            Notification.objects.create(
                user=authority,
                title=f"⚠️ إعذار إداري رقابي عاجل رقم {notice.reference}",
                text=(
                    f"أصدرت الإدارة المركزية (عين الصقر) إعذاراً إدارياً رقابياً ملزماً برقم {notice.reference} "
                    f"بشأن مخالفة '{notice.get_violation_type_display()}'. "
                    f"المهلة الممنوحة لتقديم تقرير التصحيح هي {notice.deadline_days} يوماً (حتى {notice.deadline_date})."
                ),
                link_href="/authority/audit?tab=injunctions",
                notification_type="urgent",
            )
        except Exception as e:
            logger.warning("تعذر إنشاء إشعار للمصلحة %s: %s", authority.id, e)

        serializer = AdministrativeNoticeSerializer(notice, context={'request': request})
        return Response({
            'message': f'تم إصدار الإعذار الإداري الرقابي {notice.reference} بنجاح.',
            'injunction': serializer.data,
        }, status=status.HTTP_201_CREATED)


class AuthorityInjunctionsView(views.APIView):
    """
    استعراض الإعذارات الإدارية الموجهة للمصلحة المتعاقدة:
    - GET /api/procurements/authorities/{authority_id}/injunctions/
    - GET /api/procurements/my-injunctions/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, authority_id=None):
        user = request.user
        target_auth_id = authority_id

        if not target_auth_id:
            target_auth_id = user.id

        if not user.is_staff and getattr(user, 'role', None) != 'central_admin':
            if str(target_auth_id) != str(user.id):
                return Response({'error': 'لا تملك صلاحية الاطلاع على إعذارات جهة أخرى.'}, status=status.HTTP_403_FORBIDDEN)

        qs = AdministrativeNotice.objects.filter(authority_id=target_auth_id).select_related('authority', 'deal', 'issued_by')

        for item in qs:
            try:
                item.check_and_update_escalation()
            except Exception:
                pass

        active_count = qs.filter(status__in=['issued', 'acknowledged']).count()
        escalated_count = qs.filter(status='escalated_to_court').count()
        has_active = active_count > 0 or escalated_count > 0

        serializer = AdministrativeNoticeSerializer(qs, many=True, context={'request': request})
        return Response({
            'authority_id': str(target_auth_id),
            'has_active_injunction': has_active,
            'active_count': active_count,
            'escalated_count': escalated_count,
            'injunctions': serializer.data,
            'results': serializer.data,
        })


class InjunctionRespondView(views.APIView):
    """
    تقديم المصلحة المتعاقدة لتقرير التصحيح والرد الرسمي:
    - PATCH /api/procurements/injunctions/{id}/respond/
    - POST /api/procurements/injunctions/{id}/respond/
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request, pk):
        return self.handle_respond(request, pk)

    def post(self, request, pk):
        return self.handle_respond(request, pk)

    def handle_respond(self, request, pk):
        notice = get_object_or_404(AdministrativeNotice, pk=pk)
        user = request.user

        if not user.is_staff and getattr(user, 'role', None) != 'central_admin':
            if str(notice.authority_id) != str(user.id):
                return Response({'error': 'لا تملك صلاحية الرد على إعذار صادر لجهة أخرى.'}, status=status.HTTP_403_FORBIDDEN)

        response_text = request.data.get('authority_response') or request.data.get('response', '')
        if not response_text and 'authority_response_file' not in request.FILES and 'file' not in request.FILES:
            return Response({'error': 'تقرير التصحيح أو إرفاق ملف PDF إلزامي للرد على الإعذار.'}, status=status.HTTP_400_BAD_REQUEST)

        if response_text:
            notice.authority_response = response_text

        uploaded_file = request.FILES.get('authority_response_file') or request.FILES.get('file')
        if uploaded_file:
            notice.authority_response_file = uploaded_file

        notice.status = 'resolved'
        notice.responded_at = timezone.now()
        notice.responded_by = user
        notice.save()

        now = timezone.now()
        ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()

        AuditLog.objects.create(
            user=user,
            action='ADMINISTRATIVE_INJUNCTION_RESPONDED',
            resource_type='AdministrativeNotice',
            resource_id=str(notice.id),
            description=f"تقديم تقرير التصحيح الرسمي للإعذار الإداري {notice.reference} بواسطة {user.email}.",
            changes={
                'injunction_id': str(notice.id),
                'status': 'resolved',
                'responded_at': now.isoformat(),
            },
            ip_address=ip,
            timestamp=now,
        )

        try:
            inspectors = CustomUser.objects.filter(models.Q(role='central_admin') | models.Q(is_staff=True))
            auth_name = getattr(notice.authority, 'entity_name', None) or getattr(notice.authority, 'full_name', None) or notice.authority.email
            for inspector in inspectors:
                Notification.objects.create(
                    user=inspector,
                    title=f"استلام تقرير التصحيح: إعذار رقابي {notice.reference}",
                    text=f"أودعت المصلحة المتعاقدة ({auth_name}) تقرير التصحيح والرد الرسمي على الإعذار الإداري {notice.reference}.",
                    link_href="/central/injunctions",
                    notification_type="update",
                )
        except Exception:
            pass

        serializer = AdministrativeNoticeSerializer(notice, context={'request': request})
        return Response({
            'message': 'تم تسجيل وإيداع تقرير التصحيح بنجاح واعتماد تسوية الإعذار الرقابي.',
            'injunction': serializer.data,
        })


class InjunctionAcknowledgeView(views.APIView):
    """
    تأكيد المصلحة المتعاقدة لاستلام الإعذار الإداري:
    - PATCH /api/procurements/injunctions/{id}/acknowledge/
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        notice = get_object_or_404(AdministrativeNotice, pk=pk)
        user = request.user

        if not user.is_staff and getattr(user, 'role', None) != 'central_admin':
            if str(notice.authority_id) != str(user.id):
                return Response({'error': 'غير مصرح.'}, status=status.HTTP_403_FORBIDDEN)

        notice.status = 'acknowledged'
        notice.acknowledged_at = timezone.now()
        notice.save()

        serializer = AdministrativeNoticeSerializer(notice, context={'request': request})
        return Response({
            'message': 'تم تأكيد استلام الإعذار الإداري الرقابي وفق المادة 67.',
            'injunction': serializer.data,
        })


class InjunctionPdfView(views.APIView):
    """
    تحميل وثيقة الإعذار الإداري الرسمي PDF مع الختم الرقمي:
    - GET /api/central/injunctions/{id}/pdf/
    - GET /api/procurements/injunctions/{id}/pdf/
    - GET /api/reports/central/injunctions/{id}/pdf/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        notice = get_object_or_404(AdministrativeNotice, pk=pk)
        if notice.document_pdf:
            return FileResponse(notice.document_pdf.open(), content_type='application/pdf')

        try:
            from .pdf_service import generate_administrative_injunction_pdf
            pdf_bytes = generate_administrative_injunction_pdf(notice, request.user)
            filename = f"Injonction_{notice.reference}.pdf"
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            logger.error("تعذر إنشاء PDF للإعذار الإداري %s: %s", notice.id, e)
            return Response({'error': f'تعذر إنشاء وثيقة الإعذار الإداري: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
