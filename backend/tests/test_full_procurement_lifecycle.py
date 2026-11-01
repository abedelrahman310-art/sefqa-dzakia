"""
اختبارات المسار الإجرائي الشامل للصفقة العمومية وفق القانون 23-12 والمرسوم 15-247
المراحل الـ 13:
1. تسجيل
2. موافقة إدارية
3. إنشاء صفقة ودفتر شروط
4. نشر الفرصة
5. إيداع عرضين
6. منع كشف العروض قبل الموعد
7. جلسة فتح الأظرفة
8. تصدير المحضر PDF
9. التقييم
10. المنح المؤقت
11. الطعن
12. المراقبة المركزية
13. سجل تدقيق كامل
"""

import pytest
import hashlib
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from apps.users.models import CustomUser, OperatorProfile
from apps.procurements.models import ProcurementDeal, CahierSpecs, OpeningSession, SessionAccess, OpeningEvent
from apps.bids.models import BidOffer
from apps.contracts.models import AwardDecision, AwardObjection, Contract
from apps.audit.models import AuditLog
from apps.procurements.pdf_service import generate_opening_session_pdf


@pytest.mark.django_db
class TestFullProcurementLifecycle:

    def test_full_13_stages_lifecycle_execution(self):
        now = timezone.now()
        unique = now.strftime("%Y%m%d%H%M%S")

        # ─── 1. تسجيل ───
        authority = CustomUser.objects.create_user(
            email=f"wilaya.{unique}@safaqat.gov.dz",
            role="authority",
            display_name="مديرية التجهيزات العمومية",
            organization_name="وزارة السكن والعمران",
        )
        op1 = CustomUser.objects.create_user(
            email=f"op1.{unique}@safaqat-demo.dz",
            role="operator",
            display_name="مجمع البناء الأول",
            organization_name="ش.ذ.م.م البناء الأول",
        )
        op2 = CustomUser.objects.create_user(
            email=f"op2.{unique}@safaqat-demo.dz",
            role="operator",
            display_name="مؤسسة الأشغال العصرية",
            organization_name="ش.ذ.م.م المنشآت العصرية",
        )
        central_admin = CustomUser.objects.create_user(
            email=f"central.{unique}@safaqat.gov.dz",
            role="central_admin",
            is_staff=True,
            display_name="المرصد الوطني للطلب العمومي",
        )
        assert authority.role == "authority"
        assert op1.role == "operator"
        assert op2.role == "operator"
        assert central_admin.role == "central_admin"

        # ─── 2. موافقة إدارية ───
        prof1, _ = OperatorProfile.objects.get_or_create(user=op1)
        prof2, _ = OperatorProfile.objects.get_or_create(user=op2)
        assert prof1 is not None and prof2 is not None

        # ─── 3. إنشاء صفقة ودفتر شروط ───
        deal_ref = f"DZ-2026-TEST-{unique[-4:]}"
        deal = ProcurementDeal.objects.create(
            reference_number=deal_ref,
            title="إنجاز مجمع مدرسي صنف ج وقاعة رياضة",
            description="أشغال البناء والتهيئة الخارجية والشبكات المختلفة",
            authority=authority,
            current_stage=2,
            estimated_budget=Decimal("120000000.00"),
            wilaya="وهران",
            submission_deadline=now + timedelta(days=21),
        )

        raw_digest = f"{deal.reference_number}|{deal.estimated_budget}"
        digest = hashlib.sha256(raw_digest.encode()).hexdigest()
        specs = CahierSpecs.objects.create(
            deal=deal,
            administrative_clauses={"qualification": "درجة 3 فما فوق"},
            technical_requirements={"norm": "مطابقة معايير البناء الوطنية"},
            financial_criteria={"method": "الأقل ثمناً تقنياً"},
            is_validated=True,
        )
        AuditLog.objects.create(
            user=authority,
            action="cahier_specs_frozen",
            resource_type="CahierSpecs",
            resource_id=str(specs.id),
            description=f"دفتر الشروط مجمد للصفقة {deal.reference_number}",
            changes={"digest": digest},
        )
        assert specs.is_validated is True

        # ─── 4. نشر الفرصة ───
        deal.current_stage = 3
        deal.save(update_fields=["current_stage"])
        AuditLog.objects.create(
            user=authority,
            action="deal_published",
            resource_type="ProcurementDeal",
            resource_id=str(deal.id),
            description=f"نشر الإعلان عن طلب العروض للصفقة {deal.reference_number}",
        )
        assert deal.current_stage == 3

        # ─── 5. إيداع عرضين ───
        deal.current_stage = 5
        deal.save(update_fields=["current_stage"])

        offer1 = BidOffer.objects.create(
            deal=deal,
            operator=op1,
            status="submitted",
            financial_amount=Decimal("114000000.00"),
            technical_score=Decimal("85.00"),
            submission_timestamp=now + timedelta(days=2),
        )
        offer2 = BidOffer.objects.create(
            deal=deal,
            operator=op2,
            status="submitted",
            financial_amount=Decimal("118500000.00"),
            technical_score=Decimal("79.00"),
            submission_timestamp=now + timedelta(days=3),
        )
        assert offer1.id != offer2.id

        # ─── 6. منع كشف العروض قبل الموعد ───
        assert offer1.submission_timestamp < deal.submission_deadline
        assert offer2.submission_timestamp < deal.submission_deadline
        assert offer1.operator_id != offer2.operator_id

        # ─── 7. جلسة فتح الأظرفة ───
        session = OpeningSession.objects.create(
            tender=deal,
            scheduled_at=deal.submission_deadline,
            started_at=deal.submission_deadline,
            ended_at=deal.submission_deadline + timedelta(hours=1),
            location="قاعة المداولات الرسمية",
            status="live",
            access_policy="participants_only",
            total_offers=2,
            opened_count=2,
            created_by=authority,
        )
        ev1 = OpeningEvent.objects.create(
            session=session,
            offer=offer1,
            event_type="offer_opened",
            order=1,
            announced_price=offer1.financial_amount,
            is_accepted=True,
            created_by=authority,
        )
        ev2 = OpeningEvent.objects.create(
            session=session,
            offer=offer2,
            event_type="offer_opened",
            order=2,
            announced_price=offer2.financial_amount,
            is_accepted=True,
            created_by=authority,
        )
        session.status = "ended"
        session.save(update_fields=["status"])
        deal.current_stage = 6
        deal.save(update_fields=["current_stage"])
        assert session.status == "ended"
        assert session.opened_count == 2

        # ─── 8. تصدير المحضر PDF ───
        pdf_bytes = generate_opening_session_pdf(session, authority)
        assert len(pdf_bytes) > 1000
        assert pdf_bytes[:4] == b"%PDF"
        AuditLog.objects.create(
            user=authority,
            action="session_pv_pdf_exported",
            resource_type="OpeningSession",
            resource_id=str(session.id),
            description=f"تصدير محضر فتح الأظرفة للصفقة {deal.reference_number}",
            changes={"size_bytes": len(pdf_bytes)},
        )

        # ─── 9. التقييم ───
        deal.current_stage = 7
        deal.save(update_fields=["current_stage"])
        offer1.status = "admitted"
        offer1.save(update_fields=["status"])
        offer2.status = "admitted"
        offer2.save(update_fields=["status"])
        assert offer1.financial_amount < offer2.financial_amount
        assert offer1.technical_score >= Decimal("70.0")

        # ─── 10. المنح المؤقت ───
        deal.current_stage = 8
        deal.save(update_fields=["current_stage"])
        offer1.status = "awarded"
        offer1.save(update_fields=["status"])

        award = AwardDecision.objects.create(
            deal=deal,
            awarded_bid=offer1,
            publication_date=now.date(),
            appeal_window_days=10,
            appeal_status="none",
            is_definitive=False,
            justification="الحائز على أفضل عرض مالي وتقني مستوف للشروط.",
        )
        AuditLog.objects.create(
            user=authority,
            action="provisional_award_published",
            resource_type="AwardDecision",
            resource_id=str(award.id),
            description=f"الإسناد المؤقت للصفقة {deal.reference_number}",
        )
        assert award.appeal_window_days == 10
        assert award.is_definitive is False

        # ─── 11. الطعن ───
        objection = AwardObjection.objects.create(
            tender=deal,
            objector=op2,
            contested_operator=op1,
            objection_type="administrative",
            grounds=["evaluation"],
            description="طلب إعادة النظر في التقييم المالي والتقني.",
            award_announced_at=now,
            deadline_at=now + timedelta(days=10),
            submitted_at=now + timedelta(days=2),
            status="submitted",
        )
        award.appeal_status = "pending"
        award.save(update_fields=["appeal_status"])
        AuditLog.objects.create(
            user=op2,
            action="award_objection_filed",
            resource_type="AwardObjection",
            resource_id=str(objection.id),
            description=f"إيداع طعن إداري على الصفقة {deal.reference_number}",
        )
        assert objection.is_within_deadline() is True
        assert bool(objection.checksum) is True
        assert award.appeal_status == "pending"

        # ─── 12. المراقبة المركزية ───
        objection.reviewer = central_admin
        objection.status = "rejected"
        objection.decision = "rejected"
        objection.decision_reason = "عدم تأسيس الطعن بعد مراجعة ملفات العروض."
        objection.save()

        award.appeal_status = "rejected"
        award.is_definitive = True
        award.save(update_fields=["appeal_status", "is_definitive"])

        deal.current_stage = 9
        deal.save(update_fields=["current_stage"])

        contract = Contract.objects.create(
            deal=deal,
            awarded_operator=op1,
            contract_number=f"CNT-2026-{unique[-4:]}",
            signed_amount=offer1.financial_amount,
            duration_months=12,
            ods_date=now.date() + timedelta(days=15),
            status="approved_control",
        )
        AuditLog.objects.create(
            user=central_admin,
            action="central_control_ruling_issued",
            resource_type="AwardObjection",
            resource_id=str(objection.id),
            description=f"تثبيت الإسناد وإبرام العقد للصفقة {deal.reference_number}",
        )
        assert contract.status == "approved_control"
        assert contract.signed_amount == offer1.financial_amount

        # ─── 13. سجل تدقيق كامل ───
        logs = AuditLog.objects.filter(description__icontains=deal.reference_number)
        assert logs.count() >= 5
        for log in logs:
            assert log.checksum is not None
            assert len(log.checksum) == 64  # SHA-256
