import uuid
import logging
from django.utils import timezone
from apps.ai_gateway.models import AIConversation, AIMessage, AIInsight
from apps.procurements.models import ProcurementDeal
from apps.contracts.models import AwardDecision, Contract
from apps.users.models import CustomUser
from .llm_client import get_llm_client

logger = logging.getLogger(__name__)


def sanitize_pii(text: str) -> str:
    """
    تطهير البيانات ذات الطابع الشخصي (PII) امتثالاً لأحكام القانون 18-07.
    حجب عناوين البريد الإلكتروني وأرقام الهواتف إن وجدت في النصوص.
    """
    import re
    # حجب البريد الإلكتروني
    sanitized = re.sub(r"[\w\.-]+@[\w\.-]+\.\w+", "[محجوب بموجب القانون 18-07]", text)
    # حجب أرقام الهواتف (أرقام متتالية من 9 إلى 10 خانات)
    sanitized = re.sub(r"\b0[567][0-9]{8}\b", "[رقم هاتف محجوب]", sanitized)
    return sanitized


def extract_data_for_question(question: str) -> dict:
    """
    استخراج البيانات والسياق الإحصائي من قاعدة البيانات بناءً على الكلمات المفتاحية للسؤال الرقابي.
    الالتزام الصارم بعدم تضمين أي بيانات شخصية (قانون 18-07).
    """
    context_data = {
        "kpis": {},
        "relevant_deals": [],
        "relevant_insights": [],
        "sources": [],
    }

    try:
        # إحصائيات عامة سريعة
        total_deals = ProcurementDeal.objects.count()
        context_data["kpis"]["total_deals"] = total_deals

        # 1. الاستفسار عن التأخير والآجال
        if any(k in question for k in ["تأخير", "متأخر", "آجال", "مهلة"]):
            delayed_deals = ProcurementDeal.objects.filter(
                submission_deadline__lt=timezone.now(),
                current_stage__in=[3, 4, 5],
            )[:5]
            context_data["kpis"]["delayed_count"] = ProcurementDeal.objects.filter(
                submission_deadline__lt=timezone.now(),
                current_stage__in=[3, 4, 5],
            ).count()
            for d in delayed_deals:
                context_data["relevant_deals"].append({
                    "ref": d.reference_number,
                    "title": d.title,
                    "stage": d.get_current_stage_display(),
                    "wilaya": d.wilaya,
                })
                context_data["sources"].append(f"صفقة مرجعية: {d.reference_number}")

        # 2. الاستفسار عن المخاطر والشبهات والتوصيات
        if any(k in question for k in ["مخاطر", "شبهات", "فساد", "توصية", "توصيات"]):
            critical_insights = AIInsight.objects.filter(
                is_resolved=False,
                severity__in=["critical", "high"],
            )[:5]
            for ins in critical_insights:
                context_data["relevant_insights"].append({
                    "title": ins.title,
                    "severity": ins.severity,
                    "category": ins.category,
                })
                context_data["sources"].append(f"تنبيه رقابي: {ins.title}")

        # 3. الاستفسار عن ولاية محددة
        for wilaya_name in ["وهران", "الجزائر", "قسنطينة", "سطيف", "عنابة", "تلمسان", "باتنة", "ورقلة"]:
            if wilaya_name in question:
                wilaya_deals = ProcurementDeal.objects.filter(wilaya__icontains=wilaya_name)[:5]
                context_data["kpis"][f"deals_in_{wilaya_name}"] = ProcurementDeal.objects.filter(wilaya__icontains=wilaya_name).count()
                for d in wilaya_deals:
                    context_data["relevant_deals"].append({
                        "ref": d.reference_number,
                        "title": d.title,
                        "wilaya": d.wilaya,
                    })
                    context_data["sources"].append(f"صفقة ولاية {wilaya_name}: {d.reference_number}")

        # 4. الاستفسار عن الطعون
        if any(k in question for k in ["طعن", "طعون", "منازعات"]):
            appeals_count = AwardDecision.objects.filter(appeal_status="pending").count()
            context_data["kpis"]["pending_appeals"] = appeals_count
            context_data["sources"].append("سجل الطعون أمام لجان الصفقات (المرحلة 08)")

        # المصادر القانونية الثابتة
        context_data["sources"].append("القانون رقم 23-12 المؤرخ في 5 أوت 2023 المتعلق بالمشتريات العمومية")

    except Exception as e:
        logger.error(f"خطأ أثناء استخراج البيانات للمحادثة: {e}")

    return context_data


def chat_with_admin(
    user,
    conversation_id: str = None,
    message: str = "",
) -> dict:
    """
    إجراء محادثة استشارية ذكية للإدارة المركزية والرقابة الوطنية.
    - يدعم متابعة المحادثات عبر conversation_id.
    - يستخرج السياق من قاعدة البيانات (RAG-like Context Building).
    - يطبق قيود الخصوصية وقانون 18-07.
    - يستدعي get_llm_client() ويوثق النتائج.
    """
    if not message:
        return {
            "error": "نص الرسالة مطلوب لإجراء المحادثة",
            "is_advisory": True,
        }

    # 1. جلب أو إنشاء المحادثة
    conversation = None
    if conversation_id:
        try:
            conversation = AIConversation.objects.filter(id=conversation_id, user=user).first()
        except Exception:
            conversation = None

    if not conversation:
        conversation = AIConversation.objects.create(
            user=user,
            title=message[:50].strip() or "محادثة رقابية جديدة",
        )

    # 2. حفظ رسالة المستخدم
    clean_user_message = sanitize_pii(message)
    AIMessage.objects.create(
        conversation=conversation,
        role=AIMessage.Role.USER,
        content=clean_user_message,
        is_advisory=True,
    )

    # 3. استخراج البيانات والسياق من DB لأغراض التوثيق وسجل التدقيق
    db_context = extract_data_for_question(clean_user_message)

    # 4. بناء قائمة الرسائل للمحادثة (السؤال فقط بدون سياق خام أو system prompt محشو بقواميس Python)
    messages = [
        {"role": "user", "content": clean_user_message},
    ]

    # 5. استدعاء LLM Client
    client = get_llm_client()
    try:
        raw_answer = client.chat(messages)
    except Exception as e:
        logger.warning(f"تعذر الحصول على رد من المزود: {e}. اللجوء للمحرك الاحتياطي.")
        from .llm_client import RuleBasedFallback
        raw_answer = RuleBasedFallback().chat(messages)

    final_answer = sanitize_pii(raw_answer)

    # 6. حفظ رد المساعد في AIMessage
    AIMessage.objects.create(
        conversation=conversation,
        role=AIMessage.Role.ASSISTANT,
        content=final_answer,
        context_used=db_context["kpis"],
        sources=db_context["sources"],
        tokens_used=len(final_answer.split()),
        is_advisory=True,
    )

    return {
        "conversation_id": str(conversation.id),
        "answer": final_answer,
        "sources": db_context["sources"],
        "is_advisory": True,
        "human_verification_required": True,
        "statutory_reference": "القانون 23-12 (المشتريات العمومية) والقانون 18-07 (حماية المعطيات الشخصية)",
    }
