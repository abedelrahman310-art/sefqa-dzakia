from decimal import Decimal
import uuid
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from apps.users.models import CustomUser, OperatorProfile
from apps.procurements.models import ProcurementDeal, CahierSpecs, SpecsPurchase


class SpecsPaymentTests(APITestCase):
    def setUp(self):
        # 1. المصلحة المتعاقدة
        self.authority = CustomUser.objects.create_user(
            email='authority_specs@safaqat.dz',
            password='Password123!',
            role='authority',
            display_name='المصلحة المتعاقدة للتجارب',
            organization_name='مديرية التجهيزات العمومية',
        )

        # 2. المتعامل الاقتصادي
        self.operator = CustomUser.objects.create_user(
            email='operator_specs@safaqat.dz',
            password='Password123!',
            role='operator',
            display_name='مؤسسة النور للأشغال',
            organization_name='مؤسسة النور',
        )
        self.operator_profile, _ = OperatorProfile.objects.get_or_create(
            user=self.operator,
            defaults={'sector': 'works', 'available_wilayas': ['الجزائر']}
        )

        # 3. متعامل اقتصادي آخر (للتأكد من حماية الخصوصية ومنع التحميل بدون وصل)
        self.other_operator = CustomUser.objects.create_user(
            email='other_specs@safaqat.dz',
            password='Password123!',
            role='operator',
            display_name='شركة ثانية',
            organization_name='شركة ثانية',
        )

        # 4. صفقة بمقابل مالي (2500 دج)
        self.paid_deal = ProcurementDeal.objects.create(
            reference_number='DZ-2026-PAID-01',
            title='مشروع تهيئة شبكة الطرقات الحضرية',
            description='سحب دفتر الشروط مدفوع بمبلغ 2500 دج',
            authority=self.authority,
            current_stage=5,
            status='open',
            estimated_budget=Decimal('50000000.00'),
            specs_price=Decimal('2500.00'),
            wilaya='الجزائر',
            submission_deadline=timezone.now() + timedelta(days=20),
        )
        CahierSpecs.objects.create(deal=self.paid_deal)

        # 5. صفقة مجانية (0 دج)
        self.free_deal = ProcurementDeal.objects.create(
            reference_number='DZ-2026-FREE-02',
            title='استشارة تقنية مجانية لخدمات الصيانة',
            description='سحب دفتر شروط مجاني',
            authority=self.authority,
            current_stage=5,
            status='open',
            estimated_budget=Decimal('2000000.00'),
            specs_price=Decimal('0.00'),
            wilaya='وهران',
            submission_deadline=timezone.now() + timedelta(days=15),
        )
        CahierSpecs.objects.create(deal=self.free_deal)

    def test_specs_status_unpurchased(self):
        """التحقق من حالة دفتر الشروط قبل الشراء"""
        self.client.force_authenticate(user=self.operator)
        res = self.client.get(f"/api/procurements/deals/{self.paid_deal.id}/specs/status/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['has_purchased'], False)
        self.assertEqual(res.data['specs_price'], 2500.0)
        self.assertEqual(res.data['is_specs_free'], False)

    def test_checkout_paid_specs(self):
        """إنشاء جلسة دفع لسحب دفتر شروط بمقابل مالي"""
        self.client.force_authenticate(user=self.operator)
        res = self.client.post(f"/api/procurements/deals/{self.paid_deal.id}/specs/checkout/")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('payment_id', res.data)
        self.assertIn('checkout_url', res.data)
        self.assertEqual(res.data['amount'], 2500.0)

        # التحقق من تسجيل السجل في قاعدة البيانات
        purchase = SpecsPurchase.objects.get(deal=self.paid_deal, operator=self.operator)
        self.assertEqual(purchase.status, 'pending')
        self.assertEqual(purchase.amount, Decimal('2500.00'))

    def test_verify_payment_and_unlock_specs(self):
        """التحقق من الدفع وإصدار وصل السحب وتفعيل التحميل"""
        self.client.force_authenticate(user=self.operator)
        # إنشاء الجلسة
        checkout_res = self.client.post(f"/api/procurements/deals/{self.paid_deal.id}/specs/checkout/")
        payment_id = checkout_res.data['payment_id']

        # التحقق
        verify_res = self.client.get(f"/api/procurements/specs/purchase/{payment_id}/verify/")
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertEqual(verify_res.data['status'], 'paid')
        receipt_number = verify_res.data['receipt_number']
        self.assertTrue(receipt_number.startswith('REC-'))

        # التحقق من أن حالة الصفقة للمتعامل أصبحت has_purchased = True
        status_res = self.client.get(f"/api/procurements/deals/{self.paid_deal.id}/specs/status/")
        self.assertEqual(status_res.data['has_purchased'], True)
        self.assertEqual(status_res.data['purchase']['receipt_number'], receipt_number)

    def test_free_specs_checkout_instant_paid(self):
        """سحب دفتر شروط مجاني يتم فوره دون توجيه لبوابة دفع"""
        self.client.force_authenticate(user=self.operator)
        res = self.client.post(f"/api/procurements/deals/{self.free_deal.id}/specs/checkout/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'paid')
        self.assertEqual(res.data['is_free'], True)
        self.assertTrue(res.data['receipt_number'].startswith('REC-'))

    def test_download_specs_and_receipt(self):
        """تحميل دفتر الشروط ووصل السحب بعد الدفع والتحقق"""
        self.client.force_authenticate(user=self.operator)
        checkout_res = self.client.post(f"/api/procurements/deals/{self.paid_deal.id}/specs/checkout/")
        payment_id = checkout_res.data['payment_id']
        verify_res = self.client.get(f"/api/procurements/specs/purchase/{payment_id}/verify/")
        receipt_number = verify_res.data['receipt_number']

        # 1. تحميل دفتر الشروط
        specs_dl = self.client.get(f"/api/procurements/specs/download/{receipt_number}/")
        self.assertEqual(specs_dl.status_code, status.HTTP_200_OK)
        self.assertEqual(specs_dl['Content-Type'], 'application/pdf')

        # 2. تحميل وصل السحب الرقمي
        receipt_dl = self.client.get(f"/api/procurements/specs/receipt/{receipt_number}/")
        self.assertEqual(receipt_dl.status_code, status.HTTP_200_OK)
        self.assertEqual(receipt_dl['Content-Type'], 'application/pdf')

    def test_unauthorized_specs_download_blocked(self):
        """منع متعامل آخر من تحميل دفتر الشروط باستخدام وصل غيره"""
        # المتعامل الأول يدفع
        self.client.force_authenticate(user=self.operator)
        checkout_res = self.client.post(f"/api/procurements/deals/{self.paid_deal.id}/specs/checkout/")
        payment_id = checkout_res.data['payment_id']
        verify_res = self.client.get(f"/api/procurements/specs/purchase/{payment_id}/verify/")
        receipt_number = verify_res.data['receipt_number']

        # المتعامل الثاني يحاول التحميل بوصل الأول
        self.client.force_authenticate(user=self.other_operator)
        bad_dl = self.client.get(f"/api/procurements/specs/download/{receipt_number}/")
        self.assertEqual(bad_dl.status_code, status.HTTP_403_FORBIDDEN)

    def test_operator_my_purchases_list(self):
        """التحقق من ظهور المشتريات في قائمة مشتريات المتعامل"""
        self.client.force_authenticate(user=self.operator)

        # لا توجد مشتريات أولاً
        res_empty = self.client.get("/api/procurements/specs/my-purchases/")
        self.assertEqual(res_empty.status_code, status.HTTP_200_OK)
        self.assertEqual(res_empty.data['paid_count'], 0)

        # شراء دفتر
        checkout_res = self.client.post(f"/api/procurements/deals/{self.paid_deal.id}/specs/checkout/")
        payment_id = checkout_res.data['payment_id']
        self.client.get(f"/api/procurements/specs/purchase/{payment_id}/verify/")

        # فحص القائمة بعد الشراء
        res_after = self.client.get("/api/procurements/specs/my-purchases/")
        self.assertEqual(res_after.status_code, status.HTTP_200_OK)
        self.assertEqual(res_after.data['paid_count'], 1)
        self.assertEqual(res_after.data['total_spent'], 2500.0)
        self.assertEqual(len(res_after.data['purchases']), 1)
        item = res_after.data['purchases'][0]
        self.assertEqual(item['deal_reference'], 'DZ-2026-PAID-01')
        self.assertEqual(item['status'], 'paid')
        self.assertIsNotNone(item['download_url'])
        self.assertIsNotNone(item['receipt_url'])
