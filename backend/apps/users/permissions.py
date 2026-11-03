from rest_framework.permissions import BasePermission

class IsCentralAdminBase(BasePermission):
    """
    التحقق الأساسي من أن المستخدم ينتمي للإدارة المركزية أو مشرف عام.
    """
    message = "الوصول مقتصر حصرياً على موظفي ومسؤولي الإدارة المركزية والرقابة الوطنية."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (
                getattr(user, "role", None) == "central_admin"
                or user.is_superuser
                or user.is_staff
            )
        )


class IsInspectorGeneral(BasePermission):
    """
    المفتش العام ومدير النظام أو المشرف العام:
    يملك صلاحية دعوة الموظفين وتعديل وتعطيل الحسابات وإدارة الصلاحيات.
    """
    message = "هذا الإجراء الرقابي مقصور حصرياً على المفتش العام ومدير نظام الإدارة المركزية."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        if getattr(user, "role", None) == "central_admin":
            central_role = getattr(user, "central_role", None)
            # يسمح للمفتش العام ومدير النظام، وكذلك الحسابات المركزية الإدارية الافتراضية
            if central_role in ["inspector_general", "system_admin"]:
                return True
            if central_role is None and user.is_staff:
                return True
        return False


class CanIssueInjunctions(BasePermission):
    """
    من يمكنه إصدار الأوامر والإعذارات الإدارية الرقابية:
    المفتش العام، المفتشون، مدير النظام، والمشرف العام.
    """
    message = "إصدار الإعذارات الإدارية مقصور على المفتش العام والمفتشين المعتمدين."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        if getattr(user, "role", None) == "central_admin":
            central_role = getattr(user, "central_role", None)
            if central_role in ["inspector_general", "inspector", "system_admin", None]:
                return True
        return False


class CanViewFinancials(BasePermission):
    """
    من يمكنه الاطلاع على العمليات المالية والتدقيق المالي والميزانيات:
    المراقب المالي، محلل البيانات، المفتش العام، ومدير النظام.
    """
    message = "الاطلاع على البيانات والمدفوعات المالية مقصور على المراقبين الماليين والمفتشية العامة."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        if getattr(user, "role", None) == "central_admin":
            central_role = getattr(user, "central_role", None)
            if central_role in ["inspector_general", "financial_auditor", "analyst", "system_admin", None]:
                return True
        return False
