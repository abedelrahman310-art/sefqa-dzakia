"""
test_opening_session_workflow.py — اختبارات مسار جلسة فتح الأظرفة كاملاً (القانون 23-12).

تغطي الدورة الكاملة:
  برمجة المصلحة للجلسة → إيداع المتعاملين قبل الأجل → إقفال العروض →
  بدء الجلسة في موعدها → توثيق العروض → الاختتام → المحضر + سجل التدقيق.

ملاحظة بيانات: جميع البيانات هنا تجريبية موسومة بوضوح (نطاق demo.test
وأرقام مرجعية DEMO-*) ولا تمثل متعاملين أو صفقات حقيقية.
"""
import pytest
from datetime import timedelta
from decimal import Decimal
from django.core.exceptions import PermissionDenied
from django.utils import timezone
from rest_framework.test import APIClient

from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal, OpeningSession, OpeningEvent
from apps.bids.models import BidOffer
from apps.audit.models import AuditLog


DEAL_REF = "DEMO-2026-OPEN-001"


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def demo_users(db):
    pwd = "DemoOnlyPassword2026!"
    users = {
        "auth1": CustomUser.objects.create_user(
            email="demo-authority1@demo.test", password=pwd, role="authority",
            display_name="مصلحة تجريبية 1", organization_name="جهة تجريبية 1",
        ),
        "auth2": CustomUser.objects.create_user(
            email="demo-authority2@demo.test", password=pwd, role="authority",
            display_name="مصلحة تجريبية 2", organization_name="جهة تجريبية 2",
        ),
        "op1": CustomUser.objects.create_user(
            email="demo-operator1@demo.test", password=pwd, role="operator",
            display_name="متعامل تجريبي 1", organization_name="شركة تجريبية 1",
        ),
        "op2": CustomUser.objects.create_user(
            email="demo-operator2@demo.test", password=pwd, role="operator",
            display_name="متعامل تجريبي 2", organization_name="شركة تجريبية 2",
        ),
        "op3": CustomUser.objects.create_user(
            email="demo-operator3@demo.test", password=pwd, role="operator",
            display_name="متعامل تجريبي 3 (غير مشارك)",
            organization_name="شركة تجريبية 3",
        ),
    }
    return users


@pytest.fixture
def demo_deal(db, demo_users):
    """صفقة تجريبية في مرحلة استلام العروض بأجل مفتوح"""
    return ProcurementDeal.objects.create(
        reference_number=DEAL_REF,
        title="صفقة تجريبية لمسار جلسة الفتح",
        description="بيانات تجريبية فقط",
        authority=demo_users["auth1"],
        wilaya="الجزائر",
        current_stage=5,
        estimated_budget=Decimal("10000000.00"),
        submission_deadline=timezone.now() + timedelta(days=30),
    )


def schedule_session(api_client, authority, deal, when=None, location="قاعة تجريبية"):
    api_client.force_authenticate(user=authority)
    return api_client.post(
        "/api/procurements/sessions/schedule/",
        {
            "tender_id": str(deal.id),
            "scheduled_at": (when or (timezone.now() + timedelta(days=2))).isoformat(),
            "location": location,
        },
        format="json",
    )


def backdate_session(session_id, days=1):
    """إنزال موعد الجلسة إلى الماضي عبر ORM لمحاكاة حلول الموعد (الاختبار فقط)"""
    OpeningSession.objects.filter(pk=session_id).update(
        scheduled_at=timezone.now() - timedelta(days=days)
    )


def start_session(api_client, authority, session_id):
    api_client.force_authenticate(user=authority)
    return api_client.post(f"/api/procurements/sessions/{session_id}/start/", {}, format="json")


def submit_bid(api_client, operator, deal, amount="5000000.00", status="submitted"):
    api_client.force_authenticate(user=operator)
    return api_client.post(
        "/api/bids/offers/",
        {"deal": str(deal.id), "financial_amount": amount, "status": status},
        format="json",
    )


@pytest.mark.django_db
class TestOpeningSessionWorkflow:
    def test_authority_can_schedule_session(self, api_client, demo_users, demo_deal):
        """المصلحة تبرمج جلسة فتح لصفقتها → 201 + سجل تدقيق"""
        response = schedule_session(api_client, demo_users["auth1"], demo_deal)

        assert response.status_code == 201
        assert response.data["status"] == "scheduled"
        assert AuditLog.objects.filter(
            action="opening_session_scheduled",
            resource_id=str(response.data["id"]),
        ).exists()

    def test_schedule_rejects_past_datetime(self, api_client, demo_users, demo_deal):
        """لا تُبرمج الجلسات بأثر رجعي"""
        response = schedule_session(
            api_client, demo_users["auth1"], demo_deal,
            when=timezone.now() - timedelta(hours=1),
        )
        assert response.status_code == 400

    def test_operator_can_submit_before_deadline(self, api_client, demo_users, demo_deal):
        """الإيداع قبل الأجل مسموح وموثق في سجل التدقيق"""
        response = submit_bid(api_client, demo_users["op1"], demo_deal)

        assert response.status_code == 201
        bid = BidOffer.objects.get(pk=response.data["id"])
        assert bid.status == "submitted"
        assert bid.submission_timestamp is not None
        assert AuditLog.objects.filter(action="bid_submitted", resource_id=str(bid.id)).exists()

    def test_operator_cannot_submit_after_deadline(self, api_client, demo_users, demo_deal):
        """الإيداع بعد الأجل مرفوض من الخادم"""
        demo_deal.submission_deadline = timezone.now() - timedelta(hours=1)
        demo_deal.save(update_fields=["submission_deadline"])

        response = submit_bid(api_client, demo_users["op1"], demo_deal)
        assert response.status_code == 400

    def test_operator_cannot_escalate_status_on_submit(self, api_client, demo_users, demo_deal):
        """المتعامل لا يمنح عرضه حالة (حائز/مقبول) عبر الواجهة"""
        response = submit_bid(api_client, demo_users["op1"], demo_deal, status="awarded")
        assert response.status_code == 400
        assert not BidOffer.objects.filter(status="awarded").exists()

    def test_authority_cannot_start_before_scheduled_time(
        self, api_client, demo_users, demo_deal
    ):
        """الحارس الزمني: بدء الجلسة قبل موعدها مرفوض وتبقى مبرمجة"""
        scheduled = schedule_session(api_client, demo_users["auth1"], demo_deal)
        assert scheduled.status_code == 201

        response = start_session(api_client, demo_users["auth1"], scheduled.data["id"])
        assert response.status_code == 400

        session = OpeningSession.objects.get(pk=scheduled.data["id"])
        assert session.status == "scheduled"
        assert session.started_at is None

    def test_authority_can_start_at_or_after_scheduled_time(
        self, api_client, demo_users, demo_deal
    ):
        """بدء الجلسة عند حلول الموعد → جارية + حدث افتتاح + سجل تدقيق"""
        scheduled = schedule_session(api_client, demo_users["auth1"], demo_deal)
        backdate_session(scheduled.data["id"])

        response = start_session(api_client, demo_users["auth1"], scheduled.data["id"])
        assert response.status_code == 200
        assert response.data["status"] == "live"

        assert OpeningEvent.objects.filter(
            session_id=scheduled.data["id"], event_type="session_started"
        ).exists()
        assert AuditLog.objects.filter(
            action="opening_session_started",
            resource_id=str(scheduled.data["id"]),
        ).exists()

    def test_operator_cannot_view_other_bids_before_opening(
        self, api_client, demo_users, demo_deal
    ):
        """المتعامل لا يرى في الجلسة قبل الفتح إلا عرضه الخاص (القانون 18-07)"""
        submit_bid(api_client, demo_users["op1"], demo_deal, amount="5000000.00")
        submit_bid(api_client, demo_users["op2"], demo_deal, amount="7000000.00")
        scheduled = schedule_session(api_client, demo_users["auth1"], demo_deal)
        assert scheduled.status_code == 201

        api_client.force_authenticate(user=demo_users["op1"])
        response = api_client.get(
            f"/api/procurements/sessions/{scheduled.data['id']}/offers/"
        )
        assert response.status_code == 200

        offers = response.data
        assert len(offers) == 1
        assert str(offers[0]["operator"]) == str(demo_users["op1"].id)
        assert "7000000" not in str(response.data)

    def test_only_timely_bids_visible_in_session(self, api_client, demo_users, demo_deal):
        """المسودات والمتأخرة عن الأجل مستبعدة من الظاهر في الجلسة"""
        timely = submit_bid(api_client, demo_users["op1"], demo_deal, amount="5000000.00")
        assert timely.status_code == 201

        # عرض متأخر (ختم بعد الأجل) + مسودة — عبر ORM لمحاكاة أي مسار إدخال
        BidOffer.objects.create(
            deal=demo_deal,
            operator=demo_users["op2"],
            status="submitted",
            financial_amount=Decimal("1000000.00"),
            submission_timestamp=demo_deal.submission_deadline + timedelta(hours=1),
        )
        BidOffer.objects.create(
            deal=demo_deal,
            operator=demo_users["op2"],
            status="draft",
            financial_amount=Decimal("2000000.00"),
        )
        scheduled = schedule_session(api_client, demo_users["auth1"], demo_deal)

        api_client.force_authenticate(user=demo_users["auth1"])
        response = api_client.get(
            f"/api/procurements/sessions/{scheduled.data['id']}/offers/"
        )
        assert response.status_code == 200
        assert [o["id"] for o in response.data] == [timely.data["id"]]

    def test_operator_cannot_modify_bid_after_opening_starts(
        self, api_client, demo_users, demo_deal
    ):
        """العرض المقفل بالجلسة لا يُعدَّل"""
        draft = submit_bid(api_client, demo_users["op1"], demo_deal, status="draft")
        assert draft.status_code == 201

        scheduled = schedule_session(api_client, demo_users["auth1"], demo_deal)
        backdate_session(scheduled.data["id"])
        started = start_session(api_client, demo_users["auth1"], scheduled.data["id"])
        assert started.status_code == 200

        api_client.force_authenticate(user=demo_users["op1"])
        response = api_client.patch(
            f"/api/bids/offers/{draft.data['id']}/",
            {"financial_amount": "1000000.00"},
            format="json",
        )
        assert response.status_code == 400

    def test_operator_cannot_access_another_authoritys_session(
        self, api_client, demo_users, demo_deal
    ):
        """متعامل غير مشارك ومصلحة أخرى: كلاهما محجوب عن الجلسة"""
        submit_bid(api_client, demo_users["op1"], demo_deal)
        scheduled = schedule_session(api_client, demo_users["auth1"], demo_deal)

        api_client.force_authenticate(user=demo_users["op3"])
        assert api_client.get(
            f"/api/procurements/sessions/{scheduled.data['id']}/"
        ).status_code == 403

        api_client.force_authenticate(user=demo_users["auth2"])
        assert api_client.get(
            f"/api/procurements/sessions/{scheduled.data['id']}/"
        ).status_code == 403

    def test_authority_records_bid_details_during_session(
        self, api_client, demo_users, demo_deal
    ):
        """توثيق العرض ومبلغه المعلن أثناء الجلسة + منع التوثيق المكرر"""
        bid = submit_bid(api_client, demo_users["op1"], demo_deal, amount="5000000.00")
        scheduled = schedule_session(api_client, demo_users["auth1"], demo_deal)
        backdate_session(scheduled.data["id"])
        assert start_session(api_client, demo_users["auth1"], scheduled.data["id"]).status_code == 200

        api_client.force_authenticate(user=demo_users["auth1"])
        response = api_client.post(
            f"/api/procurements/sessions/{scheduled.data['id']}/open-offer/",
            {"offer_id": bid.data["id"], "announced_price": "5000000.00", "notes": "توثيق تجريبي"},
            format="json",
        )
        assert response.status_code == 201
        assert response.data["announced_price"] == "5000000.00"

        # التوثيق المكرر للعرض نفسه مرفوض
        duplicate = api_client.post(
            f"/api/procurements/sessions/{scheduled.data['id']}/open-offer/",
            {"offer_id": bid.data["id"], "announced_price": "5000000.00"},
            format="json",
        )
        assert duplicate.status_code == 400

    def test_authority_can_close_session(self, api_client, demo_users, demo_deal):
        """الاختتام → منتهية + حدث ختام + سجل تدقيق"""
        scheduled = schedule_session(api_client, demo_users["auth1"], demo_deal)
        backdate_session(scheduled.data["id"])
        assert start_session(api_client, demo_users["auth1"], scheduled.data["id"]).status_code == 200

        api_client.force_authenticate(user=demo_users["auth1"])
        response = api_client.post(
            f"/api/procurements/sessions/{scheduled.data['id']}/end/", {}, format="json"
        )
        assert response.status_code == 200
        assert response.data["status"] == "ended"
        assert OpeningEvent.objects.filter(
            session_id=scheduled.data["id"], event_type="session_ended"
        ).exists()
        assert AuditLog.objects.filter(
            action="opening_session_ended",
            resource_id=str(scheduled.data["id"]),
        ).exists()

    def test_closed_session_cannot_be_reopened(self, api_client, demo_users, demo_deal):
        """المغلقة لا تُعاد ولا تُستبدل ببرمجة جديدة صامتة"""
        scheduled = schedule_session(api_client, demo_users["auth1"], demo_deal)
        backdate_session(scheduled.data["id"])
        assert start_session(api_client, demo_users["auth1"], scheduled.data["id"]).status_code == 200

        api_client.force_authenticate(user=demo_users["auth1"])
        assert api_client.post(
            f"/api/procurements/sessions/{scheduled.data['id']}/end/", {}, format="json"
        ).status_code == 200

        # إعادة البدء مرفوضة
        assert start_session(
            api_client, demo_users["auth1"], scheduled.data["id"]
        ).status_code == 400
        # الاختتام المكرر مرفوض
        api_client.force_authenticate(user=demo_users["auth1"])
        assert api_client.post(
            f"/api/procurements/sessions/{scheduled.data['id']}/end/", {}, format="json"
        ).status_code == 400
        # البرمجة الجديدة فوق جلسة مغلقة مرفوضة (لا حذف صامت للسجل)
        assert schedule_session(
            api_client, demo_users["auth1"], demo_deal
        ).status_code == 400
        assert OpeningSession.objects.filter(tender=demo_deal).count() == 1

    def test_session_record_and_immutable_audit_logs(
        self, api_client, demo_users, demo_deal
    ):
        """المحضر (سلسلة الوقائع) + سجلات تدقيق غير قابلة للتعديل أو الحذف"""
        bid = submit_bid(api_client, demo_users["op1"], demo_deal, amount="5000000.00")
        scheduled = schedule_session(api_client, demo_users["auth1"], demo_deal)
        backdate_session(scheduled.data["id"])
        assert start_session(api_client, demo_users["auth1"], scheduled.data["id"]).status_code == 200

        api_client.force_authenticate(user=demo_users["auth1"])
        assert api_client.post(
            f"/api/procurements/sessions/{scheduled.data['id']}/open-offer/",
            {"offer_id": bid.data["id"], "announced_price": "5000000.00"},
            format="json",
        ).status_code == 201
        assert api_client.post(
            f"/api/procurements/sessions/{scheduled.data['id']}/end/", {}, format="json"
        ).status_code == 200

        # المحضر: سلسلة الوقائع كاملة قابلة للاسترجاع
        detail = api_client.get(f"/api/procurements/sessions/{scheduled.data['id']}/")
        assert detail.status_code == 200
        event_types = [e["event_type"] for e in detail.data["events"]]
        assert event_types == ["session_started", "offer_opened", "session_ended"]

        # سجل التدقيق يوثق كل إجراء حساس (سجل فتح العرض مرتبط بمعرف الحدث)
        event_ids = [str(e["id"]) for e in detail.data["events"]]
        logged_actions = set(
            AuditLog.objects.filter(
                resource_id__in=[str(scheduled.data["id"]), str(bid.data["id"])] + event_ids
            ).values_list("action", flat=True)
        )
        for expected in (
            "opening_session_scheduled",
            "bid_submitted",
            "opening_session_started",
            "offer_opened",
            "opening_session_ended",
        ):
            assert expected in logged_actions

        # الخلود: التعديل والحذف مرفوضان على مستوى النموذج
        log = AuditLog.objects.filter(
            action="opening_session_ended",
            resource_id=str(scheduled.data["id"]),
        ).first()
        log.description = "محاولة عبث تجريبية"
        with pytest.raises(PermissionDenied):
            log.save()
        with pytest.raises(PermissionDenied):
            log.delete()
