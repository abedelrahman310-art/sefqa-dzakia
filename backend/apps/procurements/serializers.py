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


class CahierSpecsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CahierSpecs
        fields = '__all__'


class ProcurementDealSerializer(serializers.ModelSerializer):
    authority_name = serializers.ReadOnlyField(source='authority.full_name')
    authority_entity = serializers.ReadOnlyField(source='authority.entity_name')
    cahier_specs = CahierSpecsSerializer(read_only=True)
    stage_display = serializers.CharField(source='get_current_stage_display', read_only=True)

    class Meta:
        model = ProcurementDeal
        fields = '__all__'
        read_only_fields = ['authority']


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
