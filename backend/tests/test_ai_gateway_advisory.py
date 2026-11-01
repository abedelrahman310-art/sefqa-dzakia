import pytest
from rest_framework.test import APIClient
from apps.users.models import CustomUser

@pytest.fixture
def auth_user(db):
    return CustomUser.objects.create_user(
        email='ai_tester@safaqat.dz', password='pass', role='authority'
    )

@pytest.mark.django_db
class TestAIGatewayAdvisoryOnly:
    def test_compliance_check_is_strictly_advisory(self, auth_user):
        """فحص الامتثال عبر الذكاء الاصطناعي استشاري حصراً ولا يمتلك سلطة تقريرية"""
        client = APIClient()
        client.force_authenticate(user=auth_user)

        response = client.post('/api/ai/compliance-check/', {
            'tender_data': {
                'deal_type': 'public_call',
                'submission_window_days': 10,  # أقل من 15 يوماً
            }
        }, format='json')

        assert response.status_code == 200
        data = response.data

        # تأكيد القواعد النظامية الصارمة لمشروع صفقات ذكية
        assert data.get('is_advisory') is True
        assert data.get('human_verification_required') is True
        assert 'القانون 23-12' in data.get('statutory_reference', '')
        assert 'استرشادي' in data.get('legal_disclaimer', '')
        assert len(data.get('advisory_notes', [])) > 0

    def test_summarize_tender_requires_human_verification(self, auth_user):
        """تلخيص العطاءات استرشادي ولا يحل محل دفتر الشروط الرسمي"""
        client = APIClient()
        client.force_authenticate(user=auth_user)

        response = client.post('/api/ai/summarize/', {
            'title': 'مشروع تعبيد مسالك ريفية',
            'description': 'تفاصيل المشروع'
        }, format='json')

        assert response.status_code == 200
        data = response.data
        assert data.get('is_advisory') is True
        assert data.get('human_verification_required') is True
        assert 'summary' in data
