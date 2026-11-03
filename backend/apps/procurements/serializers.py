import uuid
from decimal import Decimal
from rest_framework import serializers
from .models import (
    OpeningCommitteeShare,
    SpecsPurchase,
    ProcurementDeal,
    CahierSpecs,
    OpeningSession,
    SessionAccess,
    OpeningEvent,
    OfferDocument,
    Contract,
    Milestone,
    MilestoneProgressReport,
    Avenant,
    LegalNotice,
    AdministrativeNotice,
)
from .reference_prices import normalize_item_name, normalize_wilaya
from apps.bids.models import BidOffer


class CahierSpecsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CahierSpecs
        fields = '__all__'

    def validate(self, attrs):
        instance = self.instance
        deal = attrs.get('deal') or (instance.deal if instance else None)
        request = self.context.get('request')

        # 1. الصلاحيات المؤسسية وحماية البيانات: التأكد من أن المصلحة المالكة فقط تعدل الدفتر
        if request and request.user and not request.user.is_staff:
            if deal and getattr(deal, 'authority_id', None) != request.user.id:
                raise serializers.PermissionDenied(
                    "لا تملك المصلحة المتعاقدة صلاحية إنشاء أو تعديل دفتر الشروط التابع لصفقة مصلحة أخرى."
                )

        # 2. منع تعديل دفتر الشروط المؤشر عليه والمجمد
        if instance and instance.is_validated:
            raise serializers.ValidationError({
                "non_field_errors": [
                    "دفتر الشروط مؤشر عليه ومجمد رسمياً؛ لا يمكن تعديل بياناته وفقاً لأحكام الصفقات العمومية."
                ]
            })

        # 3. التحقق من توافق طريقة الإبرام مع الشكل والقالب
        admin_clauses = attrs.get('administrative_clauses')
        if admin_clauses is None and instance:
            admin_clauses = instance.administrative_clauses or {}

        if isinstance(admin_clauses, dict):
            admin_clauses = dict(admin_clauses)
            method = admin_clauses.get('procurement_method')
            form = admin_clauses.get('procurement_form')

            valid_forms_for_tender = {'open', 'open_with_min_capacity', 'restricted', 'competition'}
            valid_forms_for_negotiated = {'direct', 'after_consultation'}

            if method and form:
                if method in ('call_for_tenders', 'open_tender'):
                    if form not in valid_forms_for_tender:
                        raise serializers.ValidationError({
                            "procurement_form": (
                                f"شكل الإبرام '{form}' غير متوافق مع طلب العروض (المادة 40 من القانون 23-12). "
                                f"الأشكال المقبولة: {', '.join(sorted(valid_forms_for_tender))}."
                            )
                        })
                elif method == 'negotiated_procedure':
                    if form not in valid_forms_for_negotiated:
                        raise serializers.ValidationError({
                            "procurement_form": (
                                f"شكل الإبرام '{form}' غير متوافق مع الإجراء التفاوضي (المادة 46 وما بعدها من القانون 23-12). "
                                f"الأشكال المقبولة: {', '.join(sorted(valid_forms_for_negotiated))}."
                            )
                        })

            # 4. عدم الوثوق بحالة الاعتماد المرسلة من العميل (template_status)
            # القوالب الحالية استرشادية داخلية تخضع لمراجعة المصلحة
            raw_status = admin_clauses.get('template_status')
            if raw_status:
                admin_clauses['template_status'] = 'internal_advisory'
            attrs['administrative_clauses'] = admin_clauses

        return attrs

    def update(self, instance, validated_data):
        # دمج حقول JSON عند التحديث الجزئي (PATCH) دون مسح المفاتيح السابقة
        for json_field in ['administrative_clauses', 'technical_requirements', 'financial_criteria']:
            if json_field in validated_data:
                existing_dict = getattr(instance, json_field) or {}
                incoming_dict = validated_data[json_field] or {}
                if isinstance(existing_dict, dict) and isinstance(incoming_dict, dict):
                    merged_dict = {**existing_dict, **incoming_dict}
                    validated_data[json_field] = merged_dict

        return super().update(instance, validated_data)


class ProcurementDealSerializer(serializers.ModelSerializer):
    authority_name = serializers.ReadOnlyField(source='authority.full_name')
    authority_entity = serializers.ReadOnlyField(source='authority.entity_name')
    cahier_specs = CahierSpecsSerializer(read_only=True)
    stage_display = serializers.CharField(source='get_current_stage_display', read_only=True)
    reference_number = serializers.CharField(required=False, allow_blank=True)
    base_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_avenant_amount = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_avenant_percentage = serializers.FloatField(read_only=True)
    avenants_count = serializers.SerializerMethodField()
    has_avenant_warning = serializers.SerializerMethodField()
    active_legal_notices_count = serializers.IntegerField(read_only=True)
    has_expired_notice = serializers.BooleanField(read_only=True)
    legal_notices_count = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)
    days_left = serializers.IntegerField(read_only=True)

    class Meta:
        model = ProcurementDeal
        fields = '__all__'
        read_only_fields = ['authority']

    def get_avenants_count(self, obj):
        return obj.avenants.count()

    def get_has_avenant_warning(self, obj):
        return getattr(obj, 'total_avenant_percentage', 0.0) >= 20.0

    def get_legal_notices_count(self, obj):
        return obj.legal_notices.count()

    def create(self, validated_data):
        if not validated_data.get('reference_number'):
            import random
            from django.utils import timezone
            year = timezone.now().year
            num = random.randint(1000, 9999)
            validated_data['reference_number'] = f"DZ-{year}-{num}"
        return super().create(validated_data)


class AvenantSerializer(serializers.ModelSerializer):
    percentage_impact = serializers.FloatField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    deal_reference = serializers.ReadOnlyField(source='deal.reference_number')
    deal_title = serializers.ReadOnlyField(source='deal.title')

    class Meta:
        model = Avenant
        fields = [
            'id',
            'deal',
            'deal_reference',
            'deal_title',
            'reference',
            'reason',
            'amount_change',
            'percentage_impact',
            'time_extension_days',
            'status',
            'status_display',
            'committee_approval_ref',
            'document_pdf',
            'created_at',
            'approved_at',
        ]
        read_only_fields = ['id', 'created_at', 'approved_at', 'percentage_impact']

    def validate(self, attrs):
        deal = attrs.get('deal') or getattr(self.instance, 'deal', None)
        amount_change = attrs.get('amount_change')
        if amount_change is None and self.instance:
            amount_change = self.instance.amount_change
        amount_change = amount_change or Decimal('0.00')

        if deal:
            base_amount = deal.base_amount
            if base_amount and base_amount > 0:
                # مجموع الملاحق السابقة (باستثناء الحالي إن كان تعديلاً)
                existing_qs = deal.avenants.filter(status__in=['approved', 'pending_approval'])
                if self.instance:
                    existing_qs = existing_qs.exclude(id=self.instance.id)
                current_total = sum((a.amount_change for a in existing_qs), Decimal('0.00'))
                new_total = current_total + amount_change
                total_percentage = (new_total / base_amount) * Decimal('100.0')

                # التحقق الصارم من الحد الأقصى القانوني 25% (وفقاً للمرسوم 15-247 والقانون 23-12)
                if total_percentage > Decimal('25.0'):
                    raise serializers.ValidationError({
                        'amount_change': (
                            f"مرفوض قانوناً وفقاً لأحكام المرسوم الرئاسي 15-247 (المادتان 138 و139) والقانون 23-12: "
                            f"مجموع مبالغ الملاحق التعاقدية سيصل إلى {new_total:,.2f} دج أي بنسبة {float(total_percentage):.2f}% "
                            f"من المبلغ الأصلي للصفقة ({base_amount:,.2f} دج)، وهو ما يتجاوز السقف القانوني الأقصى المطلق (25%)."
                        )
                    })

        return attrs





class LegalNoticeSerializer(serializers.ModelSerializer):
    """
    محدد بيانات الإعذار القانوني (Mise en Demeure) وفق المرسوم الرئاسي 15-247
    والقانون 23-12 (المادة 67 الخاصة بالتبليغ الإلكتروني والإخطارات الرسمية).
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    notice_type_display = serializers.CharField(source='get_notice_type_display', read_only=True)
    deal_reference = serializers.ReadOnlyField(source='deal.reference_number')
    deal_title = serializers.ReadOnlyField(source='deal.title')
    authority_name = serializers.ReadOnlyField(source='deal.authority.full_name')
    created_by_name = serializers.ReadOnlyField(source='created_by.full_name')
    acknowledged_by_name = serializers.ReadOnlyField(source='acknowledged_by.full_name')
    operator_name = serializers.SerializerMethodField()
    deadline_date = serializers.DateField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = LegalNotice
        fields = [
            'id',
            'deal',
            'deal_reference',
            'deal_title',
            'authority_name',
            'operator_name',
            'reference',
            'notice_type',
            'notice_type_display',
            'reason',
            'issued_date',
            'legal_deadline_days',
            'deadline_date',
            'days_remaining',
            'is_expired',
            'status',
            'status_display',
            'penalty_amount',
            'operator_justification',
            'operator_justification_file',
            'justification_submitted_at',
            'created_by',
            'created_by_name',
            'acknowledged_at',
            'acknowledged_by',
            'acknowledged_by_name',
            'resolved_at',
            'resolution_notes',
            'document_pdf',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'deal_reference',
            'deal_title',
            'authority_name',
            'operator_name',
            'created_by_name',
            'acknowledged_by_name',
            'deadline_date',
            'days_remaining',
            'is_expired',
            'created_at',
            'updated_at',
        ]

    def get_operator_name(self, obj):
        try:
            if hasattr(obj.deal, 'contract') and obj.deal.contract and obj.deal.contract.awarded_operator:
                op = obj.deal.contract.awarded_operator
                return getattr(op, 'company_name', None) or getattr(op, 'full_name', None) or op.email
            contract = obj.deal.procurement_contracts.first()
            if contract and contract.operator:
                return getattr(contract.operator, 'company_name', None) or getattr(contract.operator, 'full_name', None) or contract.operator.email
        except Exception:
            pass
        return ''

    def to_representation(self, instance):
        # التحقق التلقائي وتحديث غرامات التأخير في حال انقضاء المهلة
        try:
            instance.check_and_update_expiry_and_penalty()
        except Exception:
            pass
        return super().to_representation(instance)




class AdministrativeNoticeSerializer(serializers.ModelSerializer):
    """
    محدد بيانات الإعذار الإداري الرقابي الصادر من الإدارة المركزية (عين الصقر)
    وفقاً لأحكام القانون رقم 23-12 والمرسوم الرئاسي 15-247.
    """
    authority_name = serializers.SerializerMethodField()
    authority_entity = serializers.SerializerMethodField()
    authority_wilaya = serializers.SerializerMethodField()
    deal_reference = serializers.ReadOnlyField(source='deal.reference_number')
    deal_title = serializers.ReadOnlyField(source='deal.title')
    violation_type_display = serializers.CharField(source='get_violation_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    issued_by_name = serializers.ReadOnlyField(source='issued_by.full_name')
    responded_by_name = serializers.ReadOnlyField(source='responded_by.full_name')
    deadline_date = serializers.DateField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = AdministrativeNotice
        fields = [
            'id',
            'reference',
            'authority',
            'authority_name',
            'authority_entity',
            'authority_wilaya',
            'deal',
            'deal_reference',
            'deal_title',
            'violation_type',
            'violation_type_display',
            'legal_reference',
            'directive_text',
            'violation_details',
            'issued_date',
            'deadline_days',
            'deadline_date',
            'days_remaining',
            'is_expired',
            'status',
            'status_display',
            'issued_by',
            'issued_by_name',
            'authority_response',
            'authority_response_file',
            'responded_at',
            'responded_by',
            'responded_by_name',
            'acknowledged_at',
            'escalated_at',
            'escalation_reason',
            'document_pdf',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'authority_name',
            'authority_entity',
            'authority_wilaya',
            'deal_reference',
            'deal_title',
            'issued_by_name',
            'responded_by_name',
            'deadline_date',
            'days_remaining',
            'is_expired',
            'created_at',
            'updated_at',
            'escalated_at',
        ]

    def get_authority_name(self, obj):
        if obj.authority:
            return getattr(obj.authority, 'organization_name', None) or getattr(obj.authority, 'entity_name', None) or getattr(obj.authority, 'full_name', None) or obj.authority.email
        return 'المصلحة المتعاقدة'

    def get_authority_entity(self, obj):
        if obj.authority:
            return getattr(obj.authority, 'entity_name', None) or getattr(obj.authority, 'organization_name', None) or ''
        return ''

    def get_authority_wilaya(self, obj):
        if obj.authority:
            return getattr(obj.authority, 'wilaya', None) or (obj.deal.wilaya if obj.deal else '')
        return ''

    def to_representation(self, instance):
        try:
            instance.check_and_update_escalation()
        except Exception:
            pass
        return super().to_representation(instance)


class SessionAccessSerializer(serializers.ModelSerializer):
    operator_email = serializers.ReadOnlyField(source='operator.email')
    operator_name = serializers.ReadOnlyField(source='operator.full_name')

    class Meta:
        model = SessionAccess
        fields = [
            'id',
            'session',
            'operator',
            'operator_email',
            'operator_name',
            'can_view_live',
            'can_view_recording',
            'can_download_minutes',
            'granted_at',
            'revoked_at',
        ]


class OpeningEventSerializer(serializers.ModelSerializer):
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    is_my_offer = serializers.SerializerMethodField()
    offer_id = serializers.SerializerMethodField()
    operator_label = serializers.SerializerMethodField()

    class Meta:
        model = OpeningEvent
        fields = [
            'id',
            'event_type',
            'event_type_display',
            'order',
            'announced_price',
            'is_accepted',
            'notes',
            'created_at',
            'offer_id',
            'is_my_offer',
            'operator_label',
        ]

    def get_is_my_offer(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not obj.offer:
            return False
        return obj.offer.operator_id == request.user.id

    def get_offer_id(self, obj):
        request = self.context.get('request')
        if not obj.offer:
            return None
        # القانون 18-07: عزل معرفات العروض وعرض معرف العرض فقط للمتعامل صاحبه أو للمصلحة المتعاقدة
        if request and request.user:
            if getattr(request.user, 'role', None) in ['authority', 'central_admin'] or request.user.is_staff:
                return str(obj.offer.id)
            if obj.offer.operator_id == request.user.id:
                return str(obj.offer.id)
        return None

    def get_operator_label(self, obj):
        request = self.context.get('request')
        if not obj.offer:
            return None
        # القانون 18-07: عزل أسماء المنافسين وحجب هوياتهم في واجهة المتعامل
        if request and request.user:
            if getattr(request.user, 'role', None) in ['authority', 'central_admin'] or request.user.is_staff:
                return obj.offer.operator.full_name or obj.offer.operator.entity_name or obj.offer.operator.email
            if obj.offer.operator_id == request.user.id:
                return "عرضك (المتعامل الحالي)"
        return f"المتعامل رقم {obj.order}" if obj.order else "عرض منافس"


class OpeningCommitteeShareSerializer(serializers.ModelSerializer):
    """بيانات عضو لجنة فتح الأظرفة وحالة تقديم حصته التشفيرية"""
    role_display = serializers.CharField(source='get_member_role_display', read_only=True)

    class Meta:
        model = OpeningCommitteeShare
        fields = [
            'id',
            'session_id',
            'member_name',
            'member_role',
            'role_display',
            'share_index',
            'is_submitted',
            'submitted_at',
            'created_at',
        ]
        read_only_fields = fields


class OpeningSessionListSerializer(serializers.ModelSerializer):
    tender_id = serializers.UUIDField(source='tender.id', read_only=True)
    tender_reference = serializers.CharField(source='tender.reference_number', read_only=True)
    tender_title = serializers.CharField(source='tender.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    access_policy_display = serializers.CharField(source='get_access_policy_display', read_only=True)

    class Meta:
        model = OpeningSession
        fields = [
            'id',
            'tender_id',
            'tender_reference',
            'tender_title',
            'scheduled_at',
            'location',
            'status',
            'status_display',
            'access_policy',
            'access_policy_display',
            'total_offers',
            'opened_count',
        ]


class OpeningSessionDetailSerializer(serializers.ModelSerializer):
    tender_id = serializers.UUIDField(source='tender.id', read_only=True)
    tender_reference = serializers.CharField(source='tender.reference_number', read_only=True)
    tender_title = serializers.CharField(source='tender.title', read_only=True)
    authority_name = serializers.CharField(source='tender.authority.full_name', read_only=True)
    authority_entity = serializers.CharField(source='tender.authority.entity_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    access_policy_display = serializers.CharField(source='get_access_policy_display', read_only=True)
    accesses_count = serializers.SerializerMethodField()
    my_access = serializers.SerializerMethodField()
    events = serializers.SerializerMethodField()
    committee_shares = OpeningCommitteeShareSerializer(many=True, read_only=True)
    quorum_reached = serializers.SerializerMethodField()

    def get_quorum_reached(self, obj) -> bool:
        return obj.ceremony_status == 'unlocked' or (obj.committee_shares.filter(is_submitted=True).count() >= obj.threshold_k)

    class Meta:
        model = OpeningSession
        fields = [
            'id',
            'tender_id',
            'tender_reference',
            'tender_title',
            'authority_name',
            'authority_entity',
            'scheduled_at',
            'started_at',
            'ended_at',
            'location',
            'stream_url',
            'recording_url',
            'status',
            'status_display',
            'access_policy',
            'access_policy_display',
            'total_offers',
            'opened_count',
            'require_committee_ceremony',
            'threshold_k',
            'threshold_n',
            'ceremony_status',
            'unlocked_at',
            'committee_shares',
            'quorum_reached',
            'accesses_count',
            'my_access',
            'events',
            'created_at',
        ]

    def get_accesses_count(self, obj):
        return obj.accesses.count()

    def get_my_access(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return None
        access = obj.accesses.filter(operator=request.user, revoked_at__isnull=True).first()
        if access:
            return SessionAccessSerializer(access).data
        return None

    def get_events(self, obj):
        events_qs = obj.events.all().order_by('order', 'created_at')
        return OpeningEventSerializer(events_qs, many=True, context=self.context).data


class SessionScheduleRequestSerializer(serializers.Serializer):
    tender_id = serializers.UUIDField(required=True)
    scheduled_at = serializers.DateTimeField(required=True)
    location = serializers.CharField(max_length=255, required=True)
    stream_url = serializers.URLField(required=False, allow_blank=True, default='')

    def validate_scheduled_at(self, value):
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError('يجب أن يكون موعد جلسة الفتح في المستقبل؛ لا تُبرمج الجلسات بأثر رجعي.')
        return value


class OpenOfferRequestSerializer(serializers.Serializer):
    offer_id = serializers.UUIDField(required=True)
    announced_price = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        required=True,
        min_value=Decimal('0.01'),
    )
    is_accepted = serializers.BooleanField(required=False, default=True)
    notes = serializers.CharField(required=False, allow_blank=True, default='')


class DealOfferSummarySerializer(serializers.ModelSerializer):
    """
    ملخص العروض المودعة لعرضها في لوحة التحكم بجلسة فتح الأظرفة.
    لا يكشف إلا عن الحقول الضرورية للمصلحة المتعاقدة خلال الجلسة.
    """
    operator_name = serializers.SerializerMethodField()

    class Meta:
        model = BidOffer
        fields = [
            'id',
            'operator',
            'operator_name',
            'status',
            'financial_amount',
            'submission_timestamp',
            'created_at',
        ]

    def get_operator_name(self, obj):
        op = obj.operator
        if not op:
            return None
        return (
            op.organization_name
            or op.display_name
            or op.email
        )

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if user and getattr(user, 'role', None) == 'authority':
            deal = getattr(instance, 'deal', None)
            stage = getattr(deal, 'current_stage', 1) if deal else 1
            if stage < 4:
                ret['financial_amount'] = None
        return ret


STAGE_STATUS_MAP = {
    1: 'planning',
    2: 'specs_draft',
    3: 'published',
    4: 'clarifications',
    5: 'submission_open',
    6: 'opening_in_progress',
    7: 'technical_evaluation',
    8: 'provisional_award',
    9: 'contract_signed',
    10: 'in_execution',
    11: 'delivered',
    12: 'closed',
}


class OpportunitySerializer(serializers.ModelSerializer):
    """محدد بيانات الفرص/الصفقات الموجه للمتعاملين مع مطابقة تسميات الواجهة"""
    reference = serializers.CharField(source='reference_number', read_only=True)
    authorityName = serializers.SerializerMethodField()
    authority_name = serializers.SerializerMethodField()
    hasDocument = serializers.SerializerMethodField()
    has_document = serializers.SerializerMethodField()
    estimatedBudget = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    submissionDeadline = serializers.DateTimeField(source='submission_deadline', format='%Y-%m-%dT%H:%M:%S%z', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%dT%H:%M:%S%z', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', format='%Y-%m-%dT%H:%M:%S%z', read_only=True)
    has_active_injunction = serializers.SerializerMethodField()
    specs_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    specsPrice = serializers.SerializerMethodField()
    is_specs_free = serializers.SerializerMethodField()
    has_purchased_specs = serializers.SerializerMethodField()
    specs_purchase = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    isExpired = serializers.SerializerMethodField()
    days_left = serializers.SerializerMethodField()
    daysLeft = serializers.SerializerMethodField()

    class Meta:
        model = ProcurementDeal
        fields = [
            'id',
            'reference',
            'reference_number',
            'title',
            'description',
            'authorityName',
            'authority_name',
            'hasDocument',
            'has_document',
            'estimatedBudget',
            'estimated_budget',
            'specs_price',
            'specsPrice',
            'is_specs_free',
            'has_purchased_specs',
            'specs_purchase',
            'is_expired',
            'isExpired',
            'days_left',
            'daysLeft',
            'status',
            'current_stage',
            'wilaya',
            'submissionDeadline',
            'submission_deadline',
            'createdAt',
            'created_at',
            'updatedAt',
            'updated_at',
            'has_active_injunction',
        ]

    def get_is_expired(self, obj):
        return getattr(obj, 'is_expired', False)

    def get_isExpired(self, obj):
        return getattr(obj, 'is_expired', False)

    def get_days_left(self, obj):
        return getattr(obj, 'days_left', 0)

    def get_daysLeft(self, obj):
        return getattr(obj, 'days_left', 0)

    def get_has_active_injunction(self, obj):
        return getattr(obj, 'has_active_injunction', False)

    def get_specsPrice(self, obj):
        return float(obj.specs_price) if obj.specs_price else 0.0

    def get_is_specs_free(self, obj):
        return obj.is_specs_free

    def get_has_purchased_specs(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return obj.specs_purchases.filter(operator=request.user, status='paid').exists()

    def get_specs_purchase(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return None
        p = obj.specs_purchases.filter(operator=request.user, status='paid').first()
        if not p:
            return None
        return {
            'id': str(p.id),
            'receipt_number': p.receipt_number,
            'amount': float(p.amount),
            'paid_at': p.paid_at.isoformat() if p.paid_at else None,
            'download_url': f"/api/procurements/specs/download/{p.receipt_number}/",
            'receipt_url': f"/api/procurements/specs/receipt/{p.receipt_number}/",
        }

    def get_authorityName(self, obj):
        if obj.authority:
            return obj.authority.organization_name or obj.authority.display_name or obj.authority.email
        return 'المصلحة المتعاقدة'

    def get_authority_name(self, obj):
        return self.get_authorityName(obj)

    def get_hasDocument(self, obj):
        return hasattr(obj, 'cahier_specs') and obj.cahier_specs is not None

    def get_has_document(self, obj):
        return self.get_hasDocument(obj)

    def get_estimatedBudget(self, obj):
        return str(obj.estimated_budget) if obj.estimated_budget is not None else None

    def get_status(self, obj):
        return STAGE_STATUS_MAP.get(obj.current_stage, 'published')


class OfferDocumentSerializer(serializers.ModelSerializer):
    """محدد بيانات وثائق العروض المرفوعة"""
    file_url = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = OfferDocument
        fields = [
            'id',
            'offer',
            'file',
            'file_url',
            'file_name',
            'uploaded_at',
        ]
        read_only_fields = ['id', 'uploaded_at']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_file_name(self, obj):
        if obj.file:
            return obj.file.name.split('/')[-1]
        return None


class OfferSerializer(serializers.ModelSerializer):
    """
    محدد بيانات العروض الموجه للواجهة الأمامية متوافق مع Multipart Form Data ورفع الوثائق
    وفق أحكام القانون 23-12.
    """
    opportunityId = serializers.CharField(source='deal.id', read_only=True)
    opportunity_id = serializers.CharField(source='deal.id', read_only=True)
    opportunityTitle = serializers.CharField(source='deal.title', read_only=True)
    opportunity_title = serializers.CharField(source='deal.title', read_only=True)
    authorityName = serializers.SerializerMethodField()
    authority_name = serializers.SerializerMethodField()
    financialOffer = serializers.SerializerMethodField()
    financial_amount = serializers.SerializerMethodField()
    deliveryTimeDays = serializers.SerializerMethodField()
    hasDocument = serializers.SerializerMethodField()
    has_document = serializers.SerializerMethodField()
    submittedAt = serializers.DateTimeField(source='submission_timestamp', format='%Y-%m-%dT%H:%M:%S%z', read_only=True)
    updatedAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%dT%H:%M:%S%z', read_only=True)
    operatorName = serializers.SerializerMethodField()
    technicalScore = serializers.DecimalField(source='technical_score', max_digits=5, decimal_places=2, read_only=True)
    financialScore = serializers.DecimalField(source='financial_score', max_digits=5, decimal_places=2, read_only=True)

    # حقول رفع الوثائق عبر Multipart Form Data
    document = serializers.FileField(required=False, write_only=True)
    file = serializers.FileField(required=False, write_only=True)

    # حقول استعراض وتحميل الوثيقة
    document_url = serializers.SerializerMethodField()
    document_file = serializers.SerializerMethodField()
    document_name = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()

    # حقول إضافية قد تمررها الواجهة عند الحفظ والإيداع
    technical_offer = serializers.CharField(required=False, allow_blank=True, write_only=True)
    delivery_time_days = serializers.CharField(required=False, allow_blank=True, write_only=True)
    can_withdraw = serializers.SerializerMethodField()
    canWithdraw = serializers.SerializerMethodField()

    class Meta:
        model = BidOffer
        fields = [
            'id',
            'deal',
            'opportunityId',
            'opportunity_id',
            'opportunityTitle',
            'opportunity_title',
            'authorityName',
            'authority_name',
            'financialOffer',
            'financial_amount',
            'deliveryTimeDays',
            'delivery_time_days',
            'status',
            'technical_score',
            'technicalScore',
            'financial_score',
            'financialScore',
            'rejection_reason',
            'evaluator_notes',
            'hasDocument',
            'has_document',
            'submittedAt',
            'submission_timestamp',
            'updatedAt',
            'created_at',
            'operator',
            'operatorName',
            'document',
            'file',
            'document_url',
            'document_file',
            'document_name',
            'documents',
            'technical_offer',
            'can_withdraw',
            'canWithdraw',
        ]
        read_only_fields = ['operator', 'submission_timestamp']

    def get_can_withdraw(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if not user or getattr(user, 'role', None) != 'operator' or obj.operator_id != user.id:
            return False
        if obj.status != 'submitted':
            return False
        deal = obj.deal
        if not deal:
            return False
        from django.utils import timezone
        now = timezone.now()
        if deal.submission_deadline and now > deal.submission_deadline:
            return False
        if getattr(deal, 'current_stage', 1) > 5:
            return False
        from apps.procurements.models import OpeningSession
        session = OpeningSession.objects.filter(tender=deal).first()
        if session and session.status in ('live', 'ended'):
            return False
        return True

    def get_canWithdraw(self, obj):
        return self.get_can_withdraw(obj)

    def get_has_active_injunction(self, obj):
        return getattr(obj, 'has_active_injunction', False)

    def get_specsPrice(self, obj):
        return float(obj.specs_price) if obj.specs_price else 0.0

    def get_is_specs_free(self, obj):
        return obj.is_specs_free

    def get_has_purchased_specs(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return obj.specs_purchases.filter(operator=request.user, status='paid').exists()

    def get_specs_purchase(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return None
        p = obj.specs_purchases.filter(operator=request.user, status='paid').first()
        if not p:
            return None
        return {
            'id': str(p.id),
            'receipt_number': p.receipt_number,
            'amount': float(p.amount),
            'paid_at': p.paid_at.isoformat() if p.paid_at else None,
            'download_url': f"/api/procurements/specs/download/{p.receipt_number}/",
            'receipt_url': f"/api/procurements/specs/receipt/{p.receipt_number}/",
        }

    def get_authorityName(self, obj):
        if obj.deal and obj.deal.authority:
            return obj.deal.authority.organization_name or obj.deal.authority.display_name or obj.deal.authority.email
        return 'المصلحة المتعاقدة'

    def get_authority_name(self, obj):
        return self.get_authorityName(obj)

    def get_financialOffer(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        # حجب المبلغ المالي عن المصلحة المتعاقدة قبل مرحلة فتح الأظرفة (المراحل 1، 2، 3)
        if user and getattr(user, 'role', None) == 'authority':
            stage = getattr(obj.deal, 'current_stage', 1) if obj.deal else 1
            if stage < 4:
                return None
        return str(obj.financial_amount) if obj.financial_amount is not None else ""

    def get_financial_amount(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        # حجب المبلغ المالي عن المصلحة المتعاقدة قبل مرحلة فتح الأظرفة (المراحل 1، 2، 3)
        if user and getattr(user, 'role', None) == 'authority':
            stage = getattr(obj.deal, 'current_stage', 1) if obj.deal else 1
            if stage < 4:
                return None
        return obj.financial_amount

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        # حجب المبالغ المالية نهائياً عن المصلحة المتعاقدة في المراحل 1، 2، 3
        if user and getattr(user, 'role', None) == 'authority':
            deal = getattr(instance, 'deal', None)
            stage = getattr(deal, 'current_stage', 1) if deal else 1
            if stage < 4:
                ret['financial_amount'] = None
                ret['financialOffer'] = None
        return ret

    def to_internal_value(self, data):
        ret = super().to_internal_value(data)
        # استخراج المبلغ المالي عند إيداع العرض من قبل المتعامل
        amount_val = data.get('financial_amount')
        if amount_val is None or amount_val == '':
            amount_val = data.get('financialOffer')
        if amount_val is not None and amount_val != '':
            try:
                ret['financial_amount'] = Decimal(str(amount_val))
            except Exception:
                pass

        # ربط الصفقة إذا مرر المعرف بأسماء بديلة
        if 'deal' not in ret:
            deal_id = data.get('opportunityId') or data.get('opportunity_id') or data.get('deal_id')
            if deal_id:
                from apps.procurements.models import ProcurementDeal
                try:
                    ret['deal'] = ProcurementDeal.objects.get(id=deal_id)
                except Exception:
                    pass
        return ret

    def get_deliveryTimeDays(self, obj):
        return None

    def _get_latest_document(self, obj):
        if hasattr(obj, 'documents'):
            return obj.documents.order_by('-uploaded_at').first()
        return None

    def get_document_url(self, obj):
        latest = self._get_latest_document(obj)
        if latest and latest.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(latest.file.url)
            return latest.file.url
        return None

    def get_document_file(self, obj):
        return self.get_document_url(obj)

    def get_document_name(self, obj):
        latest = self._get_latest_document(obj)
        if latest and latest.file:
            return latest.file.name.split('/')[-1]
        return None

    def get_documents(self, obj):
        if not hasattr(obj, 'documents'):
            return []
        request = self.context.get('request')
        result = []
        for doc in obj.documents.order_by('-uploaded_at'):
            if not doc.file:
                continue
            url = request.build_absolute_uri(doc.file.url) if request else doc.file.url
            result.append({
                'id': str(doc.id),
                'name': doc.file.name.split('/')[-1],
                'url': url,
                'uploaded_at': doc.uploaded_at.isoformat() if doc.uploaded_at else None,
            })
        return result

    def get_hasDocument(self, obj):
        return bool(self._get_latest_document(obj))

    def get_has_document(self, obj):
        return self.get_hasDocument(obj)

    def get_operatorName(self, obj):
        if obj.operator:
            return obj.operator.organization_name or obj.operator.display_name or obj.operator.email
        return ''

    def create(self, validated_data):
        doc_file = validated_data.pop('document', None) or validated_data.pop('file', None)
        validated_data.pop('technical_offer', None)
        validated_data.pop('delivery_time_days', None)

        request = self.context.get('request')
        if not doc_file and request and hasattr(request, 'FILES'):
            doc_file = request.FILES.get('document') or request.FILES.get('file')

        offer = super().create(validated_data)
        if doc_file:
            from apps.bids.validators import validate_document_upload
            from django.core.exceptions import ValidationError as DjangoValidationError
            try:
                validate_document_upload(doc_file)
            except DjangoValidationError as e:
                raise serializers.ValidationError({'document': list(e.messages) if hasattr(e, 'messages') else str(e)})
            OfferDocument.objects.create(offer=offer, file=doc_file)
        return offer

    def update(self, instance, validated_data):
        doc_file = validated_data.pop('document', None) or validated_data.pop('file', None)
        validated_data.pop('technical_offer', None)
        validated_data.pop('delivery_time_days', None)

        request = self.context.get('request')
        if not doc_file and request and hasattr(request, 'FILES'):
            doc_file = request.FILES.get('document') or request.FILES.get('file')

        offer = super().update(instance, validated_data)
        if doc_file:
            from apps.bids.validators import validate_document_upload
            from django.core.exceptions import ValidationError as DjangoValidationError
            try:
                validate_document_upload(doc_file)
            except DjangoValidationError as e:
                raise serializers.ValidationError({'document': list(e.messages) if hasattr(e, 'messages') else str(e)})
            OfferDocument.objects.create(offer=offer, file=doc_file)
        return offer


class MilestoneProgressReportSerializer(serializers.ModelSerializer):
    operator_name = serializers.SerializerMethodField()
    report_file_url = serializers.SerializerMethodField()

    class Meta:
        model = MilestoneProgressReport
        fields = [
            'id',
            'milestone',
            'operator',
            'operator_name',
            'progress_percentage',
            'report_text',
            'report_file',
            'report_file_url',
            'submitted_at',
        ]
        read_only_fields = ['id', 'operator', 'submitted_at']

    def get_operator_name(self, obj):
        if obj.operator:
            return obj.operator.organization_name or obj.operator.display_name or obj.operator.email
        return ''

    def get_report_file_url(self, obj):
        if obj.report_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.report_file.url)
            return obj.report_file.url
        return None


class MilestoneSerializer(serializers.ModelSerializer):
    deal_reference = serializers.CharField(source='deal.reference_number', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    progress_reports = MilestoneProgressReportSerializer(many=True, read_only=True)

    class Meta:
        model = Milestone
        fields = [
            'id',
            'deal',
            'deal_reference',
            'title',
            'description',
            'amount',
            'due_date',
            'status',
            'status_display',
            'completion_date',
            'progress_percentage',
            'progress_reports',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ContractSerializer(serializers.ModelSerializer):
    deal_reference = serializers.CharField(source='deal.reference_number', read_only=True)
    deal_title = serializers.CharField(source='deal.title', read_only=True)
    operator_name = serializers.SerializerMethodField()
    operator_email = serializers.CharField(source='operator.email', read_only=True)
    contract_pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = Contract
        fields = [
            'id',
            'deal',
            'deal_reference',
            'deal_title',
            'operator',
            'operator_name',
            'operator_email',
            'contract_number',
            'contract_pdf',
            'contract_pdf_url',
            'signed_at',
            'status',
            'amount',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_operator_name(self, obj):
        if obj.operator:
            return obj.operator.organization_name or obj.operator.display_name or obj.operator.email
        return ''

    def get_contract_pdf_url(self, obj):
        if obj.contract_pdf:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.contract_pdf.url)
            return obj.contract_pdf.url
        return None


class PriceCheckItemSerializer(serializers.Serializer):
    """بند مالي واحد مرسل إلى /api/procurements/check-prices/.

    يقبل الأسماء القانونية (name / proposed_price / unit / wilaya)
    مع مرادفات شائعة من الواجهة (item_name / price / unit_price...).
    """

    name = serializers.CharField(max_length=255, trim_whitespace=True)
    proposed_price = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        min_value=Decimal('0.01'),
    )
    unit = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    wilaya = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')

    _FIELD_ALIASES = {
        'name': ('item_name', 'itemName', 'designation', 'label', 'item', 'name_ar'),
        'proposed_price': ('price', 'unit_price', 'unitPrice', 'amount', 'proposedPrice'),
        'unit': ('measure_unit', 'unite', 'unit_name'),
        'wilaya': ('province', 'wilaya_name', 'state'),
    }

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = data.copy()
            for canonical, aliases in self._FIELD_ALIASES.items():
                current = data.get(canonical)
                if current not in (None, ''):
                    continue
                for alias in aliases:
                    value = data.get(alias)
                    if value not in (None, ''):
                        data[canonical] = value
                        break
        return super().to_internal_value(data)

    def validate_name(self, value):
        value = value.strip()
        if not normalize_item_name(value):
            raise serializers.ValidationError(
                'اسم المادة أو الخدمة يجب أن يحتوي على حروف أو أرقام.'
            )
        return value

    def validate_unit(self, value):
        return (value or '').strip()

    def validate_wilaya(self, value):
        value = (value or '').strip()
        if value and not normalize_wilaya(value):
            raise serializers.ValidationError('الولاية يجب أن تحتوي على حروف أو أرقام.')
        return value

    def validate_proposed_price(self, value):
        if not value.is_finite():
            raise serializers.ValidationError('السعر المقترح يجب أن يكون رقماً صحيحاً.')
        return value


class CheckPricesRequestSerializer(serializers.Serializer):
    """غلاف طلب فحص الأسعار: ولاية افتراضية + قائمة البنود المالية."""

    wilaya = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        default='',
    )
    items = PriceCheckItemSerializer(many=True, allow_empty=False, max_length=200)

    def to_internal_value(self, data):
        if isinstance(data, dict):
            data = data.copy()
            if 'items' not in data:
                for alias in ('financial_items', 'lines', 'prices', 'entries'):
                    if alias in data:
                        data['items'] = data[alias]
                        break
            if data.get('wilaya') in (None, ''):
                for alias in ('province', 'wilaya_name', 'state'):
                    value = data.get(alias)
                    if value not in (None, ''):
                        data['wilaya'] = value
                        break
        return super().to_internal_value(data)

    def validate_wilaya(self, value):
        value = (value or '').strip()
        if value and not normalize_wilaya(value):
            raise serializers.ValidationError('الولاية يجب أن تحتوي على حروف أو أرقام.')
        return value

class SpecsPurchaseSerializer(serializers.ModelSerializer):
    operator_name = serializers.ReadOnlyField(source='operator.full_name')
    operator_email = serializers.ReadOnlyField(source='operator.email')
    deal_title = serializers.ReadOnlyField(source='deal.title')
    deal_reference = serializers.ReadOnlyField(source='deal.reference_number')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = SpecsPurchase
        fields = '__all__'

