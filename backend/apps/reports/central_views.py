import uuid
import logging
from decimal import Decimal
from django.db.models import Count, Sum, Q
from django.utils import timezone
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import BasePermission
from rest_framework import status

from apps.procurements.models import ProcurementDeal, CahierSpecs, OpeningSession
from apps.bids.models import BidOffer
from apps.contracts.models import Contract
from apps.users.models import CustomUser
from apps.audit.models import AuditLog
from apps.ai_gateway.models import AIInsight
from apps.ai_gateway.services.suspicion_detector import get_all_suspicions
from .pdf_generator import generate_central_report_pdf

logger = logging.getLogger(__name__)


# ─── صلاحيات الإدارة المركزية والرقابة الوطنية ────────────────────────────
class IsCentralAdminUser(BasePermission):
    """
    التحقق من أن المستخدم مسجل الدخول ويحمل دور الإدارة المركزية (central_admin)
    أو مشرف النظام العام (is_superuser).
    """
    message = "الوصول مقتصر حصرياً على حسابات الإدارة المركزية والرقابة الوطنية (central_admin)."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                getattr(request.user, "role", None) == "central_admin"
                or request.user.is_superuser
            )
        )


# خريطة الولايات الجزائرية للربط المعياري (الرمز، الاسم العربي، الاسم الفرنسي)
ALGERIA_WILAYAS_CATALOG = {
    "01": ("أدرار", "Adrar"),
    "02": ("الشلف", "Chlef"),
    "03": ("الأغواط", "Laghouat"),
    "04": ("أم البواقي", "Oum El Bouaghi"),
    "05": ("باتنة", "Batna"),
    "06": ("بجاية", "Béjaïa"),
    "07": ("بسكرة", "Biskra"),
    "08": ("بشار", "Béchar"),
    "09": ("البليدة", "Blida"),
    "10": ("البويرة", "Bouira"),
    "11": ("تمنراست", "Tamanrasset"),
    "12": ("تبسة", "Tébessa"),
    "13": ("تلمسان", "Tlemcen"),
    "14": ("تيارت", "Tiaret"),
    "15": ("تيزي وزو", "Tizi Ouzou"),
    "16": ("الجزائر", "Alger"),
    "17": ("الجلفة", "Djelfa"),
    "18": ("جيجل", "Jijel"),
    "19": ("سطيف", "Sétif"),
    "20": ("سعيدة", "Saïda"),
    "21": ("سكيكدة", "Skikda"),
    "22": ("سيدي بلعباس", "Sidi Bel Abbès"),
    "23": ("عنابة", "Annaba"),
    "24": ("قالمة", "Guelma"),
    "25": ("قسنطينة", "Constantine"),
    "26": ("المدية", "Médéa"),
    "27": ("مستغانم", "Mostaganem"),
    "28": ("المسيلة", "M'Sila"),
    "29": ("معسكر", "Mascara"),
    "30": ("ورقلة", "Ouargla"),
    "31": ("وهران", "Oran"),
    "32": ("البيض", "El Bayadh"),
    "33": ("إليزي", "Illizi"),
    "34": ("برج بوعريريج", "Bordj Bou Arreridj"),
    "35": ("بومرداس", "Boumerdès"),
    "36": ("الطارف", "El Tarf"),
    "37": ("تندوف", "Tindouf"),
    "38": ("تيسمسيلت", "Tissemsilt"),
    "39": ("الوادي", "El Oued"),
    "40": ("خنشلة", "Khenchela"),
    "41": ("سوق أهراس", "Souk Ahras"),
    "42": ("تيبازة", "Tipaza"),
    "43": ("ميلة", "Mila"),
    "44": ("عين الدفلى", "Aïn Defla"),
    "45": ("النعامة", "Naâma"),
    "46": ("عين تموشنت", "Aïn Témouchent"),
    "47": ("غرداية", "Ghardaïa"),
    "48": ("غليزان", "Relizane"),
    "49": ("تيميمون", "Timimoun"),
    "50": ("برج باجي مختار", "Bordj Badji Mokhtar"),
    "51": ("أولاد جلال", "Ouled Djellal"),
    "52": ("بني عباس", "Béni Abbès"),
    "53": ("إن صالح", "In Salah"),
    "54": ("إن قزام", "In Guezzam"),
    "55": ("تقرت", "Touggourt"),
    "56": ("جانت", "Djanet"),
    "57": ("المغير", "El M'Ghair"),
    "58": ("المنيعة", "El Meniaa"),
    "59": ("أفلو", "Aflou"),
    "60": ("بريكة", "Barika"),
    "61": ("القنطرة", "El Kantara"),
    "62": ("بئر العاتر", "Bir El Ater"),
    "63": ("العريشة", "El Aricha"),
    "64": ("قصر الشلالة", "Ksar Chellala"),
    "65": ("عين وسارة", "Aïn Oussara"),
    "66": ("مسعد", "Messaad"),
    "67": ("قصر البخاري", "Ksar El Boukhari"),
    "68": ("بوسعادة", "Bou Saâda"),
    "69": ("الأبيض سيدي الشيخ", "El Abiodh Sidi Cheikh"),
}

# فهرس بحث بالاسم العربي المعياري
WILAYA_NAME_TO_CODE = {
    ar: code for code, (ar, _) in ALGERIA_WILAYAS_CATALOG.items()
}


def normalize_wilaya(raw_value: str):
    """استخراج كود واسم الولاية بدقة من النص المدخل"""
    val = (raw_value or "").strip()
    clean = val.replace("ولاية", "").strip()
    if not clean:
        return "16", "الجزائر", "Alger"

    # بحث بالرمز مباشرة (مثلاً "16" أو "06")
    padded = clean.zfill(2)
    if padded in ALGERIA_WILAYAS_CATALOG:
        ar, fr = ALGERIA_WILAYAS_CATALOG[padded]
        return padded, ar, fr

    # بحث بالاسم العربي
    if clean in WILAYA_NAME_TO_CODE:
        code = WILAYA_NAME_TO_CODE[clean]
        ar, fr = ALGERIA_WILAYAS_CATALOG[code]
        return code, ar, fr

    # بحث تقريبي بالاسم
    for code, (ar, fr) in ALGERIA_WILAYAS_CATALOG.items():
        if ar in clean or clean in ar or fr.lower() in clean.lower():
            return code, ar, fr

    return "unknown", val, val


# ─────────────────────────────────────────────────────────────────────────────
# 1. الخريطة الحرارية (Heatmap API)
# ─────────────────────────────────────────────────────────────────────────────
class CentralHeatmapView(APIView):
    """
    GET /api/central/heatmap/
    تجميع الصفقات العمومية حسب الولاية مع احتساب مستوى الخطورة
    بناءً على إنذارات الذكاء الاصطناعي والميزانية المرصودة.
    """
    permission_classes = [IsCentralAdminUser]

    def get(self, request):
        deals_qs = ProcurementDeal.objects.all().select_related("authority")

        # جلب مؤشرات الشبهات النشطة من وكيل الذكاء الاصطناعي
        suspicions_by_type = get_all_suspicions()
        all_suspicions = []
        for cat, items in suspicions_by_type.items():
            for item in items:
                all_suspicions.append(item)

        # خريطة الصفقات إلى إنذاراتها
        deal_suspicions = {}
        for s in all_suspicions:
            for deal_id in s.get("deal_ids", []):
                deal_suspicions.setdefault(str(deal_id), []).append(s)

        # تجميع الصفقات حسب الولاية
        wilaya_groups = {}
        now = timezone.now()

        for deal in deals_qs:
            code, ar, fr = normalize_wilaya(deal.wilaya)
            if code not in wilaya_groups:
                wilaya_groups[code] = {
                    "code": code,
                    "wilaya_code": code,
                    "wilaya": ar,
                    "wilaya_name": ar,
                    "wilaya_name_fr": fr,
                    "name_ar": ar,
                    "name_fr": fr,
                    "deals_count": 0,
                    "tenders_count": 0,
                    "total_budget": Decimal("0"),
                    "active_deals_count": 0,
                    "delayed_deals_count": 0,
                    "alarms": [],
                }

            wg = wilaya_groups[code]
            wg["deals_count"] += 1
            wg["tenders_count"] += 1

            if deal.estimated_budget:
                wg["total_budget"] += deal.estimated_budget

            # فحص النشاط والتأخير
            if 1 <= deal.current_stage < 12:
                wg["active_deals_count"] += 1

            if (
                deal.submission_deadline
                and deal.submission_deadline < now
                and 3 <= deal.current_stage <= 8
            ):
                wg["delayed_deals_count"] += 1

            # إنذارات الصفقة
            s_list = deal_suspicions.get(str(deal.id), [])
            for s in s_list:
                if s not in wg["alarms"]:
                    wg["alarms"].append(s)

        # حساب مستوى الخطورة لكل ولاية
        # (critical, high, medium, low) بناءً على الشبهات والميزانية
        wilayas_result = []
        total_national_budget = Decimal("0")
        total_national_deals = 0

        for code, data in wilaya_groups.items():
            alarms_count = len(data["alarms"])
            budget = data["total_budget"]
            has_critical = any(a.get("severity") == "critical" for a in data["alarms"])
            has_high = any(a.get("severity") == "high" for a in data["alarms"])

            if has_critical:
                risk_level = "critical"
            elif alarms_count >= 2 or has_high:
                risk_level = "high"
            elif alarms_count >= 1 or budget >= Decimal("100000000"):  # 100M DZD
                risk_level = "medium"
            else:
                risk_level = "low"

            warning_details = [
                f"{a.get('title')}: {a.get('description', '')[:120]}"
                for a in data["alarms"][:3]
            ]

            total_national_budget += budget
            total_national_deals += data["deals_count"]

            risk_color_map = {
                "critical": "#DC2626",  # أحمر قاني (شبهات حرجة / تجزئة صفقات)
                "high": "#EA580C",      # برتقالي (شبهات عالية / تواطؤ وأسعار شاذة)
                "medium": "#EAB308",    # أصفر (شبهات متوسطة / منافسة صورية)
                "low": "#16A34A",       # أخضر (نشاط طبيعي متوافق)
            }
            color_hex = risk_color_map.get(risk_level, "#16A34A")

            wilayas_result.append({
                "code": data["code"],
                "wilaya_code": data["wilaya_code"],
                "wilaya": data["wilaya"],
                "wilaya_name": data["wilaya_name"],
                "wilaya_name_fr": data["wilaya_name_fr"],
                "name_ar": data["name_ar"],
                "name_fr": data["name_fr"],
                "deals_count": data["deals_count"],
                "tenders_count": data["deals_count"],
                "total_budget": float(budget),
                "budget_billion_dzd": round(float(budget) / 1_000_000_000, 3),
                "ai_alarms_count": alarms_count,
                "warnings": alarms_count,
                "risk_level": risk_level,
                "risk_color": color_hex,
                "color": color_hex,
                "active_deals_count": data["active_deals_count"],
                "delayed_deals_count": data["delayed_deals_count"],
                "warning_details": warning_details,
            })

        # ترتيب حسب مستوى الخطورة ثم عدد الصفقات
        risk_priority = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        wilayas_result.sort(
            key=lambda w: (risk_priority.get(w["risk_level"], 9), -w["deals_count"])
        )

        return Response({
            "total_wilayas_active": len(wilayas_result),
            "total_deals": total_national_deals,
            "total_budget_dzd": float(total_national_budget),
            "wilayas": wilayas_result,
        })


# ─────────────────────────────────────────────────────────────────────────────
# 2. لوحة القيادة والمؤشرات السيادية (KPIs Dashboard API)
# ─────────────────────────────────────────────────────────────────────────────
class CentralDashboardView(APIView):
    """
    GET /api/central/dashboard/
    المؤشرات الحقيقية للوحة قيادة الإدارة المركزية للرقابة:
    - إجمالي الصفقات الجارية
    - الصفقات بانتظار التأشيرة
    - عدد المصالح النشطة
    - إجمالي إنذارات الذكاء الاصطناعي
    """
    permission_classes = [IsCentralAdminUser]

    def get(self, request):
        deals_qs = ProcurementDeal.objects.all()
        now = timezone.now()

        total_deals = deals_qs.count()

        # 1. إجمالي الصفقات الجارية (في مراحل الإعداد، النشر، التقييم، أو التنفيذ)
        active_deals_count = deals_qs.filter(
            current_stage__gte=1, current_stage__lt=12
        ).count()

        # 2. الصفقات بانتظار التأشيرة (المرحلة 2 إعداد دفتر الشروط غير المؤشر، أو طلبات التأشيرة)
        unvalidated_specs_deal_ids = CahierSpecs.objects.filter(
            is_validated=False
        ).values_list("deal_id", flat=True)

        pending_visa_count = deals_qs.filter(
            Q(current_stage=2)
            | Q(id__in=unvalidated_specs_deal_ids)
            | Q(status__icontains="VISA")
            | Q(status__icontains="PENDING")
        ).distinct().count()

        # 3. عدد المصالح النشطة (المصالح المتعاقدة التي لديها صفقات نشطة حالياً)
        total_authorities_count = CustomUser.objects.filter(role="authority").count()
        active_authorities_count = ProcurementDeal.objects.filter(current_stage__lt=12).values("authority_id").distinct().count()

        # 4. عدد المتعاملين الاقتصاديين المسجلين في النظام
        total_operators_count = CustomUser.objects.filter(role="operator").count()
        active_operators_count = BidOffer.objects.values("operator_id").distinct().count()

        # 5. إجمالي الإنذارات التي أطلقها الذكاء الاصطناعي
        suspicions_by_type = get_all_suspicions()
        total_suspicions_count = sum(len(v) for v in suspicions_by_type.values())
        active_insights_count = AIInsight.objects.filter(is_resolved=False).count()
        total_ai_alarms = total_suspicions_count + active_insights_count

        # مؤشرات مالية وتعاقدية تكميلية
        total_budget_dzd = float(
            deals_qs.aggregate(Sum("estimated_budget"))["estimated_budget__sum"] or 0
        )
        total_contracts = Contract.objects.count()
        total_contracted_amount_dzd = float(
            Contract.objects.aggregate(Sum("signed_amount"))["signed_amount__sum"] or 0
        )
        total_bids = BidOffer.objects.count()

        # توزيع المراحل
        stages_data = list(
            deals_qs.values("current_stage")
            .annotate(count=Count("id"))
            .order_by("current_stage")
        )

        # أحدث الصفقات في النظام
        recent_deals = [
            {
                "id": str(d.id),
                "reference_number": d.reference_number,
                "title": d.title,
                "authority_name": (
                    d.authority.organization_name
                    or d.authority.display_name
                    or d.authority.email
                ),
                "wilaya": d.wilaya or "غير محددة",
                "estimated_budget": float(d.estimated_budget or 0),
                "current_stage": d.current_stage,
                "stage_display": d.get_current_stage_display(),
                "created_at": d.created_at.isoformat(),
            }
            for d in deals_qs.select_related("authority").order_by("-created_at")[:5]
        ]

        # أهم الإنذارات الفورية للعرض في لوحة القيادة
        top_alarms = []
        for cat, items in suspicions_by_type.items():
            for item in items[:2]:
                top_alarms.append({
                    "type": item.get("type"),
                    "severity": item.get("severity"),
                    "title": item.get("title"),
                    "description": item.get("description", "")[:180],
                    "confidence": item.get("confidence", 0.8),
                })

        return Response({
            "active_deals_count": active_deals_count,
            "pending_visa_count": pending_visa_count,
            "active_authorities_count": active_authorities_count,
            "total_authorities_count": total_authorities_count,
            "total_operators_count": total_operators_count,
            "active_operators_count": active_operators_count,
            "total_ai_alarms": total_ai_alarms,
            "total_suspicions_count": total_suspicions_count,
            "active_insights_count": active_insights_count,
            "total_deals": total_deals,
            "total_bids": total_bids,
            "total_budget_dzd": total_budget_dzd,
            "total_contracts": total_contracts,
            "total_contracted_amount_dzd": total_contracted_amount_dzd,
            "stages_distribution": stages_data,
            "recent_deals": recent_deals,
            "top_alarms": top_alarms[:5],
        })


# ─────────────────────────────────────────────────────────────────────────────
# 3. وكيل اكتشاف التلاعب والشبهات (Suspicion Detector API)
# ─────────────────────────────────────────────────────────────────────────────
class CentralSuspicionsView(APIView):
    """
    GET /api/central/suspicions/
    رصد الشبهات الرقابية بما فيها تجزئة الصفقات (Tender Splitting)
    وتسجيل هذه الإنذارات قانونياً في سجل التدقيق (AuditLog) ببصمة رقمية.
    """
    permission_classes = [IsCentralAdminUser]

    def get(self, request):
        suspicions_by_type = get_all_suspicions()

        flat_suspicions = []
        for cat, items in suspicions_by_type.items():
            for item in items:
                flat_suspicions.append(item)

        # توسيع بيانات الصفقات المرتبطة بكل شبهة
        all_deal_ids = set()
        for s in flat_suspicions:
            for did in s.get("deal_ids", []):
                all_deal_ids.add(did)

        valid_uuid_ids = set()
        for did in all_deal_ids:
            try:
                uuid.UUID(str(did))
                valid_uuid_ids.add(str(did))
            except (ValueError, TypeError, AttributeError):
                continue

        deals_map = {
            str(d.id): {
                "id": str(d.id),
                "reference_number": d.reference_number,
                "title": d.title,
                "wilaya": d.wilaya,
                "estimated_budget": float(d.estimated_budget or 0),
                "current_stage": d.current_stage,
            }
            for d in ProcurementDeal.objects.filter(id__in=valid_uuid_ids)
        }

        enriched_suspicions = []
        audit_records_created = 0

        for item in flat_suspicions:
            deal_ids = item.get("deal_ids", [])
            expanded_deals = [deals_map[did] for did in deal_ids if did in deals_map]

            enriched = {
                **item,
                "deals": expanded_deals,
            }
            enriched_suspicions.append(enriched)

            # تسجيل الإنذار في سجل التدقيق AuditLog بتسلسل تراكمي محمي (Append-Only)
            try:
                deal_ids_str = ",".join(deal_ids)
                resource_key = f"{item['type']}:{deal_ids_str}"[:100]

                # التحقق من عدم التكرار خلال الـ 24 ساعة الماضية
                recent_log = AuditLog.objects.filter(
                    action=f"SUSPICION_ALERT_{item['type'].upper()}",
                    resource_id=resource_key,
                    timestamp__gte=timezone.now() - timezone.timedelta(hours=24),
                ).first()

                if not recent_log:
                    AuditLog.objects.create(
                        user=request.user,
                        action=f"SUSPICION_ALERT_{item['type'].upper()}",
                        resource_type="ProcurementDeal",
                        resource_id=resource_key,
                        description=(
                            f"رصد إنذار ذكاء اصطناعي رقابي ({item.get('title')}): "
                            f"{item.get('description', '')[:250]}"
                        ),
                        changes={
                            "type": item.get("type"),
                            "severity": item.get("severity"),
                            "confidence": item.get("confidence"),
                            "authority_id": item.get("authority_id"),
                            "authority_name": item.get("authority_name"),
                            "deal_ids": deal_ids,
                            "statutory_violation": item.get("statutory_violation"),
                        },
                    )
                    audit_records_created += 1
            except Exception as e:
                logger.error(f"خطأ أثناء تسجيل إنذار الشبهة في AuditLog: {e}")

        # تجميع الإحصائيات
        critical_count = sum(1 for s in flat_suspicions if s.get("severity") == "critical")
        high_count = sum(1 for s in flat_suspicions if s.get("severity") == "high")
        medium_count = sum(1 for s in flat_suspicions if s.get("severity") == "medium")

        return Response({
            "is_advisory": True,
            "statutory_reference": "القانون 23-12 — مبدأ الشفافية والنزاهة والمنافسة الحرة",
            "total_suspicions": len(flat_suspicions),
            "critical_count": critical_count,
            "high_count": high_count,
            "medium_count": medium_count,
            "audit_records_logged": audit_records_created,
            "suspicions": suspicions_by_type,
            "results": enriched_suspicions,
        })


# ─────────────────────────────────────────────────────────────────────────────
# 4. التقارير الوطنية وأداء المصالح المتعاقدة (Reports API)
# ─────────────────────────────────────────────────────────────────────────────
class CentralReportsView(APIView):
    """
    GET /api/central/reports/
    تقارير وطنية وبيانات مجمعة عن أداء المصالح المتعاقدة:
    - عدد الصفقات
    - نسبة الالتزام بالآجال القانونية
    - نسبة الشفافية والمنافسة
    - تصنيف الأداء والمؤشرات الرقابية
    """
    permission_classes = [IsCentralAdminUser]

    def get(self, request):
        authorities = CustomUser.objects.filter(role="authority").order_by("organization_name")
        now = timezone.now()

        # جلب الشبهات للربط بأداء كل مصلحة
        suspicions_by_type = get_all_suspicions()
        all_suspicions = []
        for cat, items in suspicions_by_type.items():
            all_suspicions.extend(items)

        authority_suspicions_count = {}
        for s in all_suspicions:
            auth_id = s.get("authority_id")
            if auth_id:
                authority_suspicions_count[auth_id] = authority_suspicions_count.get(auth_id, 0) + 1

        authorities_report = []
        total_national_volume = Decimal("0")
        total_national_deals = 0
        total_compliance_sum = 0.0
        total_transparency_sum = 0.0

        for auth in authorities:
            deals = ProcurementDeal.objects.filter(authority=auth)
            deals_count = deals.count()
            total_national_deals += deals_count

            active_deals = deals.filter(current_stage__gte=1, current_stage__lt=12).count()
            completed_deals = deals.filter(current_stage=12).count()

            budget_sum = deals.aggregate(Sum("estimated_budget"))["estimated_budget__sum"] or Decimal("0")
            total_national_volume += budget_sum

            # احتساب التأخير في إيداع العروض أو المراحل
            delayed_deals = deals.filter(
                submission_deadline__lt=now,
                current_stage__gte=3,
                current_stage__lte=8,
            ).count()

            # 1. نسبة الالتزام بالآجال (Compliance / On-time rate)
            if deals_count > 0:
                on_time_ratio = round(((deals_count - delayed_deals) / deals_count) * 100, 1)
            else:
                on_time_ratio = 100.0

            # 2. نسبة الشفافية (Transparency Rate) وفق القانون 23-12:
            # - نشر دفاتر الشروط والتأشيرة عليها (+35%)
            # - تنظيم جلسات فتح الأظرفة العلنية (+35%)
            # - تنافسية العروض وسلامة الملفات (+30% إذا خلت من شبهات احتكار وتجزئة)
            has_validated_specs = CahierSpecs.objects.filter(deal__in=deals, is_validated=True).exists()
            has_open_sessions = OpeningSession.objects.filter(tender__in=deals).exists()
            suspicion_flags = authority_suspicions_count.get(str(auth.id), 0)

            transparency_score = 65.0
            if has_validated_specs:
                transparency_score += 15.0
            if has_open_sessions:
                transparency_score += 15.0
            if suspicion_flags == 0:
                transparency_score += 5.0
            else:
                transparency_score -= min(30.0, suspicion_flags * 10.0)

            transparency_score = max(40.0, min(99.0, round(transparency_score, 1)))

            # تصنيف الحالة
            if on_time_ratio >= 90 and transparency_score >= 85 and suspicion_flags == 0:
                auth_status = "excellent"
            elif suspicion_flags >= 2:
                auth_status = "infractions"
            elif on_time_ratio < 75 or transparency_score < 70:
                auth_status = "needs_support"
            else:
                auth_status = "normal"

            total_compliance_sum += on_time_ratio
            total_transparency_sum += transparency_score

            first_deal = deals.first()
            wilaya_code, wilaya_ar, _ = normalize_wilaya(first_deal.wilaya if first_deal else "")

            authorities_report.append({
                "id": str(auth.id),
                "name": auth.organization_name or auth.display_name or auth.email,
                "email": auth.email,
                "wilaya": wilaya_ar,
                "wilaya_code": wilaya_code,
                "deals_count": deals_count,
                "active_deals_count": active_deals,
                "completed_deals_count": completed_deals,
                "delayed_deals_count": delayed_deals,
                "total_volume_dzd": float(budget_sum),
                "compliance_rate": on_time_ratio,
                "on_time_ratio": on_time_ratio,
                "transparency_rate": transparency_score,
                "transparency_score": transparency_score,
                "suspicions_count": suspicion_flags,
                "status": auth_status,
                "ai_training_needed": auth_status in ["needs_support", "infractions"],
            })

        # ترتيب حسب حجم الصفقات
        authorities_report.sort(key=lambda a: -a["deals_count"])

        auth_count = len(authorities_report) or 1
        avg_compliance = round(total_compliance_sum / auth_count, 1)
        avg_transparency = round(total_transparency_sum / auth_count, 1)

        # تقارير دورية نموذجية جاهزة للتحميل والطباعة
        quarter = (now.month - 1) // 3 + 1
        reports_catalog = [
            {
                "id": f"NAT-REP-{now.year}-Q{quarter}",
                "title": f"الحصيلة الوطنية الدورية للرقابة والصفقات - الثلاثي {quarter} / {now.year}",
                "type": "quarterly",
                "period": f"الثلاثي {quarter} {now.year}",
                "wilaya_scope": "كافة الولايات (69 ولاية)",
                "generated_date": now.strftime("%Y-%m-%d"),
                "total_deals": total_national_deals,
                "total_volume_dzd": float(total_national_volume),
                "average_compliance_rate": avg_compliance,
                "average_transparency_rate": avg_transparency,
                "status": "ready",
            },
            {
                "id": f"NAT-REP-{now.year}-M{str(now.month).zfill(2)}",
                "title": f"التقرير الشهري لمؤشرات النزاهة والصفقات العمومية - {now.strftime('%B %Y')}",
                "type": "monthly",
                "period": now.strftime("%Y-%m"),
                "wilaya_scope": "المصالح المتعاقدة النشطة",
                "generated_date": now.strftime("%Y-%m-%d"),
                "total_deals": total_national_deals,
                "total_volume_dzd": float(total_national_volume),
                "average_compliance_rate": avg_compliance,
                "average_transparency_rate": avg_transparency,
                "status": "ready",
            },
        ]

        return Response({
            "national_summary": {
                "total_authorities": len(authorities_report),
                "total_deals": total_national_deals,
                "total_volume_dzd": float(total_national_volume),
                "average_compliance_rate": avg_compliance,
                "average_transparency_rate": avg_transparency,
            },
            "authorities": authorities_report,
            "reports": reports_catalog,
        })


class CentralReportPdfView(APIView):
    """
    GET /api/central/reports/{report_id}/pdf/
    توليد وتحميل التقرير الوطني بصيغة PDF قابلة للأرشفة مع رمز QR وبصمة تحقق (SHA-256).
    مقتصر حصرياً على حسابات الإدارة المركزية (central_admin).
    """
    permission_classes = [IsCentralAdminUser]

    def get(self, request, report_id):
        # 1. جلب البيانات الوطنية المجمعة
        authorities = CustomUser.objects.filter(role="authority").order_by("organization_name")
        now = timezone.now()

        total_national_volume = Decimal("0")
        total_national_deals = 0
        total_compliance_sum = 0.0
        total_transparency_sum = 0.0
        authorities_report = []

        for auth in authorities:
            deals = ProcurementDeal.objects.filter(authority=auth)
            deals_count = deals.count()
            total_national_deals += deals_count
            budget_sum = deals.aggregate(Sum("estimated_budget"))["estimated_budget__sum"] or Decimal("0")
            total_national_volume += budget_sum

            delayed_deals = deals.filter(
                submission_deadline__lt=now,
                current_stage__gte=3,
                current_stage__lte=8,
            ).count()
            on_time_ratio = round(((deals_count - delayed_deals) / deals_count) * 100, 1) if deals_count > 0 else 100.0

            has_validated_specs = CahierSpecs.objects.filter(deal__in=deals, is_validated=True).exists()
            has_open_sessions = OpeningSession.objects.filter(tender__in=deals).exists()
            transparency_score = 65.0 + (15.0 if has_validated_specs else 0) + (15.0 if has_open_sessions else 0) + 5.0
            transparency_score = max(40.0, min(99.0, round(transparency_score, 1)))

            total_compliance_sum += on_time_ratio
            total_transparency_sum += transparency_score

            first_deal = deals.first()
            wilaya_code, wilaya_ar, _ = normalize_wilaya(first_deal.wilaya if first_deal else "")

            authorities_report.append({
                "name": auth.organization_name or auth.display_name or auth.email,
                "email": auth.email,
                "wilaya": wilaya_ar,
                "deals_count": deals_count,
                "total_volume_dzd": float(budget_sum),
                "compliance_rate": on_time_ratio,
                "transparency_rate": transparency_score,
                "status": "excellent" if on_time_ratio >= 90 else "normal",
            })

        auth_count = len(authorities_report) or 1
        avg_compliance = round(total_compliance_sum / auth_count, 1)
        avg_transparency = round(total_transparency_sum / auth_count, 1)

        national_summary = {
            "total_authorities": len(authorities_report),
            "total_deals": total_national_deals,
            "total_volume_dzd": float(total_national_volume),
            "average_compliance_rate": avg_compliance,
            "average_transparency_rate": avg_transparency,
        }

        # تحديد العنوان المناسب للتقرير
        quarter = (now.month - 1) // 3 + 1
        if "Q" in report_id.upper():
            report_title = f"الحصيلة الوطنية الدورية للرقابة والصفقات — الثلاثي {quarter} / {now.year}"
        elif "M" in report_id.upper():
            report_title = f"التقرير الشهري لمؤشرات النزاهة والصفقات العمومية — {now.strftime('%B %Y')}"
        else:
            report_title = f"التقرير الوطني الاستراتيجي للصفقات العمومية — {report_id}"

        # 2. توليد مستند الـ PDF المشفر
        pdf_bytes, sha256_hash = generate_central_report_pdf(
            report_id=report_id,
            title=report_title,
            period=now.strftime("%Y-%m"),
            national_summary=national_summary,
            authorities=authorities_report,
            generated_by=f"{request.user.display_name or request.user.email} (الإدارة المركزية)",
        )

        # 3. إرجاع استجابة PDF رسمية
        filename = f"safaqat_report_{report_id.lower().replace('-', '_')}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response["X-Report-Id"] = report_id
        response["X-Report-Checksum"] = sha256_hash
        return response


# ─────────────────────────────────────────────────────────────────────────────
# 6. قائمة المصالح المتعاقدة الحقيقية (Real Authorities API)
# ─────────────────────────────────────────────────────────────────────────────
class CentralAuthoritiesView(APIView):
    """
    GET /api/central/authorities/
    استرجاع قائمة المصالح المتعاقدة الحقيقية المسجلة في جدول المستخدمين (CustomUser.objects.filter(role='authority')).
    لا تتضمن أي بيانات وهمية أو مصالح افتراضية.
    مقتصرة على الإدارة المركزية والرقابة السيادية (central_admin/superuser).
    """
    permission_classes = [IsCentralAdminUser]

    def get(self, request):
        authorities = (
            CustomUser.objects.filter(role="authority")
            .order_by("organization_name", "email")
        )
        now = timezone.now()

        results = []
        for auth in authorities:
            deals_qs = ProcurementDeal.objects.filter(authority=auth)
            deals_count = deals_qs.count()
            active_deals = deals_qs.filter(current_stage__gte=1, current_stage__lt=12).count()
            completed_deals = deals_qs.filter(current_stage=12).count()
            delayed_deals = deals_qs.filter(
                submission_deadline__lt=now,
                current_stage__gte=3,
                current_stage__lte=8,
            ).count()
            budget_sum = deals_qs.aggregate(Sum("estimated_budget"))["estimated_budget__sum"] or Decimal("0")

            first_deal = deals_qs.first()
            wilaya_code, wilaya_ar, wilaya_fr = normalize_wilaya(first_deal.wilaya if first_deal else "")

            results.append({
                "id": str(auth.id),
                "name": auth.organization_name or auth.display_name or auth.email,
                "organization_name": auth.organization_name,
                "display_name": auth.display_name,
                "email": auth.email,
                "phone_number": getattr(auth, "phone_number", "") or "",
                "wilaya": wilaya_ar,
                "wilaya_code": wilaya_code,
                "wilaya_name_fr": wilaya_fr,
                "deals_count": deals_count,
                "active_deals_count": active_deals,
                "completed_deals_count": completed_deals,
                "delayed_deals_count": delayed_deals,
                "total_volume_dzd": float(budget_sum),
                "is_active": auth.is_active,
                "created_at": auth.date_joined.isoformat() if hasattr(auth, "date_joined") and auth.date_joined else None,
            })

        return Response({
            "count": len(results),
            "results": results,
            "authorities": results,
        })


# ─────────────────────────────────────────────────────────────────────────────
# 7. قائمة المتعاملين الاقتصاديين الحقيقيين (Real Operators API)
# ─────────────────────────────────────────────────────────────────────────────
class CentralOperatorsView(APIView):
    """
    GET /api/central/operators/
    استرجاع قائمة المتعاملين الاقتصاديين الحقيقيين المسجلين في جدول المستخدمين (CustomUser.objects.filter(role='operator')).
    لا تتضمن أي بيانات وهمية.
    مقتصرة على الإدارة المركزية والرقابة السيادية (central_admin/superuser).
    """
    permission_classes = [IsCentralAdminUser]

    def get(self, request):
        operators = (
            CustomUser.objects.filter(role="operator")
            .select_related("operator_profile")
            .order_by("organization_name", "email")
        )

        results = []
        for op in operators:
            profile = getattr(op, "operator_profile", None)
            offers_qs = BidOffer.objects.filter(operator=op)
            offers_count = offers_qs.count()
            awarded_count = offers_qs.filter(status="awarded").count()
            rejected_count = offers_qs.filter(status="rejected").count()
            contracts_qs = Contract.objects.filter(awarded_operator=op)
            contracts_count = contracts_qs.count()
            contracted_volume = float(
                contracts_qs.aggregate(Sum("signed_amount"))["signed_amount__sum"] or 0
            )
            company_name = op.organization_name or op.display_name or op.email

            results.append({
                "id": str(op.id),
                "name": company_name,
                "company_name": company_name,
                "organization_name": op.organization_name,
                "display_name": op.display_name,
                "email": op.email,
                "phone_number": getattr(op, "phone_number", "") or "",
                "nif": getattr(op, "nif", "") or "",
                "nis": getattr(op, "nis", "") or "",
                "sector": profile.sector if profile else "any",
                "sector_display": profile.get_sector_display() if profile and hasattr(profile, "get_sector_display") else "متعدد القطاعات",
                "available_wilayas": profile.available_wilayas if profile else [],
                "offers_count": offers_count,
                "wins_count": awarded_count,
                "awarded_count": awarded_count,
                "rejected_count": rejected_count,
                "contracts_count": contracts_count,
                "total_volume_dzd": contracted_volume,
                "is_active": op.is_active,
                "created_at": op.date_joined.isoformat() if hasattr(op, "date_joined") and op.date_joined else None,
            })

        return Response({
            "count": len(results),
            "results": results,
            "operators": results,
        })


# ─────────────────────────────────────────────────────────────────────────────
# 8. السجل الوطني للصفقات الحقيقية (Real Deals API)
# ─────────────────────────────────────────────────────────────────────────────
class CentralDealsView(APIView):
    """
    GET /api/central/deals/
    استرجاع الصفقات العمومية الحقيقية فقط المسجلة في جدول صفقات المنصة (ProcurementDeal.objects.all()).
    مقتصرة على الإدارة المركزية والرقابة السيادية (central_admin/superuser).
    """
    permission_classes = [IsCentralAdminUser]

    def get(self, request):
        deals_qs = ProcurementDeal.objects.all().select_related("authority").order_by("-created_at")

        # تصفيات اختيارية
        wilaya = request.query_params.get("wilaya")
        if wilaya:
            deals_qs = deals_qs.filter(Q(wilaya__icontains=wilaya))

        stage = request.query_params.get("stage")
        if stage and stage.isdigit():
            deals_qs = deals_qs.filter(current_stage=int(stage))

        search = request.query_params.get("search") or request.query_params.get("q")
        if search:
            deals_qs = deals_qs.filter(
                Q(title__icontains=search)
                | Q(reference_number__icontains=search)
                | Q(description__icontains=search)
                | Q(authority__organization_name__icontains=search)
            )

        results = []
        for d in deals_qs:
            results.append({
                "id": str(d.id),
                "reference_number": d.reference_number,
                "title": d.title,
                "description": d.description,
                "authority_id": str(d.authority_id) if d.authority_id else None,
                "authority_name": (
                    d.authority.organization_name
                    or d.authority.display_name
                    or d.authority.email
                ) if d.authority else "المصلحة المتعاقدة",
                "wilaya": d.wilaya or "غير محددة",
                "estimated_budget": float(d.estimated_budget or 0),
                "current_stage": d.current_stage,
                "stage_display": d.get_current_stage_display(),
                "submission_deadline": d.submission_deadline.isoformat() if d.submission_deadline else None,
                "created_at": d.created_at.isoformat(),
                "updated_at": d.updated_at.isoformat(),
            })

        return Response({
            "count": len(results),
            "results": results,
            "deals": results,
        })
