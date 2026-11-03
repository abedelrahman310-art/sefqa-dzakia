from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from apps.users.models import CustomUser, OperatorProfile
from apps.procurements.models import ProcurementDeal, CahierSpecs
from apps.bids.models import BidOffer
from apps.ai_gateway.services.operator_matcher import recommend_tenders


class ExpiredDealsEnforcementTests(APITestCase):
    def setUp(self):
        # 1. المصلحة المتعاقدة
        self.authority = CustomUser.objects.create_user(
            email='authority_test@safaqat.dz',
            password='Password123!',
            role='authority',
            display_name='مصلحة ولاية الجزائر',
            organization_name='ولاية الجزائر',
        )

        # 2. المتعامل الاقتصادي
        self.operator = CustomUser.objects.create_user(
            email='operator_test@safaqat.dz',
            password='Password123!',
            role='operator',
            display_name='شركة الإنجاز الجزائرية',
            organization_name='شركة الإنجاز',
        )
        self.operator_profile, _ = OperatorProfile.objects.get_or_create(
            user=self.operator,
            defaults={'sector': 'works', 'available_wilayas': ['الجزائر', 'وهران']}
        )

        # 3. صفقة نشطة سارية المفعول
        self.active_deal = ProcurementDeal.objects.create(
            reference_number='DZ-2026-ACTIVE-001',
            title='مشروع بناء مدرسة ابتدائية - نشطة',
            description='مشروع قيد استلام العروض أشغال بناء',
            authority=self.authority,
            current_stage=5,
            status='open',
            estimated_budget=Decimal('15000000.00'),
            wilaya='الجزائر',
            submission_deadline=timezone.now() + timedelta(days=10),
            specs_price=Decimal('0.00'),
        )
        CahierSpecs.objects.create(deal=self.active_deal)

        # 4. صفقة منتهية الأجل (انقضى ميعاد إيداع العروض وفقاً للمادة 68 من القانون 23-12)
        self.expired_deal = ProcurementDeal.objects.create(
            reference_number='DZ-2026-EXPIRED-002',
            title='مشروع تهيئة طريق ولائي - منتهية',
            description='مشروع انقضى أجله القانوني أشغال طرقات',
            authority=self.authority,
            current_stage=5,
            status='open',
            estimated_budget=Decimal('25000000.00'),
            wilaya='وهران',
            submission_deadline=timezone.now() - timedelta(days=5),
            specs_price=Decimal('0.00'),
        )
        CahierSpecs.objects.create(deal=self.expired_deal)

    def test_deal_model_expired_properties(self):
        """التحقق من صحة خصائص النموذج is_expired و days_left"""
        self.assertFalse(self.active_deal.is_expired)
        self.assertGreaterEqual(self.active_deal.days_left, 9)

        self.assertTrue(self.expired_deal.is_expired)
        self.assertEqual(self.expired_deal.days_left, 0)

    def test_operator_list_deals_filters_expired_by_default(self):
        """افتراضياً: يتم استبعاد الصفقات المنتهية في قوائم المتعاملين"""
        self.client.force_authenticate(user=self.operator)

        # /api/procurements/deals/
        res = self.client.get('/api/procurements/deals/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data if isinstance(res.data, list) else res.data.get('results', [])
        ids = [str(d['id']) for d in results]
        self.assertIn(str(self.active_deal.id), ids)
        self.assertNotIn(str(self.expired_deal.id), ids)

        # /api/opportunities/
        res_opp = self.client.get('/api/opportunities/')
        self.assertEqual(res_opp.status_code, status.HTTP_200_OK)
        opps = res_opp.data.get('opportunities', [])
        opp_ids = [str(o['id']) for o in opps]
        self.assertIn(str(self.active_deal.id), opp_ids)
        self.assertNotIn(str(self.expired_deal.id), opp_ids)

    def test_operator_can_filter_expired_or_all_deals(self):
        """المتعامل يمكنه استعراض الصفقات المنتهية صراحة عبر ?status=expired أو ?status=all"""
        self.client.force_authenticate(user=self.operator)

        # status=expired
        res_expired = self.client.get('/api/procurements/deals/?status=expired')
        self.assertEqual(res_expired.status_code, status.HTTP_200_OK)
        results_exp = res_expired.data if isinstance(res_expired.data, list) else res_expired.data.get('results', [])
        ids_exp = [str(d['id']) for d in results_exp]
        self.assertIn(str(self.expired_deal.id), ids_exp)
        self.assertNotIn(str(self.active_deal.id), ids_exp)

        # status=all
        res_all = self.client.get('/api/procurements/deals/?status=all')
        self.assertEqual(res_all.status_code, status.HTTP_200_OK)
        results_all = res_all.data if isinstance(res_all.data, list) else res_all.data.get('results', [])
        ids_all = [str(d['id']) for d in results_all]
        self.assertIn(str(self.active_deal.id), ids_all)
        self.assertIn(str(self.expired_deal.id), ids_all)

    def test_expired_deal_accessible_on_detail_view_with_warning_flag(self):
        """صفحة التفاصيل تفتح الصفقة المنتهية مع أعلام is_expired=True و days_left=0 لعرض التحذير"""
        self.client.force_authenticate(user=self.operator)

        # GET /api/procurements/deals/{id}/
        res_deal = self.client.get(f'/api/procurements/deals/{self.expired_deal.id}/')
        self.assertEqual(res_deal.status_code, status.HTTP_200_OK)
        self.assertTrue(res_deal.data.get('is_expired'))
        self.assertEqual(res_deal.data.get('days_left'), 0)

        # GET /api/opportunities/{id}/
        res_opp = self.client.get(f'/api/opportunities/{self.expired_deal.id}/')
        self.assertEqual(res_opp.status_code, status.HTTP_200_OK)
        self.assertTrue(res_opp.data.get('is_expired'))
        self.assertTrue(res_opp.data.get('isExpired'))
        self.assertEqual(res_opp.data.get('days_left'), 0)
        self.assertEqual(res_opp.data.get('daysLeft'), 0)

    def test_bid_submission_rejected_for_expired_deal_pursuant_to_art_68(self):
        """المادة 68 من القانون 23-12: الرفض الصارم لإيداع أي عرض لصفقة منتهية"""
        self.client.force_authenticate(user=self.operator)

        offer_payload = {
            'deal': str(self.expired_deal.id),
            'financial_amount': '24000000.00',
            'status': 'submitted',
        }
        res = self.client.post('/api/bids/offers/', offer_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        error_text = str(res.data)
        self.assertIn('68', error_text)
        self.assertIn('القانون 23-12', error_text)

    def test_ai_analysis_rejected_for_expired_deal(self):
        """التحليل الذكي لدفتر الشروط يُرفض للصفقات المنتهية"""
        self.client.force_authenticate(user=self.operator)

        res = self.client.post('/api/ai/analyze-tender/', {'deal_id': str(self.expired_deal.id)}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('68', str(res.data))

    def test_radar_recommended_deals_strictly_excludes_expired_deals(self):
        """رادار الصفقات التنبؤي /api/operator/recommended-deals/ يستبعد الصفقات المنتهية نهائياً"""
        self.client.force_authenticate(user=self.operator)

        res = self.client.get('/api/operator/recommended-deals/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        deals = res.data if isinstance(res.data, list) else res.data.get('results', [])
        ids = [str(d['deal_id']) for d in deals]
        # الصفقة النشطة فقط هي التي تظهر في الرادار
        self.assertIn(str(self.active_deal.id), ids)
        # الصفقة المنتهية مستبعدة تماماً وقطعياً
        self.assertNotIn(str(self.expired_deal.id), ids)

    def test_operator_matcher_service_strictly_excludes_expired(self):
        """خدمة operator_matcher.recommend_tenders تستبعد الصفقات المنتهية نهائياً"""
        recommendations = recommend_tenders(operator=self.operator, limit=10)
        rec_ids = [str(r.get('deal_id') or r.get('id') or r.get('tender_id')) for r in recommendations]
        self.assertIn(str(self.active_deal.id), rec_ids)
        self.assertNotIn(str(self.expired_deal.id), rec_ids)
