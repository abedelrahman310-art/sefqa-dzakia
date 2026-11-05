"""
أمر الإدارة الآمن: purge_demo_data
منصة صفقات ذكية — تنظيف وتصفير البيانات التجريبية لحسابات وبيانات الاختبار.

القواعد الصارمة:
1. لا يحذف أي حساب مسؤول خارق (is_superuser=True) أو موظف إداري رسمي (is_staff=True).
2. يحذف الصفقات والعروض والدفاتر المرتبطة بحسابات الاختبار والبيانات التجريبية فقط.
3. يتطلب راية --confirm صريحة لمنع التنفيذ العرضي في بيئات العمل.
4. يوفر وضع المحاكاة --dry-run لمعاينة السجلات قبل التنفيذ الفعلي.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from apps.users.models import CustomUser, OperatorProfile
from apps.procurements.models import ProcurementDeal, CahierSpecs, OpeningSession, SessionAccess, OpeningEvent
from apps.bids.models import BidOffer
from apps.contracts.models import AwardDecision, AwardObjection, Contract
from apps.execution.models import ExecutionMilestone, ContractAmendment, ReceptionProcess, PaymentSituation
from apps.audit.models import AuditLog


class Command(BaseCommand):
    help = 'تنظيف وتصفير البيانات والصفقات التجريبية بأمان دون المساس بالحسابات الإدارية الرسمية'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='تأكيد صريح لتنفيذ عملية التصفير والحذف الفعلي',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='معاينة السجلات التي سيتم تنظيفها دون حذف فعلي',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        confirm = options.get('confirm', False)

        if not confirm and not dry_run:
            raise CommandError(
                'تم إيقاف العملية للحماية: يجب تمرير الراية --confirm للتنفيذ الفعلي، '
                'أو استخدام --dry-run للمعاينة دون حذف.'
            )

        self.stdout.write(self.style.NOTICE(
            '=== [صفقات ذكية] فحص وتنظيف البيانات التجريبية للمنصة ==='
        ))

        # 1. تحديد المستخدمين التجريبيين (استثناء صارم للمسؤولين الخارقين والموظفين الرسميين)
        demo_emails = [
            'operator@safaqat.dz',
            'operator2@safaqat.dz',
            'operator3@safaqat.dz',
            'operator4@safaqat.dz',
            'auth_oran@safaqat.dz',
            'auth_constantine@safaqat.dz',
            'auth_tizi@safaqat.dz',
            'auth_setif@safaqat.dz',
        ]
        
        # حماية صارمة: منع حذف أي حساب يملك صلاحيات superuser أو staff
        demo_users_qs = CustomUser.objects.filter(
            email__in=demo_emails,
            is_superuser=False,
            is_staff=False,
        )
        demo_users_count = demo_users_qs.count()

        # 2. تحديد الصفقات التجريبية
        demo_deals_qs = ProcurementDeal.objects.filter(
            reference_number__icontains='DEMO'
        ) | ProcurementDeal.objects.filter(
            title__icontains='تجريب'
        ) | ProcurementDeal.objects.filter(
            authority__in=demo_users_qs
        )
        demo_deals_count = demo_deals_qs.count()
        demo_deal_ids = list(demo_deals_qs.values_list('id', flat=True))

        # 3. إحصاء السجلات التابعة
        offers_count = BidOffer.objects.filter(deal_id__in=demo_deal_ids).count()
        cahiers_count = CahierSpecs.objects.filter(deal_id__in=demo_deal_ids).count()
        sessions_count = OpeningSession.objects.filter(deal_id__in=demo_deal_ids).count()
        awards_count = AwardDecision.objects.filter(deal_id__in=demo_deal_ids).count()
        contracts_count = Contract.objects.filter(deal_id__in=demo_deal_ids).count()
        contract_ids = list(Contract.objects.filter(deal_id__in=demo_deal_ids).values_list('id', flat=True))
        milestones_count = ExecutionMilestone.objects.filter(contract_id__in=contract_ids).count()
        amendments_count = ContractAmendment.objects.filter(contract_id__in=contract_ids).count()
        receptions_count = ReceptionProcess.objects.filter(contract_id__in=contract_ids).count()
        payments_count = PaymentSituation.objects.filter(contract_id__in=contract_ids).count()

        # التدقيق
        audit_count = AuditLog.objects.filter(details__deal_id__in=[str(d) for d in demo_deal_ids]).count()

        self.stdout.write(f"• صفقات تجريبية مستهدفة: {demo_deals_count}")
        self.stdout.write(f"• عروض أظرفة تجريبية: {offers_count}")
        self.stdout.write(f"• دفاتر شروط تجريبية: {cahiers_count}")
        self.stdout.write(f"• جلسات فتح أظرفة: {sessions_count}")
        self.stdout.write(f"• قرارات منح مؤقت: {awards_count}")
        self.stdout.write(f"• عقود وملاحق تنفيذ: {contracts_count + milestones_count + amendments_count + receptions_count + payments_count}")
        self.stdout.write(f"• مستخدمون تجريبيون (غير إداريين): {demo_users_count}")

        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                '\n[محاكاة ناجحة --dry-run]: لم يتم حذف أي سجل من قاعدة البيانات.'
            ))
            return

        # تنفيذ الحذف داخل معاملة ذرية آمنة
        with transaction.atomic():
            # حذف السجلات التابعة أولاً
            PaymentSituation.objects.filter(contract_id__in=contract_ids).delete()
            ReceptionProcess.objects.filter(contract_id__in=contract_ids).delete()
            ContractAmendment.objects.filter(contract_id__in=contract_ids).delete()
            ExecutionMilestone.objects.filter(contract_id__in=contract_ids).delete()
            Contract.objects.filter(deal_id__in=demo_deal_ids).delete()
            AwardObjection.objects.filter(deal_id__in=demo_deal_ids).delete()
            AwardDecision.objects.filter(deal_id__in=demo_deal_ids).delete()
            OpeningEvent.objects.filter(session__deal_id__in=demo_deal_ids).delete()
            SessionAccess.objects.filter(session__deal_id__in=demo_deal_ids).delete()
            OpeningSession.objects.filter(deal_id__in=demo_deal_ids).delete()
            BidOffer.objects.filter(deal_id__in=demo_deal_ids).delete()
            CahierSpecs.objects.filter(deal_id__in=demo_deal_ids).delete()
            demo_deals_qs.delete()
            
            # حذف المستخدمين التجريبيين المحميين
            OperatorProfile.objects.filter(user__in=demo_users_qs).delete()
            demo_users_qs.delete()

            self.stdout.write(self.style.SUCCESS(
                '\n✅ [تم بنجاح]: تم تنظيف وتصفير جميع البيانات التجريبية بأمان، '
                'مع الحفاظ التام على الحسابات الإدارية والمشرفين الرسميين.'
            ))
