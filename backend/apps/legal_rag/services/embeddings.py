import hashlib
import logging
import math
import os
import sys
from typing import List

logger = logging.getLogger(__name__)

EMBEDDING_DIM = 384
DEFAULT_MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

_model_instance = None
_model_failed = False


def _neural_embeddings_disabled() -> bool:
    """
    تعطيل تحميل النموذج العصبي في بيئات الاختبار أو عند طلب ذلك صراحةً.

    الاختبارات تعتمد على المولد الحتمي المحلي (fallback) لضمان السرعة وعدم
    الاعتماد على الشبكة أو على توافق مكتبات Python مع بيئة التشغيل.
    في الإنتاج يبقى النموذج العصبي مفعّلاً ما لم يُضبط المتغير صراحةً.
    """
    value = os.environ.get("SAFAQAT_DISABLE_NEURAL_EMBEDDINGS", "").strip().lower()
    if value in {"1", "true", "yes", "on"}:
        return True
    return "pytest" in sys.modules


def get_sentence_transformer():
    """تحميل وحفظ نسخة مفردة من نموذج التضمين متعدد اللغات (Singleton)"""
    global _model_instance, _model_failed
    if _model_failed:
        return None
    if _model_instance is not None:
        return _model_instance
    if _neural_embeddings_disabled():
        logger.info("تم تعطيل نموذج التضمين العصبي في بيئة الاختبار؛ سيُستخدم المولد الحتمي المحلي.")
        return None

    try:
        from sentence_transformers import SentenceTransformer
        logger.info("جاري تحميل نموذج التضمين %s ...", DEFAULT_MODEL_NAME)
        # 1. محاولة التحميل فوراً من الملفات المحفوظة محلياً (سرعة فائقة دون انتظار الشبكة)
        try:
            _model_instance = SentenceTransformer(DEFAULT_MODEL_NAME, local_files_only=True)
            logger.info("تم تحميل نموذج التضمين من التخزين المحلي بنجاح.")
            return _model_instance
        except Exception:
            # 2. إذا لم يكن محملاً مسبقاً، محاولة تنزيله من Hugging Face
            _model_instance = SentenceTransformer(DEFAULT_MODEL_NAME, local_files_only=False)
            logger.info("تم تنزيل وتحميل نموذج التضمين بنجاح.")
            return _model_instance
    except Exception as exc:
        logger.warning("تعذر تحميل نموذج التضمين العصبي (%s): %s. سيتم استخدام المولد المحلي البديل.", DEFAULT_MODEL_NAME, exc)
        _model_failed = True
        return None


def _fallback_deterministic_embedding(text: str, dim: int = EMBEDDING_DIM) -> List[float]:
    """
    مولد تضمين شعاعي دلالي محلي بديل (Deterministic Semantic Vector)
    ينتج شعاعاً طبيعياً ومعايراً (Unit Vector L2) بطول 384 بعداً
    يسمح بحساب التشابه الجيبي (Cosine Similarity) بدقة في بيئات الاختبار وبدون إنترنت.
    """
    if not text:
        return [0.0] * dim

    words = text.lower().split()
    vector = [0.0] * dim

    for i, word in enumerate(words):
        h = hashlib.sha256(word.encode("utf-8")).digest()
        for j in range(0, min(len(h), 32), 4):
            val = int.from_bytes(h[j:j+4], byteorder="big", signed=True)
            idx = abs(val) % dim
            vector[idx] += 1.0 / (1.0 + (i * 0.05))

    # تطبيع المتجه (L2 Normalization) ليكون متجهاً أحادياً (Norm = 1.0)
    norm = math.sqrt(sum(v * v for v in vector))
    if norm > 1e-9:
        vector = [v / norm for v in vector]
    else:
        vector[0] = 1.0

    return vector


def generate_embedding(text: str) -> List[float]:
    """
    توليد التضمين الشعاعي للنص المحدد (384 بعداً).
    يستخدم SentenceTransformer إذا توفر، أو المولد المعاير تلقائياً.
    """
    if not text or not text.strip():
        return [0.0] * EMBEDDING_DIM

    clean_text = text.strip()
    model = get_sentence_transformer()

    if model is not None:
        try:
            embedding = model.encode(clean_text, normalize_embeddings=True)
            if hasattr(embedding, "tolist"):
                return embedding.tolist()
            return list(embedding)
        except Exception as exc:
            logger.warning("فشل حساب التضمين عبر النموذج العصبي: %s", exc)

    return _fallback_deterministic_embedding(clean_text, dim=EMBEDDING_DIM)


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """حساب التشابه الجيبي بين متجهين (Cosine Similarity) في بايثون"""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 < 1e-9 or norm2 < 1e-9:
        return 0.0
    return dot / (norm1 * norm2)
