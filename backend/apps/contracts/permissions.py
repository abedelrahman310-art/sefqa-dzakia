from rest_framework.permissions import BasePermission


class IsObjectionOwner(BasePermission):
    """فقط المُطعِن يمكنه رؤية/تعديل طعنه وفق القانون 18-07"""
    def has_object_permission(self, request, view, obj):
        return obj.objector == request.user


class IsObjectionReviewer(BasePermission):
    """المصلحة المالكة أو الإدارة المركزية (رقابة)"""
    def has_object_permission(self, request, view, obj):
        if request.user.role == "central_admin":
            return True
        if request.user.role == "authority":
            return obj.tender.authority == request.user
        return False
