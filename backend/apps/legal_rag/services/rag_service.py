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
    """أمر النظام الصارم للمساعد القانوني المدعوم بـ RAG"""
    return (
        "أنت المستشار القانوني المتخصص لمنصة 'صفقات' للصفقات العمومية في الجمهورية الجزائرية الديمقراطية الشعبية.\n"
        "مهمتك الإجابة حصراً ودقة استناداً إلى النصوص القانونية المسترجعة أدناه فقط (القانون رقم 23-12 والمرسوم الرئاسي رقم 15-247).\n\n"
        "القواعد الصارمة الواجب اتباعها:\n"
        "1. أجب باستخدام النصوص المسترجعة فقط، واذكر رقم المادة القانونية واسم التشريع (القانون 23-12 أو المرسوم 15-247) بوضوح تام.\n"
        "2. لا تخترع أو تفترض أي شروط أو مدد زمنية أو عقوبات من خارج النصوص المسترجعة.\n"
        "3. صِغ إجابتك بلغة قانونية رسمية وموجزة ومباشرة، مع استخدام علامات الترقيم والنقاط التوضيحية.\n"
        "4. إذا كانت المواد المسترجعة لا تغطي استفسار المستخدم بشكل كافٍ، صرح بذلك بوضوح واذكر ما توفره المواد المتوفرة بدقة."
    )


def build_rag_user_prompt(user_question: str, retrieved_articles: List[Tuple[LegalArticle, float]]) -> str:
    """بناء رسالة المستخدم المرفقة بسياق المواد القانونية المسترجعة"""
    context_parts = []
    for idx, (art, score) in enumerate(retrieved_articles, 1):
        context_parts.append(
            f"--- مادة مرجعية رقم [{idx}] ---\n"
            f"المصدر: {art.law_source}\n"
            f"رقم المادة: {art.article_number}\n"
            f"الموضوع: {art.title or 'أحكام عامة'}\n"
            f"النص القانوني الأصلي:\n{art.content}\n"
        )

    context_str = "\n".join(context_parts)
    return (
        f"المواد القانونية المسترجعة من قاعدة البيانات التشريعية:\n\n"
        f"{context_str}\n"
        f"=========================================\n"
        f"سؤال المتعامل:\n{user_question}\n\n"
        f"المطلوب: أجب باستخدام النصوص المسترجعة أعلاه فقط، واذكر رقم المادة واسم القانون بدقة."
    )


def extract_mentioned_articles(text: str) -> List[str]:
    """استخراج أرقام المواد القانونية المذكورة في نص الإجابة"""
    pattern = r"(?:المادة|مادة|Article)\s+(?:\d+|1er|الأولى|الاولى|الثانية|الثالثة)(?:\s+من\s+(?:القانون|المرسوم|الأمر)\s*[\w\s\d-]+)?"
    matches = re.findall(pattern, text)
    return list(dict.fromkeys(matches))


def synthesize_local_rag_fallback(user_question: str, retrieved_articles: List[Tuple[LegalArticle, float]]) -> str:
    """
    توليد إجابة قانونية استرجاعية موثوقة عند غياب مفاتيح الـ LLM الخارجية أو انقطاع الاتصال.
    تقوم بتقديم خلاصات ونصوص المواد المسترجعة بأسلوب قانوني منظم.
    """
    if not retrieved_articles:
        return (
            "لم يتم العثور على مواد قانونية مطابقة مباشرة لسؤالكم في القانون 23-12 والمرسوم 15-247. "
            "يرجى إعادة صياغة السؤال بمصطلحات قانونية أكثر دقة (مثل: إسناد، طعن، كفالة، استشارة، دفتر الشروط)."
        )

    response_lines = [
        "بناءً على النصوص القانونية المسترجعة من المنظومة التشريعية للصفقات العمومية الجزائرية:\n"
    ]

    for idx, (art, _) in enumerate(retrieved_articles, 1):
        clean_content = art.content.strip()
        # تلخيص إذا كان النص طويلاً
        preview = clean_content if len(clean_content) <= 300 else clean_content[:300] + "..."
        response_lines.append(
            f"📌 **{art.law_source} - {art.article_number}**:\n"
            f"> {preview}\n"
        )

    response_lines.append(
        "تذكير: هذه الاستشارة استرشادية مبنية على النصوص القانونية المسترجعة حصراً، "
        "وتخضع لسلطة المصلحة المتعاقدة ولجان الصفقات المختصة وفق أحكام القانون 23-12."
    )

    return "\n".join(response_lines)
