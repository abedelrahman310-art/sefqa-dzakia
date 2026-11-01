import io
import pytest
from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APIClient
from reportlab.pdfgen import canvas

from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal, CahierSpecs
from apps.bids.models import BidOffer
from apps.legal_rag.models import LegalArticle
from apps.legal_rag.services.embeddings import generate_embedding
from apps.contracts.models import (
    AwardObjection,
    ObjectionStatus,
    ObjectionType,
    ObjectionGround,
)


@pytest.fixture
def auth_setup(db):
    client = APIClient()
    operator = CustomUser.objects.create_user(
        email="operator_test_ai@safaqat.dz",
        password="Safaqat@2026",
        role="operator",
        display_name="مؤسسة الإنشاءات الوطنية",
    )
    authority = CustomUser.objects.create_user(
        email="authority_test_ai@safaqat.dz",
        password="Safaqat@2026",
        role="authority",
        display_name="مديرية التجهيزات العمومية لولاية وهران",
    )
    deal = ProcurementDeal.objects.create(
        reference_number="DEAL-AI-TEST-2026",
        title="مشروع بناء مجمع مدرسي نموذجي",
        description="إنجاز مجمع مدرسي يتضمن 12 قاعة دراسة ومطعم وقاعة رياضة",
        authority=authority,
        wilaya="31",
        estimated_budget=85000000.00,
        current_stage=3,
        submission_deadline=timezone.now() + timedelta(days=21),
    )
    cahier = CahierSpecs.objects.create(
        deal=deal,
        administrative_clauses={
            "procurement_method": "open_tender",
            "competition_scope": "national",
            "required_documents": ["شهادة التأهيل والتصنيف المهنيين", "السجل التجاري", "كفالة التعهد"]
        },
        technical_requirements={
            "duration": "10 أشهر",
            "details": "أشغال الخرسانة المسلحة والكتامة والتهيئة الخارجية"
        },
        financial_criteria={
            "scoring": "تنقيط العرض التقني على 100 نقطة والحد الأدنى الإقصائي 60 نقطة"
        }
    )
    bid = BidOffer.objects.create(
        deal=deal,
        operator=operator,
        status="submitted",
        financial_amount=79000000.00,
    )
    client.force_authenticate(user=operator)
    return {
        "client": client,
        "operator": operator,
        "authority": authority,
        "deal": deal,
        "cahier": cahier,
        "bid": bid,
    }


def generate_sample_pdf_bytes():
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer)
    p.drawString(100, 750, "Cahier des Charges - Safaqat Platform")
    p.drawString(100, 730, "Tender Reference: DEAL-AI-TEST-2026")
    p.drawString(100, 710, "Article 1: Qualification Requirements: Grade 3 minimum in Works")
    p.drawString(100, 690, "Article 2: Bid Bond Guarantee: 1% of total offer value")
    p.drawString(100, 670, "Article 3: Submission Deadline: 21 days from publication")
    p.drawString(100, 650, "Article 4: Performance Guarantee: 5% of basic deal amount")
    p.save()
    buffer.seek(0)
    return buffer.getvalue()


@pytest.fixture
def legal_article_72(db):
    """يزرع المادة 72 حتى يعمل RAG في قاعدة الاختبار الفارغة."""
    content = (
        "يحق لكل متعهد يشارك في طلب عروض ويحتج على قرار الإسناد المؤقت للصفقة "
        "أن يرفع طعناً إدارياً مسبقاً أمام لجنة الصفقات المختصة في أجل أقصاه "
        "عشرة (10) أيام ابتداءً من تاريخ نشر إشعار الإسناد المؤقت."
    )
    return LegalArticle.objects.create(
        law_source="القانون رقم 23-12",
        article_number="المادة 72",
        title="الطعن الإداري المسبق في الإسناد المؤقت",
        content=content,
        embedding=generate_embedding(
            f"القانون رقم 23-12 المادة 72 الطعن الإداري المسبق في الإسناد المؤقت {content}"
        ),
    )


@pytest.mark.django_db
def test_ai_legal_chat_endpoint(auth_setup, legal_article_72):
    client = auth_setup["client"]

    response = client.post(
        "/api/ai/legal-chat/",
        {"question": "ما هي مهلة رفع الطعن الإداري وما هي المادة القانونية؟"},
        format="json",
    )

    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "legal_articles" in data
    assert any("72" in art for art in data["legal_articles"]) or "72" in data["reply"]
    assert data["is_advisory"] is True
    assert "القانون 23-12" in data["statutory_reference"]


@pytest.mark.django_db
def test_ai_analyze_tender_with_deal_id(auth_setup):
    client = auth_setup["client"]
    deal = auth_setup["deal"]

    response = client.post(
        "/api/ai/analyze-tender/",
        {"deal_id": str(deal.id)},
        format="json",
    )

    assert response.status_code == 200
    data = response.json()
    assert data["deal_id"] == str(deal.id)
    assert len(data["qualification_conditions"]) > 0
    assert len(data["deadlines"]) > 0
    assert len(data["guarantees"]) > 0
    assert len(data["evaluation_criteria"]) > 0


@pytest.mark.django_db
def test_ai_analyze_tender_with_pdf_upload(auth_setup):
    client = auth_setup["client"]
    pdf_bytes = generate_sample_pdf_bytes()
    file_obj = io.BytesIO(pdf_bytes)
    file_obj.name = "cahier_charges_sample.pdf"

    response = client.post(
        "/api/ai/analyze-tender/",
        {"file": file_obj},
        format="multipart",
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_pages_read"] >= 1
    assert len(data["deadlines"]) > 0
    assert len(data["guarantees"]) > 0


@pytest.mark.django_db
def test_objection_days_remaining_computed_field(auth_setup):
    client = auth_setup["client"]
    operator = auth_setup["operator"]
    deal = auth_setup["deal"]

    now = timezone.now()
    objection = AwardObjection.objects.create(
        tender=deal,
        objector=operator,
        objection_type=ObjectionType.ADMINISTRATIVE,
        grounds=[ObjectionGround.EVALUATION],
        description="طعن إداري لاحتساب علامة العرض المالي والتقني بشكل غير مطابق",
        award_announced_at=now,
        submitted_at=now - timedelta(days=2),  # Submitted 2 days ago
        deadline_at=now + timedelta(days=8),
        status=ObjectionStatus.SUBMITTED,
    )

    assert objection.days_remaining() == 8  # 10 - 2 days elapsed = 8 days remaining

    # Test via API list endpoint
    response = client.get("/api/contracts/objections/")
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 1
    assert items[0]["days_remaining"] == 8
    assert items[0]["is_within_deadline"] is True

    # Test direct /api/objections/ route
    direct_response = client.get("/api/objections/")
    assert direct_response.status_code == 200
    direct_items = direct_response.json()
    assert len(direct_items) == 1
    assert direct_items[0]["days_remaining"] == 8
