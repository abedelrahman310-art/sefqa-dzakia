from typing import Protocol, Any
import os
import time
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class LLMError(Exception):
    """استثناء مخصص لأخطاء بوابة الذكاء الاصطناعي"""
    pass


class LLMProvider(Protocol):
    """بروتوكول موحد لمزودي الذكاء الاصطناعي"""

    def chat(self, messages: list[dict[str, str]], **kwargs: Any) -> str:
        ...

    def test_connection(self) -> bool:
        ...


class GeminiProvider:
    """Google Gemini Provider — موصى به للأداء العربي الاستثنائي"""

    def __init__(self, api_key: str, model: str = "gemini-1.5-flash"):
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            self.model_name = model
            self.model = genai.GenerativeModel(model)
        except ImportError as e:
            raise LLMError("مكتبة google-generativeai غير مثبتة في البيئة الحالية") from e

    def chat(self, messages: list[dict[str, str]], temperature: float = 0.2, max_tokens: int = 2000, **kwargs: Any) -> str:
        # تحويل الرسائل إلى بنية Gemini
        formatted_contents = []
        for msg in messages:
            role = "user" if msg.get("role") in ("user", "system") else "model"
            formatted_contents.append({"role": role, "parts": [msg.get("content", "")]})

        last_error = None
        for attempt in range(1, 4):
            try:
                response = self.model.generate_content(
                    formatted_contents,
                    generation_config={
                        "temperature": temperature,
                        "max_output_tokens": max_tokens,
                    },
                    request_options={"timeout": 60},
                )
                if response and response.text:
                    return response.text.strip()
                raise LLMError("استجابة خالية من النموذج")
            except Exception as e:
                last_error = e
                wait_time = 2 ** attempt
                logger.warning(f"محاولة استدعاء Gemini رقم {attempt} فشلت: {e}. إعادة المحاولة بعد {wait_time} ثوان...")
                time.sleep(wait_time)

        raise LLMError(f"فشلت كافة محاولات الاتصال بـ Gemini: {last_error}")

    def test_connection(self) -> bool:
        try:
            res = self.model.generate_content("اختبار الاتصال", request_options={"timeout": 10})
            return bool(res and res.text)
        except Exception as e:
            logger.warning(f"اختبار اتصال Gemini غير ناجح: {e}")
            return False


class AnthropicProvider:
    """Anthropic Claude Provider"""

    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        try:
            import anthropic
            self.client = anthropic.Anthropic(api_key=api_key)
            self.model_name = model
        except ImportError as e:
            raise LLMError("مكتبة anthropic غير مثبتة في البيئة الحالية") from e

    def chat(self, messages: list[dict[str, str]], temperature: float = 0.2, max_tokens: int = 2000, **kwargs: Any) -> str:
        system_prompt = ""
        claude_messages = []
        for msg in messages:
            if msg.get("role") == "system":
                system_prompt = msg.get("content", "")
            else:
                claude_messages.append({
                    "role": "user" if msg.get("role") == "user" else "assistant",
                    "content": msg.get("content", ""),
                })

        for attempt in range(1, 4):
            try:
                response = self.client.messages.create(
                    model=self.model_name,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=system_prompt,
                    messages=claude_messages,
                    timeout=60.0,
                )
                return response.content[0].text.strip()
            except Exception as e:
                time.sleep(2 ** attempt)
                logger.warning(f"فشل محاولة الاتصال بـ Anthropic رقم {attempt}: {e}")

        raise LLMError("تعذر الاتصال بـ Anthropic بعد 3 محاولات")

    def test_connection(self) -> bool:
        try:
            res = self.client.messages.create(
                model=self.model_name,
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}],
                timeout=10.0,
            )
            return bool(res and res.content)
        except Exception:
            return False


class OpenAIProvider:
    """OpenAI GPT Provider"""

    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        try:
            import openai
            self.client = openai.OpenAI(api_key=api_key)
            self.model_name = model
        except ImportError as e:
            raise LLMError("مكتبة openai غير مثبتة في البيئة الحالية") from e

    def chat(self, messages: list[dict[str, str]], temperature: float = 0.2, max_tokens: int = 2000, **kwargs: Any) -> str:
        for attempt in range(1, 4):
            try:
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    timeout=60.0,
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                time.sleep(2 ** attempt)
                logger.warning(f"فشل محاولة OpenAI رقم {attempt}: {e}")

        raise LLMError("تعذر الاتصال بـ OpenAI بعد 3 محاولات")

    def test_connection(self) -> bool:
        try:
            res = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5,
                timeout=10.0,
            )
            return bool(res and res.choices)
        except Exception:
            return False


class RuleBasedFallback:
    """
    محرك استشاري محلي مبني على القواعد القانونية والتنظيمية (قانون 23-12).
    يعمل بدون أي اتصال بالإنترنت أو مفاتيح API، ويعتمد في بيئات الاختبار والتطوير.
    يُرجع جملاً عربية طبيعية ونظيفة دون إظهار الـ system prompt أو هياكل البيانات الخام.
    """

    def _get_context_data(self) -> dict:
        """
        استخراج المعطيات اللحظية من قاعدة البيانات لصياغة إجابات دقيقة وطبيعية.
        """
        try:
            from django.utils import timezone
            from apps.procurements.models import ProcurementDeal
            from apps.contracts.models import AwardDecision
            from apps.ai_gateway.models import AIInsight

            total_deals = ProcurementDeal.objects.count()
            delayed_count = ProcurementDeal.objects.filter(
                submission_deadline__lt=timezone.now(),
                current_stage__in=[3, 4, 5],
            ).count()
            critical_insights = AIInsight.objects.filter(
                is_resolved=False,
                severity__in=["critical", "high"],
            ).count()
            appeals_count = AwardDecision.objects.filter(appeal_status="pending").count()

            return {
                "total_deals": total_deals,
                "delayed_count": delayed_count,
                "critical_insights": critical_insights,
                "appeals_count": appeals_count,
            }
        except Exception as e:
            logger.debug(f"RuleBasedFallback context fetch fallback: {e}")
            return {
                "total_deals": 0,
                "delayed_count": 0,
                "critical_insights": 0,
                "appeals_count": 0,
            }

    def chat(self, messages: list[dict[str, str]], **kwargs: Any) -> str:
        # 1. تجاهل أي system prompt تماماً واستخراج رسالة المستخدم فقط
        user_msg = next((m.get("content", "") for m in reversed(messages) if m.get("role") == "user"), "")
        if not user_msg:
            user_msg = next((m.get("content", "") for m in reversed(messages) if m.get("role") != "system"), "")

        # 2. تحليل السؤال وتوجيهه وصياغة الرد بالعربية الطبيعية
        if any(k in user_msg for k in ["تأخير", "متأخر", "آجال", "مهلة"]):
            return self._delays_response(user_msg)
        if any(k in user_msg for k in ["كم", "عدد", "إحصائيات", "إحصائية", "مجموع"]):
            return self._count_response(user_msg)
        if any(k in user_msg for k in ["مخاطر", "شبهات", "فساد", "تواطؤ", "احتكار", "خطر"]):
            return self._risks_response(user_msg)
        if any(k in user_msg for k in ["ولاية", "وهران", "الجزائر", "قسنطينة", "سطيف", "عنابة", "تلمسان", "ورقلة", "باتنة"]):
            return self._wilaya_response(user_msg)
        if any(k in user_msg for k in ["امتثال", "دفتر الشروط", "قانون", "23-12", "لجنة"]):
            return self._compliance_response(user_msg)

        return self._default_response(user_msg)

    def _count_response(self, question: str) -> str:
        data = self._get_context_data()

        if "تأخير" in question or "متأخر" in question:
            count = data.get("delayed_count", 0)
            if count == 0:
                return "لا توجد صفقات متأخرة حالياً."
            return f"يوجد {count} صفقة متأخرة."

        if "طعن" in question or "طعون" in question:
            count = data.get("appeals_count", 0)
            if count == 0:
                return "لا توجد طعون معلقة حالياً."
            return f"يوجد {count} طعن معلق."

        if "مخاطر" in question or "شبهات" in question or "تنبيه" in question or "توصية" in question:
            count = data.get("critical_insights", 0)
            if count == 0:
                return "لا توجد تنبيهات رقابية حرجة حالياً."
            return f"يوجد {count} تنبيه رقابي حرج."

        total = data.get("total_deals", 0)
        return f"إجمالي الصفقات المسجلة: {total}."

    def _delays_response(self, question: str) -> str:
        data = self._get_context_data()
        count = data.get("delayed_count", 0)
        if count == 0:
            return "لا توجد صفقات متأخرة حالياً."
        return f"يوجد {count} صفقة متأخرة."

    def _risks_response(self, question: str) -> str:
        data = self._get_context_data()
        count = data.get("critical_insights", 0)
        if count == 0:
            return "المؤشرات الرقابية الحالية مستقرة ولا توجد شبهات حرجة مرصودة."
        return f"تم رصد {count} تنبيه رقابي يتعلق بمخاطر وشبهات إجرائية محتملة."

    def _wilaya_response(self, question: str) -> str:
        wilayas = ["وهران", "الجزائر", "قسنطينة", "سطيف", "عنابة", "تلمسان", "ورقلة", "باتنة"]
        matched_wilaya = next((w for w in wilayas if w in question), None)
        if matched_wilaya:
            try:
                from apps.procurements.models import ProcurementDeal
                w_count = ProcurementDeal.objects.filter(wilaya__icontains=matched_wilaya).count()
                return f"تسجل ولاية {matched_wilaya} حالياً {w_count} صفقة خاضعة للرقابة."
            except Exception:
                return f"تخضع صفقات ولاية {matched_wilaya} للمتابعة الدورية."
        return "تخضع كافة الصفقات الولائية للمتابعة الرقابية الميدانية."

    def _compliance_response(self, question: str) -> str:
        return (
            "وفقاً للقانون رقم 23-12، يُشترط استيفاء دفاتر الشروط لمعايير التأهيل المسبقة، "
            "واحترام آجال الإشهار، وتأشيرة لجان الرقابة قبل فتح الأظرفة."
        )

    def _default_response(self, question: str) -> str:
        return (
            "مرحباً بك في المساعد الذكي. يمكنك سؤالي عن عدد الصفقات، الصفقات المتأخرة، مؤشرات المخاطر، أو الامتثال للقانون 23-12."
        )

    def test_connection(self) -> bool:
        return True


def get_llm_client() -> LLMProvider:
    """
    استرجاع المزود النشط للذكاء الاصطناعي مع التراجع التلقائي والآمن إلى RuleBasedFallback
    """
    provider = os.getenv("LLM_PROVIDER", getattr(settings, "LLM_PROVIDER", "rule_based")).lower()
    model = os.getenv("LLM_MODEL", getattr(settings, "LLM_MODEL", "gemini-1.5-flash"))

    if provider == "gemini":
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            try:
                client = GeminiProvider(api_key=api_key, model=model)
                logger.info(f"تم تفعيل مزود Google Gemini بنجاح (Model: {model})")
                return client
            except Exception as e:
                logger.warning(f"تعذر تهيئة مزود Gemini: {e}. يتم التراجع إلى المحرك المحلي.")
        else:
            logger.info("مزود Gemini محدد لكن GEMINI_API_KEY غير موجود. يتم التراجع إلى المحرك المحلي.")

    elif provider == "anthropic":
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if api_key:
            try:
                client = AnthropicProvider(api_key=api_key, model=model)
                logger.info("تم تفعيل مزود Anthropic بنجاح")
                return client
            except Exception as e:
                logger.warning(f"تعذر تهيئة مزود Anthropic: {e}. يتم التراجع إلى المحرك المحلي.")

    elif provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            try:
                client = OpenAIProvider(api_key=api_key, model=model)
                logger.info("تم تفعيل مزود OpenAI بنجاح")
                return client
            except Exception as e:
                logger.warning(f"تعذر تهيئة مزود OpenAI: {e}. يتم التراجع إلى المحرك المحلي.")

    logger.info("استخدام المحرك المحلي القاعدي (RuleBasedFallback) لضمان العمل المستقل والمستقر.")
    return RuleBasedFallback()
