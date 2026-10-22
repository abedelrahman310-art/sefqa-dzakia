"""BE-03: فحوص PostgreSQL الخاصة بالتزامن والقيود الفعلية.

هذا الملف لا يُشغَّل على SQLite: يتحقق من سلوك PostgreSQL الحقيقي
(المعاملات المتزامنة، قفل الصفوف، وقيود المفاتيح الخارجية).
"""

import threading
import uuid
from datetime import date
from decimal import Decimal
from types import SimpleNamespace

import pytest
from django.db import IntegrityError, connection, transaction
from django.urls import get_resolver
from rest_framework.test import APIClient

from apps.audit.models import AuditLog
from apps.contracts.models import Contract
from apps.execution.models import ExecutionMilestone
from apps.procurements.models import ProcurementDeal
from apps.users.models import CustomUser


pytestmark = pytest.mark.skipif(
    connection.vendor != 'postgresql',
    reason='فحوص التزامن والقيود مخصصة لـ PostgreSQL فقط',
)


def _user(email, role):
    return CustomUser.objects.create_user(email=email, password='pass', role=role)


def _client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def pg_world(db):
    authority = _user('be03.pg.authority@safaqat.dz', 'authority')
    operator = _user('be03.pg.operator@safaqat.dz', 'operator')

    deal = ProcurementDeal.objects.create(
        reference_number='DEAL-BE03-PG',
        title='صفقة فحوص PostgreSQL',
        description='وصف اختبار التزامن',
        authority=authority,
        current_stage=10,
    )
    contract = Contract.objects.create(
        deal=deal,
        awarded_operator=operator,
        contract_number='CNT-BE03-PG',
        signed_amount=Decimal('1000000.00'),
        duration_months=12,
        status='active',
    )
    milestone = ExecutionMilestone.objects.create(
        contract=contract,
        title='محطة أصلية',
        planned_completion_date=date(2026, 12, 31),
        progress_percentage=0,
    )

    return SimpleNamespace(
        authority=authority,
        operator=operator,
        deal=deal,
        contract=contract,
        milestone=milestone,
        client=_client(operator),
    )


def _run_parallel(workers, timeout=30):
    """يشغّل دوالاً في خيوط منفصلة مع نقطة انطلاق واحدة، ويجمع نتائجها."""
    # تحميل URLconf ووحدات العرض مسبقاً في الخيط الرئيسي: الاستيراد المتزامن
    # داخل الخيوط يقود إلى انتظار قفل استيراد Python ويُفسد قياس التزامن.
    get_resolver().url_patterns

    barrier = threading.Barrier(len(workers))
    results = {}
    errors = {}

    def runner(name, work):
        try:
            barrier.wait(timeout=15)
            results[name] = work()
        except BaseException as exc:  # noqa: BLE001 - نعيد الخطأ للخيط الرئيسي
            errors[name] = exc
        finally:
            connection.close()

    threads = [
        threading.Thread(target=runner, args=(name, work), daemon=True)
        for name, work in workers.items()
    ]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=timeout)

    assert not any(thread.is_alive() for thread in threads), 'خيط اختبار ما زال معلقاً'
    assert not errors, errors
    return results


@pytest.mark.django_db(transaction=True)
def test_concurrent_patches_preserve_both_updates_and_audit(pg_world):
    """تعديلان متزامنان على حقول مختلفة يجب ألا يمحو أحدهما الآخر."""
    milestone = pg_world.milestone
    url = f'/api/execution/milestones/{milestone.id}/'

    def patch_title():
        return _client(pg_world.operator).patch(
            url, {'title': 'تحديث متزامن أ'}, format='json'
        )

    def patch_progress():
        return _client(pg_world.operator).patch(
            url, {'progress_percentage': 40}, format='json'
        )

    responses = _run_parallel({'title': patch_title, 'progress': patch_progress})

    assert responses['title'].status_code == 200, responses['title'].data
    assert responses['progress'].status_code == 200, responses['progress'].data

    milestone.refresh_from_db()
    assert milestone.title == 'تحديث متزامن أ'
    assert milestone.progress_percentage == 40

    logs = AuditLog.objects.filter(
        action='execution_milestone_updated',
        resource_id=str(milestone.id),
    )
    assert logs.count() == 2
    assert logs.filter(changes__contract_id=str(pg_world.contract.id)).count() == 2


@pytest.mark.django_db(transaction=True)
def test_concurrent_update_and_delete_leave_consistent_state(pg_world):
    """تعديل وحذف متزامنان: لا 500، والحالة النهائية والتدقيق متسقان."""
    milestone = pg_world.milestone
    url = f'/api/execution/milestones/{milestone.id}/'

    def patch():
        return _client(pg_world.operator).patch(
            url, {'title': 'تعديل أثناء الحذف'}, format='json'
        )

    def delete():
        return _client(pg_world.operator).delete(url)

    responses = _run_parallel({'patch': patch, 'delete': delete})

    assert responses['patch'].status_code in (200, 404)
    assert responses['delete'].status_code == 204

    # الحذف هو العملية الحاسمة: السجل يجب ألا يعود للوجود.
    assert not ExecutionMilestone.objects.filter(pk=milestone.id).exists()

    deleted_logs = AuditLog.objects.filter(
        action='execution_milestone_deleted',
        resource_id=str(milestone.id),
    )
    assert deleted_logs.count() == 1

    updated_logs = AuditLog.objects.filter(
        action='execution_milestone_updated',
        resource_id=str(milestone.id),
    )
    expected_updates = 1 if responses['patch'].status_code == 200 else 0
    assert updated_logs.count() == expected_updates


@pytest.mark.django_db(transaction=True)
def test_foreign_key_is_enforced_by_postgresql(pg_world):
    """المفتاح الخارجي للعقد يجب أن يمنع سجلاً يتيماً على مستوى PostgreSQL."""
    with pytest.raises(IntegrityError) as excinfo:
        with transaction.atomic():
            ExecutionMilestone.objects.create(
                contract_id=uuid.uuid4(),
                title='سجل بعقد غير موجود',
                planned_completion_date=date(2026, 12, 31),
            )

    cause = excinfo.value.__cause__
    # psycopg2 exposes pgcode; psycopg 3 exposes sqlstate.
    sqlstate = getattr(cause, 'pgcode', None) or getattr(cause, 'sqlstate', None)
    assert sqlstate == '23503'
    assert not ExecutionMilestone.objects.filter(
        title='سجل بعقد غير موجود'
    ).exists()
