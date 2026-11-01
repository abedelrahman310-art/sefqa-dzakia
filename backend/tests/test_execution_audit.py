"""اختبارات BE-02: إنشاء محاضر الاستلام وتدقيق عمليات التنفيذ."""

from datetime import date, datetime
from decimal import Decimal
from types import SimpleNamespace

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.audit.models import AuditLog
from apps.contracts.models import Contract
from apps.execution.models import (
    ExecutionMilestone,
    ContractAmendment,
    ReceptionProcess,
    PaymentSituation,
)
from apps.procurements.models import ProcurementDeal
from apps.users.models import CustomUser


EXECUTION_ENDPOINTS = ['milestones', 'amendments', 'receptions', 'payments']

EXECUTION_MODELS = {
    'milestones': ExecutionMilestone,
    'amendments': ContractAmendment,
    'receptions': ReceptionProcess,
    'payments': PaymentSituation,
}

AUDIT_PREFIXES = {
    'milestones': 'execution_milestone',
    'amendments': 'contract_amendment',
    'receptions': 'reception_process',
    'payments': 'payment_situation',
}


def _user(email, role):
    return CustomUser.objects.create_user(email=email, password='pass', role=role)


def _client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def world(db):
    """مصلحتان ومتعاملان وعقدان منفصلان + عملاء لكل دور."""
    auth_a = _user('be02_auth_a@safaqat.dz', 'authority')
    auth_b = _user('be02_auth_b@safaqat.dz', 'authority')
    op_a = _user('be02_op_a@safaqat.dz', 'operator')
    op_b = _user('be02_op_b@safaqat.dz', 'operator')
    admin = _user('be02_admin@safaqat.dz', 'central_admin')

    deal_a = ProcurementDeal.objects.create(
        reference_number='DEAL-BE02-A',
        title='صفقة BE-02 أ',
        description='وصف صفقة اختبار التدقيق',
        authority=auth_a,
        current_stage=10,
    )
    deal_b = ProcurementDeal.objects.create(
        reference_number='DEAL-BE02-B',
        title='صفقة BE-02 ب',
        description='وصف صفقة اختبار التدقيق',
        authority=auth_b,
        current_stage=10,
    )
    contract_a = Contract.objects.create(
        deal=deal_a,
        awarded_operator=op_a,
        contract_number='CNT-BE02-A',
        signed_amount=Decimal('1000000.00'),
        duration_months=12,
        status='active',
    )
    contract_b = Contract.objects.create(
        deal=deal_b,
        awarded_operator=op_b,
        contract_number='CNT-BE02-B',
        signed_amount=Decimal('2000000.00'),
        duration_months=12,
        status='active',
    )

    return SimpleNamespace(
        auth_a=auth_a,
        auth_b=auth_b,
        op_a=op_a,
        op_b=op_b,
        admin=admin,
        c_auth_a=_client(auth_a),
        c_auth_b=_client(auth_b),
        c_op_a=_client(op_a),
        c_op_b=_client(op_b),
        c_admin=_client(admin),
        deal_a=deal_a,
        deal_b=deal_b,
        contract_a=contract_a,
        contract_b=contract_b,
    )


def _create_record(endpoint, contract):
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


def _create_payload(endpoint, contract):
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


def _update_payload(endpoint):
    return {
        'milestones': {'title': 'عنوان محدث'},
        'amendments': {'object_clause': 'موضوع محدث'},
        'receptions': {'reservations': 'تحفظ محدث'},
        'payments': {'payment_reference': 'TRESOR-2026-001'},
    }[endpoint]


@pytest.mark.django_db
class TestReceptionCreation:
    """إصلاح reception_date: الإنشاء الصحيح لا يعطي 500 والقيمة الافتراضية تاريخ."""

    def test_authorized_create_returns_201_and_persists(self, world):
        today = timezone.localdate()
        response = world.c_op_a.post(
            '/api/execution/receptions/',
            {'contract': str(world.contract_a.id)},
            format='json',
        )

        assert response.status_code == 201, response.data
        record = ReceptionProcess.objects.get(pk=response.data['id'])
        assert record.contract_id == world.contract_a.id
        assert record.reception_date == today
        assert response.data['reception_date'] == today.isoformat()

    def test_default_value_is_date_not_datetime(self, world):
        field = ReceptionProcess._meta.get_field('reception_date')
        default = field.get_default()

        assert default == timezone.localdate()
        assert isinstance(default, date)
        assert not isinstance(default, datetime)

        unsaved = ReceptionProcess(contract=world.contract_a)
        assert isinstance(unsaved.reception_date, date)
        assert not isinstance(unsaved.reception_date, datetime)

    def test_invalid_payload_rejected_without_record_or_audit(self, world):
        response_type = world.c_op_a.post(
            '/api/execution/receptions/',
            {
                'contract': str(world.contract_a.id),
                'reception_type': 'not-a-valid-type',
            },
            format='json',
        )
        assert response_type.status_code == 400

        response_date = world.c_op_a.post(
            '/api/execution/receptions/',
            {
                'contract': str(world.contract_a.id),
                'reception_date': '2026-13-40',
            },
            format='json',
        )
        assert response_date.status_code == 400

        assert ReceptionProcess.objects.count() == 0
        assert AuditLog.objects.filter(action='reception_process_created').count() == 0

    def test_foreign_contract_rejected_without_record_or_audit(self, world):
        response_operator = world.c_op_a.post(
            '/api/execution/receptions/',
            {'contract': str(world.contract_b.id)},
            format='json',
        )
        assert response_operator.status_code == 403

        response_authority = world.c_auth_a.post(
            '/api/execution/receptions/',
            {'contract': str(world.contract_b.id)},
            format='json',
        )
        assert response_authority.status_code == 403

        assert ReceptionProcess.objects.count() == 0
        assert AuditLog.objects.count() == 0


@pytest.mark.django_db
class TestExecutionAuditTrail:
    """كل عملية كتابة ناجحة = سجل تدقيق واحد مرتبط بالمستخدم والمورد."""

    @pytest.mark.parametrize('endpoint', EXECUTION_ENDPOINTS)
    def test_create_writes_exactly_one_audit_log(self, world, endpoint):
        response = world.c_op_a.post(
            f'/api/execution/{endpoint}/',
            _create_payload(endpoint, world.contract_a),
            format='json',
        )
        assert response.status_code == 201, response.data

        logs = AuditLog.objects.filter(
            action=f'{AUDIT_PREFIXES[endpoint]}_created'
        )
        assert logs.count() == 1
        log = logs.get()
        assert log.user_id == world.op_a.id
        assert log.resource_type == EXECUTION_MODELS[endpoint].__name__
        assert log.resource_id == str(response.data['id'])
        assert log.changes['contract_id'] == str(world.contract_a.id)
        assert log.changes['contract_number'] == 'CNT-BE02-A'
        assert log.timestamp is not None
        assert log.checksum and len(log.checksum) == 64
        assert str(log.ip_address) == '127.0.0.1'

    @pytest.mark.parametrize('endpoint', EXECUTION_ENDPOINTS)
    def test_update_writes_exactly_one_audit_log(self, world, endpoint):
        record = _create_record(endpoint, world.contract_a)

        response = world.c_op_a.patch(
            f'/api/execution/{endpoint}/{record.id}/',
            _update_payload(endpoint),
            format='json',
        )
        assert response.status_code == 200, response.data

        logs = AuditLog.objects.filter(
            action=f'{AUDIT_PREFIXES[endpoint]}_updated'
        )
        assert logs.count() == 1
        log = logs.get()
        assert log.user_id == world.op_a.id
        assert log.resource_id == str(record.id)
        assert log.changes['contract_id'] == str(world.contract_a.id)

        # لا تكرار: الحدث الواحد = سجل واحد فقط.
        assert AuditLog.objects.filter(resource_id=str(record.id)).count() == 1

    @pytest.mark.parametrize('endpoint', EXECUTION_ENDPOINTS)
    def test_delete_writes_exactly_one_audit_log(self, world, endpoint):
        record = _create_record(endpoint, world.contract_a)
        record_id = str(record.id)

        response = world.c_op_a.delete(
            f'/api/execution/{endpoint}/{record_id}/'
        )
        assert response.status_code == 204
        assert not EXECUTION_MODELS[endpoint].objects.filter(pk=record_id).exists()

        logs = AuditLog.objects.filter(
            action=f'{AUDIT_PREFIXES[endpoint]}_deleted'
        )
        assert logs.count() == 1
        log = logs.get()
        assert log.user_id == world.op_a.id
        assert log.resource_type == EXECUTION_MODELS[endpoint].__name__
        assert log.resource_id == record_id

    @pytest.mark.parametrize('endpoint', EXECUTION_ENDPOINTS)
    def test_denied_operations_leave_no_audit(self, world, endpoint):
        # إنشاء على عقد خارج النطاق.
        response = world.c_op_a.post(
            f'/api/execution/{endpoint}/',
            _create_payload(endpoint, world.contract_b),
            format='json',
        )
        assert response.status_code == 403

        # تعديل/حذف سجل عقد خارج النطاق.
        foreign_record = _create_record(endpoint, world.contract_b)
        foreign_url = f'/api/execution/{endpoint}/{foreign_record.id}/'
        assert world.c_op_a.patch(
            foreign_url, _update_payload(endpoint), format='json'
        ).status_code == 404
        assert world.c_op_a.delete(foreign_url).status_code == 404

        # الرقابة المركزية: قراءة فقط.
        own_record = _create_record(endpoint, world.contract_a)
        own_url = f'/api/execution/{endpoint}/{own_record.id}/'
        assert world.c_admin.post(
            f'/api/execution/{endpoint}/',
            _create_payload(endpoint, world.contract_a),
            format='json',
        ).status_code == 403
        assert world.c_admin.patch(
            own_url, _update_payload(endpoint), format='json'
        ).status_code == 403
        assert world.c_admin.delete(own_url).status_code == 403

        foreign_record.refresh_from_db()
        own_record.refresh_from_db()
        assert foreign_record.contract_id == world.contract_b.id
        assert own_record.contract_id == world.contract_a.id
        assert AuditLog.objects.count() == 0

    def test_audit_failure_rolls_back_create(self, world, monkeypatch):
        def explode(*args, **kwargs):
            raise RuntimeError('audit storage unavailable')

        monkeypatch.setattr(AuditLog.objects, 'create', explode)

        with pytest.raises(RuntimeError):
            world.c_op_a.post(
                '/api/execution/milestones/',
                _create_payload('milestones', world.contract_a),
                format='json',
            )

        assert not ExecutionMilestone.objects.filter(
            contract=world.contract_a
        ).exists()

    def test_audit_failure_rolls_back_update(self, world, monkeypatch):
        record = _create_record('milestones', world.contract_a)
        original_title = record.title

        def explode(*args, **kwargs):
            raise RuntimeError('audit storage unavailable')

        monkeypatch.setattr(AuditLog.objects, 'create', explode)

        with pytest.raises(RuntimeError):
            world.c_op_a.patch(
                f'/api/execution/milestones/{record.id}/',
                {'title': 'تغيير يجب ألا يُحفظ'},
                format='json',
            )

        record.refresh_from_db()
        assert record.title == original_title

    def test_audit_failure_rolls_back_delete(self, world, monkeypatch):
        record = _create_record('milestones', world.contract_a)

        def explode(*args, **kwargs):
            raise RuntimeError('audit storage unavailable')

        monkeypatch.setattr(AuditLog.objects, 'create', explode)

        with pytest.raises(RuntimeError):
            world.c_op_a.delete(f'/api/execution/milestones/{record.id}/')

        assert ExecutionMilestone.objects.filter(pk=record.id).exists()
