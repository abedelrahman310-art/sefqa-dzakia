import os
import io
import re
import json
import logging
from datetime import timedelta
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from apps.procurements.models import CahierSpecs, ProcurementDeal
from apps.ai_gateway.models import AIConversation, AIMessage
from apps.ai_gateway.permissions import CanUseAILegalChat
from apps.ai_gateway.services.admin_assistant import sanitize_pii
from apps.ai_gateway.services.operator_assistant import analyze_tender_for_operator
from apps.ai_gateway.throttles import AIChatThrottle, AIInsightsThrottle, AIAnalyzeTenderThrottle

logger = logging.getLogger(__name__)


LEGAL_SYSTEM_PROMPT = """
أنت المستشار القانوني الذكي الرسمي لمنصة "صفقات ذكية" الجزائرية، خبير بالقانون رقم 23-12 المؤرخ في 5 أوت 2023 
المحدد للقواعد العامة المتعلقة بالصفقات العمومية والمرسوم الرئاسي رقم 15-247 المتعلق بتنظيم الصفقات العمومية وتفويضات المرفق العام.

قواعد الرد الإلزامية:
1. اذكر دائماً أرقام المواد القانونية المحددة في إجابتك واسم النص القانوني (مثال: "وفقاً للمادة 72 من القانون 23-12..." أو "بموجب المادة 125 من المرسوم الرئاسي 15-247...").
2. أجب باللغة العربية الرسمية الواضحة والمهنية، وقسّم الإجابة إلى خطوات أو نقاط عملية إجرائية.
3. حدد الآجال النظامية بدقة متناهية (مثال: مهلة الطعن 10 أيام، مدة صلاحية العروض، كفالة التعهد، إلخ).
4. اختم دائماً بتنبيه استشاري بأن الرأي إرشادي وتبقى المرجعية الرسمية للنصوص المنشورة في الجريدة الرسمية للجمهورية الجزائرية.
""".strip()


def call_openai_chat(messages, model=None, temperature=0.2, max_tokens=2000, json_mode=False):
    """
    استدعاء نموذج OpenAI أو DeepSeek عبر المتغيرات البيئية في .env
    """
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    deepseek_key = os.getenv("DEEPSEEK_API_KEY", "").strip()

    api_key = openai_key or deepseek_key
    if not api_key:
        return None

    base_url = None
    if deepseek_key and not openai_key:
        base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
        openai_model = model or os.getenv("DEEPSEEK_MODEL") or "deepseek-chat"
    else:
        base_url = os.getenv("OPENAI_BASE_URL", None)
        openai_model = model or os.getenv("OPENAI_MODEL") or os.getenv("LLM_MODEL") or "gpt-4o-mini"

    if openai_model.startswith("gemini"):
        openai_model = "gpt-4o-mini"

    try:
        import openai
        client = openai.OpenAI(api_key=api_key, base_url=base_url) if base_url else openai.OpenAI(api_key=api_key)
        kwargs = {
            "model": openai_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "timeout": 45.0,
        }
        if json_mode and ("gpt-4" in openai_model or "gpt-3.5" in openai_model or "deepseek" in openai_model):
            kwargs["response_format"] = {"type": "json_object"}

        completion = client.chat.completions.create(**kwargs)
        if completion and completion.choices:
            return completion.choices[0].message.content.strip()
    except Exception as e:
        logger.warning("فشل استدعاء LLM API: %s. سيتم التراجع للمحرك القانوني الداخلي.", e)

    return None


def extract_text_from_pdf(file_bytes, max_pages=30) -> tuple[str, int]:
    """
    استخراج النص من ملف PDF باستخدام مكتبة pypdf
    """
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        total_pages = len(reader.pages)
        pages_to_read = min(total_pages, max_pages)
        text_parts = []
        for idx in range(pages_to_read):
            page = reader.pages[idx]
            page_text = page.extract_text()
            if page_text:
                text_parts.append(f"--- صفحة {idx + 1} ---\n{page_text}")
        return "\n\n".join(text_parts), total_pages
    except Exception as e:
        logger.error("خطأ أثناء استخراج النص عبر pypdf: %s", e)
        raise ValueError(f"تعذر استخراج النص من ملف PDF بواسطة pypdf: {str(e)}")


def get_legal_fallback_response(question: str) -> str:
    """
    المحرك القانوني المحلي المتخصص في القانون 23-12 والمرسوم الرئاسي 15-247
    مع ذكر المواد القانونية الدقيقة.
    """
    q = question.lower()

    if any(w in q for w in ["طعن", "طعون", "اعتراض", "إلغاء الإسناد", "مظلمة"]):
        return (
            "وفقاً للمادة 72 من القانون رقم 23-12 والمادة 82 من ذات القانون، يحق لكل متعامل اقتصادي شارك في المنافسة "
            "ويحتج على قرار الإسناد المؤقت للصفقة أن يرفع طعناً إدارياً مسبقاً أمام لجنة الصفقات المختصة.\n\n"
            "📌 الأجل القانوني للإيداع: يودع الطعن في أجل أقصاه عشرة (10) أيام ابتداءً من تاريخ نشر إشعار الإسناد المؤقت للصفقة في النشرة الرسمية لصفقات المتعامل العمومي (BOMOP) أو في الصحف الوطنية.\n"
            "📌 الأثر الموقف: يترتب على رفع الطعن تعليق إجراءات توقيع الصفقة وتنفيذها إلى حين البت فيه.\n"
            "📌 أجل دراسة الطعن: يتعين على لجنة الصفقات البت في الطعن خلال أجل عشرة (10) أيام ابتداءً من تاريخ تبليغه.\n"
            "📌 الجهة القضائية: في حال رفض الطعن أو عدم الرد، يمكن اللجوء إلى المحكمة الإدارية المختصة وفق قانون الإجراءات المدنية والإدارية."
        )

    if any(w in q for w in ["كفالة", "ضمان", "تعهد", "حسن التنفيذ", "اقتطاع"]):
        return (
            "وفقاً لأحكام المواد 125 إلى 134 من المرسوم الرئاسي رقم 15-247 والمادة 74 من القانون 23-12، تلتزم المؤسسات "
            "بتقديم الضمانات المالية القانونية التالية:\n\n"
            "1. كفالة التعهد (المادة 125 من المرسوم 15-247): تفرض في طلبات العروض بنسبة تتراوح بين 1% و2% من مبلغ العرض لضمان جدية المتعهد وصلاحية عرضه.\n"
            "2. كفالة حسن التنفيذ (المادة 130 من المرسوم 15-247): بنسبة 5% إلى 10% من مبلغ الصفقة الأساسية لضمان إتمام الأشغال والمقتنيات طبقاً للشروط.\n"
            "3. كفالة الضمان (المادة 133 من المرسوم 15-247): تحل محل الاقتطاع المالي للضمان وتسترجع نهائياً عند رفع اليد بعد الاستلام النهائي."
        )

    if any(w in q for w in ["تأهيل", "تصنيف", "شهادة", "قدرات", "ملف الترشح", "سجل"]):
        return (
            "تنص المادة 54 من القانون 23-12 والمادة 51 من المرسوم الرئاسي 15-247 على شروط ومعايير تأهيل المتعهدين:\n\n"
            "1. شهادة التأهيل والتصنيف المهنيين: إلزامية في صفقات الأشغال ومحددة بالدرجة والنشاط الرئيسي والفرعي.\n"
            "2. السجل التجاري الإلكتروني: مطابق لموضوع الصفقة وصالح قانوناً.\n"
            "3. المراجع المهنية: إثبات إنجاز مشاريع مماثلة بشهادات حسن التنفيذ المسلمة من المصالح المتعاقدة.\n"
            "4. الملاءة المالية: تقديم الحسابات المالية المعتمدة للسنوات الثلاث الأخيرة ورقم الأعمال الأدنى المطلوب."
        )

    if any(w in q for w in ["آجال", "مهلة", "إشهار", "نشر", "تحضير العروض"]):
        return (
            "استناداً إلى المادتين 66 و67 من القانون 23-12، تحدد آجال تحضير العروض وفق درجة تعقيد الموضوع وحجم الصفقة:\n\n"
            "📌 الحد الأدنى لإيداع العروض: 15 يوماً في الاستشارات الإجرائية البسيطة، وما بين 30 إلى 45 يوماً في طلبات العروض المفتوحة.\n"
            "📌 وسيلة الإشهار الإلزامية: النشرة الرسمية لصفقات المتعامل العمومي (BOMOP) وجريدتان يوميتان وطنيتان إحداهما باللغة العربية.\n"
            "📌 تمديد الأجل: تملك المصلحة المتعاقدة صلاحية تمديد مهلة تحضير العروض إذا طلبت توضيحات أو أدخلت تعديلات جوهرية على دفتر الشروط."
        )

    if any(w in q for w in ["مراجعة", "تحيين", "أسعار", "تضخم", "مؤشر"]):
        return (
            "تنص المادة 97 من القانون 23-12 على قواعد مراجعة وتحيين أسعار الصفقات العمومية:\n\n"
            "1. صفقات بأسعار قابلة للمراجعة: تشمل الصفقات التي تتجاوز مدة إنجازها سنة وتخضع لتقلبات أسعار المواد الأولية.\n"
            "2. صيغة المراجعة: يجب إدراج الصيغة الرياضية لمراجعة الأسعار والمؤشرات الإحصائية المعتمدة في دفتر الشروط منذ البداية.\n"
            "3. تحيين الأسعار: يطبق عندما يفصل بين تاريخ فتح الأظرفة والأمر ببداية الأشغال أجل يفوق مدة صلاحية العروض."
        )

    if any(w in q for w in ["باطن", "تناول", "مناولة", "sous-traitance"]):
        return (
            "وفقاً للمادة 83 من القانون 23-12، يُسمح باللجوء إلى التناول من الباطن وفق الشروط التالية:\n\n"
            "1. ترخيص مسبق: الحصول على موافقة كتابية صريحة من المصلحة المتعاقدة على المناول وشروط العقد.\n"
            "2. عدم التنازل الكلي: لا يجوز أن يشمل التناول من الباطن موضوع الصفقة كلياً، ويشترط ألا يتعدى سقف 40% من مبلغ الصفقة.\n"
            "3. المسؤولية القانونية: يبقى الحائز على الصفقة هو المسؤول الحصري والمباشر تجاه المصلحة المتعاقدة عن التنفيذ."
        )

    if any(w in q for w in ["تراضي", "مباشر", "استعجال", "احتكار"]):
        return (
            "تحدد المادتان 41 و42 من القانون 23-12 الحالات الاستثنائية للجوء إلى إجراء التراضي (Gré à gré):\n\n"
            "1. التراضي البسيط (المادة 41 من القانون 23-12): في حالات الاحتكار التقني أو الفني المثبت، حالات الاستعجال الملح الناجم عن أزمة أو خطر وشيك، أو متطلبات الدفاع الوطني.\n"
            "2. التراضي بعد الاستشارة (المادة 42 من القانون 23-12): عند عدم جدوى طلب العروض للمرة الثانية، أو في صفقات الدراسات والأشغال التكميلية المبررة قانوناً."
        )

    return (
        "وفقاً لأحكام القانون رقم 23-12 المؤرخ في 5 أوت 2023 المحدد للقواعد العامة للصفقات العمومية والمرسوم الرئاسي 15-247:\n\n"
        "تخضع كافة الصفقات العمومية للمبادئ الجوهرية المنصوص عليها في المادة 5 من القانون 23-12، وهي:\n"
        "1. حرية الوصول إلى الطلب العمومي (المادة 5 من القانون 23-12).\n"
        "2. المساواة في معاملة المرشحين والمتعاملين الاقتصاديين.\n"
        "3. شفافية الإجراءات وتكافؤ الفرص.\n\n"
        "يرجى تحديد سؤالك القانوني (مثل: الطعون وأجل 10 أيام، كفالات التعهد وحسن التنفيذ، مراجعة الأسعار، شروط التأهيل والتصنيف) لنوافيك بالسند والمادة النظامية المباشرة."
    )


class AICheckComplianceView(APIView):
    """
    فحص الامتثال القانوني الاستشاري لدفتر الشروط أو العرض وفق القانون 23-12.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        tender_data = request.data.get('tender_data', {})
        submission_days = tender_data.get('submission_window_days', 15)
        deal_type = tender_data.get('deal_type', 'public_call')

        findings = []
        is_compliant_hint = True

        if deal_type == 'public_call' and submission_days < 15:
            findings.append({
                'rule': 'المادة 66 من القانون 23-12 المتعلقة بآجال تحضير العروض',
                'severity': 'warning',
                'message': 'الأجل المقترح لإيداع العروض يبدو أقل من الحد الأدنى المعمول به قانوناً (15 يوماً على الأقل).',
                'recommendation': 'يُوصى بمراجعة الأجل لمنح المتنافسين الوقت الكافي وضمان حرية الوصول والمساواة.'
            })
            is_compliant_hint = False

        if not tender_data.get('evaluation_criteria'):
            findings.append({
                'rule': 'المادة 71 من القانون 23-12 المتعلقة بشفافية معايير التقييم',
                'severity': 'warning',
                'message': 'دفتر الشروط يفتقر إلى معايير تنقيط موضوعية محددة مسبقاً للعرض التقني.',
                'recommendation': 'تحديد شبكة المعايير المرجحة وأوزانها بدقة قبل نشر الإعلان.'
            })
            is_compliant_hint = False

        return Response({
            'is_advisory': True,
            'statutory_reference': 'القانون 23-12 المؤرخ في 5 أوت 2023 المتعلق بالصفقات العمومية',
            'legal_disclaimer': 'هذا التحليل استرشادي تقني مؤتمت، وتبقى السلطة التقديرية الحصرية لمسؤولي المصلحة المتعاقدة ولجنة الصفقات.',
            'preliminary_compliance_check': is_compliant_hint,
            'advisory_notes': findings,
            'human_verification_required': True
        }, status=status.HTTP_200_OK)


class AISummarizeTenderView(APIView):
    """
    تلخيص استشاري لدفتر الشروط لمساعدة المتعاملين الاقتصاديين على فهم متطلبات المشاركة
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        deal_title = request.data.get('title', '')
        if not deal_title:
            return Response({'error': 'عنوان الصفقة مطلوب للتوليد'}, status=status.HTTP_400_BAD_REQUEST)

        summary_text = (
            f"ملخص استشاري للصفقة: {deal_title}. "
            f"يركز المشروع على تنفيذ الأعمال الموضحة في المتطلبات الإدارية والفنية. "
            f"يتوجب على المتعاملين تجهيز ملف الترشح، العرض التقني، والعرض المالي قبل انقضاء الأجل القانوني "
            f"استناداً إلى المادة 67 من القانون 23-12."
        )

        return Response({
            'is_advisory': True,
            'summary': summary_text,
            'human_verification_required': True,
            'statutory_reference': 'القانون 23-12'
        }, status=status.HTTP_200_OK)


class AILegalChatView(APIView):
    """
    POST /api/ai/legal-chat/
    استشارة قانونية ذكية في الصفقات العمومية الجزائرية بتقنية RAG (Retrieval-Augmented Generation).
    1. يحول سؤال المستخدم إلى Vector (Embedding).
    2. يبحث في قاعدة البيانات عن أقرب 3 مواد قانونية (Top-3 Similarity من القانون 23-12 والمرسوم 15-247).
    3. يرسل المواد مع السؤال للـ LLM (OpenAI/DeepSeek) مع أمر صارم: "أجب باستخدام النصوص المسترجعة فقط، واذكر رقم المادة".
    4. يعيد للمستخدم الإجابة + المواد القانونية التي استند إليها.
    """
    # تم ضبط الصلاحية لتشمل المتعامل والمصلحة المتعاقدة ومدير النظام مع استبعاد central_admin
    permission_classes = [permissions.IsAuthenticated, CanUseAILegalChat]
    throttle_classes = [AIChatThrottle]

    def post(self, request):
        # التحقق من الصلاحية يتم تلقائياً عبر CanUseAILegalChat (السماح لـ operator و authority و superuser)
        from apps.legal_rag.services.rag_service import normalize_rag_language

        requested_language = (
            request.data.get('language')
            or request.data.get('lang')
            or request.headers.get('Accept-Language', '')
        )
        language = normalize_rag_language(requested_language)

        user_question = (
            request.data.get('question')
            or request.data.get('message')
            or request.data.get('prompt')
            or ''
        ).strip()

        if not user_question:
            return Response(
                {
                    'error': (
                        'Veuillez saisir une question juridique.'
                        if language == 'fr'
                        else 'يرجى تقديم سؤال قانوني للاستشارة.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        clean_question = sanitize_pii(user_question)

        # 1. RAG Step: البحث الدلالي الشعاعي عن أقرب 3 مواد قانونية (Top 3 Similarity)
        from apps.legal_rag.services.rag_service import (
            search_top_articles,
            build_rag_system_prompt,
            build_rag_user_prompt,
            synthesize_local_rag_fallback,
            extract_mentioned_articles,
        )

        top_articles = search_top_articles(clean_question, top_k=3)

        # إدارة المحادثة والسياق
        conversation = None
        conversation_id = request.data.get('conversation_id')
        if conversation_id:
            try:
                conversation = AIConversation.objects.filter(id=conversation_id, user=request.user).first()
            except Exception:
                conversation = None

        if not conversation:
            conversation = AIConversation.objects.create(
                user=request.user,
                title=clean_question[:80] or "استشارة قانونية RAG",
            )

        AIMessage.objects.create(
            conversation=conversation,
            role=AIMessage.Role.USER,
            content=clean_question,
            is_advisory=True,
        )

        # 2. بناء رسائل LLM مع الأمر الصارم والمواد المسترجعة
        rag_system_prompt = build_rag_system_prompt(language)
        rag_user_prompt = build_rag_user_prompt(clean_question, top_articles, language)

        history_msgs = list(
            conversation.messages.order_by("created_at").values("role", "content")
        )[-6:]

        messages = [{"role": "system", "content": rag_system_prompt}]
        for item in history_msgs[:-1]:
            if item.get("content"):
                messages.append({"role": item["role"], "content": item["content"]})
        messages.append({"role": "user", "content": rag_user_prompt})

        # 3. الاستدعاء عبر LLM (OpenAI / DeepSeek)
        openai_key = os.getenv("OPENAI_API_KEY", "").strip()
        deepseek_key = os.getenv("DEEPSEEK_API_KEY", "").strip()
        openai_model = os.getenv("OPENAI_MODEL") or os.getenv("LLM_MODEL", "gpt-4o-mini")
        reply = None
        model_used = f"DeepSeek ({os.getenv('DEEPSEEK_MODEL', 'deepseek-chat')})" if (deepseek_key and not openai_key) else f"OpenAI ({openai_model})"

        if openai_key or deepseek_key:
            reply = call_openai_chat(messages, model=openai_model)

        # التراجع للمولد المحلي الذكي المستند حصراً للنصوص المسترجعة عند غياب المفاتيح أو فشل الاتصال
        if not reply:
            reply = synthesize_local_rag_fallback(clean_question, top_articles, language)
            model_used = "safaqat-legal-rag (pgvector + Law 23-12 & Decree 15-247)"

        final_reply = sanitize_pii(reply).strip()

        # 4. تجميع المواد القانونية المستند إليها
        retrieved_data = []
        legal_articles = []

        for art, score in top_articles:
            art_obj = {
                'id': str(art.id),
                'label': f"{art.article_number} - {art.law_source}",
                'article_number': art.article_number,
                'law_source': art.law_source,
                'law': art.law_source,
                'title': art.title or '',
                'content': art.content,
                'text': art.content,
                'similarity_score': score,
            }
            retrieved_data.append(art_obj)
            legal_articles.append(art_obj)

        if language == 'fr':
            sources = [
                "Loi n° 23-12 du 5 août 2023 fixant les règles générales des marchés publics",
                "Décret présidentiel n° 15-247 relatif à la réglementation des marchés publics et aux délégations de service public",
            ]
            statutory_reference = 'Loi 23-12 et décret présidentiel 15-247'
            disclaimer = (
                "Cet avis est automatisé et repose exclusivement sur les textes de la loi 23-12 "
                "et du décret présidentiel 15-247. Il relève de la compétence des commissions des "
                "marchés compétentes et de la commission de révision des marchés publics conformément "
                "à la loi 23-12."
            )
        else:
            sources = [
                "القانون رقم 23-12 المؤرخ في 5 أوت 2023 المحدد للقواعد العامة للصفقات العمومية",
                "المرسوم الرئاسي رقم 15-247 المتعلق بتنظيم الصفقات العمومية وتفويضات المرفق العام",
            ]
            statutory_reference = 'القانون 23-12 والمرسوم الرئاسي 15-247'
            disclaimer = (
                'هذه الاستشارة آلية مستندة حصراً إلى نصوص القانون 23-12 والمرسوم الرئاسي 15-247، '
                'وتخضع لسلطة لجان الصفقات المختصة ولجنة مراجعة الصفقات العمومية وفق القانون 23-12.'
            )

        AIMessage.objects.create(
            conversation=conversation,
            role=AIMessage.Role.ASSISTANT,
            content=final_reply,
            context_used={
                "model": model_used,
                "legal_articles": legal_articles,
                "retrieved_articles": retrieved_data,
            },
            sources=sources,
            tokens_used=len(final_reply.split()),
            is_advisory=True,
        )

        return Response({
            'reply': final_reply,
            'answer': final_reply,
            'question': user_question,
            'conversation_id': str(conversation.id),
            'sources': sources,
            'legal_articles': legal_articles,
            'retrieved_articles': retrieved_data,
            'model_used': model_used,
            'rag_enabled': True,
            'top_k': len(retrieved_data),
            'is_advisory': True,
            'no_answer': len(retrieved_data) == 0,
            'language': language,
            'human_verification_required': True,
            'statutory_reference': statutory_reference,
            'disclaimer': disclaimer
        }, status=status.HTTP_200_OK)


class AIAnalyzeTenderView(APIView):
    """
    POST /api/ai/analyze-tender/
    تحليل استشاري ذكي لدفتر الشروط أو وثيقة المناقصة/الصفقة.
    يستقبل ملف PDF (أو deal_id)، ويستخدم مكتبة pypdf لاستخراج النص،
    ثم يرسله إلى OpenAI لتلخيص أهم الشروط والمواعيد والضمانات.
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [AIAnalyzeTenderThrottle]

    def post(self, request):
        if getattr(request.user, 'role', None) != 'operator':
            return Response(
                {'detail': 'هذه الميزة مخصصة لحسابات المتعاملين الاقتصاديين.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        extracted_text = ""
        total_pages = 0
        deal_obj = None

        # 1. فحص إذا تم إرسال ملف PDF عبر طلب multipart/form-data
        uploaded_file = (
            request.FILES.get('file')
            or request.FILES.get('tender_pdf')
            or request.FILES.get('pdf')
            or request.FILES.get('document')
        )

        deal_id = request.data.get('deal_id') or request.query_params.get('deal_id')

        if uploaded_file:
            try:
                file_bytes = uploaded_file.read()
                pdf_text, pages_count = extract_text_from_pdf(file_bytes, max_pages=30)
                total_pages = pages_count
                extracted_text += pdf_text
            except Exception as e:
                logger.error("خطأ أثناء استخراج النص من PDF بواسطة pypdf: %s", e)
                return Response(
                    {'error': f'فشل في قراءة ملف PDF عبر مكتبة pypdf: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 2. فحص إذا تم إرسال deal_id
        if deal_id:
            try:
                deal_obj = ProcurementDeal.objects.filter(id=deal_id).first()
                if not deal_obj:
                    deal_obj = ProcurementDeal.objects.filter(reference_number=deal_id).first()
            except Exception as e:
                logger.debug("خطأ البحث عن الصفقة بالمعرف %s: %s", deal_id, e)

            if deal_obj:
                sector = getattr(deal_obj, 'sector', '') or 'غير محدد'
                budget = (
                    getattr(deal_obj, 'estimated_budget', None)
                    or getattr(deal_obj, 'budget_estimated', None)
                    or 'غير محددة'
                )
                deal_summary = (
                    f"بيانات الصفقة المرجعية:\n"
                    f"- المرجع: {deal_obj.reference_number}\n"
                    f"- العنوان: {deal_obj.title}\n"
                    f"- الموضوع والوصف: {deal_obj.description}\n"
                    f"- القطاع: {sector}\n"
                    f"- الولاية: {deal_obj.wilaya}\n"
                    f"- الميزانية التقديرية: {budget} دج\n"
                    f"- آخر أجل لإيداع العروض: {deal_obj.submission_deadline}\n"
                )
                if hasattr(deal_obj, 'cahier_specs') and deal_obj.cahier_specs:
                    cs = deal_obj.cahier_specs
                    deal_summary += f"- البنود الإدارية: {cs.administrative_clauses}\n"
                    deal_summary += f"- المواصفات التقنية: {cs.technical_requirements}\n"
                    deal_summary += f"- معايير التقييم: {cs.financial_criteria}\n"

                if not extracted_text:
                    extracted_text = deal_summary
                else:
                    extracted_text = deal_summary + "\n\nنص دفتر الشروط المستخرج عبر pypdf:\n" + extracted_text

        if not extracted_text.strip():
            return Response(
                {'error': 'يرجى تقديم ملف PDF لدفتر الشروط أو تحديد معرف الصفقة deal_id لتحليله.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. إرسال النص إلى OpenAI أو المحلل الذكي
        analysis_result = self._analyze_text(extracted_text, deal_obj)

        title = deal_obj.title if deal_obj else (uploaded_file.name if uploaded_file else 'وثيقة طلب العروض')
        ref = deal_obj.reference_number if deal_obj else 'DOC-PDF'

        payload = {
            'deal_id': str(deal_obj.id) if deal_obj else None,
            'deal_reference': ref,
            'deal_title': title,
            'total_pages_read': total_pages,
            'summary': analysis_result.get('summary', ''),
            'qualification_conditions': analysis_result.get('qualification_conditions', []),
            'deadlines': analysis_result.get('deadlines', []),
            'guarantees': analysis_result.get('guarantees', []),
            'evaluation_criteria': analysis_result.get('evaluation_criteria', []),
            'warnings': analysis_result.get('warnings', []),
            'model_used': analysis_result.get('model_used', 'rule_based'),
            'is_advisory': True,
            'human_verification_required': True,
            'statutory_reference': 'القانون 23-12 والمرسوم الرئاسي 15-247'
        }

        # توفير تحليل منظم إضافي للواجهة الحديثة مع الحفاظ على الحقول السابقة.
        if deal_obj:
            try:
                specs_obj = deal_obj.cahier_specs
            except CahierSpecs.DoesNotExist:
                specs_obj = None
            try:
                payload.update(analyze_tender_for_operator(deal_obj, specs_obj))
            except Exception:
                logger.exception(
                    'تعذر توليد التحليل المنظم لدفتر شروط الصفقة [%s]',
                    deal_obj.reference_number,
                )

        return Response(payload, status=status.HTTP_200_OK)

    def _analyze_text(self, text: str, deal_obj) -> dict:
        prompt = (
            "أنت خبير صفقات عمومية جزائرية ومحلل دفاتر الشروط وفق القانون 23-12 والمرسوم الرئاسي 15-247.\n"
            "تلتزم منصة «صفقات ذكية» بمبدأ 'صفر ورقة' (Zéro papier) التام: الإيداع رقمي حصراً عبر المنصة، "
            "والعرض المالي مشفر بتقنية AES-256 حتى موعد جلسة الفتح العلنية الرقمية، والوثائق الرسمية "
            "(السجل التجاري، NIF، شهادات الضرائب، CNAS، عدم الإفلاس) يتم التحقق منها آنياً عبر الربط البيني الحكومي المباشر. "
            "يُحظر تماماً نصح المتعامل بإعداد أظرفة ورقية أو ذكر عبارة 'ثلاثة أظرفة' أو ما شابه.\n"
            "قم بتحليل النص التالي المستخرج من دفتر الشروط بواسطة pypdf، واستخرج أهم الشروط والمواعيد.\n"
            "أعد النتيجة حصراً بصيغة JSON صالحة بالشكل التالي:\n"
            "{\n"
            '  "summary": "ملخص عام لدفتر الشروط وطبيعة المشروع وأهدافه",\n'
            '  "qualification_conditions": ["شرط التأهيل 1", "شرط 2"],\n'
            '  "deadlines": ["تاريخ آخر أجل لإيداع العروض", "مدة صلاحية العروض", "مدة الإنجاز"],\n'
            '  "guarantees": ["كفالة التعهد ومبلغها أو نسبتها", "كفالة حسن التنفيذ"],\n'
            '  "evaluation_criteria": ["معايير التقييم التقني والمالي وشبكة التنقيط"],\n'
            '  "warnings": ["تنبيهات رقمية للمتعامل لتجنب إقصاء عرضه وتأكيد الإيداع الرقمي والتشفير"],\n'
            '  "recommendations": ["توصيات منهجية للمتعامل للتحضير والإيداع الرقمي الناجح"]\n'
            "}\n\n"
            f"نص الوثيقة المستخرج:\n{text[:12000]}"
        )

        messages = [
            {
                "role": "system",
                "content": (
                    "أنت محلل دفاتر شروط ومستشار صفقات عمومية جزائرية لمنظومة «صفقات ذكية» الرقمية الوطنية.\n"
                    "تلتزم الصرامة التامة بمبدأ صفر ورقة (Zéro papier) والإيداع الرقمي المشفر AES-256 والتحقق البيني الحكومي.\n"
                    "يُمنع منعاً باتاً طلب أظرفة ورقية أو ذكر 'ثلاثة أظرفة'. تعيد الإجابة حصراً بصيغة JSON نظيفة."
                ),
            },
            {"role": "user", "content": prompt}
        ]

        raw_output = call_openai_chat(messages, json_mode=True)
        if raw_output:
            try:
                # استخراج كائن JSON حتى لو كان محاطاً بعلامات markdown
                json_str = raw_output
                if "```json" in json_str:
                    json_str = json_str.split("```json")[1].split("```")[0].strip()
                elif "```" in json_str:
                    json_str = json_str.split("```")[1].split("```")[0].strip()

                parsed = json.loads(json_str)
                openai_model = os.getenv("OPENAI_MODEL", os.getenv("LLM_MODEL", "gpt-4o-mini"))
                parsed["model_used"] = f"OpenAI ({openai_model})"
                return parsed
            except Exception as e:
                logger.warning("فشل معالجة JSON من رد OpenAI: %s", e)

        # التراجع للمحلل الهيكلي الداخلي
        return self._heuristic_analysis(text, deal_obj)

    def _heuristic_analysis(self, text: str, deal_obj) -> dict:
        title = deal_obj.title if deal_obj else "مشروع المناقصة"
        deadline_val = getattr(deal_obj, 'submission_deadline', None)
        deadline_str = str(deadline_val) if deadline_val else "حسب التاريخ والساعة المعلنين في BOMOP والصحف الوطنية"

        deadlines = [
            f"آخر أجل لإيداع العروض: {deadline_str}",
            "مدة صلاحية العروض: 90 يوماً زائد مدة تحضير العروض وفق المادة 68 من القانون 23-12",
            "جلسة فتح العروض الرقمية: تنعقد رقمياً عبر المنصة في نفس اليوم المحدد كآخر أجل لإيداع العروض في جلسة علنية (المادة 71 من القانون 23-12)",
        ]

        qualification_conditions = [
            "حيازة شهادة التأهيل والتصنيف المهنيين بالدرجة والنشاط المطابقين لموضوع الصفقة (المادة 54 من القانون 23-12)",
            "التحقق التلقائي من السجل التجاري وبطاقة التعريف الجبائي (NIF) يتم عبر الربط البيني للدولة — لا يُطلب رفعهما كملفات",
            "إثبات المراجع المهنية وشهادات حسن التنفيذ لمشاريع مماثلة منجزة خلال السنوات الأخيرة",
            "تقديم الحسابات المالية المعتمدة للسنوات الثلاث الأخيرة — أما مستخرجات الضرائب والضمان الاجتماعي فيتم التحقق منها بينياً",
        ]

        guarantees = [
            "كفالة التعهد (Caution de soumission): بنسبة لا تقل عن 1% من مبلغ العرض (المادة 125 من المرسوم 15-247)",
            "كفالة حسن التنفيذ (Caution de bonne exécution): بنسبة 5% إلى 10% من مبلغ الصفقة عند الفوز بالإسناد (المادة 130)",
            "كفالة الضمان: بنسبة 5% تحل محل اقتطاع الضمان عند الاستلام المؤقت (المادة 133 من المرسوم 15-247)",
        ]

        criteria = [
            "تقييم العرض التقني وفق شبكة تنقيط معتمدة وموضوعية مسبقة (المادة 71 من القانون 23-12)",
            "إقصاء العروض التي لم تبلغ الحد الأدنى التقني الإقصائي المنصوص عليه صراحة في دفتر الشروط",
            "اختيار العرض الأقل ثمناً من بين العروض التقنية المؤهلة أو العرض الأفضل اقتصادياً",
        ]

        warnings = [
            "مبدأ صفر ورقة: الإيداع رقمي بالكامل عبر المنصة، يُرفع الملف الإداري والعرض التقني منفصلين، ويُشفّر العرض المالي بـ AES-256 ولا يُفتح إلا في جلسة الفتح العلنية (بديل رقمي معتمد عن الأظرفة الورقية الثلاثة)",
            "أي نقص في وثيقة إلزامية غير قابلة للاستدراك ككفالة التعهد أو تصريح بالنزاهة يؤدي إلى الإقصاء التلقائي",
            "الالتزام بالساعة المحددة لآخر أجل، وترفض العروض المودعة بعد انقضاء المهلة قانوناً",
        ]

        recommendations = [
            "حمّل دفتر الشروط والإعلان واقرأهما كاملين قبل تجهيز العرض.",
            "أعد قائمة تحقق بالوثائق التي يجب رفعها رقمياً (كفالة التعهد، العرض التقني، العرض المالي) — الوثائق الحكومية تُتحقق تلقائياً.",
            "تحقق من قدراتك الفنية والمالية ومن متطلبات التأهيل قبل الالتزام بأي ضمان أو سعر.",
            "احسب التكلفة والهامش مع مراعاة مدة التنفيذ والضرائب والضمانات.",
            "أودع رقمياً عبر واجهة إيداع العروض قبل انقضاء الأجل واحتفظ بوصل الإيداع الرقمي.",
        ]

        summary = (
            f"تحليل استشاري مستخرج لدفتر الشروط المتعلق بـ: {title}. "
            "يتطلب المشروع امتثالاً شاملاً لمقتضيات القانون 23-12 والمرسوم 15-247، "
            "مع إيداع العروض رقمياً عبر المنصة وتشفير العرض المالي AES-256، وضمان كفالة التعهد قبل تاريخ الإيداع."
        )

        return {
            "summary": summary,
            "qualification_conditions": qualification_conditions,
            "deadlines": deadlines,
            "guarantees": guarantees,
            "evaluation_criteria": criteria,
            "warnings": warnings,
            "recommendations": recommendations,
            "model_used": "safaqat-smart-analyzer (pypdf + Law 23-12 rules)",
        }


# Aliases for backwards compatibility
OperatorLegalChatView = AILegalChatView
AnalyzeTenderView = AIAnalyzeTenderView
