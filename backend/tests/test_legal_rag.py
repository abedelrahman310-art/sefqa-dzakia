import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.core.management import call_command

from apps.legal_rag.models import LegalArticle
from apps.legal_rag.services.embeddings import generate_embedding, cosine_similarity
from apps.legal_rag.services.rag_service import (
    search_top_articles,
    build_rag_system_prompt,
    build_rag_user_prompt,
    extract_mentioned_articles,
)

User = get_user_model()


@pytest.fixture
def operator_user(db):
    return User.objects.create_user(
        email="operator.rag@safaqat.dz",
        password="ValidPassword123!",
        role="operator",
        organization_name="مؤسسة الأشغال الكبرى الجزائرية",
        display_name="المقاول الجزائري",
    )


@pytest.fixture
def authority_user(db):
    return User.objects.create_user(
        email="authority.rag@safaqat.dz",
        password="ValidPassword123!",
        role="authority",
        organization_name="مديرية التجهيزات العمومية",
        display_name="رئيس المصلحة",
    )


@pytest.fixture
def central_admin_user(db):
    return User.objects.create_user(
        email="central.rag@safaqat.dz",
        password="ValidPassword123!",
        role="central_admin",
        organization_name="المفتشية العامة للرقابة",
        display_name="المفتش المركزي",
    )


@pytest.fixture
def seed_legal_articles(db):
    """تهيئة مواد قانونية مرجعية للاختبارات السريعة"""
    articles_data = [
        {
            "law_source": "القانون رقم 23-12",
            "article_number": "المادة 72",
            "title": "الطعن الإداري المسبق في الإسناد المؤقت",
            "content": (
                "يحق لكل متعهد يشارك في طلب عروض ويحتج على قرار الإسناد المؤقت للصفقة أو إلغائها "
                "أن يرفع طعناً إدارياً مسبقاً أمام لجنة الصفقات المختصة في أجل أقصاه عشرة (10) أيام ابتداءً من تاريخ نشر إشعار الإسناد المؤقت."
            ),
        },
        {
            "law_source": "القانون رقم 23-12",
            "article_number": "المادة 82",
            "title": "الأثر الموقف للطعن ومهلة البت فيه",
            "content": (
                "يترتب على رفع الطعن أمام لجنة الصفقات المختصة تعليق إجراءات توقيع الصفقة وتنفيذها إلى حين البت فيه. "
                "وتفصل لجنة الصفقات في أجل عشرة (10) أيام."
            ),
        },
        {
            "law_source": "المرسوم الرئاسي رقم 15-247",
            "article_number": "المادة 125",
            "title": "كفالة حسن التنفيذ",
            "content": (
                "تحدد كفالة حسن التنفيذ بنسبة تتراوح بين 5% و10% من المبلغ الإجمالي للصفقة. "
                "وتودع الكفالة قبل أي دفع وتستمر حتى الاستلام المؤقت."
            ),
        },
        {
            "law_source": "المرسوم الرئاسي رقم 15-247",
            "article_number": "المادة 134",
            "title": "اقتطاع الضمان",
            "content": (
                "يطبق اقتطاع ضمان بنسبة 5% على كل وضعية دفع شهرية لضمان فترة الضمان والصيانة. "
                "يفرج عنه خلال شهر بعد الاستلام النهائي."
            ),
        },
        {
            "law_source": "القانون رقم 23-12",
            "article_number": "المادة 67",
            "title": "ملف الترشح والوثائق الإلزامية",
            "content": (
                "يجب على كل متعهد تقديم ملف الترشح متضمناً التصريح بالترشح والتصريح بالنزاهة "
                "والسجل التجاري الإلكتروني ورقم التعريف الجبائي وشهادات أداء مستحقات الضرائب والضمان الاجتماعي."
            ),
        },
    ]

    created_objs = []
    for item in articles_data:
        emb = generate_embedding(f"{item['law_source']} {item['article_number']} {item['title']} {item['content']}")
        obj, _ = LegalArticle.objects.update_or_create(
            law_source=item["law_source"],
            article_number=item["article_number"],
            defaults={
                "title": item["title"],
                "content": item["content"],
                "embedding": emb,
            }
        )
        created_objs.append(obj)

    return created_objs


@pytest.mark.django_db
class TestLegalRagEmbeddingAndSearch:
    """اختبارات التضمين الشعاعي والبحث الدلالي Top-3"""

    def test_embedding_generation_dimension_and_norm(self):
        emb = generate_embedding("طلب العروض في الصفقات العمومية")
        assert isinstance(emb, list)
        assert len(emb) == 384
        # التحقق من أن المتجه ليس صفرياً
        norm = sum(x * x for x in emb)
        assert norm > 0.0

    def test_cosine_similarity_identical_and_orthogonal(self):
        v1 = [1.0, 0.0, 0.0] + [0.0] * 381
        v2 = [1.0, 0.0, 0.0] + [0.0] * 381
        v3 = [0.0, 1.0, 0.0] + [0.0] * 381

        assert pytest.approx(cosine_similarity(v1, v2), 0.001) == 1.0
        assert pytest.approx(cosine_similarity(v1, v3), 0.001) == 0.0

    def test_search_top_articles_retrieves_appeals_articles(self, seed_legal_articles):
        query = "ما هو أجل تقديم الطعن في قرار الإسناد المؤقت للصفقة؟"
        results = search_top_articles(query, top_k=3)

        assert len(results) <= 3
        assert len(results) > 0

        # يجب أن يسترجع المادة 72 أو 82 ضمن أقرب المواد
        article_numbers = [art.article_number for art, _ in results]
        assert any(num in ["المادة 72", "المادة 82"] for num in article_numbers)

    def test_search_top_articles_retrieves_guarantee_articles(self, seed_legal_articles):
        query = "ما هي نسبة كفالة حسن التنفيذ واقتطاع الضمان؟"
        results = search_top_articles(query, top_k=3)

        assert len(results) <= 3
        article_numbers = [art.article_number for art, _ in results]
        assert any(num in ["المادة 125", "المادة 134", "المادة 74"] for num in article_numbers)

    def test_build_rag_prompts_strictly_grounded(self, seed_legal_articles):
        results = search_top_articles("طعن في الإسناد", top_k=2)
        system_prompt = build_rag_system_prompt()
        user_prompt = build_rag_user_prompt("كيف أطعن؟", results)

        assert "أنت مساعد قانوني آلي لمنصة \"صفقات ذكية\" الجزائرية" in system_prompt
        assert "لا تختلق أي مادة قانونية من عندك" in system_prompt
        assert "السياق القانوني (نصوص المواد المسترجعة):" in user_prompt
        assert "سؤال المتعامل:" in user_prompt
        assert "المادة 72" in user_prompt or "المادة" in user_prompt


@pytest.mark.django_db
class TestLegalRagApiEndpoint:
    """اختبارات مسار /api/ai/legal-chat/ المدعوم بـ RAG"""

    def test_unauthenticated_request_is_blocked(self):
        client = APIClient()
        response = client.post("/api/ai/legal-chat/", {"question": "سؤال عام"})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authority_user_is_allowed(self, authority_user):
        client = APIClient()
        client.force_authenticate(user=authority_user)
        response = client.post("/api/ai/legal-chat/", {"question": "سؤال عام"})
        assert response.status_code == status.HTTP_200_OK

    def test_central_admin_role_is_forbidden(self, central_admin_user):
        client = APIClient()
        client.force_authenticate(user=central_admin_user)
        response = client.post("/api/ai/legal-chat/", {"question": "سؤال عام"})
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_empty_question_returns_bad_request(self, operator_user):
        client = APIClient()
        client.force_authenticate(user=operator_user)
        response = client.post("/api/ai/legal-chat/", {"question": "   "})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_rag_legal_chat_successful_response(self, operator_user, seed_legal_articles):
        client = APIClient()
        client.force_authenticate(user=operator_user)

        response = client.post(
            "/api/ai/legal-chat/",
            {"question": "ما هي المهلة القانونية لتقديم طعن في نتائج الإسناد المؤقت وفق القانون 23-12؟"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.data

        # التحقق من هيكل رد الـ RAG
        assert "reply" in data
        assert "answer" in data
        assert data.get("rag_enabled") is True
        assert data.get("top_k") > 0
        assert len(data.get("retrieved_articles", [])) > 0
        assert len(data.get("legal_articles", [])) > 0

        # التحقق من أن المواد المسترجعة تتضمن المادة 72
        retrieved_art_nums = [a["article_number"] for a in data["retrieved_articles"]]
        assert any("72" in n or "82" in n for n in retrieved_art_nums)

        # التحقق من أن الإجابة تحتوي على رقم المادة المستند إليها
        assert "المادة" in data["reply"]


@pytest.mark.django_db
class TestIngestLegalDocsCommand:
    """اختبار أمر الإدارة ingest_legal_docs"""

    @pytest.mark.timeout(180)
    def test_ingest_legal_docs_command_executes_cleanly(self):
        # استخراج النصوص من ملفي PDF الرسميين يستغرق ~40 ثانية على Python 3.14،
        # وقد يتجاوز حد 60 ثانية تحت حمل تشغيل المجموعة الكاملة.
        call_command("ingest_legal_docs", max_articles=5)
        # التأكد من حفظ المواد في قاعدة البيانات
        total_count = LegalArticle.objects.count()
        assert total_count >= 14
        assert LegalArticle.objects.filter(article_number="المادة 67").exists()
        assert LegalArticle.objects.filter(article_number="المادة 72").exists()
        assert LegalArticle.objects.filter(article_number="المادة 125").exists()
