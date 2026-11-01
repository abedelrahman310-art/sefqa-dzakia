import logging
from django.utils import timezone
from apps.procurements.models import ProcurementDeal
from apps.contracts.models import AwardDecision
from apps.ai_gateway.models import AIInsight

logger = logging.getLogger(__name__)


def generate_smart_alerts() -> dict:
    """
    توليد التنبيهات الذكية المصاحبة لمؤشرات الأداء الرئيسية (KPIs)
    للوحة تحكم الرقابة المركزية وبوابة المصلحة المتعاقدة.
    """
    now = timezone.now()

    # 1. حساب نسبة الامتثال الإجرائي
    total_deals = ProcurementDeal.objects.filter(current_stage__gte=2).count()
    if total_deals > 0:
        compliant_deals = ProcurementDeal.objects.filter(
            current_stage__gte=2,
            cahier_specs__is_validated=True,
        ).count()
        compliance_val = int((compliant_deals / total_deals) * 100)
    else:
        compliance_val = 100

    if compliance_val < 60:
        comp_alert = "critical"
        comp_msg = f"نسبة الامتثال منخفضة للغاية ({compliance_val}%)، تتطلب تدقيق دفاتر الشروط."
    elif compliance_val < 80:
        comp_alert = "high"
        comp_msg = f"نسبة الامتثال تبلغ {compliance_val}% مع وجود دفاتر شروط غير مؤشرة."
    elif compliance_val < 90:
        comp_alert = "medium"
        comp_msg = f"نسبة الامتثال مقبولة عند {compliance_val}%."
    else:
        comp_alert = "low"
        comp_msg = f"نسبة الامتثال الإجرائي ممتازة ({compliance_val}%)."

    # 2. حصر الطعون والمنازعات النشطة
    pending_objections = AwardDecision.objects.filter(appeal_status="pending").count()
    if pending_objections >= 5:
        obj_alert = "critical"
        obj_msg = f"{pending_objections} طعون نشطة تتطلب فحصاً عاجلاً للجان الصفقات."
    elif pending_objections >= 2:
        obj_alert = "high"
        obj_msg = f"{pending_objections} طعون قيد الدراسة أمام لجان الصفقات."
    elif pending_objections == 1:
        obj_alert = "medium"
        obj_msg = "طعن واحد قيد المعالجة الإدارية."
    else:
        obj_alert = "low"
        obj_msg = "لا توجد طعون عالقة حالياً."

    # 3. الصفقات الحرجة التي تتضمن شبهات أو مخالفات خطيرة
    critical_insights_count = AIInsight.objects.filter(
        severity__in=["critical", "high"],
        is_resolved=False,
    ).count()

    if critical_insights_count >= 3:
        crit_alert = "critical"
        crit_msg = f"{critical_insights_count} صفقات وتنبيهات تصنف عالية الخطورة وتحتاج تدخلاً رقابياً."
    elif critical_insights_count >= 1:
        crit_alert = "high"
        crit_msg = f"{critical_insights_count} صفقات مسجلة تحت المراقبة الرقابية المشددة."
    else:
        crit_alert = "low"
        crit_msg = "لا توجد صفقات بحالة حرجة حالياً."

    # 4. الصفقات المتأخرة عن الآجال القانونية
    delayed_count = ProcurementDeal.objects.filter(
        submission_deadline__lt=now,
        current_stage__in=[3, 4, 5],
    ).count()

    if delayed_count >= 5:
        delay_alert = "high"
        delay_msg = f"{delayed_count} صفقات تجاوزت مهلة فتح الأظرفة."
    elif delayed_count >= 1:
        delay_alert = "medium"
        delay_msg = f"{delayed_count} صفقات متأخرة جزئياً عن الجدول الزمني."
    else:
        delay_alert = "low"
        delay_msg = "جميع الصفقات تسير ضمن الآجال المحددة."

    return {
        "compliance_rate": {
            "value": compliance_val,
            "alert": comp_alert,
            "trend": -3 if compliance_val < 80 else 2,
            "message": comp_msg,
        },
        "objections": {
            "value": pending_objections,
            "alert": obj_alert,
            "message": obj_msg,
        },
        "critical_tenders": {
            "value": critical_insights_count,
            "alert": crit_alert,
            "message": crit_msg,
        },
        "delayed_tenders": {
            "value": delayed_count,
            "alert": delay_alert,
            "message": delay_msg,
        },
    }
