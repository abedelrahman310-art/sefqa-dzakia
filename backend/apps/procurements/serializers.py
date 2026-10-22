import uuid
from decimal import Decimal
from rest_framework import serializers
from .models import (
    ProcurementDeal,
    CahierSpecs,
    OpeningSession,
    SessionAccess,
    OpeningEvent,
)
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

    class Meta:
        model = ProcurementDeal
        fields = '__all__'
        read_only_fields = ['authority']

    def create(self, validated_data):
        if not validated_data.get('reference_number'):
            import random
            from django.utils import timezone
            year = timezone.now().year
            num = random.randint(1000, 9999)
            validated_data['reference_number'] = f"DZ-{year}-{num}"
        return super().create(validated_data)


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

