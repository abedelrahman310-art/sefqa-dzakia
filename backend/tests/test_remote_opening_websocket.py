"""
test_remote_opening_websocket.py - اختبارات جلسة فتح الأظرفة عن بُعد وتقنية WebSockets و REST APIs
وفق متطلبات المادة 70 وما بعدها من القانون 23-12.
"""
import pytest
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator

from safaqat_core.asgi import application
from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal, OpeningSession, OpeningEvent, SessionAccess
from apps.bids.models import BidOffer
from apps.audit.models import AuditLog


def get_jwt_token(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def users(db):
    authority = CustomUser.objects.create_user(
        email="authority-ws@test.dz",
        password="TestPassword123!",
        role="authority",
        display_name="مديرية التجهيزات العمومية",
    )
    other_authority = CustomUser.objects.create_user(
        email="other-authority-ws@test.dz",
        password="TestPassword123!",
        role="authority",
        display_name="مصلحة أخرى",
    )
    operator1 = CustomUser.objects.create_user(
        email="operator1-ws@test.dz",
        password="TestPassword123!",
        role="operator",
        display_name="شركة المقاولات الوطنية",
    )
    operator2_no_access = CustomUser.objects.create_user(
        email="operator2-noaccess@test.dz",
        password="TestPassword123!",
        role="operator",
        display_name="متعامل لم يقدم عرضاً",
    )
    return {
        "authority": authority,
        "other_authority": other_authority,
        "op1": operator1,
        "op_no_access": operator2_no_access,
    }


@pytest.fixture
def deal(db, users):
    deal = ProcurementDeal.objects.create(
        reference_number="DZ-2026-REMOTE-OPEN-01",
        title="مشروع إنجاز المجمع الإداري الذكي",
        description="صفقة أشغال عمومية",
        authority=users["authority"],
        wilaya="الجزائر",
        current_stage=5,
        estimated_budget=Decimal("50000000.00"),
        submission_deadline=timezone.now() + timedelta(days=15),
    )
    return deal


@pytest.fixture
def offer(db, deal, users):
    offer = BidOffer.objects.create(
        deal=deal,
        operator=users["op1"],
        status="submitted",
        financial_amount=Decimal("46500000.00"),
        submission_timestamp=timezone.now() - timedelta(days=1),
    )
    return offer


@pytest.fixture
def opening_session(db, deal, users, offer):
    session = OpeningSession.objects.create(
        tender=deal,
        scheduled_at=timezone.now() - timedelta(minutes=5),  # موعد الجلسة حل مسبقاً
        location="قاعة الاجتماعات الرقمية",
        status="scheduled",
        access_policy="participants_only",
        total_offers=1,
        created_by=users["authority"],
    )
    SessionAccess.objects.create(
        session=session,
        operator=users["op1"],
        has_access=True,
    )
    return session


@pytest.mark.django_db
class TestRemoteOpeningModels:
    """1. التحقق من بنية النماذج وتصميمها السليم"""

    def test_opening_session_model_attributes(self, opening_session, deal, users):
        assert opening_session.deal == deal
        assert opening_session.created_by == users["authority"]
        assert opening_session.status in ["scheduled", "pending", "live", "closed", "ended"]
        assert opening_session.scheduled_at is not None

        # Setter test
        opening_session.deal = deal
        assert opening_session.tender == deal

    def test_session_access_model_attributes(self, opening_session, users):
        access = SessionAccess.objects.get(session=opening_session, operator=users["op1"])
        assert access.has_access is True
        assert access.joined_at is None

        # تحديث وقت الانضمام
        access.joined_at = timezone.now()
        access.save()
        access.refresh_from_db()
        assert access.joined_at is not None

    def test_opening_event_model_attributes(self, opening_session, offer, users):
        event = OpeningEvent.objects.create(
            session=opening_session,
            event_type="opened_financial",
            offer=offer,
            announced_amount=Decimal("46500000.00"),
            created_by=users["authority"],
        )
        assert event.announced_amount == Decimal("46500000.00")
        assert event.announced_price == Decimal("46500000.00")
        assert event.timestamp == event.created_at
        assert event.event_type == "opened_financial"


@pytest.mark.django_db
class TestRemoteOpeningRestApi:
    """2 & 3 & 4. التحقق من نقاط النهاية REST لبدء البث، فتح الأظرفة، وسجل الأحداث"""

    def test_start_session_endpoint(self, api_client, users, opening_session):
        api_client.force_authenticate(user=users["authority"])
        url = f"/api/opening/sessions/{opening_session.id}/start/"
        res = api_client.post(url, {}, format="json")

        assert res.status_code == 200
        assert res.data["status"] == "live"
        opening_session.refresh_from_db()
        assert opening_session.status == "live"
        assert opening_session.started_at is not None

        # التحقق من تسجيل حدث بدء الجلسة
        assert OpeningEvent.objects.filter(session=opening_session, event_type="session_started").exists()

        # التحقق من سجل التدقيق
        assert AuditLog.objects.filter(
            action="opening_session_started",
            resource_id=str(opening_session.id),
        ).exists()

    def test_unauthorized_user_cannot_start_session(self, api_client, users, opening_session):
        api_client.force_authenticate(user=users["other_authority"])
        url = f"/api/opening/sessions/{opening_session.id}/start/"
        res = api_client.post(url, {}, format="json")
        assert res.status_code == 403

    def test_open_envelope_technical_and_financial(self, api_client, users, opening_session, offer):
        # 1. بدء الجلسة أولاً
        api_client.force_authenticate(user=users["authority"])
        api_client.post(f"/api/opening/sessions/{opening_session.id}/start/", {}, format="json")

        # 2. فتح الظرف التقني
        url = f"/api/opening/sessions/{opening_session.id}/open-envelope/"
        tech_res = api_client.post(
            url,
            {"offer_id": str(offer.id), "envelope_type": "technical", "notes": "ملف تقني مطابق"},
            format="json",
        )
        assert tech_res.status_code == 201
        assert tech_res.data["event_type"] == "opened_technical"
        assert tech_res.data["announced_amount"] is None

        # 3. فتح الظرف المالي وفك تشفير المبلغ
        fin_res = api_client.post(
            url,
            {"offer_id": str(offer.id), "envelope_type": "financial", "notes": "عرض مالي مطابق"},
            format="json",
        )
        assert fin_res.status_code == 201
        assert fin_res.data["event_type"] == "opened_financial"
        assert fin_res.data["announced_amount"] == 46500000.0

        # التحقق من أن المبلغ تم فك تشفيره وتسجيله في الحدث
        fin_event = OpeningEvent.objects.get(session=opening_session, event_type="opened_financial")
        assert fin_event.announced_amount == Decimal("46500000.00")

    def test_cannot_open_envelope_if_session_not_live(self, api_client, users, opening_session, offer):
        api_client.force_authenticate(user=users["authority"])
        url = f"/api/opening/sessions/{opening_session.id}/open-envelope/"
        res = api_client.post(
            url,
            {"offer_id": str(offer.id), "envelope_type": "financial"},
            format="json",
        )
        assert res.status_code == 400
        assert "ليست جارية" in res.data["detail"]

    def test_get_session_events_for_late_joiners(self, api_client, users, opening_session, offer):
        # بدء الجلسة وفتح العرض
        api_client.force_authenticate(user=users["authority"])
        api_client.post(f"/api/opening/sessions/{opening_session.id}/start/", {}, format="json")
        api_client.post(
            f"/api/opening/sessions/{opening_session.id}/open-envelope/",
            {"offer_id": str(offer.id), "envelope_type": "financial"},
            format="json",
        )

        # استرجاع سجل الأحداث بواسطة المتعامل المصرح له (دخل متأخراً)
        api_client.force_authenticate(user=users["op1"])
        url = f"/api/opening/sessions/{opening_session.id}/events/"
        res = api_client.get(url)

        assert res.status_code == 200
        events = res.data
        assert len(events) >= 2  # session_started + opened_financial
        event_types = [e["event_type"] for e in events]
        assert "session_started" in event_types
        assert "opened_financial" in event_types

        fin_item = next(e for e in events if e["event_type"] == "opened_financial")
        assert fin_item["announced_amount"] == 46500000.0

    def test_unauthorized_operator_cannot_access_events(self, api_client, users, opening_session):
        api_client.force_authenticate(user=users["op_no_access"])
        url = f"/api/opening/sessions/{opening_session.id}/events/"
        res = api_client.get(url)
        assert res.status_code == 403


@pytest.mark.asyncio
@pytest.mark.django_db(transaction=True)
class TestRemoteOpeningWebSocket:
    """5. التحقق من حماية اتصال WebSocket بالمصادقة (JWT) وشرط وجود SessionAccess"""

    async def test_websocket_connection_success_with_valid_session_access(self, opening_session, users):
        token = get_jwt_token(users["op1"])
        communicator = WebsocketCommunicator(
            application,
            f"/ws/opening/sessions/{opening_session.id}/?token={token}",
        )
        connected, subprotocol = await communicator.connect()
        assert connected is True

        # استقبال رسالة الترحيب وتأكيد الاتصال
        welcome = await communicator.receive_json_from()
        assert welcome["type"] == "connection_established"
        assert welcome["session_id"] == str(opening_session.id)

        # التحقق من تحديث joined_at في SessionAccess
        access = await SessionAccess.objects.aget(session=opening_session, operator=users["op1"])
        assert access.joined_at is not None

        await communicator.disconnect()

    async def test_websocket_rejected_without_jwt_token(self, opening_session):
        communicator = WebsocketCommunicator(
            application,
            f"/ws/opening/sessions/{opening_session.id}/",
        )
        connected, _ = await communicator.connect()
        assert connected is False

    async def test_websocket_rejected_for_operator_without_session_access(self, opening_session, users):
        # متعامل اقتصادي مسجل بالمنصة لكنه لم يقدم عرضاً ولم يُمنح SessionAccess
        token = get_jwt_token(users["op_no_access"])
        communicator = WebsocketCommunicator(
            application,
            f"/ws/opening/sessions/{opening_session.id}/?token={token}",
        )
        connected, _ = await communicator.connect()
        assert connected is False

    async def test_websocket_rejected_if_session_access_revoked_or_disabled(self, opening_session, users):
        # تعطيل صلاحية المتعامل
        await SessionAccess.objects.filter(session=opening_session, operator=users["op1"]).aupdate(has_access=False)

        token = get_jwt_token(users["op1"])
        communicator = WebsocketCommunicator(
            application,
            f"/ws/opening/sessions/{opening_session.id}/?token={token}",
        )
        connected, _ = await communicator.connect()
        assert connected is False

    async def test_websocket_receives_live_envelope_broadcast(self, opening_session, users, offer):
        # 1. اتصال المتعامل المصرح له بالـ WebSocket
        token = get_jwt_token(users["op1"])
        communicator = WebsocketCommunicator(
            application,
            f"/ws/opening/sessions/{opening_session.id}/?token={token}",
        )
        connected, _ = await communicator.connect()
        assert connected is True
        await communicator.receive_json_from()  # تفريغ رسالة الترحيب

        # 2. قيام المصلحة ببدء الجلسة وفتح الظرف المالي عبر API
        def do_start():
            client = APIClient()
            client.force_authenticate(user=users["authority"])
            return client.post(f"/api/opening/sessions/{opening_session.id}/start/", {}, format="json")

        start_res = await database_sync_to_async(do_start)()
        assert start_res.status_code == 200

        # التحقق من وصول بث بدء الجلسة عبر الـ WebSocket
        start_msg = await communicator.receive_json_from()
        assert start_msg["type"] == "session_started"
        assert start_msg["status"] == "live"

        # 3. فتح الظرف المالي عبر API
        def do_open_envelope():
            client = APIClient()
            client.force_authenticate(user=users["authority"])
            return client.post(
                f"/api/opening/sessions/{opening_session.id}/open-envelope/",
                {"offer_id": str(offer.id), "envelope_type": "financial"},
                format="json",
            )

        open_res = await database_sync_to_async(do_open_envelope)()
        assert open_res.status_code == 201

        # التحقق من وصول بث فتح الظرف وفك التشفير للمتعامل المتصل فوراً
        env_msg = await communicator.receive_json_from()
        assert env_msg["type"] == "envelope_opened"
        assert env_msg["event_type"] == "opened_financial"
        assert env_msg["announced_amount"] == 46500000.0
        assert env_msg["offer_id"] == str(offer.id)

        await communicator.disconnect()
