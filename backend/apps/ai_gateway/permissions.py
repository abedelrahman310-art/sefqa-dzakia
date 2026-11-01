from rest_framework.permissions import BasePermission


class IsAdminCenter(BasePermission):
    """
    صلاحية الوصول حصرياً للإدارة المركزية والرقابة الوطنية.
    تشمل مديري النظام العامين (is_superuser).
    """
    message = "هذه الميزة متاحة للإدارة المركزية والرقابة الوطنية فقط."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.role == "central_admin"
                or request.user.is_superuser
            )
        )


class IsAuthorityOrAdmin(BasePermission):
    """
    صلاحية الوصول للمصلحة المتعاقدة أو الإدارة المركزية.
    """
    message = "هذه الميزة متاحة للمصالح المتعاقدة والإدارة المركزية فقط."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ["authority", "central_admin"]
            or (request.user.is_authenticated and request.user.is_superuser)
        )


class CanUseAILegalChat(BasePermission):
    """
    صلاحية استخدام المساعد القانوني الذكي (AILegalChat).
    متاحة للمتعاملين الاقتصاديين ('operator') والمصالح المتعاقدة ('authority')
    بالإضافة إلى مديري النظام العامين (is_superuser).
    
    ملاحظة: يتم استبعاد الإدارة المركزية ('central_admin') صراحة لأن لديها منظومة
    رقابة سيادية وتحليلات مستقلة (عين الصقر / Hawk Eye).
    """
    message = "المساعد القانوني الذكي متاح للمتعاملين الاقتصاديين والمصالح المتعاقدة فقط."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if getattr(user, "is_superuser", False):
            return True

        # السماح حصراً للمتعامل والمصلحة، واستبعاد central_admin
        return getattr(user, "role", None) in ["operator", "authority"]

