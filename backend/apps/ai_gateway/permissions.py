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
