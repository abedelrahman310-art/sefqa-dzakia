import os
from decimal import Decimal
from datetime import timedelta
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal, CahierSpecs
from apps.bids.models import BidOffer
from apps.audit.models import AuditLog
from apps.ai_gateway.models import AIInsight
from apps.ai_gateway.services.suspicion_detector import get_all_suspicions


class Command(BaseCommand):
    help = "بذر البيانات التجريبية لمحرك الذكاء الاصطناعي السيادي وبوابة الإدارة المركزية (الرقابة المركزية) وفق القانون 23-12"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="حذف الصفقات والعروض التجريبية المخصصة لمحرك الرقابة وإعادة إنشائها",
        )
        parser.add_argument(
            "--allow-production",
            action="store_true",
            help="السماح بالتنفيذ الصريح حتى في حال كانت بيئة التشغيل إنتاجية (DEBUG=False)",
        )

    def handle(self, *args, **options):
        # 1. فحص سياسة منع البيانات الوهمية في الإنتاج
        enable_demo = getattr(settings, 'ENABLE_DEMO_DATA', False)
        if not enable_demo and not options.get('allow_production'):
            self.stdout.write(self.style.WARNING(
                '⚠️ [تنبيه إنتاجي]: بذر البيانات الرقابية التجريبية معطّل حالياً (ENABLE_DEMO_DATA=False). '
                'المنصة مهيأة للعمل الفعلي النظيف، ولن يتم حقن أي شبهات أو صفقات رقابية وهمية.'
            ))
            return

        # 2. فحص بيئة الإنتاج الصارم
        if not settings.DEBUG and not options.get("allow_production"):
            raise CommandError(
                "تم رفض التنفيذ: بيئة التشغيل إنتاجية (DEBUG=False). "
                "لا يمكن بذر بيانات تجريبية في الإنتاج إلا بتمرير الراية --allow-production صراحة."
            )

        test_password = os.getenv("SEPAQAT_SEED_PASSWORD", "Safaqat@2026")
        self.stdout.write(self.style.NOTICE("بدء تهيئة البيانات التجريبية لمحرك الذكاء الاصطناعي (الرقابة المركزية)..."))

        # 2. إنشاء المستخدمين المعنيين بالسيناريوهات الرقابية
        admin_user, _ = CustomUser.objects.get_or_create(
            email="admin@safaqat.dz",
            defaults={
                "display_name": "المفتشية العامة للرقابة والصفقات",
                "organization_name": "المفتشية العامة للصفقات والمشتريات العمومية",
                "role": "central_admin",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if not admin_user.check_password(test_password):
            admin_user.set_password(test_password)
            admin_user.save()

        # المصالح المتعاقدة الجهوية
        auth_algiers, _ = CustomUser.objects.get_or_create(
            email="authority@safaqat.dz",
            defaults={
                "display_name": "مديرية التجهيزات العمومية - ولاية الجزائر",
                "organization_name": "مديرية التجهيزات العمومية لولاية الجزائر",
                "role": "authority",
            },
        )
        auth_algiers.set_password(test_password)
        auth_algiers.save()

        auth_oran, _ = CustomUser.objects.get_or_create(
            email="auth_oran@safaqat.dz",
            defaults={
                "display_name": "مديرية الأشغال العمومية - ولاية وهران",
                "organization_name": "مديرية الأشغال العمومية لولاية وهران",
                "role": "authority",
            },
        )
        auth_oran.set_password(test_password)
        auth_oran.save()

        auth_constantine, _ = CustomUser.objects.get_or_create(
            email="auth_constantine@safaqat.dz",
            defaults={
                "display_name": "مديرية البناء والتعمير - ولاية قسنطينة",
                "organization_name": "مديرية السكن والتجهيزات العمومية لقسنطينة",
                "role": "authority",
            },
        )
        auth_constantine.set_password(test_password)
        auth_constantine.save()

        auth_tizi, _ = CustomUser.objects.get_or_create(
            email="auth_tizi@safaqat.dz",
            defaults={
                "display_name": "مديرية الموارد المائية - ولاية تيزي وزو",
                "organization_name": "مديرية الموارد المائية لولاية تيزي وزو",
                "role": "authority",
            },
        )
        auth_tizi.set_password(test_password)
        auth_tizi.save()

        auth_setif, _ = CustomUser.objects.get_or_create(
            email="auth_setif@safaqat.dz",
            defaults={
                "display_name": "مديرية الصحة والسكان - ولاية سطيف",
                "organization_name": "مديرية الصحة والسكان لولاية سطيف",
                "role": "authority",
            },
        )
        auth_setif.set_password(test_password)
        auth_setif.save()

        # المتعاملون الاقتصاديون
        op1, _ = CustomUser.objects.get_or_create(
            email="operator@safaqat.dz",
            defaults={
                "display_name": "مؤسسة الجزائر الحديثة للأشغال والمنشآت الكبرى",
                "organization_name": "مؤسسة الجزائر الحديثة للأشغال والمنشآت الكبرى (ش.ذ.م.م)",
                "role": "operator",
            },
        )
        op1.set_password(test_password)
        op1.save()

        op2, _ = CustomUser.objects.get_or_create(
            email="operator2@safaqat.dz",
            defaults={
                "display_name": "شركة البناء والري الجزائرية الحديثة",
                "organization_name": "شركة البناء والري الجزائرية الحديثة (ش.أ)",
                "role": "operator",
            },
        )
        op2.set_password(test_password)
        op2.save()

        op3, _ = CustomUser.objects.get_or_create(
            email="operator3@safaqat.dz",
            defaults={
                "display_name": "مؤسسة الأطلس للتهيئة والتعمير",
                "organization_name": "مؤسسة الأطلس للتهيئة والتعمير",
                "role": "operator",
            },
        )
        op3.set_password(test_password)
        op3.save()

        op4, _ = CustomUser.objects.get_or_create(
            email="operator4@safaqat.dz",
            defaults={
                "display_name": "مجمع النور للمقاولات العامة",
                "organization_name": "مجمع النور للمقاولات العامة والتجهيز",
                "role": "operator",
            },
        )
        op4.set_password(test_password)
        op4.save()

        self.stdout.write(self.style.SUCCESS("✓ تم التحقق من الحسابات التجريبية وتأمين كلمات المرور."))

        # 3. تنظيف البيانات التجريبية السابقة المخصصة للعرض
        demo_prefixes = ["DZ-SPLIT-", "ORN-RIG-", "CST-PRICE-", "TIZI-PHANTOM-", "SET-NORM-", "TEST-"]
        if options.get("reset"):
            for prefix in demo_prefixes:
                BidOffer.objects.filter(deal__reference_number__startswith=prefix).delete()
                ProcurementDeal.objects.filter(reference_number__startswith=prefix).delete()
            self.stdout.write(self.style.WARNING("✓ تم تفريغ الصفقات التجريبية السابقة بنجاح."))

        now = timezone.now()

        # ─── 4. السيناريو 1: ولاية الجزائر — شبهة «تجزئة صفقات» (Tender Splitting) ───
        # 3 صفقات متقاربة في التاريخ لنفس المصلحة بمبالغ دون العتبة (12M دج) ومجموعها يتجاوزها
        deal_split_1, _ = ProcurementDeal.objects.update_or_create(
            reference_number="DZ-SPLIT-2026-001",
            defaults={
                "title": "أشغال صيانة وتأهيل المدارس الابتدائية - الشطر الشرقي",
                "description": "أشغال ترميم الكتامة وشبكات التدفئة لمدارس المقاطعة الإدارية الشرقية",
                "authority": auth_algiers,
                "current_stage": 2,
                "status": "PUBLISHED",
                "estimated_budget": Decimal("9500000.00"),
                "wilaya": "الجزائر",
                "submission_deadline": now + timedelta(days=15),
            },
        )
        deal_split_1.created_at = now - timedelta(days=6)
        deal_split_1.save(update_fields=["created_at"])

        deal_split_2, _ = ProcurementDeal.objects.update_or_create(
            reference_number="DZ-SPLIT-2026-002",
            defaults={
                "title": "أشغال صيانة وتأهيل المدارس الابتدائية - الشطر الغربي",
                "description": "أشغال صيانة المساكة والدهان لمدارس المقاطعة الإدارية الغربية",
                "authority": auth_algiers,
                "current_stage": 2,
                "status": "PUBLISHED",
                "estimated_budget": Decimal("8200000.00"),
                "wilaya": "الجزائر",
                "submission_deadline": now + timedelta(days=16),
            },
        )
        deal_split_2.created_at = now - timedelta(days=4)
        deal_split_2.save(update_fields=["created_at"])

        deal_split_3, _ = ProcurementDeal.objects.update_or_create(
            reference_number="DZ-SPLIT-2026-003",
            defaults={
                "title": "أشغال صيانة وتأهيل المدارس الابتدائية - الشطر المركزي",
                "description": "أشغال إعادة تهيئة الساحات والمرافق الصحية لمدارس المقاطعة الوسطى",
                "authority": auth_algiers,
                "current_stage": 2,
                "status": "PUBLISHED",
                "estimated_budget": Decimal("11000000.00"),
                "wilaya": "الجزائر",
                "submission_deadline": now + timedelta(days=17),
            },
        )
        deal_split_3.created_at = now - timedelta(days=1)
        deal_split_3.save(update_fields=["created_at"])

        # ربط دفاتر شروط مؤشرة
        for d in [deal_split_1, deal_split_2, deal_split_3]:
            CahierSpecs.objects.get_or_create(deal=d, defaults={"is_validated": True})

        self.stdout.write(self.style.SUCCESS("✓ [الجزائر]: تم إنشاء 3 صفقات متتالية بمبالغ دون العتبة (تجزئة صفقات -> Critical 🔴)."))

        # ─── 5. السيناريو 2: ولاية وهران — شبهة «تواطؤ وتنسيق أسعار» (Bid Rigging) ───
        # شركتان تقدمتا بعروض متطابقة السعر تماماً على نفس الصفقة
        deal_oran, _ = ProcurementDeal.objects.update_or_create(
            reference_number="ORN-RIG-2026-015",
            defaults={
                "title": "مشروع إنجاز وتجهيز محطة معالجة وضخ المياه الصالحة للشرب بشرق وهران",
                "description": "أشغال الهندسة المدنية وتوريد التجهيزات الكهروميكانيكية لمحطة الضخ الرئيسية",
                "authority": auth_oran,
                "current_stage": 4,  # مرحلة فتح الأظرفة
                "status": "PUBLISHED",
                "estimated_budget": Decimal("42000000.00"),
                "wilaya": "وهران",
                "submission_deadline": now - timedelta(days=1),
            },
        )
        CahierSpecs.objects.get_or_create(deal=deal_oran, defaults={"is_validated": True})

        # عرضان ماليان متطابقان تماماً: 38,500,000.00 دج
        identical_amount = Decimal("38500000.00")
        BidOffer.objects.update_or_create(
            deal=deal_oran,
            operator=op1,
            defaults={
                "status": "submitted",
                "financial_amount": identical_amount,
                "technical_score": Decimal("85.0"),
                "submission_timestamp": now - timedelta(hours=5),
            },
        )
        BidOffer.objects.update_or_create(
            deal=deal_oran,
            operator=op2,
            defaults={
                "status": "submitted",
                "financial_amount": identical_amount,
                "technical_score": Decimal("84.5"),
                "submission_timestamp": now - timedelta(hours=3),
            },
        )
        self.stdout.write(self.style.SUCCESS("✓ [وهران]: تم إنشاء صفقة بعروض متطابقة السعر بالسنتيم (تواطؤ محظور -> High 🟠)."))

        # ─── 6. السيناريو 3: ولاية قسنطينة — شبهة «سعر شاذ ومنخفض» (Price Anomaly) ───
        # عرض أقل من 60% من الميزانية التقديرية (44% فقط)
        deal_constantine, _ = ProcurementDeal.objects.update_or_create(
            reference_number="CST-PRICE-2026-033",
            defaults={
                "title": "مشروع دراسة ومتابعة إنجاز المحور الدوراني لجبل الوحش بقسنطينة",
                "description": "دراسات الجيوتقنية والطوبوغرافية ومتابعة أشغال تدعيم المنحدرات والمحور الدوراني",
                "authority": auth_constantine,
                "current_stage": 4,  # فتح الأظرفة
                "status": "PUBLISHED",
                "estimated_budget": Decimal("50000000.00"),
                "wilaya": "قسنطينة",
                "submission_deadline": now - timedelta(days=2),
            },
        )
        CahierSpecs.objects.get_or_create(deal=deal_constantine, defaults={"is_validated": True})

        # عرض طبيعي: 46 مليون دج
        BidOffer.objects.update_or_create(
            deal=deal_constantine,
            operator=op3,
            defaults={
                "status": "submitted",
                "financial_amount": Decimal("46000000.00"),
                "technical_score": Decimal("80.0"),
                "submission_timestamp": now - timedelta(hours=10),
            },
        )
        # عرض شاذ ومنخفض بصورة غير عادية: 22 مليون دج (44% من الميزانية)
        BidOffer.objects.update_or_create(
            deal=deal_constantine,
            operator=op1,
            defaults={
                "status": "submitted",
                "financial_amount": Decimal("22000000.00"),
                "technical_score": Decimal("72.0"),
                "submission_timestamp": now - timedelta(hours=8),
            },
        )
        self.stdout.write(self.style.SUCCESS("✓ [قسنطينة]: تم إنشاء صفقة بعرض منخفض شاذ 44% من الميزانية (شبهة سعر شاذ -> High 🟠)."))

        # ─── 7. السيناريو 4: ولاية تيزي وزو — شبهة «منافسة صورية» (Phantom Competition) ──
        # عرضان مقدمان في نفس الثانية من متعهدين مختلفين
        deal_tizi, _ = ProcurementDeal.objects.update_or_create(
            reference_number="TIZI-PHANTOM-2026-008",
            defaults={
                "title": "أشغال تهيئة المسالك الريفية والمنشآت الفنية بمرتفعات ذراع الميزان",
                "description": "تهيئة وتعبيد المسالك الجبلية مع بناء جدران دعم ومنشآت تصريف مياه الأمطار",
                "authority": auth_tizi,
                "current_stage": 4,  # فتح الأظرفة
                "status": "PUBLISHED",
                "estimated_budget": Decimal("35000000.00"),
                "wilaya": "تيزي وزو",
                "submission_deadline": now - timedelta(days=1),
            },
        )
        CahierSpecs.objects.get_or_create(deal=deal_tizi, defaults={"is_validated": True})

        # توقيت إيداع متطابق في نفس الثانية
        simultaneous_time = now - timedelta(hours=4)
        BidOffer.objects.update_or_create(
            deal=deal_tizi,
            operator=op2,
            defaults={
                "status": "submitted",
                "financial_amount": Decimal("33000000.00"),
                "technical_score": Decimal("78.0"),
                "submission_timestamp": simultaneous_time,
            },
        )
        BidOffer.objects.update_or_create(
            deal=deal_tizi,
            operator=op4,
            defaults={
                "status": "submitted",
                "financial_amount": Decimal("34200000.00"),
                "technical_score": Decimal("75.0"),
                "submission_timestamp": simultaneous_time,
            },
        )
        self.stdout.write(self.style.SUCCESS("✓ [تيزي وزو]: تم إنشاء صفقة بإيداع متزامن في نفس الثانية (منافسة صورية -> Medium 🟡)."))

        # ─── 8. سيناريو تكميلي: ولاية سطيف — صفقة طبيعية متوافقة (Low Risk 🟢) ───────
        deal_setif, _ = ProcurementDeal.objects.update_or_create(
            reference_number="SET-NORM-2026-012",
            defaults={
                "title": "اقتناء وتوريد عتاد طبي وأجهزة تصوير للمؤسسة الاستشفائية بالعلمة",
                "description": "تجهيز مصلحة الأشعة بمعدات تصوير متطورة مع التركيب والصيانة التجريبية",
                "authority": auth_setif,
                "current_stage": 4,
                "status": "PUBLISHED",
                "estimated_budget": Decimal("45000000.00"),
                "wilaya": "سطيف",
                "submission_deadline": now - timedelta(days=3),
            },
        )
        CahierSpecs.objects.get_or_create(deal=deal_setif, defaults={"is_validated": True})

        BidOffer.objects.update_or_create(
            deal=deal_setif,
            operator=op1,
            defaults={
                "status": "submitted",
                "financial_amount": Decimal("41500000.00"),
                "technical_score": Decimal("88.0"),
                "submission_timestamp": now - timedelta(days=4),
            },
        )
        BidOffer.objects.update_or_create(
            deal=deal_setif,
            operator=op3,
            defaults={
                "status": "submitted",
                "financial_amount": Decimal("43000000.00"),
                "technical_score": Decimal("86.0"),
                "submission_timestamp": now - timedelta(days=3, hours=4),
            },
        )
        self.stdout.write(self.style.SUCCESS("✓ [سطيف]: تم إنشاء صفقة نظامية متوافقة مع القواعد (نشاط طبيعي -> Low 🟢)."))

        # ─── 9. تشغيل محرك الرصد وتسجيل الإنذارات في AuditLog و AIInsight ────────────
        self.stdout.write(self.style.NOTICE("جاري تشغيل محرك كشف الشبهات (Suspicion Detector)..."))
        suspicions_by_type = get_all_suspicions()

        total_alarms = sum(len(items) for items in suspicions_by_type.values())
        logged_audit = 0
        logged_insights = 0

        for cat, items in suspicions_by_type.items():
            for item in items:
                deal_ids = item.get("deal_ids", [])
                deal_ids_str = ",".join(deal_ids)
                resource_key = f"{item['type']}:{deal_ids_str}"[:100]

                # تسجيل في AuditLog ببصمة رقمية
                recent_log = AuditLog.objects.filter(
                    action=f"SUSPICION_ALERT_{item['type'].upper()}",
                    resource_id=resource_key,
                ).first()

                if not recent_log:
                    AuditLog.objects.create(
                        user=admin_user,
                        action=f"SUSPICION_ALERT_{item['type'].upper()}",
                        resource_type="ProcurementDeal",
                        resource_id=resource_key,
                        description=f"إنذار ذكاء اصطناعي رقابي ({item.get('title')}): {item.get('description', '')[:250]}",
                        changes={
                            "type": item.get("type"),
                            "severity": item.get("severity"),
                            "confidence": item.get("confidence"),
                            "authority_id": item.get("authority_id"),
                            "deal_ids": deal_ids,
                            "statutory_violation": item.get("statutory_violation"),
                        },
                    )
                    logged_audit += 1

                # تسجيل في AIInsight
                category_map = {
                    "tender_splitting": AIInsight.Category.FRAUD_SUSPICION,
                    "identical_bid_amounts": AIInsight.Category.PATTERN,
                    "operator_monopoly": AIInsight.Category.PATTERN,
                    "abnormally_low_tender": AIInsight.Category.PRICE_ANOMALY,
                    "excessive_price_bid": AIInsight.Category.PRICE_ANOMALY,
                    "extreme_price_spread": AIInsight.Category.PRICE_ANOMALY,
                    "simultaneous_submission": AIInsight.Category.PATTERN,
                    "interconnected_bidders": AIInsight.Category.FRAUD_SUSPICION,
                }
                cat_enum = category_map.get(item.get("type"), AIInsight.Category.RECOMMENDATION)

                AIInsight.objects.get_or_create(
                    title=item.get("title")[:200],
                    defaults={
                        "severity": item.get("severity", "medium"),
                        "category": cat_enum,
                        "description": item.get("description", ""),
                        "related_tenders": deal_ids,
                        "recommendation": item.get("recommendation", "مراجعة وتدقيق الإجراءات"),
                        "confidence": float(item.get("confidence", 0.8)),
                        "is_advisory": True,
                        "human_verification_required": True,
                        "is_resolved": False,
                    },
                )
                logged_insights += 1

        self.stdout.write(self.style.SUCCESS(
            f"✓ محرك الشبهات: رصد {total_alarms} شبهات نشطة. "
            f"تم تسجيل {logged_audit} قيداً جديداً في سجل التدقيق الجنائي (AuditLog) "
            f"و {logged_insights} توصية في جدول AIInsight."
        ))

        self.stdout.write("\n" + "=" * 65)
        self.stdout.write(self.style.SUCCESS("خلاصة مستويات الخطورة الميدانية على الخريطة الحرارية:"))
        self.stdout.write("  🔴 ولاية الجزائر   (16): Critical (شبهة تجزئة صفقات تحت العتبة)")
        self.stdout.write("  🟠 ولاية وهران     (31): High     (شبهة تواطؤ وتطابق أسعار العروض)")
        self.stdout.write("  🟠 ولاية قسنطينة   (25): High     (شبهة سعر شاذ منخفض 44% من الميزانية)")
        self.stdout.write("  🟡 ولاية تيزي وزو  (15): Medium   (شبهة منافسة صورية وإيداع متزامن في نفس الثانية)")
        self.stdout.write("  🟢 ولاية سطيف      (19): Low      (صفقة نظامية متطابقة مع المعايير)")
        self.stdout.write("=" * 65 + "\n")
