from django.contrib import admin
from .models import AwardObjection, ObjectionTimeline, AwardDecision, Contract


class ObjectionTimelineInline(admin.TabularInline):
    model = ObjectionTimeline
    extra = 0
    readonly_fields = ["event", "actor", "notes", "created_at"]
    can_delete = False


@admin.register(AwardObjection)
class AwardObjectionAdmin(admin.ModelAdmin):
    list_display = [
        "reference", "tender", "objector", "status",
        "objection_type", "deadline_at", "days_remaining"
    ]
    list_filter = ["status", "objection_type"]
    search_fields = [
        "reference", "tender__reference_number",
        "objector__email"
    ]
    readonly_fields = ["checksum", "created_at", "updated_at"]
    inlines = [ObjectionTimelineInline]


@admin.register(ObjectionTimeline)
class ObjectionTimelineAdmin(admin.ModelAdmin):
    list_display = ["objection", "event", "actor", "created_at"]
    list_filter = ["event"]


@admin.register(AwardDecision)
class AwardDecisionAdmin(admin.ModelAdmin):
    list_display = ["deal", "awarded_bid", "publication_date", "appeal_status", "is_definitive"]
    list_filter = ["appeal_status", "is_definitive"]


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ["contract_number", "deal", "awarded_operator", "signed_amount", "status"]
    list_filter = ["status"]
