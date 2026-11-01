import logging
import os
import re
from typing import List, Dict, Any, Tuple
from django.db import connection

from apps.legal_rag.models import LegalArticle
from apps.legal_rag.services.embeddings import generate_embedding, cosine_similarity

logger = logging.getLogger(__name__)


def search_top_articles(query: str, top_k: int = 3) -> List[Tuple[LegalArticle, float]]:
    """
    البحث الدلالي الشعاعي عن أقرب المواد القانونية (Top-K Similarity Search)
    - يستخدم pgvector الأصلي (CosineDistance) في PostgreSQL.
    - يستخدم الخوارزمية الجيبية المحلية كـ fallback سريع في SQLite وبيئات الاختبار.
    """
    if not query or not query.strip():
        return []

    query_vector = generate_embedding(query)
    is_postgres = (connection.vendor == "postgresql")

    if is_postgres:
        try:
            from pgvector.django import CosineDistance
            candidates = (
                LegalArticle.objects.exclude(embedding__isnull=True)
                .annotate(distance=CosineDistance("embedding", query_vector))
                .order_by("distance")[:top_k]
            )
            results = []
            for art in candidates:
                # distance هي المسافة الجيبية (0 إلى 2)، والتشابه = 1 - distance
                dist = getattr(art, "distance", 1.0)
                sim = max(0.0, round(1.0 - float(dist), 4))
                results.append((art, sim))
            if results:
                return results
        except Exception as exc:
            logger.warning("تعذر تنفيذ استعلام pgvector المباشر في PostgreSQL (%s)، الانتقال للبحث الجيبي البديل.", exc)

    # البحث الجيبي في بايثون (لبيئات SQLite والاختبارات الآلية)
    articles = list(LegalArticle.objects.exclude(embedding__isnull=True))
    if not articles:
        # إذا لم توجد تضمينات محفوظة، نبحث بالكلمات المفتاحية كبديل أخير
        kw_qs = LegalArticle.objects.filter(content__icontains=query[:30])[:top_k]
        return [(art, 0.5) for art in kw_qs]

    scored = []
    for art in articles:
        emb = art.embedding
        if isinstance(emb, (list, tuple)):
            sim = cosine_similarity(query_vector, list(emb))
            scored.append((art, sim))

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_k]


def build_rag_system_prompt() -> str:
    """أمر النظام الصارم للمساعد القانوني المدعوم بـ RAG لمنصة صفقات ذكية"""
    return (
        "أنت مساعد قانوني آلي لمنصة \"صفقات ذكية\" الجزائرية.\n"
        "مهمتك الإجابة على أسئلة المتعاملين الاقتصاديين بناءً على السياق القانوني المرفق فقط.\n\n"
        "القواعد الصارمة:\n"
        "1. لا تختلق أي مادة قانونية من عندك. إذا لم تكن الإجابة موجودة في النص المرفق، قل بوضوح: \"لا توجد إجابة صريحة في النصوص المتاحة\".\n"
        "2. يجب أن تذكر رقم المادة القانونية (مثلاً: المادة 70) في إجابتك.\n"
        "3. استخدم لغة عربية قانونية رسمية ومبسطة في نفس الوقت.\n"
        "4. لا تعطِ استشارات قانونية شخصية (مثل: \"أنا أنصحك بمقاضاة المصلحة\")، بل اذكر ما ينص عليه القانون فقط.\n"
        "5. مبدأ صفر ورقة (Zéro papier) والرقمنة الشاملة:\n"
        "   - منصة «صفقات ذكية» منظومة وطنية رقمية بالكامل بدون أوراق، تتبع القانون 23-12 والمرسوم الرئاسي 15-247.\n"
        "   - إيداع العروض يتم حصراً رقمياً عبر المنصة (رفع رقمي منفصل لملف الترشح والعرض التقني، وتشفير العرض المالي بتقنية AES-256 حتى جلسة الفتح العلنية الرقمية).\n"
        "   - لا تنصح المتعامل إطلاقاً بإعداد أو تقديم أظرفة ورقية، ولا تذكر عبارات مثل \"ثلاثة أظرفة\" أو \"أظرفة منفصلة داخل ظرف خارجي مبهم\".\n"
        "   - الوثائق الرسمية الصادرة عن الهيئات العمومية (السجل التجاري، NIF، شهادات الضرائب، CNAS/CASNOS، صحيفة السوابق) يتم التحقق منها عبر الربط البيني الحكومي الآلي ولا تُطلب ورقياً من المتعامل."
    )


def build_rag_user_prompt(user_question: str, retrieved_articles: List[Tuple[LegalArticle, float]]) -> str:
    """بناء رسالة المستخدم المرفقة بسياق المواد القانونية المسترجعة"""
    context_parts = []
    for idx, (art, _) in enumerate(retrieved_articles, 1):
        context_parts.append(
            f"--- المادة [{idx}] ---\n"
            f"المصدر: {art.law_source}\n"
            f"رقم المادة: {art.article_number}\n"
            f"الموضوع: {art.title or 'أحكام عامة'}\n"
            f"النص:\n{art.content.strip()}"
        )

    context_str = "\n\n".join(context_parts) if context_parts else "لا توجد نصوص قانونية مسترجعة."

    return (
        f"السياق القانوني (نصوص المواد المسترجعة):\n"
        f"{context_str}\n\n"
        f"سؤال المتعامل:\n"
        f"{user_question}"
    )


def extract_mentioned_articles(text: str) -> List[str]:
    """استخراج أرقام المواد القانونية المذكورة في نص الإجابة"""
    pattern = r"(?:المادة|مادة|Article)\s+(?:\d+|1er|الأولى|الاولى|الثانية|الثالثة)(?:\s+من\s+(?:القانون|المرسوم|الأمر)\s*[\w\s\d-]+)?"
    matches = re.findall(pattern, text)
    return list(dict.fromkeys(matches))


def synthesize_local_rag_fallback(user_question: str, retrieved_articles: List[Tuple[LegalArticle, float]]) -> str:
    """
    توليد إجابة قانونية استرجاعية موثوقة عند غياب مفاتيح الـ LLM الخارجية أو انقطاع الاتصال.
    تقوم بتقديم خلاصات ونصوص المواد المسترجعة بأسلوب قانوني منظم وفق القواعد الصارمة.
    """
    if not retrieved_articles:
        return "لا توجد إجابة صريحة في النصوص المتاحة."

    response_lines = [
        "استناداً إلى المواد القانونية المسترجعة من المنظومة التشريعية للصفقات العمومية (القانون 23-12 والمرسوم 15-247):\n"
    ]

    for idx, (art, _) in enumerate(retrieved_articles, 1):
        clean_content = art.content.strip()
        response_lines.append(
            f"📌 **{art.article_number} ({art.law_source})**:\n"
            f"> {clean_content}\n"
        )

    response_lines.append(
        "تذكير: هذه المعلومات مستخرجة حصراً من نصوص المواد المسترجعة المذكورة أعلاه دون تأويل أو استشارة شخصية."
    )

    return "\n".join(response_lines)
