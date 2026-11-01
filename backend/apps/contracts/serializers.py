from rest_framework import serializers
from .models import (
    AwardDecision,
    Contract,
    AwardObjection,
    ObjectionTimeline,
    ObjectionType,
    ObjectionGround,
    ObjectionStatus,
)


class AwardDecisionSerializer(serializers.ModelSerializer):
    deal_title = serializers.ReadOnlyField(source='deal.title')
    deal_reference = serializers.ReadOnlyField(source='deal.reference_number')
    operator_name = serializers.ReadOnlyField(source='awarded_bid.operator.company_name')

    class Meta:
        model = AwardDecision
        fields = '__all__'


class ContractSerializer(serializers.ModelSerializer):
    deal_title = serializers.ReadOnlyField(source='deal.title')
    deal_reference = serializers.ReadOnlyField(source='deal.reference_number')
    operator_name = serializers.ReadOnlyField(source='awarded_operator.company_name')

    class Meta:
        model = Contract
        fields = '__all__'


class ObjectionTimelineSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.full_name", read_only=True)

    class Meta:
        model = ObjectionTimeline
        fields = ["id", "event", "actor_name", "notes", "metadata", "created_at"]


class ObjectionListSerializer(serializers.ModelSerializer):
    objector_name = serializers.CharField(
        source="objector.full_name", read_only=True
    )
    tender_reference = serializers.CharField(
        source="tender.reference_number", read_only=True
    )
    tender_title = serializers.CharField(
        source="tender.title", read_only=True
    )
    days_remaining = serializers.SerializerMethodField()
    is_within_deadline = serializers.SerializerMethodField()

    class Meta:
        model = AwardObjection
        fields = [
            "id", "reference", "tender_reference", "tender_title", "objector_name",
            "objection_type", "grounds", "status", "submitted_at",
            "deadline_at", "days_remaining", "is_within_deadline", "checksum", "created_at",
        ]

    def get_days_remaining(self, obj):
        return obj.days_remaining()

    def get_is_within_deadline(self, obj):
        return obj.is_within_deadline()


class ObjectionDetailSerializer(serializers.ModelSerializer):
    objector_name = serializers.CharField(
        source="objector.full_name", read_only=True
    )
    objector_email = serializers.EmailField(
        source="objector.email", read_only=True
    )
    contested_operator_name = serializers.CharField(
        source="contested_operator.full_name",
        read_only=True, allow_null=True
    )
    tender_reference = serializers.CharField(
        source="tender.reference_number", read_only=True
    )
    tender_title = serializers.CharField(
        source="tender.title", read_only=True
    )
    timeline = ObjectionTimelineSerializer(many=True, read_only=True)
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = AwardObjection
        fields = "__all__"

    def get_days_remaining(self, obj):
        return obj.days_remaining()


class ObjectionCreateSerializer(serializers.Serializer):
    tender_id = serializers.UUIDField()
    objection_type = serializers.ChoiceField(choices=ObjectionType.choices)
    grounds = serializers.ListField(
        child=serializers.ChoiceField(choices=ObjectionGround.choices),
        min_length=1,
    )
    description = serializers.CharField(min_length=20, max_length=5000)
    contested_operator_id = serializers.UUIDField(required=False, allow_null=True)


class ObjectionDecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=["accepted", "rejected"])
    reason = serializers.CharField(min_length=10, max_length=2000)
