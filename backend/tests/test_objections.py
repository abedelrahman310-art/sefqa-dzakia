import pytest
from datetime import timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient

from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal
from apps.bids.models import BidOffer
from apps.contracts.models import (
    AwardObjection,
    ObjectionTimeline,
    ObjectionStatus,
    ObjectionType,
    ObjectionGround,
)
from apps.contracts.services.objections import (
    create_objection,
    start_review,
    decide_objection,
    withdraw_objection,
)
from apps.audit.models import AuditLog


@pytest.fixture
def test_setup(db):
    authority = CustomUser.objects.create_user(
        email="auth_test@safaqat.dz",
        password="password123",
        role="authority",
        display_name="مديرية التجهيزات العمومية",
    )
    operator1 = CustomUser.objects.create_user(
        email="op1_test@safaqat.dz",
        password="password123",
        role="operator",
        display_name="مؤسسة الأشغال الكبرى",
    )
    operator2 = CustomUser.objects.create_user(
        email="op2_test@safaqat.dz",
        password="password123",
        role="operator",
        display_name="شركة البناء الحديث",
    )
    deal = ProcurementDeal.objects.create(
        reference_number="TEST-DEAL-OBJ-01",
        title="مشروع إنجاز مجمع إداري",
        description="مشروع لبناء مجمع إداري ولائي",
        authority=authority,
        current_stage=8,
    )
    # operator1 submits a bid
    bid1 = BidOffer.objects.create(
        deal=deal,
        operator=operator1,
        status="submitted",
        financial_amount=50000000.00,
    )
    return {
        "authority": authority,
        "operator1": operator1,
        "operator2": operator2,
        "deal": deal,
        "bid1": bid1,
    }


@pytest.mark.django_db
def test_create_objection_success(test_setup):
    deal = test_setup["deal"]
    operator1 = test_setup["operator1"]

    obj = create_objection(
        tender=deal,
        objector=operator1,
        objection_type=ObjectionType.ADMINISTRATIVE,
        grounds=[ObjectionGround.EVALUATION, ObjectionGround.PROCEDURAL],
        description="طعن إداري بسبب وجود خطأ في احتساب العلامة التقنية المعلنة",
        objector_ip="192.168.1.100",
    )

    assert obj.reference.startswith("OBJ-")
    assert obj.status == ObjectionStatus.SUBMITTED
    assert obj.is_within_deadline() is True
    assert obj.days_remaining() >= 9
    assert len(obj.checksum) == 64
    assert obj.timeline.count() == 1
    assert obj.timeline.first().event == "submitted"

    # AuditLog check
    audit = AuditLog.objects.filter(resource_id=str(obj.id)).first()
    assert audit is not None
    assert audit.action == "objection_submitted"


@pytest.mark.django_db
def test_create_objection_without_bid_fails(test_setup):
    deal = test_setup["deal"]
    operator2 = test_setup["operator2"]  # has no bid

    with pytest.raises(ValidationError, match="يجب أن تكون قدّمت عرضاً"):
        create_objection(
            tender=deal,
            objector=operator2,
            objection_type=ObjectionType.ADMINISTRATIVE,
            grounds=[ObjectionGround.PROCEDURAL],
            description="محاولة طعن غير مقبولة بدون تقديم عرض سابق في الصفقة",
        )


@pytest.mark.django_db
def test_create_objection_after_deadline_fails(test_setup):
    deal = test_setup["deal"]
    operator1 = test_setup["operator1"]
    past_date = timezone.now() - timedelta(days=15)

    with pytest.raises(ValidationError, match="انتهت مهلة الطعن القانونية"):
        create_objection(
            tender=deal,
            objector=operator1,
            objection_type=ObjectionType.ADMINISTRATIVE,
            grounds=[ObjectionGround.PRICE],
            description="طعن متأخر بعد انقضاء أجل 10 أيام القانونية وفق المادة 72",
            award_announced_at=past_date,
        )


@pytest.mark.django_db
def test_duplicate_open_objection_fails(test_setup):
    deal = test_setup["deal"]
    operator1 = test_setup["operator1"]

    create_objection(
        tender=deal,
        objector=operator1,
        objection_type=ObjectionType.ADMINISTRATIVE,
        grounds=[ObjectionGround.EVALUATION],
        description="الطعن الأول المودع وفق الأجل المحدد نظاماً",
    )

    with pytest.raises(ValidationError, match="يوجد طعن مفتوح بالفعل"):
        create_objection(
            tender=deal,
            objector=operator1,
            objection_type=ObjectionType.ADMINISTRATIVE,
            grounds=[ObjectionGround.PRICE],
            description="محاولة إيداع طعن ثانٍ لنفس المتعامل على نفس الصفقة",
        )


@pytest.mark.django_db
def test_review_and_decide_flow(test_setup):
    deal = test_setup["deal"]
    operator1 = test_setup["operator1"]
    authority = test_setup["authority"]

    obj = create_objection(
        tender=deal,
        objector=operator1,
        objection_type=ObjectionType.ADMINISTRATIVE,
        grounds=[ObjectionGround.CAPACITY],
        description="طعن في قدرات المتعامل الفائز المؤقت استناداً لدفتر الشروط",
    )

    # Start review
    obj = start_review(obj, authority)
    assert obj.status == ObjectionStatus.UNDER_REVIEW
    assert obj.reviewer == authority
    assert obj.review_started_at is not None

    # Decide
    obj = decide_objection(
        obj,
        authority,
        decision="rejected",
        reason="تم فحص الوثائق والتأكد من مطابقة شروط التأهيل الفني والمالي",
    )
    assert obj.status == ObjectionStatus.REJECTED
    assert obj.decision == "rejected"
    assert obj.review_ended_at is not None
    assert obj.timeline.count() == 3


@pytest.mark.django_db
def test_withdraw_flow(test_setup):
    deal = test_setup["deal"]
    operator1 = test_setup["operator1"]

    obj = create_objection(
        tender=deal,
        objector=operator1,
        objection_type=ObjectionType.ADMINISTRATIVE,
        grounds=[ObjectionGround.OTHER],
        description="طعن إداري تم التراجع عنه لاحقاً من قبل المتعامل",
    )

    obj = withdraw_objection(obj, operator1)
    assert obj.status == ObjectionStatus.WITHDRAWN
    assert obj.timeline.filter(event="withdrawn").exists()


@pytest.mark.django_db
def test_objection_api_endpoints(test_setup):
    deal = test_setup["deal"]
    operator1 = test_setup["operator1"]
    authority = test_setup["authority"]

    client = APIClient()
    client.force_authenticate(user=operator1)

    # List objections (operator sees their own)
    response = client.get("/api/contracts/objections/")
    assert response.status_code == 200
    assert len(response.data) == 0

    # Create via API
    payload = {
        "tender_id": str(deal.id),
        "objection_type": "administrative",
        "grounds": ["evaluation"],
        "description": "تفاصيل طعن عبر واجهة API لتجربة الإيداع والتحقق من الأثر",
    }
    post_res = client.post("/api/contracts/objections/", payload, format="json")
    assert post_res.status_code == 201
    obj_id = post_res.data["id"]

    # Authority reviews
    client.force_authenticate(user=authority)
    review_res = client.post(f"/api/contracts/objections/{obj_id}/start_review/")
    assert review_res.status_code == 200
    assert review_res.data["status"] == "under_review"

    decide_payload = {
        "decision": "accepted",
        "reason": "ثبت وجود خطأ حسابي في تنقيط العرض ويتقرر إعادة التقييم",
    }
    decide_res = client.post(f"/api/contracts/objections/{obj_id}/decide/", decide_payload, format="json")
    assert decide_res.status_code == 200
    assert decide_res.data["status"] == "accepted"
