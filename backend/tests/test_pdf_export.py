"""
اختبارات خدمة تصدير المحاضر ودفاتر الشروط المعتمدة بصيغة PDF (القانون 23-12 والمرسوم 15-247).
Test suite for Opening Session PV and Cahier Specs PDF export.
"""

import pytest
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from rest_framework.test import APIClient

from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal, OpeningSession, OpeningEvent, SessionAccess, CahierSpecs
from apps.bids.models import BidOffer
from apps.audit.models import AuditLog
from apps.procurements.pdf_service import generate_opening_session_pdf, generate_cahier_specs_pdf


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def pdf_test_setup(db):
    pwd = "TestOnlyPassword2026!"
    authority = CustomUser.objects.create_user(
        email="authority-pdf@demo.test",
        password=pwd,
        role="authority",
        display_name="مديرية التجهيزات العمومية",
        organization_name="وزارة السكن والعمران",
    )
    other_authority = CustomUser.objects.create_user(
        email="other-authority@demo.test",
        password=pwd,
        role="authority",
        display_name="مصلحة أخرى",
        organization_name="ولاية وهران",
    )
    operator1 = CustomUser.objects.create_user(
        email="operator1-pdf@demo.test",
        password=pwd,
        role="operator",
        display_name="شركة الإنجازات الكبرى",
        organization_name="ش.ذ.م.م الإنجازات الكبرى",
    )
    operator2 = CustomUser.objects.create_user(
        email="operator2-pdf@demo.test",
        password=pwd,
        role="operator",
        display_name="مؤسسة الأشغال العامة",
        organization_name="مؤسسة الأشغال العامة",
    )
    unauthorized_operator = CustomUser.objects.create_user(
        email="unauthorized-op@demo.test",
        password=pwd,
        role="operator",
        display_name="متعامل غير مشارك",
        organization_name="شركة مستقلة",
    )

    # صفقة معتمدة
    now = timezone.now()
    deal = ProcurementDeal.objects.create(
        reference_number="DZ-2026-PDF-001",
        title="مشروع إنجاز مجمع إداري متكامل بالجزائر العاصمة",
        description="إنجاز الدراسات ومتابعة الأشغال للبنايات الإدارية والمرافق الملحقة.",
        authority=authority,
        current_stage=5,  # استلام العروض
        estimated_budget=Decimal("150000000.00"),
        wilaya="الجزائر",
        submission_deadline=now + timedelta(days=15),
    )

    # دفتر شروط
    specs = CahierSpecs.objects.create(
        deal=deal,
        administrative_clauses={
            "eligibility": "شهادة التأهيل والتصنيف المهنيين درجة 4 فما فوق في البناء.",
            "guarantees": "كفالة تعهد بنكية بنسبة 1% وكفالة حسن التنفيذ 5%.",
        },
        technical_requirements={
            "standards": "مطابقة المعايير الجزائرية للبناء المقاوم للزلازل RPA 99 v2003.",
            "delivery_time": "مدة الإنجاز 18 شهراً من تاريخ أمر استئناف الخدمة.",
        },
        financial_criteria={
            "formula": "العرض المالي الأقل ثمناً من بين العروض التقنية الحائزة على 70/100 على الأقل.",
        },
        is_validated=True,
    )

    # جلسة فتح أظرفة
    session = OpeningSession.objects.create(
        tender=deal,
        scheduled_at=now,
        started_at=now,
        ended_at=now + timedelta(hours=2),
        location="قاعة الاجتماعات الكبرى - وزارة السكن",
        status="ended",
        access_policy="participants_only",
        total_offers=2,
        opened_count=2,
        created_by=authority,
    )

    # عروض
    offer1 = BidOffer.objects.create(
        deal=deal,
        operator=operator1,
        status="admitted",
        financial_amount=Decimal("142000000.00"),
        submission_timestamp=now - timedelta(days=2),
    )
    offer2 = BidOffer.objects.create(
        deal=deal,
        operator=operator2,
        status="admitted",
        financial_amount=Decimal("148500000.00"),
        submission_timestamp=now - timedelta(days=1),
    )

    # أذونات الحضور
    SessionAccess.objects.create(session=session, operator=operator1, can_download_minutes=True)
    SessionAccess.objects.create(session=session, operator=operator2, can_download_minutes=True)

    # وقائع الجلسة
    OpeningEvent.objects.create(
        session=session,
        offer=offer1,
        event_type="offer_opened",
        order=1,
        announced_price=offer1.financial_amount,
        is_accepted=True,
        notes="استوفى كافة الوثائق الشكلية والضمانات البنكية.",
        created_by=authority,
    )
    OpeningEvent.objects.create(
        session=session,
        offer=offer2,
        event_type="offer_opened",
        order=2,
        announced_price=offer2.financial_amount,
        is_accepted=True,
        notes="مقبول مبدئياً ومستوفٍ للشروط.",
        created_by=authority,
    )

    return {
        "authority": authority,
        "other_authority": other_authority,
        "operator1": operator1,
        "operator2": operator2,
        "unauthorized_operator": unauthorized_operator,
        "deal": deal,
        "specs": specs,
        "session": session,
        "offer1": offer1,
        "offer2": offer2,
    }


@pytest.mark.django_db
def test_opening_session_pdf_authority_export_success(api_client, pdf_test_setup):
    """تحقق من نجاح المصلحة المتعاقدة في تصدير محضر جلسة فتح الأظرفة بصيغة PDF وتوثيقه"""
    authority = pdf_test_setup["authority"]
    session = pdf_test_setup["session"]

    api_client.force_authenticate(user=authority)
    url = f"/api/procurements/sessions/{session.id}/pdf/"
    response = api_client.get(url)

    assert response.status_code == 200
    assert response["Content-Type"] == "application/pdf"
    assert "PV_Opening_" in response["Content-Disposition"]
    assert response.content.startswith(b"%PDF-")
    assert len(response.content) > 1000

    # تحقق من تسجيل العملية في AuditLog
    assert AuditLog.objects.filter(
        user=authority,
        action="session_pv_pdf_exported",
        resource_id=str(session.id),
    ).exists()


@pytest.mark.django_db
def test_opening_session_pdf_operator_access_with_law_18_07(api_client, pdf_test_setup):
    """تحقق من تحميل المتعامل المشارك لمحضر الجلسة مع مراعاة حماية البيانات (قانون 18-07)"""
    operator1 = pdf_test_setup["operator1"]
    session = pdf_test_setup["session"]

    api_client.force_authenticate(user=operator1)
    url = f"/api/procurements/sessions/{session.id}/pdf/"
    response = api_client.get(url)

    assert response.status_code == 200
    assert response["Content-Type"] == "application/pdf"
    assert response.content.startswith(b"%PDF-")


@pytest.mark.django_db
def test_opening_session_pdf_forbidden_for_unauthorized_operator(api_client, pdf_test_setup):
    """منع متعامل اقتصادي غير مصرح له من تحميل محضر جلسة ليست علنية للعموم"""
    unauthorized_operator = pdf_test_setup["unauthorized_operator"]
    session = pdf_test_setup["session"]

    api_client.force_authenticate(user=unauthorized_operator)
    url = f"/api/procurements/sessions/{session.id}/pdf/"
    response = api_client.get(url)

    assert response.status_code == 403


@pytest.mark.django_db
def test_cahier_specs_pdf_export_by_deal_and_specs_ids(api_client, pdf_test_setup):
    """تحقق من تصدير دفتر الشروط والمواصفات عبر كلا المسارين (بمعرف الصفقة وبمعرف الدفتر)"""
    authority = pdf_test_setup["authority"]
    deal = pdf_test_setup["deal"]
    specs = pdf_test_setup["specs"]

    api_client.force_authenticate(user=authority)

    # 1. عبر مسار الصفقة
    res1 = api_client.get(f"/api/procurements/deals/{deal.id}/specs-pdf/")
    assert res1.status_code == 200
    assert res1["Content-Type"] == "application/pdf"
    assert res1.content.startswith(b"%PDF-")
    assert "Cahier_Specs_" in res1["Content-Disposition"]

    # 2. عبر مسار دفتر الشروط المباشر
    res2 = api_client.get(f"/api/procurements/specs/{specs.id}/pdf/")
    assert res2.status_code == 200
    assert res2["Content-Type"] == "application/pdf"
    assert res2.content.startswith(b"%PDF-")

    # تحقق من توثيق سجل التدقيق
    assert AuditLog.objects.filter(
        user=authority,
        action="cahier_specs_pdf_exported",
        resource_id=str(deal.id),
    ).exists()


@pytest.mark.django_db
def test_cahier_specs_pdf_operator_stage_access(api_client, pdf_test_setup):
    """تحقق من عدم إتاحة دفتر الشروط للمتعاملين في مرحلة المسودة (1) وإتاحته بعد النشر (3)"""
    deal = pdf_test_setup["deal"]
    operator1 = pdf_test_setup["operator1"]

    api_client.force_authenticate(user=operator1)

    # أثناء مرحلة التخطيط والمسودة
    deal.current_stage = 1
    deal.save(update_fields=["current_stage"])

    res_blocked = api_client.get(f"/api/procurements/deals/{deal.id}/specs-pdf/")
    assert res_blocked.status_code == 403

    # بعد نشر الإعلان (المرحلة 3 وما بعدها)
    deal.current_stage = 3
    deal.save(update_fields=["current_stage"])

    res_allowed = api_client.get(f"/api/procurements/deals/{deal.id}/specs-pdf/")
    assert res_allowed.status_code == 200
    assert res_allowed["Content-Type"] == "application/pdf"
    assert res_allowed.content.startswith(b"%PDF-")


@pytest.mark.django_db
def test_direct_pdf_service_generators(pdf_test_setup):
    """اختبار دوال التوليد المباشرة generate_opening_session_pdf و generate_cahier_specs_pdf"""
    session = pdf_test_setup["session"]
    authority = pdf_test_setup["authority"]
    deal = pdf_test_setup["deal"]

    pv_pdf = generate_opening_session_pdf(session, authority)
    assert isinstance(pv_pdf, bytes)
    assert pv_pdf.startswith(b"%PDF-")
    assert len(pv_pdf) > 2000

    specs_pdf = generate_cahier_specs_pdf(deal, authority)
    assert isinstance(specs_pdf, bytes)
    assert specs_pdf.startswith(b"%PDF-")
    assert len(specs_pdf) > 2000
