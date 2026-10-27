import logging
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone
from .models import OpeningSession, SessionAccess

logger = logging.getLogger(__name__)


class OpeningSessionConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket Consumer لإدارة البث الحي لجلسة فتح الأظرفة عن بُعد.
    محمي بالمصادقة (JWT) ويتحقق من أحقية الحضور (SessionAccess).
    """

    async def connect(self):
        self.session_id = str(self.scope["url_route"]["kwargs"].get("session_id", ""))
        self.group_name = f"opening_session_{self.session_id}"
        user = self.scope.get("user")

        # 1. فحص المصادقة (JWT Authentication Check)
        if not user or not user.is_authenticated:
            logger.warning("محاولة اتصال WebSocket غير مصرح بها للجلسة %s", self.session_id)
            await self.close(code=4001)
            return

        # 2. فحص الصلاحية وحق الحضور (SessionAccess Verification)
        has_access, reason = await self.verify_session_access(user, self.session_id)
        if not has_access:
            logger.warning(
                "رفض اتصال WebSocket للمستخدم %s بالجلسة %s - السبب: %s",
                getattr(user, "email", "unknown"),
                self.session_id,
                reason,
            )
            await self.close(code=4003)
            return

        # 3. الانضمام إلى مجموعة البث للجلسة
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # 4. توثيق وقت انضمام المتعامل (joined_at)
        await self.record_operator_joined(user, self.session_id)

        # 5. إرسال تأكيد نجاح الاتصال
        await self.send_json({
            "type": "connection_established",
            "session_id": self.session_id,
            "user_id": str(user.id),
            "role": getattr(user, "role", ""),
            "message": "تم الاتصال الآمن بجلسة فتح الأظرفة بنجاح",
            "timestamp": timezone.now().isoformat(),
        })

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content):
        # معالجة رسائل النبض (Ping/Pong)
        msg_type = content.get("type")
        if msg_type == "ping":
            await self.send_json({
                "type": "pong",
                "session_id": self.session_id,
                "timestamp": timezone.now().isoformat(),
            })

    async def opening_broadcast(self, event):
        """استقبال وبث أحداث الجلسة لجميع المتصلين"""
        await self.send_json(event["data"])

    @database_sync_to_async
    def verify_session_access(self, user, session_id):
        try:
            session = OpeningSession.objects.select_related("tender").get(pk=session_id)
        except Exception:
            return False, "الجلسة غير موجودة"

        role = getattr(user, "role", None)

        # الرقابة المركزية ومسؤولو النظام
        if role == "central_admin" or user.is_staff:
            return True, "صلاحية إدارة ورقابة مركزية"

        # المصلحة المتعاقدة صاحبة الصفقة
        if role == "authority":
            if session.tender.authority_id == user.id:
                return True, "المصلحة المتعاقدة صاحبة الصفقة"
            return False, "الجلسة غير تابعة لهذه المصلحة"

        # المتعامل الاقتصادي
        if role == "operator":
            if session.access_policy == "public":
                return True, "جلسة عامة علنية"

            access = SessionAccess.objects.filter(
                session=session,
                operator=user,
                has_access=True,
                revoked_at__isnull=True,
            ).first()

            if access:
                return True, "تصريح حضور معتمد"
            return False, "لا تملك تصريح حضور لجلسة فتح هذه الصفقة (لم يتم تقديم عرض)"

        return False, "الدور غير مصرح له بحضور الجلسة"

    @database_sync_to_async
    def record_operator_joined(self, user, session_id):
        if getattr(user, "role", None) == "operator":
            SessionAccess.objects.filter(
                session_id=session_id,
                operator=user,
            ).update(joined_at=timezone.now())
