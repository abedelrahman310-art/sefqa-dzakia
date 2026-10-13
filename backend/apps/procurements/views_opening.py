import logging
from django.db import models
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.models import AuditLog
from apps.bids.models import BidOffer
from apps.users.models import CustomUser

from .models import OpeningEvent, OpeningSession, ProcurementDeal, SessionAccess
from .serializers import (
    OpeningEventSerializer,
    OpeningSessionDetailSerializer,
    OpeningSessionListSerializer,
    OpenOfferRequestSerializer,
    SessionScheduleRequestSerializer,
)

logger = logging.getLogger(__name__)


class IsAuthority(permissions.BasePermission):
    """المصلحة المتعاقدة أو الإدارة المركزية المخولة قانوناً بإدارة الجلسة"""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        role = getattr(request.user, "role", None)
        return role in ["authority", "central_admin"] or request.user.is_staff


class HasSessionAccess(permissions.BasePermission):
    """التحقق من أحقية حضور والاطلاع على الجلسة وفق ضوابط القانون 18-07"""

    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        user = request.user
        role = getattr(user, "role", None)

        if role == "central_admin" or user.is_staff:
            return True

        if role == "authority":
            return obj.tender.authority_id == user.id

        if role == "operator":
            if obj.access_policy == "public":
                return True
            return obj.accesses.filter(operator=user, revoked_at__isnull=True).exists()

        return False


class SessionScheduleView(APIView):
    """
    POST /api/procurements/sessions/schedule/
    برمجة جلسة فتح الأظرفة العلنية للصفقة وتوليد أذونات الحضور للمتعاملين المودعين
    """

    permission_classes = [IsAuthority]

    def post(self, request):
        serializer = SessionScheduleRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        tender = get_object_or_404(ProcurementDeal, pk=data["tender_id"])

        # 1. التحقق من صلاحية المصلحة المتعاقدة
        if tender.authority_id != request.user.id and not request.user.is_staff and getattr(request.user, "role", None) != "central_admin":
            logger.warning(
                "محاولة برمجة جلسة فتح لصفقة غير تابعة للمستخدم %s (الصفقة %s)",
                request.user.email,
                tender.reference_number,
            )
            return Response(
                {"detail": "المصلحة المتعاقدة صاحبة الصفقة فقط مخولة ببرمجة جلسة الفتح."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 2. التحقق من المرحلة القانونية (3: نشر الإعلان، 4: استفسارات، 5: استلام العروض)
        if tender.current_stage not in [3, 4, 5]:
            logger.warning(
                "محاولة برمجة جلسة في مرحلة غير قانونية: %s للصفقة %s",
                tender.current_stage,
                tender.reference_number,
            )
            return Response(
                {
                    "detail": "لا يمكن برمجة جلسة فتح الأظرفة إلا خلال مراحل الإعلان أو الاستفسارات أو استلام العروض (المراحل 3 أو 4 أو 5)."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. التحقق من عدم وجود جلسة قائمة مسبقاً
        existing_session = OpeningSession.objects.filter(tender=tender).first()
        if existing_session and existing_session.status in ["scheduled", "live"]:
            return Response(
                {
                    "detail": f"توجد جلسة فتح قائمة مسبقاً لهذه الصفقة بالحالة ({existing_session.get_status_display()}).",
                    "session_id": str(existing_session.id),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        elif existing_session:
            existing_session.delete()

        # 4. إنشاء جلسة الفتح
        session = OpeningSession.objects.create(
            tender=tender,
            scheduled_at=data["scheduled_at"],
            location=data["location"],
            stream_url=data.get("stream_url", ""),
            status="scheduled",
            access_policy="participants_only",
            created_by=request.user,
        )

        # 5. استخراج العروض وإنشاء تصاريح الحضور للمتعاملين المودعين
        bids_qs = BidOffer.objects.filter(deal=tender)
        submitted_qs = bids_qs.exclude(status="draft")
        relevant_bids = submitted_qs if submitted_qs.exists() else bids_qs

        operator_ids = relevant_bids.values_list("operator_id", flat=True).distinct()
        created_accesses = 0
        for op_id in operator_ids:
            SessionAccess.objects.get_or_create(
                session=session,
                operator_id=op_id,
                defaults={
                    "can_view_live": True,
                    "can_view_recording": True,
                    "can_download_minutes": True,
                },
            )
            created_accesses += 1

        session.total_offers = relevant_bids.count()
        session.save(update_fields=["total_offers"])

        # 6. تسجيل العملية في سجل التدقيق غير القابل للتعديل
        AuditLog.objects.create(
            user=request.user,
            action="opening_session_scheduled",
            resource_type="OpeningSession",
            resource_id=str(session.id),
            description=f"برمجة جلسة فتح الأظرفة العلنية للصفقة {tender.reference_number} لتاريخ {session.scheduled_at}",
            changes={
                "tender_id": str(tender.id),
                "scheduled_at": session.scheduled_at.isoformat(),
                "location": session.location,
                "access_policy": session.access_policy,
                "total_offers": session.total_offers,
                "accesses_granted": created_accesses,
            },
        )

        logger.info(
            "تمت برمجة جلسة فتح الأظرفة %s للصفقة %s بنجاح",
            session.id,
            tender.reference_number,
        )
        return Response(
            OpeningSessionDetailSerializer(session, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class SessionListView(APIView):
    """
    GET /api/procurements/sessions/
    استرجاع قائمة الجلسات المتاحة للمستخدم بحسب دوره وصلاحياته القانونية
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        role = getattr(user, "role", None)

        if role == "authority":
            sessions = OpeningSession.objects.filter(tender__authority=user).select_related("tender")
        elif role == "operator":
            sessions = (
                OpeningSession.objects.filter(
                    models.Q(accesses__operator=user, accesses__revoked_at__isnull=True)
                    | models.Q(access_policy="public")
                )
                .distinct()
                .select_related("tender")
            )
        else:
            # central_admin أو مدراء المنصة
            sessions = OpeningSession.objects.all().select_related("tender")

        serializer = OpeningSessionListSerializer(sessions, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class SessionDetailView(APIView):
    """
    GET /api/procurements/sessions/{id}/
    استرجاع التفاصيل الكاملة لجلسة الفتح مع وقائعها وأحداثها وفق ضوابط القانون 18-07
    """

    permission_classes = [permissions.IsAuthenticated, HasSessionAccess]

    def get(self, request, pk):
        session = get_object_or_404(
            OpeningSession.objects.select_related("tender", "tender__authority").prefetch_related("events", "accesses"),
            pk=pk,
        )
        self.check_object_permissions(request, session)

        serializer = OpeningSessionDetailSerializer(session, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class SessionStartView(APIView):
    """
    POST /api/procurements/sessions/{id}/start/
    إطلاق وبدء جلسة فتح الأظرفة العلنية رسمياً
    """

    permission_classes = [IsAuthority]

    def post(self, request, pk):
        session = get_object_or_404(OpeningSession.objects.select_related("tender"), pk=pk)

        if session.tender.authority_id != request.user.id and not request.user.is_staff and getattr(request.user, "role", None) != "central_admin":
            return Response(
                {"detail": "المصلحة المتعاقدة صاحبة الصفقة فقط مخولة ببدء الجلسة."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if session.status != "scheduled":
            return Response(
                {"detail": f"لا يمكن بدء الجلسة، حالتها الحالية: ({session.get_status_display()})."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.status = "live"
        session.started_at = timezone.now()
        session.save(update_fields=["status", "started_at"])

        # إنشاء حدث بدء الجلسة
        OpeningEvent.objects.create(
            session=session,
            event_type="session_started",
            order=0,
            is_accepted=True,
            notes="افتتاح وبدء جلسة فتح الأظرفة العلنية رسمياً.",
            created_by=request.user,
        )

        # توثيق في سجل التدقيق
        AuditLog.objects.create(
            user=request.user,
            action="opening_session_started",
            resource_type="OpeningSession",
            resource_id=str(session.id),
            description=f"افتتاح وبدء جلسة فتح الأظرفة العلنية للصفقة {session.tender.reference_number}",
            changes={
                "previous_status": "scheduled",
                "new_status": "live",
                "started_at": session.started_at.isoformat(),
            },
        )

        logger.info("تم بدء جلسة فتح الأظرفة %s بنجاح", session.id)
        return Response(
            OpeningSessionDetailSerializer(session, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class SessionOpenOfferView(APIView):
    """
    POST /api/procurements/sessions/{id}/open-offer/
    فتح ظرف عرض متعامل اقتصادي وإعلان مبلغه المالي وقرار القبول المبدئي
    """

    permission_classes = [IsAuthority]

    def post(self, request, pk):
        session = get_object_or_404(OpeningSession.objects.select_related("tender"), pk=pk)

        if session.tender.authority_id != request.user.id and not request.user.is_staff and getattr(request.user, "role", None) != "central_admin":
            return Response(
                {"detail": "المصلحة المتعاقدة صاحبة الصفقة فقط مخولة بفتح العروض."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if session.status != "live":
            return Response(
                {"detail": f"جلسة الفتح ليست جارية حالياً (الحالة الحالية: {session.get_status_display()})."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = OpenOfferRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        offer = get_object_or_404(BidOffer.objects.select_related("deal", "operator"), pk=data["offer_id"])

        if offer.deal_id != session.tender_id:
            return Response(
                {"detail": "العرض المحدد لا ينتمي إلى صفقة هذه الجلسة."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.opened_count += 1
        event = OpeningEvent.objects.create(
            session=session,
            offer=offer,
            event_type="offer_opened" if data.get("is_accepted", True) else "offer_rejected",
            order=session.opened_count,
            announced_price=data["announced_price"],
            is_accepted=data.get("is_accepted", True),
            notes=data.get("notes", ""),
            created_by=request.user,
        )
        session.save(update_fields=["opened_count"])

        # توثيق في سجل التدقيق
        AuditLog.objects.create(
            user=request.user,
            action="offer_opened",
            resource_type="OpeningEvent",
            resource_id=str(event.id),
            description=f"فتح العرض وإعلان المبلغ {event.announced_price} دج في جلسة الصفقة {session.tender.reference_number}",
            changes={
                "session_id": str(session.id),
                "offer_id": str(offer.id),
                "order": event.order,
                "announced_price": str(event.announced_price),
                "is_accepted": event.is_accepted,
            },
        )

        logger.info(
            "تم فتح العرض %s في الجلسة %s بالترتيب %s",
            offer.id,
            session.id,
            event.order,
        )
        return Response(
            OpeningEventSerializer(event, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class SessionEndView(APIView):
    """
    POST /api/procurements/sessions/{id}/end/
    اختتام جلسة فتح الأظرفة العلنية وتثبيت العروض المفتوحة
    """

    permission_classes = [IsAuthority]

    def post(self, request, pk):
        session = get_object_or_404(OpeningSession.objects.select_related("tender"), pk=pk)

        if session.tender.authority_id != request.user.id and not request.user.is_staff and getattr(request.user, "role", None) != "central_admin":
            return Response(
                {"detail": "المصلحة المتعاقدة صاحبة الصفقة فقط مخولة باختتام الجلسة."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if session.status != "live":
            return Response(
                {"detail": f"لا يمكن اختتام الجلسة لأنها ليست جارية (الحالة الحالية: {session.get_status_display()})."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.status = "ended"
        session.ended_at = timezone.now()
        session.save(update_fields=["status", "ended_at"])

        # إنشاء واقعة ختام الجلسة
        OpeningEvent.objects.create(
            session=session,
            event_type="session_ended",
            order=session.opened_count + 1,
            is_accepted=True,
            notes="اختتام جلسة فتح الأظرفة العلنية وإحالة العروض المقبولة على لجنة التقييم والمقارنة.",
            created_by=request.user,
        )

        # توثيق في سجل التدقيق
        AuditLog.objects.create(
            user=request.user,
            action="opening_session_ended",
            resource_type="OpeningSession",
            resource_id=str(session.id),
            description=f"اختتام جلسة فتح الأظرفة العلنية للصفقة {session.tender.reference_number}",
            changes={
                "previous_status": "live",
                "new_status": "ended",
                "ended_at": session.ended_at.isoformat(),
                "opened_count": session.opened_count,
            },
        )

        logger.info("تم اختتام جلسة فتح الأظرفة %s بنجاح", session.id)
        return Response(
            OpeningSessionDetailSerializer(session, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )
