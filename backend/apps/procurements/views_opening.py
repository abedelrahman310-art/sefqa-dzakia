import json
import logging
from django.db import models
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.models import AuditLog
from apps.bids.models import BidOffer
from apps.users.models import CustomUser

from .broadcasting import broadcast_session_event
from .models import OpeningEvent, OpeningSession, ProcurementDeal, SessionAccess
from .serializers import (
    DealOfferSummarySerializer,
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
            return obj.accesses.filter(operator=user, has_access=True, revoked_at__isnull=True).exists()

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

        # 3. التحقق من عدم وجود جلسة سابقة — الجلسات سجلات موثقة لا تُحذف
        # ولا يُعاد فتحها ببرمجة جديدة (إعادة الفتح تتطلب إذناً صريحاً خارج هذا المسار)
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
            return Response(
                {
                    "detail": f"توجد جلسة سابقة لهذه الصفقة بالحالة ({existing_session.get_status_display()})؛ الجلسات المغلقة سجلات موثقة لا تُحذف ولا يُعاد فتحها ببرمجة جديدة.",
                    "session_id": str(existing_session.id),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

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

        # تهيئة حصص التشفير التعددي لأعضاء اللجنة وفقاً للقانون 23-12 والمرسوم 15-247
        from .threshold_crypto import init_session_committee
        try:
            init_session_committee(session)
        except Exception as exc:
            logger.warning("تعذر تهيئة حصص التشفير التعددي تلقائياً: %s", exc)

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

        if session.status not in ["scheduled", "pending"]:
            return Response(
                {"detail": f"لا يمكن بدء الجلسة، حالتها الحالية: ({session.get_status_display()})."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 4. الحارس الزمني: يُحظر بدء الجلسة قبل موعدها المبرمج
        if timezone.now() < session.scheduled_at:
            return Response(
                {"detail": "لا يمكن بدء جلسة فتح الأظرفة قبل موعدها المبرمج رسمياً."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.status = "live"
        session.started_at = timezone.now()
        session.save(update_fields=["status", "started_at"])

        # نقل الصفقة تلقائياً إلى مرحلة فتح الأظرفة (المرحلة 4) لفك حجب المبالغ المالية نظامياً
        if session.tender.current_stage < 4:
            session.tender.current_stage = 4
            session.tender.save(update_fields=["current_stage"])

        # إنشاء حدث بدء الجلسة
        start_event = OpeningEvent.objects.create(
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

        # بث بدء الجلسة لجميع المتعاملين المتصلين عبر WebSockets
        broadcast_session_event(str(session.id), {
            "type": "session_started",
            "event_type": "session_started",
            "session_id": str(session.id),
            "status": "live",
            "started_at": session.started_at.isoformat(),
            "message": "تم افتتاح وبدء جلسة فتح الأظرفة العلنية رسمياً",
            "timestamp": timezone.now().isoformat(),
        })

        logger.info("تم بدء جلسة فتح الأظرفة %s بنجاح", session.id)
        return Response(
            OpeningSessionDetailSerializer(session, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class SessionOpenEnvelopeView(APIView):
    """
    POST /api/opening/sessions/{id}/open-envelope/
    (وأيضاً /api/procurements/sessions/{id}/open-envelope/)
    فتح ظرف عرض متعامل اقتصادي (تقني أو مالي)، فك تشفير المبلغ، وبث الحدث للمتعاملين عبر WebSocket.
    """

    permission_classes = [IsAuthority]

    def post(self, request, pk):
        session = get_object_or_404(OpeningSession.objects.select_related("tender"), pk=pk)

        if session.tender.authority_id != request.user.id and not request.user.is_staff and getattr(request.user, "role", None) != "central_admin":
            return Response(
                {"detail": "المصلحة المتعاقدة صاحبة الصفقة فقط مخولة بفتح الأظرفة."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if session.status != "live":
            return Response(
                {"detail": f"جلسة الفتح ليست جارية حالياً (الحالة الحالية: {session.get_status_display()})."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # التحقق من اكتمال مراسم النصاب القانوني والتشفير التعددي (المادة 70 من القانون 23-12)
        if session.committee_shares.exists() and session.ceremony_status != "unlocked":
            submitted_count = session.committee_shares.filter(is_submitted=True).count()
            if submitted_count < session.threshold_k:
                return Response(
                    {
                        "detail": "لا يمكن فك أظرفة العروض قبل اكتمال النصاب القانوني لمراسم التشفير التعددي للجنة (المادة 70 من القانون 23-12 والمادتين 70-71 من المرسوم 15-247).",
                        "error_code": "THRESHOLD_QUORUM_REQUIRED",
                        "ceremony_status": session.ceremony_status,
                        "submitted_count": submitted_count,
                        "required_k": session.threshold_k,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        offer_id = request.data.get("offer_id")
        envelope_type = str(request.data.get("envelope_type", "financial")).lower().strip()
        notes = request.data.get("notes", "")

        if not offer_id:
            return Response(
                {"detail": "حقل offer_id مطلوب."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        offer = get_object_or_404(BidOffer.objects.select_related("deal", "operator"), pk=offer_id)

        if offer.deal_id != session.tender_id:
            return Response(
                {"detail": "العرض المحدد لا ينتمي إلى صفقة هذه الجلسة."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # العروض المفتوحة في الجلسة هي المودَعة داخل الأجل حصراً — المسودات والمتأخرة مستبعدة
        if offer.status == "draft":
            return Response(
                {"detail": "العرض المحدد مسودة غير مودعة رسمياً؛ لا يُفتح في الجلسة إلا العرض المودَع."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deadline = session.tender.submission_deadline
        if deadline and offer.submission_timestamp and offer.submission_timestamp > deadline:
            return Response(
                {"detail": "العرض المحدد أُودع بعد انقضاء الأجل القانوني؛ يُستبعد من الجلسة."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # فك التشفير وتحديد نوع الواقعة والمبلغ المالي
        if envelope_type in ["financial", "opened_financial", "fin"]:
            norm_event_type = "opened_financial"
            # فك التشفير التشفيري (AES-256) للمبلغ المالي بطلب من رئيس اللجنة
            announced_amount = offer.decrypt_financial_amount()
            offer.is_encrypted = False
            offer.save(update_fields=['is_encrypted'])
        elif envelope_type in ["technical", "opened_technical", "tech"]:
            norm_event_type = "opened_technical"
            announced_amount = None
        else:
            norm_event_type = "offer_opened"
            announced_amount = offer.decrypt_financial_amount()
            offer.is_encrypted = False
            offer.save(update_fields=['is_encrypted'])

        # منع فتح نفس الظرف مرتين لنفس العرض (سلامة المحضر)
        if OpeningEvent.objects.filter(session=session, offer=offer, event_type=norm_event_type).exists():
            return Response(
                {"detail": f"تم فتح هذا الظرف ({norm_event_type}) مسبقاً لهذا العرض في محضر الجلسة."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.opened_count += 1
        session.save(update_fields=["opened_count"])

        event = OpeningEvent.objects.create(
            session=session,
            offer=offer,
            event_type=norm_event_type,
            order=session.opened_count,
            announced_price=announced_amount,
            announced_amount=announced_amount,
            is_accepted=True,
            notes=notes or f"فتح {norm_event_type} للعرض {offer.id}",
            created_by=request.user,
        )

        # توثيق في سجل التدقيق غير القابل للتعديل
        AuditLog.objects.create(
            user=request.user,
            action=f"envelope_opened_{norm_event_type}",
            resource_type="OpeningEvent",
            resource_id=str(event.id),
            description=f"فتح ظرف {norm_event_type} للعرض {offer.id} في جلسة الصفقة {session.tender.reference_number}",
            changes={
                "session_id": str(session.id),
                "offer_id": str(offer.id),
                "envelope_type": envelope_type,
                "event_type": norm_event_type,
                "announced_amount": str(announced_amount) if announced_amount is not None else None,
                "order": event.order,
            },
        )

        op_name = (
            getattr(offer.operator, "display_name", None)
            or getattr(offer.operator, "organization_name", None)
            or getattr(offer.operator, "company_name", None)
            or offer.operator.email
        )

        broadcast_data = {
            "type": "envelope_opened",
            "event_type": norm_event_type,
            "session_id": str(session.id),
            "event_id": str(event.id),
            "offer_id": str(offer.id),
            "operator_id": str(offer.operator_id),
            "operator_name": op_name,
            "announced_amount": float(announced_amount) if announced_amount is not None else None,
            "announced_price": float(announced_amount) if announced_amount is not None else None,
            "envelope_type": envelope_type,
            "order": event.order,
            "is_accepted": event.is_accepted,
            "timestamp": event.created_at.isoformat(),
            "notes": event.notes,
        }

        # بث الحدث عبر WebSocket لجميع المتعاملين المتصلين
        broadcast_session_event(str(session.id), broadcast_data)

        logger.info(
            "تم فتح ظرف %s للعرض %s في الجلسة %s وبثه عبر WebSockets",
            norm_event_type,
            offer.id,
            session.id,
        )
        return Response(broadcast_data, status=status.HTTP_201_CREATED)


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

        # التحقق من اكتمال مراسم النصاب القانوني والتشفير التعددي (المادة 70 من القانون 23-12)
        if session.committee_shares.exists() and session.ceremony_status != "unlocked":
            submitted_count = session.committee_shares.filter(is_submitted=True).count()
            if submitted_count < session.threshold_k:
                return Response(
                    {
                        "detail": "لا يمكن فك أظرفة العروض قبل اكتمال النصاب القانوني لمراسم التشفير التعددي للجنة (المادة 70 من القانون 23-12 والمادتين 70-71 من المرسوم 15-247).",
                        "error_code": "THRESHOLD_QUORUM_REQUIRED",
                        "ceremony_status": session.ceremony_status,
                        "submitted_count": submitted_count,
                        "required_k": session.threshold_k,
                    },
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

        # العروض المفتوحة في الجلسة هي المودَعة داخل الأجل حصراً — المسودات والمتأخرة مستبعدة
        if offer.status == "draft":
            return Response(
                {"detail": "العرض المحدد مسودة غير مودعة رسمياً؛ لا يُفتح في الجلسة إلا العرض المودَع."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deadline = session.tender.submission_deadline
        if deadline and offer.submission_timestamp and offer.submission_timestamp > deadline:
            return Response(
                {"detail": "العرض المحدد أُودع بعد انقضاء الأجل القانوني؛ يُستبعد من الجلسة."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # منع التوثيق المكرر للعرض نفسه في الجلسة (سلامة المحضر)
        if OpeningEvent.objects.filter(
            session=session,
            offer=offer,
            event_type__in=["offer_opened", "offer_rejected"],
        ).exists():
            return Response(
                {"detail": "هذا العرض موثق مسبقاً في محضر الجلسة؛ يُمنع فتحه وتوثيقه مرتين."},
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

        # بث الحدث للمتعاملين المتصلين عبر WebSockets
        broadcast_session_event(str(session.id), {
            "type": "offer_opened",
            "event_type": event.event_type,
            "session_id": str(session.id),
            "event_id": str(event.id),
            "offer_id": str(offer.id),
            "operator_id": str(offer.operator_id),
            "announced_amount": float(event.announced_price) if event.announced_price else None,
            "announced_price": float(event.announced_price) if event.announced_price else None,
            "order": event.order,
            "is_accepted": event.is_accepted,
            "timestamp": event.created_at.isoformat(),
            "notes": event.notes,
        })

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

        # بث اختتام الجلسة لجميع المتصلين عبر WebSockets
        broadcast_session_event(str(session.id), {
            "type": "session_ended",
            "event_type": "session_ended",
            "session_id": str(session.id),
            "status": "ended",
            "ended_at": session.ended_at.isoformat(),
            "opened_count": session.opened_count,
            "message": "تم اختتام جلسة فتح الأظرفة العلنية رسمياً",
            "timestamp": timezone.now().isoformat(),
        })

        logger.info("تم اختتام جلسة فتح الأظرفة %s بنجاح", session.id)
        return Response(
            OpeningSessionDetailSerializer(session, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class SessionOffersView(APIView):
    """
    GET /api/procurements/sessions/{id}/offers/
    استرجاع العروض المودعة الخاصة بصفقة هذه الجلسة حصراً
    """

    permission_classes = [permissions.IsAuthenticated, HasSessionAccess]

    def get(self, request, pk):
        session = get_object_or_404(OpeningSession.objects.select_related("tender"), pk=pk)
        self.check_object_permissions(request, session)

        # تصفية العروض حسب صفقة الجلسة حصراً (defense-in-depth)
        # + استبعاد المسودات والمتأخرة عن الأجل: الظاهر في الجلسة هو المودَع داخل الأجل فقط
        offers = (
            BidOffer.objects
            .filter(deal=session.tender)
            .exclude(status="draft")
            .select_related("operator")
            .order_by("created_at")
        )
        deadline = session.tender.submission_deadline
        if deadline:
            offers = offers.exclude(submission_timestamp__gt=deadline)

        # القانون 18-07: المتعامل لا يرى في الجلسة إلا عرضه الخاص؛
        # الكشف الكامل للمصلحة صاحبة الصفقة والرقابة المركزية فقط
        role = getattr(request.user, "role", None)
        if role == "operator" and not request.user.is_staff:
            offers = offers.filter(operator=request.user)

        serializer = DealOfferSummarySerializer(offers, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class SessionEventsView(APIView):
    """
    GET /api/opening/sessions/{id}/events/
    (وأيضاً /api/procurements/sessions/{id}/events/)
    استرجاع سجل وقائع وأحداث جلسة الفتح (لمن دخل متأخراً أو لإعادة المزامنة).
    """

    permission_classes = [permissions.IsAuthenticated, HasSessionAccess]

    def get(self, request, pk):
        session = get_object_or_404(OpeningSession.objects.select_related("tender"), pk=pk)
        self.check_object_permissions(request, session)

        events = session.events.select_related("offer", "offer__operator").order_by("order", "created_at")

        results = []
        for ev in events:
            op_name = None
            if ev.offer and ev.offer.operator:
                op = ev.offer.operator
                op_name = (
                    getattr(op, "display_name", None)
                    or getattr(op, "organization_name", None)
                    or getattr(op, "company_name", None)
                    or op.email
                )

            amount = ev.announced_amount if ev.announced_amount is not None else ev.announced_price

            results.append({
                "id": str(ev.id),
                "session_id": str(session.id),
                "event_type": ev.event_type,
                "event_type_display": ev.get_event_type_display(),
                "offer_id": str(ev.offer_id) if ev.offer_id else None,
                "operator_id": str(ev.offer.operator_id) if ev.offer else None,
                "operator_name": op_name,
                "announced_amount": float(amount) if amount is not None else None,
                "announced_price": float(amount) if amount is not None else None,
                "order": ev.order,
                "is_accepted": ev.is_accepted,
                "notes": ev.notes,
                "timestamp": ev.created_at.isoformat(),
            })

        return Response(results, status=status.HTTP_200_OK)


class SessionSSEStreamView(APIView):
    """
    GET /api/opening/sessions/{id}/stream/
    بث وقائع الجلسة عبر تقنية Server-Sent Events (SSE).
    """

    permission_classes = [permissions.IsAuthenticated, HasSessionAccess]

    def get(self, request, pk):
        session = get_object_or_404(OpeningSession.objects.select_related("tender"), pk=pk)
        self.check_object_permissions(request, session)

        def event_stream():
            init_payload = {
                "type": "init",
                "session_id": str(session.id),
                "status": session.status,
                "opened_count": session.opened_count,
                "total_offers": session.total_offers,
                "timestamp": timezone.now().isoformat(),
            }
            yield f"data: {json.dumps(init_payload, ensure_ascii=False)}\n\n"

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response

class SessionSubmitKeyShareView(APIView):
    """
    POST /api/procurements/sessions/{id}/submit-key-share/
    تأكيد حضور عضو لجنة فتح الأظرفة وتقديم حصته التشفيرية
    """
    permission_classes = [IsAuthority]

    def post(self, request, pk):
        session = get_object_or_404(OpeningSession.objects.select_related("tender"), pk=pk)
        member_role = request.data.get("member_role") or request.data.get("role") or request.data.get("share_id")
        if not member_role:
            return Response({"detail": "يجب تحديد صفة أو معرف عضو اللجنة."}, status=status.HTTP_400_BAD_REQUEST)

        from .threshold_crypto import init_session_committee, submit_committee_share
        if not session.committee_shares.exists():
            init_session_committee(session)

        try:
            result = submit_committee_share(session, str(member_role), user=request.user, request=request)
            # بث تحديث النصاب فورياً
            broadcast_session_event(
                str(session.id),
                {
                    "type": "committee_quorum_update",
                    "event_type": "committee_quorum_update",
                    "session_id": str(session.id),
                    **result,
                    "timestamp": timezone.now().isoformat(),
                }
            )
            return Response({
                "message": f"تم تسجيل حضور وتقديم حصة {result['member_submitted']} بنجاح.",
                **result,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SessionCommitteeStatusView(APIView):
    """
    GET /api/procurements/sessions/{id}/committee-status/
    استرجاع حالة أعضاء لجنة فتح الأظرفة ونصاب التشفير التعددي
    """
    permission_classes = [permissions.IsAuthenticated, HasSessionAccess]

    def get(self, request, pk):
        session = get_object_or_404(OpeningSession.objects.select_related("tender"), pk=pk)
        self.check_object_permissions(request, session)

        from .threshold_crypto import init_session_committee
        if not session.committee_shares.exists():
            init_session_committee(session)

        shares = session.committee_shares.all()
        from .serializers import OpeningCommitteeShareSerializer
        shares_data = OpeningCommitteeShareSerializer(shares, many=True).data

        submitted_count = shares.filter(is_submitted=True).count()
        return Response({
            "session_id": str(session.id),
            "ceremony_status": session.ceremony_status,
            "threshold_k": session.threshold_k,
            "threshold_n": session.threshold_n,
            "submitted_count": submitted_count,
            "quorum_reached": session.ceremony_status == 'unlocked' or (submitted_count >= session.threshold_k),
            "unlocked_at": session.unlocked_at.isoformat() if session.unlocked_at else None,
            "committee_shares": shares_data,
        }, status=status.HTTP_200_OK)

