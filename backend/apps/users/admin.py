from django.contrib import admin
from .models import CustomUser, OperatorProfile, Notification, ExcludedOperator

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'display_name', 'organization_name', 'role', 'is_active', 'is_staff', 'created_at')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('email', 'display_name', 'organization_name')
    ordering = ('-created_at',)

@admin.register(OperatorProfile)
class OperatorProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'sector', 'max_capacity', 'years_of_experience', 'employee_count')
    list_filter = ('sector',)
    search_fields = ('user__email', 'user__organization_name')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'title', 'notification_type', 'is_read', 'created_at')
    list_filter = ('is_read', 'notification_type', 'created_at')
    search_fields = ('user__email', 'title', 'text')
    ordering = ('-created_at',)

@admin.register(ExcludedOperator)
class ExcludedOperatorAdmin(admin.ModelAdmin):
    list_display = ('operator_name', 'nif', 'decision_reference', 'start_date', 'end_date', 'is_active', 'created_at')
    list_filter = ('is_active', 'start_date', 'end_date')
    search_fields = ('operator_name', 'nif', 'decision_reference', 'reason')
    ordering = ('-created_at',)
