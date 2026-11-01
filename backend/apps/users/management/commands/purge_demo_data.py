import logging
from django.core.management.base import BaseCommand
from django.db import transaction

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

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "تصفير المنصة بالكامل وحذف كافة الصفقات والعروض والبيانات الوهمية التجريبية لضمان بدء المستخدمين الجدد من الصفر"

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='تأكيد تنفيذ الحذف والتصفير الفعلي للبيانات الوهمية',
        )

    def handle(self, *args, **options):
        if not options.get('confirm'):
            self.stdout.write(
                self.style.WARNING(
                    "⚠️ تحذير: هذا الأمر سيقوم بتصفير وحذف جميع الصفقات والعروض والبيانات الوهمية!\n"
                    "لتأكيد العملية، يرجى التمرير مع المعامل --confirm:\n"
                    "python manage.py purge_demo_data --confirm"
                )
            )
            return

        self.stdout.write(self.style.NOTICE("🚀 بدء عملية التصفير وتطهير المنصة من البيانات والصفقات الوهمية..."))

        with transaction.atomic():
            # 1. حذف مدفوعات ومراحل التنفيذ التعاقدي
            p_count, _ = PaymentSituation.objects.all().delete()
            r_count, _ = ReceptionProcess.objects.all().delete()
            ca_count, _ = ContractAmendment.objects.all().delete()
            em_count, _ = ExecutionMilestone.objects.all().delete()
            self.stdout.write(f"✓ تم حذف {p_count} وضعية دفع و {em_count} مرحلة تنفيذية.")

            # 2. حذف عقود الصفقات وقرارات والطعون
            ot_count, _ = ObjectionTimeline.objects.all().delete()
            ao_count, _ = AwardObjection.objects.all().delete()
            ad_count, _ = AwardDecision.objects.all().delete()
            cc_count, _ = ContContract.objects.all().delete()
            pc_count, _ = ProcContract.objects.all().delete()
            self.stdout.write(f"✓ تم حذف {cc_count + pc_count} عقداً و {ad_count} قرار إسناد و {ao_count} طعناً.")

            # 3. حذف مراحل الصفقات وتقارير الإنجاز
            mpr_count, _ = MilestoneProgressReport.objects.all().delete()
            m_count, _ = Milestone.objects.all().delete()
            self.stdout.write(f"✓ تم حذف {m_count} مرحلة صفقة.")

            # 4. حذف أحداث وجلسات فتح الأظرفة (يجب أن يتم قبل حذف العروض لأن OpeningEvent يشير إلى BidOffer بـ on_delete=PROTECT)
            oe_count, _ = OpeningEvent.objects.all().delete()
            sa_count, _ = SessionAccess.objects.all().delete()
            os_count, _ = OpeningSession.objects.all().delete()
            self.stdout.write(f"✓ تم حذف {os_count} جلسة فتح أظرفة و {oe_count} حدث جلسة.")

            # 5. حذف وثائق العروض والعروض نفسها
            od_count, _ = OfferDocument.objects.all().delete()
            bids_count, _ = BidOffer.objects.all().delete()
            self.stdout.write(f"✓ تم حذف {bids_count} عرضاً و {od_count} وثيقة عرض.")

            # 6. حذف دفاتر الشروط
            cs_count, _ = CahierSpecs.objects.all().delete()
            self.stdout.write(f"✓ تم حذف {cs_count} دفتر شروط ومواصفات.")

            # 7. حذف كافة الصفقات العمومية
            deals_count, _ = ProcurementDeal.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(f"✓ تم تصفير وحذف {deals_count} صفقة عمومية بالكامل."))

            # 8. حذف إشعارات وتنبيهات الذكاء الاصطناعي والمحادثات
            aim_count, _ = AIMessage.objects.all().delete()
            aic_count, _ = AIConversation.objects.all().delete()
            aii_count, _ = AIInsight.objects.all().delete()
            notif_count, _ = Notification.objects.all().delete()
            self.stdout.write(f"✓ تم حذف {aii_count} إنذار ذكاء اصطناعي و {notif_count} إشعار.")

            # 9. تنظيف الحسابات التجريبية الوهمية من جدول المستخدمين
            # مع الاحتفاظ بالحسابات الحقيقية مثل abedel@gmail.com, kar7@gmail.com والحساب الرئيسي admin@safaqat.dz
            demo_users_qs = CustomUser.objects.filter(
                is_superuser=False,
            ).filter(
                email__startswith='auth_'
            ) | CustomUser.objects.filter(
                is_superuser=False,
                email__startswith='operator_'
            ) | CustomUser.objects.filter(
                is_superuser=False,
                email__startswith='operator2'
            ) | CustomUser.objects.filter(
                is_superuser=False,
                email__startswith='operator3'
            ) | CustomUser.objects.filter(
                is_superuser=False,
                email__startswith='operator4'
            ) | CustomUser.objects.filter(
                is_superuser=False,
                email__startswith='curl_'
            ) | CustomUser.objects.filter(
                is_superuser=False,
                email__startswith='central_test'
            ) | CustomUser.objects.filter(
                is_superuser=False,
                email__in=['operator@safaqat.dz', 'authority@safaqat.dz']
            )

            demo_count = demo_users_qs.count()
            demo_users_qs.delete()
            self.stdout.write(self.style.SUCCESS(f"✓ تم حذف {demo_count} حساب تجريبي وهمي بنجاح."))

        self.stdout.write(self.style.SUCCESS("✅ اكتملت عملية التصفير بنجاح! المنصة الآن نظيفة 100% وخالية من أي صفقات أو بيانات وهمية."))
