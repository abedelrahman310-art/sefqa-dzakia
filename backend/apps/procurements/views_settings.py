"""
views_settings.py — إعدادات المصلحة المتعاقدة (الشعار).

توفر نقاط النهاية التالية (مصادقة مطلوبة):
- POST   /api/authority/settings/      — رفع الشعار الرسمي للمصلحة (Multipart: logo)
- DELETE /api/authority/settings/      — حذف الشعار الحالي
- GET    /api/authority/settings/logo/ — تدفق الشعار كصورة (للعرض في الشريط العلوي)

الصلاحية: الرفع والحذف حصرياً لمستخدم الآمر بالصرف (role='ordonnateur') المرتبط بالمصلحة
؛ والعرض متاح لمستخدمي بوابة المصلحة والإدارة المركزية.
الضوابط: الحجم ≤ 2MB والصيغة PNG/JPG/SVG فقط؛ كل عملية تُوثَّق في AuditLog.
"""
import logging

from django.core.files.uploadedfile import UploadedFile
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import status, views, parsers
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.audit.models import AuditLog
from apps.procurements.models import Authority

from apps.users.views_settings import (
    MAX_LOGO_SIZE,
    ALLOWED_LOGO_EXTENSIONS,
    _client_ip,
    _logo_file_response,
)


logger = logging.getLogger(__name__)


def _log_audit(request, action: str, resource_id: str, description: str, changes: dict) -> None:
    """توثيق العملية في سجل التدقيق غير القابل للتعديل (القانون 23-12)."""
    try:
        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action=action,
            resource_type='Authority',
            resource_id=resource_id,
            description=description,
            changes=changes,
            ip_address=_client_ip(request),
        )
    except Exception as exc:
        logger.debug("تعذر توثيق عملية شعار المصلحة في التدقيق: %s", exc)


def _validate_authority_role(user) -> str | None:
    """الرفع/الحذف حصرياً للآمر بالصرف المرتبط بالمصلحة."""
    if user.role != 'ordonnateur':
        return Response(
            {
                'detail': 'رفع شعار المصلحة متاح حصرياً للآمر بالصرف.',
                'code': 'ordonnateur_only',
            },
            status=status.HTTP_403_FORBIDDEN,
        )
    return None


class AuthoritySettingsApiView(views.APIView):
    """رفع/حذف الشعار الرسمي للمصلحة المتعاقدة على /api/authority/settings/."""
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        forbidden_role = _validate_authority_role(request.user)
        if forbidden_role:
            return forbidden_role
        authority = get_object_or_404(Authority, user=request.user)
        uploaded: UploadedFile = request.FILES.get('logo')
        if not uploaded:
            raise ValidationError({'logo': 'لم يتم إرفاق ملف الشعار.'})
        if uploaded.size > MAX_LOGO_SIZE:
            raise ValidationError({
                'logo': f'حجم ملف الشعار يتجاوز الحد الأقصى ({MAX_LOGO_SIZE // (1024 * 1024)} ميغابايت).'
            })
        name = (uploaded.name or '').lower()
        if not any(name.endswith(ext) for ext in ALLOWED_LOGO_EXTENSIONS):
            raise ValidationError({
                'logo': 'الصيغ المسموحة لشعار المصلحة: PNG و JPG و SVG فقط.'
            })
        old_name = authority.logo.name if authority.logo else None
        if authority.logo:
            authority.logo.delete(save=False)
        authority.logo = uploaded
        authority.save(update_fields=['logo'])
        _log_audit(
            request,
            'AUTHORITY_LOGO_UPLOADED',
            str(authority.id),
            f"رفع الشعار الرسمي للمصلحة «{authority.name}» بواسطة الآمر بالصرف {request.user.email} ({uploaded.name}).",
            {'old_logo': old_name, 'new_logo': authority.logo.name},
        )
        return Response({'has_logo': True, 'detail': 'تم رفع شعار المصلحة بنجاح.'}, status=status.HTTP_200_OK)

    def delete(self, request):
        forbidden_role = _validate_authority_role(request.user)
        if forbidden_role:
            return forbidden_role
        authority = get_object_or_404(Authority, user=request.user)
        if not authority.logo:
            return Response({'has_logo': False, 'detail': 'لا يوجد شعار مرفوع.'}, status=status.HTTP_404_NOT_FOUND)
        old_name = authority.logo.name
        authority.logo.delete(save=False)
        authority.logo = None
        authority.save(update_fields=['logo'])
        _log_audit(
            request,
            'AUTHORITY_LOGO_DELETED',
            str(authority.id),
            f"حذف الشعار الرسمي للمصلحة «{authority.name}» بواسطة الآمر بالصرف {request.user.email} ({old_name}).",
            {'deleted_logo': old_name},
        )
        return Response({'has_logo': False, 'detail': 'تم حذف الشعار.'}, status=status.HTTP_200_OK)


class AuthorityLogoView(views.APIView):
    """تدفق شعار المصلحة كصورة لعرضه في الشريط العلوي (GET /api/authority/settings/logo/)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ('authority', 'ordonnateur', 'central_admin'):
            return Response({'detail': 'غير مسموح.'}, status=status.HTTP_403_FORBIDDEN)
        uid = request.query_params.get('user')
        if request.user.role == 'central_admin' and uid:
            authority = get_object_or_404(Authority, user=uid)
        else:
            # استعلام مباشر بدل الوصول العكسي المخزّن (user.authority) لتجنّب قراءة
            # علاقة قديمة مخزّنة في ذاكرة الكائن داخل جلسة اختبارية طويلة.
            authority = Authority.objects.filter(user=request.user).first()
        return _logo_file_response(authority.logo if authority else None)
