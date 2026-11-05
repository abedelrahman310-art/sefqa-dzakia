import os
import uuid
from decimal import Decimal
from datetime import timedelta
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal, CahierSpecs
from apps.bids.models import BidOffer
from apps.contracts.models import AwardDecision, Contract
from apps.execution.models import ExecutionMilestone, ContractAmendment, ReceptionProcess, PaymentSituation
from apps.audit.models import AuditLog

DEFAULT_WILAYA = 'الجزائر'

class Command(BaseCommand):
    help = 'بذر البيانات النموذجية لمنصة صفقات ذكية وفق القانون 23-12 (idempotent, supports --reset and --allow-production)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='حذف البيانات التجريبية المؤسسية السابقة فقط وإعادة تهيئتها',
        )
        parser.add_argument(
            '--allow-production',
            action='store_true',
            help='السماح بالتنفيذ الصريح حتى في حال كانت بيئة التشغيل إنتاجية (DEBUG=False)',
        )

    def handle(self, *args, **options):
        # 1. فحص سياسة منع البيانات الوهمية في الإنتاج
        enable_demo = getattr(settings, 'ENABLE_DEMO_DATA', False)
        if not enable_demo and not options.get('allow_production'):
            self.stdout.write(self.style.WARNING(
                '⚠️ [تنبيه إنتاجي]: بذر البيانات التجريبية معطّل حالياً (ENABLE_DEMO_DATA=False). '
                'المنصة مهيأة للعمل الفعلي النظيف، ولن يتم حقن أي صفقات أو بيانات وهمية.'
            ))
            return

        # 2. فحص بيئة الإنتاج الصارم
        if not settings.DEBUG and not options.get('allow_production'):
            raise CommandError(
                'تم رفض التنفيذ: بيئة التشغيل إنتاجية (DEBUG=False). '
                'لا يمكن بذر بيانات تجريبية في الإنتاج إلا بتفعيل ENABLE_DEMO_DATA=true وتمرير الراية --allow-production صراحة.'
            )

        # 2. تحديد كلمة المرور مع تحذير أمني واضح إذا كانت الافتراضية
        env_password = os.getenv('SEPAQAT_SEED_PASSWORD')
        if env_password:
            test_password = env_password
            self.stdout.write(self.style.SUCCESS('تم تحميل كلمة المرور المعتمدة من متغير البيئة SEPAQAT_SEED_PASSWORD.'))
        else:
            self.stdout.write(self.style.WARNING(
                '⚠️ [تحذير أمني]: لم يتم ضبط متغير البيئة SEPAQAT_SEED_PASSWORD. '
                'سيتم استخدام كلمة المرور التجريبية الافتراضية (Safaqat@2026). '
                'يُحظر استخدام هذا الوضع في البيئات الإنتاجية أو الخوادم العامة.'
            ))
            test_password = 'Safaqat@2026'

        # 3. معالجة خيار --reset لحذف البيانات التجريبية فقط
        test_deal_refs = ['DTP-DZ-2026-PLAN-01', 'DTP-DZ-2026-042', 'ADE-DZ-2026-118', 'DWH-DZ-2025-089']
        test_emails = [
            'authority@safaqat.dz',
            'operator@safaqat.dz',
            'operator2@safaqat.dz',
            'admin@safaqat.dz'
        ]

        if options.get('reset'):
            self.stdout.write(self.style.WARNING('تفعيل خيار --reset: حذف البيانات التجريبية السابقة...'))
            from apps.procurements.models import OpeningEvent, SessionAccess, OpeningSession
            from django.db.models import Q
            OpeningEvent.objects.filter(
                Q(session__tender__reference_number__in=test_deal_refs) |
                Q(created_by__email__in=test_emails) |
                Q(offer__deal__reference_number__in=test_deal_refs)
            ).delete()
            SessionAccess.objects.filter(
                Q(session__tender__reference_number__in=test_deal_refs) |
                Q(operator__email__in=test_emails)
            ).delete()
            OpeningSession.objects.filter(
                Q(tender__reference_number__in=test_deal_refs) |
                Q(created_by__email__in=test_emails)
            ).delete()
            BidOffer.objects.filter(
                Q(deal__reference_number__in=test_deal_refs) |
                Q(operator__email__in=test_emails)
            ).delete()
            ProcurementDeal.objects.filter(reference_number__in=test_deal_refs).delete()
            CustomUser.objects.filter(email__in=test_emails).delete()
            AuditLog.objects.filter(description__contains='[SEED]').delete()
            self.stdout.write(self.style.SUCCESS('تم تنظيف البيانات التجريبية بنجاح.'))

        self.stdout.write(self.style.NOTICE('بدء عملية بذر البيانات المؤسسية (Idempotent)...'))
        now = timezone.now()

        # 4. إنشاء المؤسسات والحسابات المؤسسية للأدوار الثلاثة + متعامل منافس
        authority_user, created_auth = CustomUser.objects.get_or_create(
            email='authority@safaqat.dz',
            defaults={
                'display_name': 'عمر بن سالم (مسؤول الصفقات)',
                'organization_name': 'مديرية التجهيزات العمومية - ولاية الجزائر',
                'role': 'authority',
                'is_active': True,
                'is_staff': True,
            }
        )
        if created_auth:
            authority_user.set_password(test_password)
            authority_user.save()
            self.stdout.write(self.style.SUCCESS('تم إنشاء حساب المصلحة المتعاقدة: authority@safaqat.dz'))
        else:
            self.stdout.write(self.style.NOTICE('حساب المصلحة المتعاقدة موجود مسبقاً.'))

        operator_user, created_op = CustomUser.objects.get_or_create(
            email='operator@safaqat.dz',
            defaults={
                'display_name': 'رشيد بلقاسم (المسير العام)',
                'organization_name': 'مؤسسة الجزائر الحديثة للأشغال والمنشآت الكبرى',
                'role': 'operator',
                'is_active': True,
            }
        )
        if created_op:
            operator_user.set_password(test_password)
            operator_user.save()
            self.stdout.write(self.style.SUCCESS('تم إنشاء حساب المتعامل الاقتصادي: operator@safaqat.dz'))
        else:
            self.stdout.write(self.style.NOTICE('حساب المتعامل الاقتصادي موجود مسبقاً.'))

        operator2_user, created_op2 = CustomUser.objects.get_or_create(
            email='operator2@safaqat.dz',
            defaults={
                'display_name': 'كمال عمار (مدير المناقصات)',
                'organization_name': 'شركة البناء والري الجزائرية الحديثة',
                'role': 'operator',
                'is_active': True,
            }
        )
        if created_op2:
            operator2_user.set_password(test_password)
            operator2_user.save()
            self.stdout.write(self.style.SUCCESS('تم إنشاء حساب المتعامل المنافس: operator2@safaqat.dz'))
        else:
            self.stdout.write(self.style.NOTICE('حساب المتعامل المنافس موجود مسبقاً.'))

        admin_user, created_adm = CustomUser.objects.get_or_create(
            email='admin@safaqat.dz',
            defaults={
                'display_name': 'المفتش المركزي للرقابة والمتابعة',
                'organization_name': 'المفتشية العامة للصفقات والمشتريات العمومية',
                'role': 'central_admin',
                'is_active': True,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created_adm:
            admin_user.set_password(test_password)
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('تم إنشاء حساب الرقابة والإدارة المركزية: admin@safaqat.dz'))
        else:
            self.stdout.write(self.style.NOTICE('حساب الرقابة المركزية موجود مسبقاً.'))

        # 5. إنشاء ثلاث صفقات تمثل مراحل دورة الحياة القانونية (تخطيط، نشر واستلام، تنفيذ)

        # الصفقة 1: مرحلة التخطيط وإعداد كراس الشروط (المرحلة 01)
        deal_plan, created_plan = ProcurementDeal.objects.get_or_create(
            reference_number='DTP-DZ-2026-PLAN-01',
            defaults={
                'title': 'دراسة ومتابعة إنجاز عيادة متعددة الخدمات ببلدية الرغاية',
                'description': 'مشروع قطاعي ممركز في مرحلة التحضير وإعداد كراس الشروط وضبط الحاجات التقديرية.',
                'authority': authority_user,
                'current_stage': 1,
                'estimated_budget': Decimal('35000000.00'),
                'wilaya': DEFAULT_WILAYA,
                'submission_deadline': now + timedelta(days=60),
            }
        )
        # دفتر شروط مسودة للصفقة 1
        CahierSpecs.objects.get_or_create(
            deal=deal_plan,
            defaults={
                'administrative_clauses': {
                    'legal_basis': 'المادة 20 من القانون رقم 23-12 (تحديد الحاجات)',
                    'procedure_type': 'طلب عروض مفتوح مع اشتراط قدرات دنيا',
                },
                'technical_requirements': {
                    'scope': 'إعداد المخططات المعمارية ومتابعة الورشة',
                    'duration_months': 6,
                },
                'financial_criteria': {
                    'selection_method': 'أحسن عرض تقني ومالي',
                },
                'is_validated': False,
            }
        )
        if created_plan:
            self.stdout.write(self.style.SUCCESS(f'تم إنشاء صفقة مرحلة التخطيط: {deal_plan.reference_number}'))
            AuditLog.objects.create(
                user=authority_user,
                action='DEAL_PLANNED',
                resource_type='ProcurementDeal',
                resource_id=str(deal_plan.id),
                description=f'[SEED] تسجيل عملية التخطيط وتحديد الحاجات للصفقة {deal_plan.reference_number}.',
                changes={'stage': 1, 'status': 'planning'},
                ip_address='127.0.0.1'
            )

        # الصفقة 2: مرحلة نشر الإعلان واستلام العروض (المرحلة 04) مع عرضين متنافسين
        deal_pub, created_pub = ProcurementDeal.objects.get_or_create(
            reference_number='DTP-DZ-2026-042',
            defaults={
                'title': 'إنجاز مجمع مدرسي صنف (ج) ومطعم مدرسي ببلدية زرالدة',
                'description': 'مشروع بناء منشأة تعليمية متكاملة تتضمن 12 قاعة تدريس ومطعم يوفر 200 وجبة يومياً ومرافق رياضية وإدارية.',
                'authority': authority_user,
                'current_stage': 4,
                'estimated_budget': Decimal('145000000.00'),
                'wilaya': DEFAULT_WILAYA,
                'submission_deadline': now + timedelta(days=15),
            }
        )
        # دفتر شروط مؤشر عليه للصفقة 2
        CahierSpecs.objects.get_or_create(
            deal=deal_pub,
            defaults={
                'administrative_clauses': {
                    'legal_basis': 'القانون رقم 23-12 المتعلق بالمشتريات العمومية',
                    'guarantee_deposit': '2% من مبلغ العرض كضمان التعهد',
                    'submission_rules': 'إيداع إلكتروني مشفر عبر المنصة الرسمية',
                },
                'technical_requirements': {
                    'structural_specs': 'هيكل خرساني مسلح مقاوم للزلازل حسب RPA 99/2003',
                    'timeline_months': 10,
                    'execution_standard': 'كراس الشروط التقنية العامة (CCTG)',
                },
                'financial_criteria': {
                    'scoring_system': 'العرض الأقل ثمناً من بين العروض المؤهلة تقنياً (Mieux disant)',
                    'technical_weight': 60,
                    'financial_weight': 40,
                },
                'is_validated': True,
            }
        )
        # إنشاء عرضين متنافسين للصفقة 2
        bid_1, _ = BidOffer.objects.get_or_create(
            deal=deal_pub,
            operator=operator_user,
            defaults={
                'status': 'submitted',
                'financial_amount': Decimal('138500000.00'),
                'technical_score': Decimal('82.50'),
                'submission_timestamp': now - timedelta(days=2),
            }
        )
        bid_2, _ = BidOffer.objects.get_or_create(
            deal=deal_pub,
            operator=operator2_user,
            defaults={
                'status': 'submitted',
                'financial_amount': Decimal('141200000.00'),
                'technical_score': Decimal('78.00'),
                'submission_timestamp': now - timedelta(days=1),
            }
        )
        if created_pub:
            self.stdout.write(self.style.SUCCESS(f'تم إنشاء صفقة النشر واستلام العروض (عرضان): {deal_pub.reference_number}'))
            AuditLog.objects.create(
                user=authority_user,
                action='DEAL_PUBLISHED',
                resource_type='ProcurementDeal',
                resource_id=str(deal_pub.id),
                description=f'[SEED] نشر إعلان المناقصة واستلام العروض للصفقة {deal_pub.reference_number}.',
                changes={'stage': 4, 'bids_count': 2},
                ip_address='127.0.0.1'
            )

        # الصفقة 3: في مرحلة الإسناد والتعاقد والتنفيذ والمتابعة المالية (المراحل 08-12)
        deal_exec, created_exec = ProcurementDeal.objects.get_or_create(
            reference_number='DWH-DZ-2025-089',
            defaults={
                'title': 'أشغال تهيئة وصيانة المحاور الحضرية وتحديث شبكة الإنارة العمومية الذكية',
                'description': 'مشروع البنية التحتية للطرق الحضرية وتجهيزها بنظام إنارة LED ذكي موفر للطاقة ببلدية سيدي امحمد.',
                'authority': authority_user,
                'current_stage': 10,
                'estimated_budget': Decimal('62000000.00'),
                'wilaya': DEFAULT_WILAYA,
                'submission_deadline': now - timedelta(days=120),
            }
        )
        # دفتر شروط مؤشر عليه للصفقة 3
        CahierSpecs.objects.get_or_create(
            deal=deal_exec,
            defaults={
                'administrative_clauses': {
                    'legal_basis': 'القانون 23-12 والمرسوم الرئاسي 15-247',
                    'guarantee_period_months': 12,
                },
                'technical_requirements': {
                    'energy_rating': 'كفاءة طاقة A+',
                    'standards': 'معايير الإشارات والإنارة المعتمدة',
                },
                'financial_criteria': {
                    'pricing_structure': 'جدول أسعار بالوحدة (BPU)',
                },
                'is_validated': True,
            }
        )
        # العرض الفائز للصفقة 3
        winning_bid, _ = BidOffer.objects.get_or_create(
            deal=deal_exec,
            operator=operator_user,
            defaults={
                'status': 'awarded',
                'financial_amount': Decimal('59800000.00'),
                'technical_score': Decimal('89.00'),
                'submission_timestamp': now - timedelta(days=125),
            }
        )
        # قرار الإسناد المؤقت مع مهلة طعن 10 أيام
        award_dec, _ = AwardDecision.objects.get_or_create(
            deal=deal_exec,
            defaults={
                'awarded_bid': winning_bid,
                'publication_date': (now - timedelta(days=110)).date(),
                'appeal_window_days': 10,
                'appeal_status': 'none',
                'is_definitive': True,
                'justification': 'تم إسناد الصفقة لمؤسسة الجزائر الحديثة لحيازتها العرض المؤهل تقنياً والأقل ثمناً بعد انقضاء أجل الطعون (10 أيام) دون طعن مقبول.',
            }
        )
        # العقد الرسمي المرتبط بالعرض الفائز
        contract, _ = Contract.objects.get_or_create(
            deal=deal_exec,
            defaults={
                'awarded_operator': operator_user,
                'contract_number': 'CONT-2025-0089/DWH',
                'signed_amount': Decimal('59800000.00'),
                'duration_months': 8,
                'ods_date': (now - timedelta(days=90)).date(),
                'status': 'active',
            }
        )
        # محطات التنفيذ (ExecutionMilestone)
        ExecutionMilestone.objects.get_or_create(
            contract=contract,
            title='تهيئة المسالك وأشغال نزع الطبقات القديمة والحفر',
            defaults={
                'planned_completion_date': (now - timedelta(days=60)).date(),
                'actual_completion_date': (now - timedelta(days=58)).date(),
                'progress_percentage': 100,
                'status': 'approved',
            }
        )
        ExecutionMilestone.objects.get_or_create(
            contract=contract,
            title='تعبيد المسالك بالخرسانة الزفتية وتثبيت أعمدة الإنارة',
            defaults={
                'planned_completion_date': (now + timedelta(days=30)).date(),
                'progress_percentage': 65,
                'status': 'in_progress',
            }
        )
        # ملحق الصفقة (ContractAmendment)
        ContractAmendment.objects.get_or_create(
            contract=contract,
            amendment_number=1,
            defaults={
                'object_clause': 'تعديل مسار كوابل الإنارة لتفادي شبكة الألياف البصرية القديمة',
                'financial_impact': Decimal('0.00'),
                'duration_extension_days': 15,
                'justification': 'مبررات تقنية طارئة معتمدة من المصالح التقنية البلدية ولجنة الصفقات.',
                'status': 'approved',
            }
        )
        # محضر الاستلام المؤقت (ReceptionProcess)
        ReceptionProcess.objects.get_or_create(
            contract=contract,
            reception_type='provisional',
            defaults={
                'reception_date': (now - timedelta(days=55)).date(),
                'committee_members': 'مهندس الأشغال العمومية، رئيس المصلحة التقنية، ممثل المقاولة',
                'reservations': 'لا توجد تحفظات مسجلة على ورشة الحفر.',
                'is_accepted_without_reservation': True,
                'guarantee_release_approved': False,
            }
        )
        # وضعية الدفع (PaymentSituation)
        PaymentSituation.objects.get_or_create(
            contract=contract,
            situation_number=1,
            defaults={
                'period_start': (now - timedelta(days=90)).date(),
                'period_end': (now - timedelta(days=45)).date(),
                'gross_amount': Decimal('22000000.00'),
                'deductions': Decimal('1100000.00'),
                'net_payable_amount': Decimal('20900000.00'),
                'status': 'paid',
                'payment_reference': 'MANDAT-TRESOR-2026-904',
            }
        )
        if created_exec:
            self.stdout.write(self.style.SUCCESS(f'تم إنشاء صفقة التعاقد والتنفيذ: {deal_exec.reference_number}'))
            # تسجيل العمليات الحساسة في AuditLog
            AuditLog.objects.create(
                user=authority_user,
                action='PROVISIONAL_AWARD_ANNOUNCED',
                resource_type='AwardDecision',
                resource_id=str(award_dec.id),
                description=f'[SEED] الإسناد المؤقت والنهائي للصفقة {deal_exec.reference_number} بعد مهلة 10 أيام للطعون.',
                changes={'awarded_operator': operator_user.email, 'appeal_window': 10},
                ip_address='127.0.0.1'
            )
            AuditLog.objects.create(
                user=authority_user,
                action='CONTRACT_SIGNED',
                resource_type='Contract',
                resource_id=str(contract.id),
                description=f'[SEED] إبرام وتوقيع العقد الرسمي {contract.contract_number} بمبلغ {contract.signed_amount} دج.',
                changes={'status': 'active', 'amount': str(contract.signed_amount)},
                ip_address='127.0.0.1'
            )
            AuditLog.objects.create(
                user=authority_user,
                action='PAYMENT_MANDATED',
                resource_type='PaymentSituation',
                resource_id=str(contract.id),
                description=f'[SEED] إصدار حوالة الدفع رقم MANDAT-TRESOR-2026-904 للعقد {contract.contract_number}.',
                changes={'net_amount': '20900000.00', 'status': 'paid'},
                ip_address='127.0.0.1'
            )

        # 6. تسجيل أن بوابة الذكاء الاصطناعي استشارية بحتة دون أي صفة تقريرية
        AuditLog.objects.get_or_create(
            resource_type='AIGateway',
            resource_id='SYS-AI-GOV-01',
            defaults={
                'user': admin_user,
                'action': 'AI_POLICY_CHECK',
                'description': '[SEED] تأكيد سياسة بوابة الذكاء الاصطناعي: استشارية فقط ولا تملك أي سلطة تعديل أو إسناد.',
                'changes': {'is_advisory_only': True, 'executive_authority': False},
                'ip_address': '127.0.0.1'
            }
        )

        self.stdout.write(self.style.SUCCESS('اكتمل أمر بذر البيانات المؤسسية بنجاح تام وبشكل idempotent!'))
