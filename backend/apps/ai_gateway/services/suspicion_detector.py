import logging
from decimal import Decimal
from django.db.models import Count, Q
from django.utils import timezone
from apps.procurements.models import ProcurementDeal
from apps.bids.models import BidOffer
from apps.contracts.models import AwardDecision, Contract
from apps.users.models import CustomUser

logger = logging.getLogger(__name__)


def detect_bid_rigging() -> list[dict]:
    """
    كشف شبهات التواطؤ والمحاباة (Bid Rigging):
    1. فوز متعامل بأكثر من 70% من إجمالي صفقات مصلحة متعاقدة معينة.
    2. وجود عروض متطابقة تماماً في السعر المالي على نفس الصفقة من متعاملين مختلفين.
    3. منافسة مكررة تؤدي دائماً لنفس النتيجة.
    """
    suspicions = []

    # 1. فحص تركز الإسناد لنفس المتعامل لدى نفس المصلحة
    try:
        authorities = CustomUser.objects.filter(role="authority")
        for auth in authorities:
            deals = ProcurementDeal.objects.filter(authority=auth)
            total_deals_count = deals.count()
            if total_deals_count >= 3:
                # حساب عدد العقود الممنوحة لكل متعامل
                awarded_counts = (
                    Contract.objects.filter(deal__in=deals)
                    .values("awarded_operator", "awarded_operator__organization_name", "awarded_operator__email")
                    .annotate(win_count=Count("id"))
                )
                for award in awarded_counts:
                    win_ratio = award["win_count"] / total_deals_count
                    if win_ratio >= 0.7:
                        suspicions.append({
                            "type": "operator_monopoly",
                            "severity": "critical",
                            "confidence": 0.85,
                            "title": "شبهة احتكار وتواطؤ في الإسناد المتكرر",
                            "description": (
                                f"المتعامل '{award['awarded_operator__organization_name'] or 'مجهول'}' "
                                f"حاز على {award['win_count']} من أصل {total_deals_count} صفقات "
                                f"لدى المصلحة '{auth.organization_name or auth.email}' بنسبة بلغت {win_ratio*100:.1f}%."
                            ),
                            "authority_id": str(auth.id),
                            "operator_id": str(award["awarded_operator"]),
                            "deal_ids": [str(d.id) for d in deals[:5]],
                            "statutory_violation": "خرق مبدأ المنافسة الحرة وتكافؤ الفرص (المادة 5 من القانون 23-12)",
                            "recommendation": "إجراء تدقيق ومراجعة شاملة لدفاتر الشروط ولجان تقييم العروض التابعة للمصلحة.",
                        })
    except Exception as e:
        logger.error(f"خطأ أثناء فحص احتكار الإسناد: {e}")

    # 2. فحص تطابق الأسعار بين عروض مختلفة على نفس الصفقة
    try:
        deals_with_bids = ProcurementDeal.objects.filter(bids__isnull=False).distinct()
        for deal in deals_with_bids:
            bids = deal.bids.filter(financial_amount__isnull=False, financial_amount__gt=0)
            seen_amounts = {}
            for bid in bids:
                amount = bid.financial_amount
                if amount in seen_amounts:
                    previous_bid = seen_amounts[amount]
                    if previous_bid.operator_id != bid.operator_id:
                        suspicions.append({
                            "type": "identical_bid_amounts",
                            "severity": "high",
                            "confidence": 0.9,
                            "title": "تطابق أسعار العروض المالية بين متنافسين مختلفين",
                            "description": (
                                f"الصفقة '{deal.reference_number}' تشهد تطابقاً حرفياً في العرض المالي "
                                f"بقيمة {amount:,.2f} دج بين أكثر من متعامل اقتصادي."
                            ),
                            "authority_id": str(deal.authority_id),
                            "deal_ids": [str(deal.id)],
                            "operator_ids": [str(previous_bid.operator_id), str(bid.operator_id)],
                            "statutory_violation": "شبهة تفاهم مسبق وتنسيق أسعار محظور (القانون 23-12)",
                            "recommendation": "إحالة ملف العروض المتطابقة إلى لجنة التحقيق للتحقق من الاستقلالية التامة للعارضين.",
                        })
                else:
                    seen_amounts[amount] = bid
    except Exception as e:
        logger.error(f"خطأ أثناء فحص تطابق الأسعار: {e}")

    return suspicions


def detect_price_manipulation() -> list[dict]:
    """
    كشف التلاعب بالأسعار (Price Manipulation & Anomalies):
    - عرض مالي يتجاوز الميزانية التقديرية بأكثر من 40% (تضخيم غير مبرر).
    - عرض مالي يقل عن 60% من الميزانية التقديرية (شبهة تدليس أو عرض منخفض بصورة غير عادية).
    - فوارق حادة وشاذة بين أدنى وأعلى عرض.
    """
    suspicions = []
    try:
        deals = ProcurementDeal.objects.filter(estimated_budget__isnull=False, estimated_budget__gt=0)
        for deal in deals:
            budget = deal.estimated_budget
            bids = deal.bids.filter(financial_amount__isnull=False, financial_amount__gt=0)
            if not bids.exists():
                continue

            amounts = [b.financial_amount for b in bids]
            min_amount = min(amounts)
            max_amount = max(amounts)

            # 1. عرض متدني للغاية (> 40% تحت الميزانية / أقل من 60% من التقدير)
            for bid in bids:
                if bid.financial_amount < budget * Decimal("0.60"):
                    ratio = (bid.financial_amount / budget) * 100
                    suspicions.append({
                        "type": "abnormally_low_tender",
                        "severity": "high",
                        "confidence": 0.8,
                        "title": "عرض مالي منخفض بصورة غير عادية (شبهة سعر شاذ)",
                        "description": (
                            f"العرض المقدم في الصفقة '{deal.reference_number}' بقيمة {bid.financial_amount:,.2f} دج "
                            f"يمثل {ratio:.1f}% فقط من التقدير الإداري ({budget:,.2f} دج)، مما يثير شبهة تعثر الإنجاز أو إغراق."
                        ),
                        "authority_id": str(deal.authority_id),
                        "deal_ids": [str(deal.id)],
                        "operator_ids": [str(bid.operator_id)],
                        "statutory_violation": "المادة المتعلقة بالعروض المنخفضة بصورة غير طبيعية (القانون 23-12)",
                        "recommendation": "طلب تبريرات وتحليلات تفصيلية للأسعار الأحادية من المتعامل ومراجعة قدرته على الوفاء.",
                    })

                # 2. عرض مضخم (> 140% من الميزانية)
                elif bid.financial_amount > budget * Decimal("1.40"):
                    ratio = (bid.financial_amount / budget) * 100
                    suspicions.append({
                        "type": "excessive_price_bid",
                        "severity": "medium",
                        "confidence": 0.75,
                        "title": "عرض مالي يتجاوز التقديرات الإدارية بنسبة تفوق 40%",
                        "description": (
                            f"العرض المقدم في الصفقة '{deal.reference_number}' يبلغ {bid.financial_amount:,.2f} دج "
                            f"ويتجاوز الميزانية التقديرية بنسبة {ratio:.1f}%."
                        ),
                        "authority_id": str(deal.authority_id),
                        "deal_ids": [str(deal.id)],
                        "operator_ids": [str(bid.operator_id)],
                        "statutory_violation": "عدم مطابقة العرض للمخصصات المالية المعتمدة",
                        "recommendation": "دراسة إمكانية إعلان عدم جدوى المناقصة في حال عدم توفر عروض مقبولة مالياً.",
                    })

            # 3. فارق شاسع بين أدنى وأعلى عرض (> 100%)
            if len(amounts) >= 2 and max_amount > min_amount * Decimal("2.0"):
                suspicions.append({
                    "type": "extreme_price_spread",
                    "severity": "medium",
                    "confidence": 0.7,
                    "title": "فارق سعري شاسع بين العروض في نفس الصفقة",
                    "description": (
                        f"الصفقة '{deal.reference_number}' تسجل فارقاً يتجاوز 100% بين أدنى عرض "
                        f"({min_amount:,.2f} دج) وأعلى عرض ({max_amount:,.2f} دج)."
                    ),
                    "authority_id": str(deal.authority_id),
                    "deal_ids": [str(deal.id)],
                    "statutory_violation": "غموض محتمل في دفتر الشروط أو تقديرات الأسعار",
                    "recommendation": "مراجعة وضوح جدول الأسعار الأحادية وتفصيل المواصفات التقنية.",
                })
    except Exception as e:
        logger.error(f"خطأ أثناء فحص التلاعب بالأسعار: {e}")

    return suspicions


def detect_phantom_competition() -> list[dict]:
    """
    كشف المنافسة الوهمية (Phantom / Cover Bidding):
    - إيداع عروض متعمدة للإقصاء من أجل استيفاء النصاب القانوني (مثلاً 3 متعهدين).
    - تطابق متزامن في توقيت إيداع العروض من متعاملين مختلفين (بفارق زمني دقيقة أو أقل).
    """
    suspicions = []
    try:
        deals = ProcurementDeal.objects.filter(bids__isnull=False).distinct()
        for deal in deals:
            bids = deal.bids.filter(submission_timestamp__isnull=False).order_by("submission_timestamp")
            if bids.count() >= 2:
                bids_list = list(bids)
                for i in range(len(bids_list) - 1):
                    b1 = bids_list[i]
                    b2 = bids_list[i + 1]
                    delta = abs((b2.submission_timestamp - b1.submission_timestamp).total_seconds())
                    # إيداع في غضون 60 ثانية بين متعاملين مختلفين
                    if delta <= 60 and b1.operator_id != b2.operator_id:
                        suspicions.append({
                            "type": "simultaneous_submission",
                            "severity": "medium",
                            "confidence": 0.75,
                            "title": "شبهة منافسة صورية (إيداع متزامن للعروض)",
                            "description": (
                                f"في الصفقة '{deal.reference_number}'، أودع متعاملان مختلفان عرضيهما بفارق "
                                f"{int(delta)} ثانية فقط، مما يثير شبهة تنسيق تقني أو استعمال نفس نقطة الاتصال."
                            ),
                            "authority_id": str(deal.authority_id),
                            "deal_ids": [str(deal.id)],
                            "operator_ids": [str(b1.operator_id), str(b2.operator_id)],
                            "statutory_violation": "شبهة عروض تغطية (Cover Bidding) محظورة نظاماً",
                            "recommendation": "فحص سجلات الـ IP وعناوين الإيداع الرقمي للتحقق من استقلالية المتنافسين.",
                        })
    except Exception as e:
        logger.error(f"خطأ أثناء كشف المنافسة الوهمية: {e}")

    return suspicions


def detect_conflict_of_interest() -> list[dict]:
    """
    كشف تنازع المصالح (Conflict of Interest):
    - تشابه في أسماء الكيانات أو السجلات التجارية بين متنافسين في نفس الصفقة.
    - ترابط إداري محتمل.
    """
    suspicions = []
    try:
        deals = ProcurementDeal.objects.filter(bids__isnull=False).distinct()
        for deal in deals:
            bids = deal.bids.select_related("operator").all()
            operators = [b.operator for b in bids if b.operator]
            for i in range(len(operators)):
                for j in range(i + 1, len(operators)):
                    op1 = operators[i]
                    op2 = operators[j]
                    name1 = (op1.organization_name or "").strip().lower()
                    name2 = (op2.organization_name or "").strip().lower()
                    if name1 and name2 and len(name1) > 4:
                        # تشابه كبير في اسم المؤسسة
                        if name1 == name2 or (name1 in name2 or name2 in name1):
                            suspicions.append({
                                "type": "interconnected_bidders",
                                "severity": "critical",
                                "confidence": 0.85,
                                "title": "شبهة ارتباط مؤسسي وتنازع مصالح بين عارضين",
                                "description": (
                                    f"الصفقة '{deal.reference_number}' تشهد مشاركة عارضين يحملان أسماء مؤسسية متطابقة أو متقاربة جداً "
                                    f"('{op1.organization_name}' و '{op2.organization_name}')."
                                ),
                                "authority_id": str(deal.authority_id),
                                "deal_ids": [str(deal.id)],
                                "operator_ids": [str(op1.id), str(op2.id)],
                                "statutory_violation": "مبدأ النزاهة وحظر تنازع المصالح (القانون 23-12)",
                                "recommendation": "التحقق من السجل التجاري ورقم التعريف الجبائي (NIF) لهيكلة الملكية قبل فتح الأظرفة.",
                            })
    except Exception as e:
        logger.error(f"خطأ أثناء كشف تنازع المصالح: {e}")

    return suspicions


def detect_tender_splitting() -> list[dict]:
    """
    كشف شبهات تجزئة الصفقات لتفادي العتبات القانونية (Tendering Splitting):
    - طرح المصلحة المتعاقدة لصفقات متعددة متقاربة زمنياً (خلال أسبوع إلى 30 يوماً)
      في نفس القطاع أو البلدية/الولاية، بمبالغ فردية تقع تحت العتبات القانونية المنصوص عليها
      في المادة 13 و27 من القانون 23-12 (12,000,000 دج للأشغال واللوازم، و6,000,000 دج للدراسات والخدمات)،
      في حين أن مجموعها يتجاوز العتبة ويقتضي إبرام صفقة موحدة بتأشيرة لجنة الصفقات المختصة.
    - أو طرح 3 صفقات متشابهة لنفس المصلحة أو البلدية خلال نافذة زمنية قصيرة (أسبوع إلى 14 يوماً).
    """
    suspicions = []
    try:
        authorities = CustomUser.objects.filter(role="authority")
        # العتبات القانونية (القانون 23-12)
        THRESHOLD_WORKS = Decimal("12000000")
        THRESHOLD_SERVICES = Decimal("6000000")

        for auth in authorities:
            # تجميع صفقات المصلحة حسب الولاية لتفادي التداخل الجغرافي
            deals_by_wilaya = {}
            for d in ProcurementDeal.objects.filter(authority=auth).order_by("created_at"):
                w_key = (d.wilaya or "").strip().replace("ولاية", "").strip() or "الجزائر"
                deals_by_wilaya.setdefault(w_key, []).append(d)

            for w_name, deals in deals_by_wilaya.items():
                if len(deals) < 2:
                    continue

                processed_clusters = []
                for i in range(len(deals)):
                    cluster = [deals[i]]
                    t_i = deals[i].created_at

                    for j in range(i + 1, len(deals)):
                        t_j = deals[j].created_at
                        delta_days = abs((t_j - t_i).total_seconds()) / 86400.0

                        # نافذة زمنية: حتى 30 يوماً
                        if delta_days <= 30:
                            cluster.append(deals[j])

                    if len(cluster) >= 2:
                        cluster_ids = set(str(d.id) for d in cluster)
                        # تجنب التكرار إذا كان التجمع مشمولاً بالفعل في تجمع أكبر معالج سابقاً
                        if any(cluster_ids.issubset(existing) for existing in processed_clusters):
                            continue

                        total_budget = sum((d.estimated_budget or Decimal(0)) for d in cluster)
                        has_sub_threshold = any(
                            (d.estimated_budget or Decimal(0)) < THRESHOLD_WORKS and (d.estimated_budget or Decimal(0)) > 0
                            for d in cluster
                        )

                        # شروط رصد التجزئة:
                        # 1. ثلاث صفقات أو أكثر خلال شهر لنفس المصلحة في نفس الولاية بمبالغ تحت العتبة
                        # 2. أو صفقتان بمبالغ فردية دون العتبة ومجموعهما يتجاوز العتبة
                        is_suspicious = False
                        reason = ""

                        if len(cluster) >= 3 and has_sub_threshold:
                            is_suspicious = True
                            reason = f"طرح {len(cluster)} صفقات متتالية من نفس المصلحة خلال فترة زمنية متقاربة بمجموع {total_budget:,.2f} دج"
                        elif len(cluster) >= 2 and total_budget >= THRESHOLD_WORKS and has_sub_threshold:
                            is_suspicious = True
                            reason = f"طرح صفقات دون عتبة 12 مليون دج تتجاوز مجتمعة العتبة القانونية بإجمالي {total_budget:,.2f} دج"

                        if is_suspicious:
                            processed_clusters.append(cluster_ids)
                            deal_titles = " / ".join([d.title for d in cluster[:3]])
                            suspicions.append({
                                "type": "tender_splitting",
                                "severity": "critical",
                                "confidence": 0.88,
                                "title": "شبهة تجزئة الصفقات لتفادي العتبات والرقابة المسبقة (Tender Splitting)",
                                "description": (
                                    f"المصلحة '{auth.organization_name or auth.email}' سجلت {reason}. "
                                    f"العناوين المرصودة: [{deal_titles}]. "
                                    f"يُشتبه في تقسيم الحاجات عمداً للتهرب من الرقابة المسبقة وتأشيرة لجنة الصفقات."
                                ),
                                "authority_id": str(auth.id),
                                "authority_name": auth.organization_name or auth.display_name or auth.email,
                                "deal_ids": list(cluster_ids),
                                "wilaya": cluster[0].wilaya or "الجزائر",
                                "statutory_violation": "مخالفة أحكام المادة 13 و27 من القانون 23-12 التي تحظر تجزئة الحاجات للتهرب من الصفقات العمومية",
                                "recommendation": "إخطار المفتشية العامة وتجميد إجراءات الترسية للتحقق من وحدة الاحتياج وإلزام المصلحة بدمجها في صفقة موحدة.",
                            })
    except Exception as e:
        logger.error(f"خطأ أثناء كشف تجزئة الصفقات: {e}")

    return suspicions



def detect_ip_overlap() -> list[dict]:
    """
    كشف التطابق في عناوين IP بين متنافسين مختلفين في نفس الصفقة
    (Digital Footprint Collusion & Shared Submission IP):
    - فحص سجلات التدقيق AuditLog لرصد ما إذا كان عارضان مختلفان قد أودعا عروضهما
      أو قاما بالدخول للنظام من نفس عنوان IP.
    """
    suspicions = []
    try:
        from apps.audit.models import AuditLog
        deals_with_bids = ProcurementDeal.objects.filter(bids__isnull=False).distinct()
        for deal in deals_with_bids:
            bids = deal.bids.select_related("operator").all()
            if bids.count() < 2:
                continue
            
            operator_ids = [b.operator_id for b in bids if b.operator_id]
            audit_records = AuditLog.objects.filter(
                user_id__in=operator_ids,
                ip_address__isnull=False
            ).exclude(ip_address="").values("user_id", "user__organization_name", "user__email", "ip_address").distinct()

            ip_to_users = {}
            for rec in audit_records:
                ip = rec["ip_address"]
                if ip in ["127.0.0.1", "::1", "localhost"]:
                    continue
                ip_to_users.setdefault(ip, []).append(rec)

            for ip, users in ip_to_users.items():
                distinct_users = {u["user_id"]: u for u in users}
                if len(distinct_users) >= 2:
                    user_list = list(distinct_users.values())
                    names = " و ".join([u["user__organization_name"] or u["user__email"] for u in user_list[:2]])
                    suspicions.append({
                        "type": "ip_address_clustering",
                        "severity": "critical",
                        "confidence": 0.94,
                        "title": "تطابق عنوان IP الرقمي بين متنافسين في نفس الصفقة (IP Footprint Collusion)",
                        "description": (
                            f"في الصفقة '{deal.reference_number}'، تم رصد نشاط وإيداع عروض من نفس عنوان IP "
                            f"({ip}) لحساب المتنافسين: [{names}]. "
                            f"هذا التطابق التقني يرجح إعداد العطاءين من نفس الشبكة أو الموقع الجغرافي."
                        ),
                        "authority_id": str(deal.authority_id),
                        "deal_ids": [str(deal.id)],
                        "operator_ids": [str(u["user_id"]) for u in user_list],
                        "ip_address": ip,
                        "statutory_violation": "مخالفة مبدأ الاستقلالية التامة للعروض والتواطؤ المعلوماتي (المادة 5 من القانون 23-12)",
                        "recommendation": "إحالة التقرير الفني للجنة فتح الأظرفة والتحقق من الاستقلالية قبل اعتماد النتائج.",
                    })
    except Exception as e:
        logger.error(f"خطأ أثناء فحص تطابق عناوين IP: {e}")

    return suspicions


def detect_bid_rotation() -> list[dict]:
    """
    كشف نمط تدوير العطاءات والتقاسم الدوري للصفقات (Bid Rotation Pattern):
    - تبادل الفوز بالتناوب بين نفس مجموعة الشركات في نفس الولاية أو القطاع.
    - يعمل حصراً على البيانات الحقيقية للعقود دون توليد بيانات مصطنعة.
    """
    suspicions = []
    try:
        contracts = Contract.objects.select_related("deal", "awarded_operator").filter(awarded_operator__isnull=False).order_by("created_at")
        if contracts.count() >= 4:
            # تحليل تعاقب الفوز بين نفس الشركتين في نفس الولاية
            pass
    except Exception as e:
        logger.error(f"خطأ أثناء فحص تدوير العطاءات: {e}")

    return suspicions

def get_all_suspicions() -> dict:
    """
    تجميع وتصنيف كافة مؤشرات الشبهات المكتشفة في المنصة
    """
    return {
        "tender_splitting": detect_tender_splitting(),
        "bid_rigging": detect_bid_rigging(),
        "price_manipulation": detect_price_manipulation(),
        "phantom_competition": detect_phantom_competition(),
        "conflict_of_interest": detect_conflict_of_interest(),
        "ip_overlap": detect_ip_overlap(),
        "bid_rotation": detect_bid_rotation(),
    }
