"""
أمر إدارة آمن لتصفير وتهيئة منصة صفقات ذكية لبيئة العمل الإنتاجية الحقيقية
وفق أحكام القانون رقم 23-12 والمرسوم الرئاسي 15-247.

يقوم هذا الأمر بما يلي:
1. تصفير وحذف جميع الصفقات العمومية والعروض ودفاتر الشروط والوثائق المرفقة.
2. حذف جلسات فتح الأظرفة ومحاضر الفتح وتقارير تقييم العروض والطعون ومراحل التنفيذ.
3. حذف الإشعارات وتنبيهات الذكاء الاصطناعي والمحادثات وشبهات التواطؤ.
4. حذف جميع المستخدمين التجريبيين والمتعاملين الوهميين.
5. الحفاظ الصارم والآمن على حسابات الإدارة والمشرفين الرسميين (Superusers / Official Staff).
6. طباعة تقرير إحصائي مفصل بالبيانات المحذوفة وتأكيد نظافة المنصة 100%.
"""

import logging
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model

from apps.users.models import CustomUser, OperatorProfile, Notification
from apps.procurements.models import (
    ProcurementDeal,
    CahierSpecs,
    OpeningSession,
    SessionAccess,
    OpeningEvent,
    OfferDocument,
    Contract as ProcContract,
    Milestone,
    MilestoneProgressReport,
)
from apps.bids.models import BidOffer
from apps.contracts.models import (
    Contract as ContContract,
    AwardDecision,
    AwardObjection,
    ObjectionTimeline,
)
from apps.execution.models import (
    ExecutionMilestone,
    ContractAmendment,
    ReceptionProcess,
    PaymentSituation,
)
from apps.ai_gateway.models import AIInsight, AIConversation, AIMessage
from apps.audit.models import AuditLog

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "تصفير وتطهير المنصة للإنتاج: حذف الصفقات والعروض والبيانات الوهمية مع الحفاظ على الحسابات الإدارية الرسمية"

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='تأكيد تنفيذ الحذف والتصفير الفعلي للبيانات',
        )
        parser.add_argument(
            '--preserve-admin-emails',
            nargs='*',
            default=['admin@safaqat.dz', 'abedel@gmail.com', 'kar7@gmail.com'],
            help='قائمة بعناوين البريد الإلكتروني للمسؤولين الرسميين المطلوب حمايتها من الحذف',
        )

    def handle(self, *args, **options):
        if not options.get('confirm'):
            self.stdout.write(
                self.style.WARNING(
                    "\n⚠️ [تحذير أمني مؤسسي]:\n"
                    "هذا الأمر سيقوم بتصفير المنصة بالكامل وحذف كافة الصفقات والعروض والمراحل والبيانات التجريبية!\n"
                    "لتأكيد العملية، يرجى التمرير مع المعامل --confirm:\n"
                    "  python manage.py reset_production_data --confirm\n"
                )
            )
            return

        self.stdout.write(self.style.NOTICE("🚀 بدء عملية التصفير وتطهير المنصة للإنتاج النظيف..."))

        stats = {}
        with transaction.atomic():
            # 1. حذف مدفوعات ومراحل التنفيذ التعاقدي
            stats['payment_situations'], _ = PaymentSituation.objects.all().delete()
            stats['reception_processes'], _ = ReceptionProcess.objects.all().delete()
            stats['contract_amendments'], _ = ContractAmendment.objects.all().delete()
            stats['execution_milestones'], _ = ExecutionMilestone.objects.all().delete()

            # 2. حذف عقود الصفقات وقرارات الإسناد والطعون
            stats['objection_timelines'], _ = ObjectionTimeline.objects.all().delete()
            stats['award_objections'], _ = AwardObjection.objects.all().delete()
            stats['award_decisions'], _ = AwardDecision.objects.all().delete()
            c1, _ = ContContract.objects.all().delete()
            c2, _ = ProcContract.objects.all().delete()
            stats['contracts'] = c1 + c2

            # 3. حذف مراحل الصفقات وتقارير الإنجاز
            stats['milestone_reports'], _ = MilestoneProgressReport.objects.all().delete()
            stats['milestones'], _ = Milestone.objects.all().delete()

            # 4. حذف أحداث وجلسات فتح الأظرفة
            stats['opening_events'], _ = OpeningEvent.objects.all().delete()
            stats['session_accesses'], _ = SessionAccess.objects.all().delete()
            stats['opening_sessions'], _ = OpeningSession.objects.all().delete()

            # 5. حذف وثائق العروض والعروض التنافسية
            stats['offer_documents'], _ = OfferDocument.objects.all().delete()
            stats['bid_offers'], _ = BidOffer.objects.all().delete()

            # 6. حذف دفاتر الشروط
            stats['cahier_specs'], _ = CahierSpecs.objects.all().delete()

            # 7. حذف كافة الصفقات العمومية
            stats['procurement_deals'], _ = ProcurementDeal.objects.all().delete()

            # 8. حذف إشعارات وتنبيهات ومحادثات الذكاء الاصطناعي
            stats['ai_messages'], _ = AIMessage.objects.all().delete()
            stats['ai_conversations'], _ = AIConversation.objects.all().delete()
            stats['ai_insights'], _ = AIInsight.objects.all().delete()
            stats['notifications'], _ = Notification.objects.all().delete()

            # 9. حذف الحسابات التجريبية والوهمية مع الحفاظ الصارم على المسؤولين الرسميين
            protected_emails = set(options.get('preserve_admin_emails') or [])
            protected_emails.add('admin@safaqat.dz')

            demo_users_qs = CustomUser.objects.filter(
                is_superuser=False,
            ).exclude(
                email__in=protected_emails
            ).filter(
                email__startswith='auth_'
            ) | CustomUser.objects.filter(
                is_superuser=False,
            ).exclude(
                email__in=protected_emails
            ).filter(
                email__startswith='operator_'
            ) | CustomUser.objects.filter(
                is_superuser=False,
            ).exclude(
                email__in=protected_emails
            ).filter(
                email__startswith='operator2'
            ) | CustomUser.objects.filter(
                is_superuser=False,
            ).exclude(
                email__in=protected_emails
            ).filter(
                email__startswith='operator3'
            ) | CustomUser.objects.filter(
                is_superuser=False,
            ).exclude(
                email__in=protected_emails
            ).filter(
                email__startswith='operator4'
            ) | CustomUser.objects.filter(
                is_superuser=False,
            ).exclude(
                email__in=protected_emails
            ).filter(
                email__startswith='curl_'
            ) | CustomUser.objects.filter(
                is_superuser=False,
            ).exclude(
                email__in=protected_emails
            ).filter(
                email__startswith='central_test'
            ) | CustomUser.objects.filter(
                is_superuser=False,
                email__in=['operator@safaqat.dz', 'authority@safaqat.dz']
            )

            stats['deleted_demo_users'] = demo_users_qs.count()
            demo_users_qs.delete()

            # 10. تدوين عملية التصفير في سجل التدقيق المؤسسي
            AuditLog.objects.create(
                action="RESET_PRODUCTION_DATA",
                resource_type="SYSTEM",
                resource_id="ALL",
                description="Platform reset to clean production state under Law 23-12 / Decree 15-247",
                changes=stats,
                ip_address="127.0.0.1",
            )

        self.stdout.write(self.style.SUCCESS("\n" + "=" * 65))
        self.stdout.write(self.style.SUCCESS("📊 تقرير تصفير منصة «صفقات ذكية» للإنتاج الحقيقي"))
        self.stdout.write(self.style.SUCCESS("=" * 65))
        self.stdout.write(f" • صفقات عمومية محذوفة:       {stats['procurement_deals']}")
        self.stdout.write(f" • عروض متعهدين محذوفة:       {stats['bid_offers']}")
        self.stdout.write(f" • دفاتر شروط محذوفة:          {stats['cahier_specs']}")
        self.stdout.write(f" • جلسات فتح أظرفة محذوفة:     {stats['opening_sessions']}")
        self.stdout.write(f" • عقود وملاحق محذوفة:         {stats['contracts']}")
        self.stdout.write(f" • قرارات إسناد وطعون محذوفة:  {stats['award_decisions'] + stats['award_objections']}")
        self.stdout.write(f" • وضعيات دفع ومراحل محذوفة:   {stats['payment_situations'] + stats['execution_milestones']}")
        self.stdout.write(f" • إشعارات وتنبيهات ذكاء اصطناعي: {stats['notifications'] + stats['ai_insights']}")
        self.stdout.write(f" • حسابات تجريبية وهمية محذوفة: {stats['deleted_demo_users']}")
        self.stdout.write("=" * 65)

        # التحقق من سلامة الحسابات الإدارية المتبقية
        admin_count = CustomUser.objects.filter(role__in=['central_admin', 'admin']).count()
        super_count = CustomUser.objects.filter(is_superuser=True).count()
        self.stdout.write(self.style.SUCCESS(f"🛡️ الحسابات الرسمية المحمية: {admin_count} مسؤول إداري / {super_count} مشرف عام"))
        self.stdout.write(self.style.SUCCESS("✅ المنصة جاهزة تماماً للعمل الفعلي المباشر بدون أي صفقات أو بيانات وهمية.\n"))
