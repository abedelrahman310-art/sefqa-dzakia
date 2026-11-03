from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.users.models import CustomUser, OperatorProfile, OperatorDocument
from apps.procurements.models import ProcurementDeal, OfferDocument
from apps.bids.models import BidOffer

class BidSubmissionAndWithdrawalTests(APITestCase):
    def setUp(self):
        # Create Authority User
        self.authority = CustomUser.objects.create_user(
            email='auth_test@safaqat.dz',
            password='Password123!',
            role='authority',
            organization_name='بلدية الاختبار',
        )

        # Create Operator User
        self.operator = CustomUser.objects.create_user(
            email='op_test@safaqat.dz',
            password='Password123!',
            role='operator',
            organization_name='مؤسسة الإنجاز التجريبية',
        )
        self.profile, _ = OperatorProfile.objects.get_or_create(user=self.operator)

        # Create mandatory valid documents for profile
        future = (timezone.now() + timedelta(days=60)).date()
        for doc_type in ['trade_register', 'tax_clearance', 'social_clearance']:
            OperatorDocument.objects.create(
                profile=self.profile,
                document_type=doc_type,
                name=f"وثيقة {doc_type}",
                expiry_date=future,
                is_valid=True,
            )

        # Create Active Deal
        self.deal = ProcurementDeal.objects.create(
            title='مشروع بناء مركز صحي نموذجي',
            reference_number='DEAL-TEST-2026-001',
            authority=self.authority,
            estimated_budget=Decimal('50000000.00'),
            current_stage=4,
            submission_deadline=timezone.now() + timedelta(days=15),
        )

    def test_submit_without_document_is_blocked(self):
        """فحص القفل الوقائي الصارم: منع الإيداع النهائي بدون إرفاق وثيقة العرض"""
        self.client.force_authenticate(user=self.operator)
        payload = {
            'deal': str(self.deal.id),
            'financialOffer': '45000000',
            'status': 'submitted',
        }
        response = self.client.post('/api/offers/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('وثيقة العرض غير مرفقة', str(response.data))

    def test_save_draft_without_document_is_allowed(self):
        """حفظ مسودة العرض بدون وثيقة مسموح ومقبول نظامياً"""
        self.client.force_authenticate(user=self.operator)
        payload = {
            'deal': str(self.deal.id),
            'financialOffer': '45000000',
            'status': 'draft',
        }
        response = self.client.post('/api/offers/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data.get('status'), 'draft')

    def test_submit_with_document_succeeds(self):
        """الإيداع النهائي مع إرفاق وثيقة PDF ينجح ويختم العرض"""
        self.client.force_authenticate(user=self.operator)
        sample_pdf = SimpleUploadedFile("offer_doc.pdf", b"%PDF-1.4 test document content", content_type="application/pdf")
        payload = {
            'deal': str(self.deal.id),
            'financialOffer': '45000000',
            'status': 'submitted',
            'document': sample_pdf,
        }
        response = self.client.post('/api/offers/', payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data.get('status'), 'submitted')
        self.assertTrue(response.data.get('has_document') or response.data.get('hasDocument'))

    def test_withdraw_bid_before_deadline_succeeds(self):
        """حق سحب العرض قانونياً قبل انقضاء الأجل وإعادته إلى مسودة"""
        # Create submitted bid with document
        bid = BidOffer.objects.create(
            deal=self.deal,
            operator=self.operator,
            status='submitted',
            financial_amount=Decimal('45000000.00'),
            submission_timestamp=timezone.now(),
        )
        sample_pdf = SimpleUploadedFile("bid.pdf", b"%PDF-1.4 sample", content_type="application/pdf")
        OfferDocument.objects.create(offer=bid, file=sample_pdf)

        self.client.force_authenticate(user=self.operator)
        response = self.client.post(f'/api/offers/{bid.id}/withdraw/', {
            'reason': 'سحب العرض لإعادة استكماله وتعديله قبل انقضاء الأجل',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('status'), 'draft')

        bid.refresh_from_db()
        self.assertEqual(bid.status, 'draft')
        self.assertIsNone(bid.submission_timestamp)

    def test_withdraw_blocked_after_deadline(self):
        """منع سحب العرض بعد انقضاء الأجل القانوني للصفقة وفقاً للمادة 68"""
        # Expired deal
        expired_deal = ProcurementDeal.objects.create(
            title='صفقة منتهية الأجل',
            reference_number='DEAL-EXP-2026',
            authority=self.authority,
            estimated_budget=Decimal('10000000.00'),
            current_stage=5,
            submission_deadline=timezone.now() - timedelta(days=2),
        )
        bid = BidOffer.objects.create(
            deal=expired_deal,
            operator=self.operator,
            status='submitted',
            financial_amount=Decimal('9000000.00'),
            submission_timestamp=timezone.now() - timedelta(days=3),
        )
        self.client.force_authenticate(user=self.operator)
        response = self.client.post(f'/api/offers/{bid.id}/withdraw/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('انقضى الأجل القانوني', str(response.data))
