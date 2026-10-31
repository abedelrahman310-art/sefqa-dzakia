from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import Subscription

User = get_user_model()


class SubscriptionAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='operator-pricing@safaqat.test',
            password='Password123!',
            role='operator',
            organization_name='شركة الأطلس للمقاولات',
        )

    def test_get_subscription_plans(self):
        response = self.client.get('/api/subscriptions/plans/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(len(data['plans']), 3)

        plan_ids = [p['id'] for p in data['plans']]
        self.assertIn('starter', plan_ids)
        self.assertIn('pro', plan_ids)
        self.assertIn('enterprise', plan_ids)

        pro_plan = next(p for p in data['plans'] if p['id'] == 'pro')
        self.assertTrue(pro_plan['is_popular'])
        self.assertEqual(pro_plan['raw_price'], 12000)
        self.assertIn('RAG', pro_plan['features_ar'][0])

    def test_checkout_anonymous(self):
        response = self.client.post('/api/subscriptions/checkout/', {'plan_type': 'pro'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertTrue(data['is_mock'])
        self.assertIn('login', data['checkout_url'])

    def test_checkout_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/subscriptions/checkout/', {'plan_type': 'pro'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['plan_type'], 'pro')
        self.assertIsNotNone(data['subscription_id'])

        # Verify DB entry
        sub = Subscription.objects.get(id=data['subscription_id'])
        self.assertEqual(sub.user, self.user)
        self.assertEqual(sub.plan_type, 'pro')
        self.assertTrue(sub.is_active)
        self.assertIsNotNone(sub.end_date)
