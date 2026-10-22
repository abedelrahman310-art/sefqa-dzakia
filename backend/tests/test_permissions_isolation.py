import pytest
from decimal import Decimal
from datetime import date, timedelta
from types import SimpleNamespace
from django.utils import timezone
from rest_framework.test import APIClient
from apps.users.models import CustomUser
from apps.procurements.models import ProcurementDeal
from apps.bids.models import BidOffer
from apps.contracts.models import Contract
from apps.execution.models import (
    ExecutionMilestone,
    ContractAmendment,
    ReceptionProcess,
    PaymentSituation,
)

@pytest.fixture
def client_operator_1(db):
    user = CustomUser.objects.create_user(
        email='op1@safaqat.dz', password='pass', role='operator'
    )
    c = APIClient()
    c.force_authenticate(user=user)
    return c, user

@pytest.fixture
def client_operator_2(db):
    user = CustomUser.objects.create_user(
        email='op2@safaqat.dz', password='pass', role='operator'
    )
    c = APIClient()
    c.force_authenticate(user=user)
    return c, user

@pytest.fixture
def client_authority_1(db):
    user = CustomUser.objects.create_user(
        email='auth1@safaqat.dz', password='pass', role='authority'
    )
    c = APIClient()
    c.force_authenticate(user=user)
    return c, user

@pytest.fixture
def client_authority_2(db):
    user = CustomUser.objects.create_user(
        email='auth2@safaqat.dz', password='pass', role='authority'
    )
    c = APIClient()
    c.force_authenticate(user=user)
    return c, user

@pytest.mark.django_db
class TestPermissionsAndDataIsolation:
    def test_operator_data_isolation(self, client_operator_1, client_operator_2, client_authority_1):
        """عزل بيانات المتعاملين: لا يمكن لمتعامل رؤية عروض متعامل آخر"""
        c_op1, op1 = client_operator_1
        c_op2, op2 = client_operator_2
        _, auth1 = client_authority_1

        deal = ProcurementDeal.objects.create(
            reference_number='DEAL-ISO-01',
            title='صفقة اختبار العزل',
            description='وصف الصفقة',
            authority=auth1,
            current_stage=5,
            submission_deadline=timezone.now() + timedelta(days=10),
            estimated_budget=Decimal('1000000.00'),
        )

        bid_op1 = BidOffer.objects.create(
            deal=deal,
            operator=op1,
            financial_amount=Decimal('950000.00'),
            status='submitted',
        )

        # Operator 1 can view their own bid
        res_op1 = c_op1.get(f'/api/bids/offers/{bid_op1.id}/')
        assert res_op1.status_code == 200

        # Operator 2 CANNOT view Operator 1's bid
        res_op2 = c_op2.get(f'/api/bids/offers/{bid_op1.id}/')
        assert res_op2.status_code == 404

    def test_authority_cannot_create_bid(self, client_authority_1):
        """رفض الصلاحيات: المصلحة المتعاقدة لا يحق لها التقدم بعطاءات"""
        c_auth, auth = client_authority_1
        deal = ProcurementDeal.objects.create(
            reference_number='DEAL-ISO-02',
            title='صفقة تجريبية',
            description='وصف',
            authority=auth,
            current_stage=5,
            submission_deadline=timezone.now() + timedelta(days=10),
        )

        res = c_auth.post('/api/bids/offers/', {
            'deal': str(deal.id),
            'financial_amount': '500000.00',
        }, format='json')

        assert res.status_code in [403, 400]

    def test_authority_data_isolation(self, client_operator_1, client_authority_1, client_authority_2):
        """عزل بيانات المصالح المتعاقدة: مصلحة متعاقدة لا ترى عروض صفقة تابعة لمصلحة أخرى"""
        c_op, op = client_operator_1
        _, auth1 = client_authority_1
        c_auth2, auth2 = client_authority_2

        deal1 = ProcurementDeal.objects.create(
            reference_number='DEAL-AUTH-01',
            title='صفقة المصلحة الأولى',
            description='وصف',
            authority=auth1,
            current_stage=5,
        )

        bid1 = BidOffer.objects.create(
            deal=deal1,
            operator=op,
            financial_amount=Decimal('400000.00'),
            status='submitted',
        )

        # Authority 2 cannot see bid submitted to Authority 1
        res_auth2 = c_auth2.get(f'/api/bids/offers/{bid1.id}/')
        assert res_auth2.status_code == 404

    def test_operator_cannot_create_deal(self, client_operator_1):
        """فصل المهام: منع المتعامل الاقتصادي من إنشاء صفقة عمومية"""
        c_op, op = client_operator_1
        res = c_op.post('/api/procurements/deals/', {
            'reference_number': 'FORBIDDEN-DEAL-01',
            'title': 'صفقة غير مصرح بها للمتعامل',
            'description': 'محاولة غير مصرح بها',
            'estimated_budget': '10000000.00',
            'wilaya': 'الجزائر',
        }, format='json')
        assert res.status_code == 403

    def test_authority_cannot_modify_operator_bid(self, client_operator_1, client_authority_1):
        """فصل المهام: منع المصلحة المتعاقدة من تعديل عرض المتعامل الاقتصادي"""
        c_op, op = client_operator_1
        c_auth, auth = client_authority_1
        deal = ProcurementDeal.objects.create(
            reference_number='DEAL-NO-MOD-01',
            title='صفقة فحص التعديل',
            description='وصف',
            authority=auth,
            current_stage=4,
            submission_deadline=timezone.now() + timedelta(days=10),
        )
        bid = BidOffer.objects.create(
            deal=deal,
            operator=op,
            financial_amount=Decimal('500000.00'),
            status='draft',
        )

        res = c_auth.patch(f'/api/bids/offers/{bid.id}/', {
            'financial_amount': '450000.00',
        }, format='json')
        assert res.status_code == 403

    def test_central_admin_cannot_modify_award_decision(self, client_authority_1, client_operator_1):
        """فصل المهام: منع الرقابة المركزية من تعديل قرارات التقييم والإسناد"""
        from apps.contracts.models import AwardDecision
        _, auth = client_authority_1
        _, op = client_operator_1
        deal = ProcurementDeal.objects.create(
            reference_number='DEAL-AWARD-TEST-01',
            title='صفقة اختبار الإسناد',
            description='وصف',
            authority=auth,
            current_stage=8,
        )
        bid = BidOffer.objects.create(
            deal=deal,
            operator=op,
            financial_amount=Decimal('800000.00'),
            status='awarded',
        )
        award = AwardDecision.objects.create(
            deal=deal,
            awarded_bid=bid,
            appeal_window_days=10,
            justification='إسناد قانوني أولي',
        )

        admin_user = CustomUser.objects.create_superuser(
            email='admin_perm_test@safaqat.dz',
            password='pass',
            role='central_admin'
        )
        c_admin = APIClient()
        c_admin.force_authenticate(user=admin_user)

        res = c_admin.patch(f'/api/contracts/awards/{award.id}/', {
            'justification': 'محاولة تعديل غير مصرح بها من الرقابة',
        }, format='json')
        assert res.status_code == 403


# ═══════════════════════════════════════════════════════════════
# BE-01: عزل صلاحيات تطبيق التنفيذ (execution)
# ═══════════════════════════════════════════════════════════════

EXECUTION_ENDPOINTS = ['milestones', 'amendments', 'receptions', 'payments']

EXECUTION_MODELS = {
    'milestones': ExecutionMilestone,
    'amendments': ContractAmendment,
    'receptions': ReceptionProcess,
    'payments': PaymentSituation,
}


def _make_execution_deal(authority, suffix):
    return ProcurementDeal.objects.create(
        reference_number=f'DEAL-EXEC-{suffix}',
        title=f'صفقة تنفيذ {suffix}',
        description='وصف صفقة اختبار عزل التنفيذ',
        authority=authority,
        current_stage=10,
    )


def _make_execution_contract(deal, operator, suffix):
    return Contract.objects.create(
        deal=deal,
        awarded_operator=operator,
        contract_number=f'CNT-EXEC-{suffix}',
        signed_amount=Decimal('1000000.00'),
        duration_months=12,
        status='active',
    )


def _create_execution_record(endpoint, contract):
    if endpoint == 'milestones':
        return ExecutionMilestone.objects.create(
            contract=contract,
            title=f'محطة {contract.contract_number}',
            planned_completion_date=date(2026, 12, 31),
        )
    if endpoint == 'amendments':
        return ContractAmendment.objects.create(
            contract=contract,
            object_clause=f'ملحق {contract.contract_number}',
            justification='أسباب قانونية وتقنية للاختبار',
        )
    if endpoint == 'receptions':
        return ReceptionProcess.objects.create(contract=contract)
    if endpoint == 'payments':
        return PaymentSituation.objects.create(
            contract=contract,
            period_start=date(2026, 1, 1),
            period_end=date(2026, 1, 31),
            gross_amount=Decimal('1000.00'),
            net_payable_amount=Decimal('900.00'),
        )
    raise AssertionError(f'endpoint غير معروف: {endpoint}')


def _execution_create_payload(endpoint, contract):
    base = {'contract': str(contract.id)}
    if endpoint == 'milestones':
        return {
            **base,
            'title': 'محطة جديدة',
            'planned_completion_date': '2026-12-31',
        }
    if endpoint == 'amendments':
        return {
            **base,
            'object_clause': 'ملحق جديد',
            'justification': 'مبرر الاختبار',
        }
    if endpoint == 'receptions':
        return base
    return {
        **base,
        'period_start': '2026-02-01',
        'period_end': '2026-02-28',
        'gross_amount': '2000.00',
        'net_payable_amount': '1800.00',
    }


def _response_ids(response):
    data = response.data
    if isinstance(data, dict) and 'results' in data:
        data = data['results']
    return {str(item['id']) for item in data}


@pytest.fixture
def execution_world(
    client_operator_1,
    client_operator_2,
    client_authority_1,
    client_authority_2,
    db,
):
    """عالم اختبار معزول: مصلحتان، متعاملان، صفقتان وعقدان منفصلان."""
    c_op_a, op_a = client_operator_1
    c_op_b, op_b = client_operator_2
    c_auth_a, auth_a = client_authority_1
    c_auth_b, auth_b = client_authority_2

    deal_a = _make_execution_deal(auth_a, 'A')
    deal_b = _make_execution_deal(auth_b, 'B')
    contract_a = _make_execution_contract(deal_a, op_a, 'A')
    contract_b = _make_execution_contract(deal_b, op_b, 'B')

    return SimpleNamespace(
        c_op_a=c_op_a,
        op_a=op_a,
        c_op_b=c_op_b,
        op_b=op_b,
        c_auth_a=c_auth_a,
        auth_a=auth_a,
        c_auth_b=c_auth_b,
        auth_b=auth_b,
        deal_a=deal_a,
        deal_b=deal_b,
        contract_a=contract_a,
        contract_b=contract_b,
    )


@pytest.mark.django_db
class TestExecutionPermissionsIsolation:
    """كل ViewSet تنفيذي يجب أن يقيّد القراءة والكتابة حسب الدور والملكية."""

    @pytest.mark.parametrize('endpoint', EXECUTION_ENDPOINTS)
    def test_authorized_users_read_own_scope(self, execution_world, endpoint):
        w = execution_world
        record_a = _create_execution_record(endpoint, w.contract_a)

        assert w.c_op_a.get(
            f'/api/execution/{endpoint}/{record_a.id}/'
        ).status_code == 200
        assert w.c_auth_a.get(
            f'/api/execution/{endpoint}/{record_a.id}/'
        ).status_code == 200

    @pytest.mark.parametrize('endpoint', EXECUTION_ENDPOINTS)
    def test_operator_cannot_access_other_operator_record(self, execution_world, endpoint):
        w = execution_world
        record_b = _create_execution_record(endpoint, w.contract_b)
        url = f'/api/execution/{endpoint}/{record_b.id}/'

        assert w.c_op_a.get(url).status_code == 404
        assert w.c_op_a.patch(
            url, {'contract': str(w.contract_a.id)}, format='json'
        ).status_code == 404
        assert w.c_op_a.put(
            url, _execution_create_payload(endpoint, w.contract_a), format='json'
        ).status_code == 404
        assert w.c_op_a.delete(url).status_code == 404

        record_b.refresh_from_db()
        assert record_b.contract_id == w.contract_b.id

    @pytest.mark.parametrize('endpoint', EXECUTION_ENDPOINTS)
    def test_authority_cannot_access_other_authority_record(self, execution_world, endpoint):
        w = execution_world
        record_b = _create_execution_record(endpoint, w.contract_b)
        url = f'/api/execution/{endpoint}/{record_b.id}/'

        assert w.c_auth_a.get(url).status_code == 404
        assert w.c_auth_a.patch(
            url, {'contract': str(w.contract_a.id)}, format='json'
        ).status_code == 404
        assert w.c_auth_a.put(
            url, _execution_create_payload(endpoint, w.contract_a), format='json'
        ).status_code == 404
        assert w.c_auth_a.delete(url).status_code == 404

        record_b.refresh_from_db()
        assert record_b.contract_id == w.contract_b.id

    @pytest.mark.parametrize('endpoint', EXECUTION_ENDPOINTS)
    def test_unauthenticated_cannot_access(self, execution_world, endpoint):
        w = execution_world
        record_a = _create_execution_record(endpoint, w.contract_a)
        anonymous = APIClient()

        assert anonymous.get(
            f'/api/execution/{endpoint}/'
        ).status_code in (401, 403)
        assert anonymous.get(
            f'/api/execution/{endpoint}/{record_a.id}/'
        ).status_code in (401, 403)
        assert anonymous.post(
            f'/api/execution/{endpoint}/',
            _execution_create_payload(endpoint, w.contract_a),
            format='json',
        ).status_code in (401, 403)
        assert anonymous.delete(
            f'/api/execution/{endpoint}/{record_a.id}/'
        ).status_code in (401, 403)

    @pytest.mark.parametrize('endpoint', EXECUTION_ENDPOINTS)
    def test_create_within_own_scope_allowed(self, execution_world, endpoint):
        w = execution_world
        res_operator = w.c_op_a.post(
            f'/api/execution/{endpoint}/',
            _execution_create_payload(endpoint, w.contract_a),
            format='json',
        )
        assert res_operator.status_code == 201, res_operator.data

        res_authority = w.c_auth_a.post(
            f'/api/execution/{endpoint}/',
            _execution_create_payload(endpoint, w.contract_a),
            format='json',
        )
        assert res_authority.status_code == 201, res_authority.data

        assert EXECUTION_MODELS[endpoint].objects.filter(
            contract=w.contract_a
        ).count() == 2

    @pytest.mark.parametrize('endpoint', EXECUTION_ENDPOINTS)
    def test_cannot_create_on_foreign_contract(self, execution_world, endpoint):
        w = execution_world

        res_operator = w.c_op_a.post(
            f'/api/execution/{endpoint}/',
            _execution_create_payload(endpoint, w.contract_b),
            format='json',
        )
        assert res_operator.status_code == 403

        res_authority = w.c_auth_a.post(
            f'/api/execution/{endpoint}/',
            _execution_create_payload(endpoint, w.contract_b),
            format='json',
        )
        assert res_authority.status_code == 403

        assert not EXECUTION_MODELS[endpoint].objects.filter(
            contract=w.contract_b
        ).exists()

    @pytest.mark.parametrize('endpoint', EXECUTION_ENDPOINTS)
    def test_cannot_move_record_to_foreign_contract_via_patch(self, execution_world, endpoint):
        w = execution_world
        record_a = _create_execution_record(endpoint, w.contract_a)
        url = f'/api/execution/{endpoint}/{record_a.id}/'

        assert w.c_op_a.patch(
            url, {'contract': str(w.contract_b.id)}, format='json'
        ).status_code == 403
        record_a.refresh_from_db()
        assert record_a.contract_id == w.contract_a.id

        assert w.c_auth_a.patch(
            url, {'contract': str(w.contract_b.id)}, format='json'
        ).status_code == 403
        record_a.refresh_from_db()
        assert record_a.contract_id == w.contract_a.id

    def test_cannot_move_milestone_to_foreign_contract_via_put(self, execution_world):
        w = execution_world
        record_a = _create_execution_record('milestones', w.contract_a)
        payload = {
            'contract': str(w.contract_b.id),
            'title': 'نقل غير مصرح به',
            'planned_completion_date': '2026-12-31',
        }

        res = w.c_op_a.put(
            f'/api/execution/milestones/{record_a.id}/',
            payload,
            format='json',
        )
        assert res.status_code == 403
        record_a.refresh_from_db()
        assert record_a.contract_id == w.contract_a.id

    @pytest.mark.parametrize('endpoint', EXECUTION_ENDPOINTS)
    def test_central_admin_is_read_only(self, execution_world, endpoint):
        w = execution_world
        record_b = _create_execution_record(endpoint, w.contract_b)

        admin = CustomUser.objects.create_user(
            email=f'exec_central_{endpoint}@safaqat.dz',
            password='pass',
            role='central_admin',
        )
        c_admin = APIClient()
        c_admin.force_authenticate(user=admin)
        url = f'/api/execution/{endpoint}/{record_b.id}/'

        # قراءة رقابية شاملة (السياسة القائمة في تطبيق العقود).
        assert c_admin.get(url).status_code == 200
        # لا كتابة ولا حذف لمجرد كون الدور إدارة مركزية.
        assert c_admin.patch(
            url, {'contract': str(w.contract_a.id)}, format='json'
        ).status_code == 403
        assert c_admin.delete(url).status_code == 403
        assert c_admin.post(
            f'/api/execution/{endpoint}/',
            _execution_create_payload(endpoint, w.contract_b),
            format='json',
        ).status_code == 403

        record_b.refresh_from_db()
        assert record_b.contract_id == w.contract_b.id

    @pytest.mark.parametrize('endpoint', EXECUTION_ENDPOINTS)
    def test_unrelated_users_get_no_scope(self, execution_world, endpoint):
        """غياب علاقة ملكية لا يوسّع الوصول (رفض افتراضي)."""
        w = execution_world
        record_a = _create_execution_record(endpoint, w.contract_a)

        outsider_operator = CustomUser.objects.create_user(
            email=f'exec_op_outsider_{endpoint}@safaqat.dz',
            password='pass',
            role='operator',
        )
        outsider_authority = CustomUser.objects.create_user(
            email=f'exec_auth_outsider_{endpoint}@safaqat.dz',
            password='pass',
            role='authority',
        )

        for user in (outsider_operator, outsider_authority):
            client = APIClient()
            client.force_authenticate(user=user)
            assert client.get(
                f'/api/execution/{endpoint}/{record_a.id}/'
            ).status_code == 404
            list_res = client.get(f'/api/execution/{endpoint}/')
            assert list_res.status_code == 200
            assert _response_ids(list_res) == set()

    @pytest.mark.parametrize('endpoint', EXECUTION_ENDPOINTS)
    def test_list_scoped_to_own_records(self, execution_world, endpoint):
        w = execution_world
        record_a = _create_execution_record(endpoint, w.contract_a)
        _create_execution_record(endpoint, w.contract_b)

        res_operator = w.c_op_a.get(f'/api/execution/{endpoint}/')
        assert res_operator.status_code == 200
        assert _response_ids(res_operator) == {str(record_a.id)}

        res_authority = w.c_auth_a.get(f'/api/execution/{endpoint}/')
        assert res_authority.status_code == 200
        assert _response_ids(res_authority) == {str(record_a.id)}

        res_authority_b = w.c_auth_b.get(f'/api/execution/{endpoint}/')
        assert res_authority_b.status_code == 200
        assert len(_response_ids(res_authority_b)) == 1
        assert str(record_a.id) not in _response_ids(res_authority_b)


