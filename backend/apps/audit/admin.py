from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'action', 'user', 'resource_type', 'resource_id', 'ip_address')
    list_filter = ('action', 'resource_type', 'timestamp')
    search_fields = ('action', 'resource_type', 'resource_id', 'description', 'user__email', 'checksum')
    readonly_fields = [f.name for f in AuditLog._meta.fields]
    actions = None  # يمنع أي إجراءات جماعية بما فيها الحذف

    def has_add_permission(self, request):
        # تمنع الإضافة اليدوية - التسجيل يتم تلقائياً فقط عبر النظام
        return False

    def has_delete_permission(self, request, obj=None):
        # يمنع الحذف نهائياً وفق القانون 23-12
        return False

    def has_change_permission(self, request, obj=None):
        # يمنع التعديل نهائياً وفق القانون 23-12
        return False
