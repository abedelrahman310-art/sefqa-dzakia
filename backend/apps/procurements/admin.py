from django.contrib import admin
from .models import (
    ProcurementDeal,
    CahierSpecs,
    OpeningSession,
    SessionAccess,
    OpeningEvent,
)


@admin.register(ProcurementDeal)
class ProcurementDealAdmin(admin.ModelAdmin):
    list_display = ('reference_number', 'title', 'authority', 'current_stage', 'estimated_budget', 'submission_deadline', 'created_at')
    list_filter = ('current_stage', 'wilaya')
    search_fields = ('reference_number', 'title', 'description')
    ordering = ('-created_at',)


@admin.register(CahierSpecs)
class CahierSpecsAdmin(admin.ModelAdmin):
    list_display = ('deal', 'is_validated', 'created_at')
    list_filter = ('is_validated',)
    search_fields = ('deal__reference_number', 'deal__title')


class SessionAccessInline(admin.TabularInline):
    model = SessionAccess
    extra = 0
    fields = ('operator', 'can_view_live', 'can_view_recording', 'can_download_minutes', 'granted_at', 'revoked_at')
    readonly_fields = ('granted_at',)


class OpeningEventInline(admin.TabularInline):
    model = OpeningEvent
    extra = 0
    fields = ('order', 'event_type', 'offer', 'announced_price', 'is_accepted', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(OpeningSession)
class OpeningSessionAdmin(admin.ModelAdmin):
    list_display = ('tender', 'scheduled_at', 'status', 'access_policy', 'total_offers', 'opened_count', 'created_by')
    list_filter = ('status', 'access_policy')
    search_fields = ('tender__reference_number', 'tender__title', 'location')
    inlines = [SessionAccessInline, OpeningEventInline]
    ordering = ('-scheduled_at',)


@admin.register(SessionAccess)
class SessionAccessAdmin(admin.ModelAdmin):
    list_display = ('session', 'operator', 'can_view_live', 'can_view_recording', 'can_download_minutes', 'granted_at', 'revoked_at')
    list_filter = ('can_view_live', 'can_view_recording', 'can_download_minutes')
    search_fields = ('operator__email', 'session__tender__reference_number')


@admin.register(OpeningEvent)
class OpeningEventAdmin(admin.ModelAdmin):
    list_display = ('session', 'order', 'event_type', 'offer', 'announced_price', 'is_accepted', 'created_at')
    list_filter = ('event_type', 'is_accepted')
    search_fields = ('session__tender__reference_number', 'notes')
