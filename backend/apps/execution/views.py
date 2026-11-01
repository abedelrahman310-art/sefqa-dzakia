from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, exceptions
from apps.audit.models import AuditLog
from apps.contracts.models import Contract
from .models import ExecutionMilestone, ContractAmendment, ReceptionProcess, PaymentSituation
from .serializers import (
    ExecutionMilestoneSerializer,
    ContractAmendmentSerializer,
    ReceptionProcessSerializer,
    PaymentSituationSerializer
)


def _role(user):
    """دور المستخدم المصادق عليه، أو None لغير المصادق عليهم."""
    if not user or not user.is_authenticated:
        return None
    return getattr(user, 'role', None)


def _execution_scope(queryset, user):
    """
    نطاق القراءة حسب الدور والملكية الفعلية للعقد (رفض افتراضي).

    - operator: سجلات العقود المسندة إليه فقط.
    - authority: سجلات عقود صفقات مصلحته فقط.
    - central_admin: قراءة رقابية شاملة (لا يمنح أي صلاحية كتابة هنا).
    - أي دور آخر: لا شيء.
    """
    role = _role(user)
    if role == 'operator':
        return queryset.filter(contract__awarded_operator=user)
    if role == 'authority':
        return queryset.filter(contract__deal__authority=user)
    if role == 'central_admin':
        return queryset
    return queryset.none()


def _writable_contracts(user):
    """العقود المسموح للمستخدم بالكتابة ضمن سجلات تنفيذها (الرقابة المركزية للقراءة فقط)."""
    role = _role(user)
    contracts = Contract.objects.all()
    if role == 'operator':
        return contracts.filter(awarded_operator=user)
    if role == 'authority':
        return contracts.filter(deal__authority=user)
    return contracts.none()


class ExecutionAccessMixin:
    """
    تقييد سجلات التنفيذ حسب الدور والملكية الفعلية للعقد.

    القراءة تمر عبر get_queryset، فالسجل خارج النطاق يعطي 404.
    الكتابة تتحقق أيضاً من أن العقد المستهدف ضمن نطاق المستخدم، فلا يمكن
    إنشاء سجل على عقد غير مصرح به ولا نقل سجل إليه عبر PUT/PATCH.

    كل عملية كتابة ناجحة تُسجَّل في AuditLog داخل المعاملة نفسها:
    - إذا فشلت العملية الأساسية لا يُكتب سجل تدقيق.
    - إذا فشل كتابة التدقيق تُلغى العملية الأساسية (تدقيق إلزامي).
    """

    audit_action_prefix = None
    audit_label = 'سجل تنفيذ'

    def get_queryset(self):
        return _execution_scope(super().get_queryset(), self.request.user)

    def _assert_writable_contract(self, contract):
        allowed = (
            contract is not None
            and _writable_contracts(self.request.user).filter(pk=contract.pk).exists()
        )
        if not allowed:
            raise exceptions.PermissionDenied(
                'ليست لديك صلاحية الكتابة على سجلات تنفيذ هذا العقد.'
            )

    def _audit_snapshot(self, instance):
        changes = {
            'contract_id': str(instance.contract_id),
            'contract_number': instance.contract.contract_number,
        }
        for field in (
            'status',
            'progress_percentage',
            'reception_type',
            'is_accepted_without_reservation',
            'financial_impact',
            'duration_extension_days',
            'net_payable_amount',
        ):
            if hasattr(instance, field):
                changes[field] = str(getattr(instance, field))
        return {
            'resource_type': instance.__class__.__name__,
            'resource_id': str(instance.pk),
            'description': (
                f"{self.audit_label} للعقد "
                f"{instance.contract.contract_number} (المعرّف {instance.pk})"
            ),
            'changes': changes,
        }

    def _write_audit(self, event, snapshot):
        verb = {'created': 'إنشاء', 'updated': 'تعديل', 'deleted': 'حذف'}[event]
        ip = (
            self.request.META.get('HTTP_X_FORWARDED_FOR')
            or self.request.META.get('REMOTE_ADDR')
        )
        if ip and ',' in ip:
            ip = ip.split(',')[0].strip()
        AuditLog.objects.create(
            user=self.request.user,
            action=f'{self.audit_action_prefix}_{event}',
            resource_type=snapshot['resource_type'],
            resource_id=snapshot['resource_id'],
            description=f"{verb} {snapshot['description']}",
            changes=snapshot['changes'],
            ip_address=ip or None,
        )

    def perform_create(self, serializer):
        self._assert_writable_contract(serializer.validated_data.get('contract'))
        with transaction.atomic():
            instance = serializer.save()
            self._write_audit('created', self._audit_snapshot(instance))

    def perform_update(self, serializer):
        # القفل يمنع سباق القراءة–التعديل–الكتابة: نعيد قراءة أحدث نسخة
        # داخل المعاملة، ثم نطبق عليها الحقول المرسلة فقط.
        with transaction.atomic():
            instance = get_object_or_404(
                self.get_queryset().select_for_update(),
                pk=serializer.instance.pk,
            )
            contract = serializer.validated_data.get('contract', instance.contract)
            self._assert_writable_contract(contract)
            serializer.instance = instance
            instance = serializer.save()
            self._write_audit('updated', self._audit_snapshot(instance))

    def perform_destroy(self, instance):
        with transaction.atomic():
            instance = get_object_or_404(
                self.get_queryset().select_for_update(),
                pk=instance.pk,
            )
            self._assert_writable_contract(instance.contract)
            snapshot = self._audit_snapshot(instance)
            instance.delete()
            self._write_audit('deleted', snapshot)


class ExecutionMilestoneViewSet(ExecutionAccessMixin, viewsets.ModelViewSet):
    """إدارة محطات الإنجاز والتنفيذ"""
    audit_action_prefix = 'execution_milestone'
    audit_label = 'محطة إنجاز'
    queryset = ExecutionMilestone.objects.all().select_related('contract')
    serializer_class = ExecutionMilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]

class ContractAmendmentViewSet(ExecutionAccessMixin, viewsets.ModelViewSet):
    """إدارة ملاحق الصفقات (Avenants)"""
    audit_action_prefix = 'contract_amendment'
    audit_label = 'ملحق صفقة'
    queryset = ContractAmendment.objects.all().select_related('contract')
    serializer_class = ContractAmendmentSerializer
    permission_classes = [permissions.IsAuthenticated]

class ReceptionProcessViewSet(ExecutionAccessMixin, viewsets.ModelViewSet):
    """إدارة محاضر الاستلام المؤقت والنهائي"""
    audit_action_prefix = 'reception_process'
    audit_label = 'محضر استلام'
    queryset = ReceptionProcess.objects.all().select_related('contract')
    serializer_class = ReceptionProcessSerializer
    permission_classes = [permissions.IsAuthenticated]

class PaymentSituationViewSet(ExecutionAccessMixin, viewsets.ModelViewSet):
    """إدارة كشوف الحساب ووضعيات الدفع"""
    audit_action_prefix = 'payment_situation'
    audit_label = 'وضعية دفع'
    queryset = PaymentSituation.objects.all().select_related('contract')
    serializer_class = PaymentSituationSerializer
    permission_classes = [permissions.IsAuthenticated]
