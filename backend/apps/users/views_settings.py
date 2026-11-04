"""
views_settings.py — إعدادات المتعامل الاقتصادي (الشعار).

توفر نقاط النهاية التالية (مصادقة مطلوبة):
- POST   /api/operator/settings/      — رفع شعار المؤسسة (Multipart: logo)
- DELETE /api/operator/settings/      — حذف الشعار الحالي
- GET    /api/operator/settings/logo/ — تدفق الشعار كصورة (للعرض في الشريط العلوي)

الضوابط: الحجم ≤ 2MB والصيغة PNG/JPG/SVG فقط؛ كل عملية تُوثَّق في AuditLog.
"""
import logging

from django.core.files.uploadedfile import UploadedFile
from django.http import FileResponse
from rest_framework import status, views, parsers
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.audit.models import AuditLog
from apps.users.models import CustomUser

logger = logging.getLogger(__name__)

MAX_LOGO_SIZE = 2 * 1024 * 1024  # 2 ميغابايت
ALLOWED_LOGO_EXTENSIONS = ('.png', '.jpg', '.jpeg', '.svg')


def _client_ip(request):
    ip = request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR')
    if ip and ',' in ip:
        ip = ip.split(',')[0].strip()
    return ip


def _log_audit(request, action: str, resource_id: str, description: str, changes: dict) -> None:
    """توثيق العملية في سجل التدقيق غير القابل للتعديل (القانون 23-12) دون تعطيل العملية عند فشل التسجيل."""
    try:
        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action=action,
            resource_type='CustomUser',
            resource_id=resource_id,
            description=description,
            changes=changes,
            ip_address=_client_ip(request),
        )
    except Exception as exc:
        logger.debug("تعذر توثيق عملية الشعار في التدقيق: %s", exc)


def validate_logo_file(uploaded: UploadedFile | None) -> None:
    """يرفع ValidationError عند غياب الملف أو تجاوز الحجم أو مخالفة الصيغ المسموحة."""
    if not uploaded:
        raise ValidationError({'logo': 'لم يتم إرفاق ملف الشعار.'})
    if uploaded.size > MAX_LOGO_SIZE:
        raise ValidationError({
            'logo': f'حجم ملف الشعار يتجاوز الحد الأقصى ({MAX_LOGO_SIZE // (1024 * 1024)} ميغابايت).'
        })
    name = (uploaded.name or '').lower()
    if not any(name.endswith(ext) for ext in ALLOWED_LOGO_EXTENSIONS):
        raise ValidationError({
            'logo': 'الصيغ المسموحة لشعار المؤسسة: PNG و JPG و SVG فقط.'
        })


def _ensure_role(request, allowed_roles) -> Response | None:
    """يعيد Response خطأ 403 إن لم يكن المستخدم من أدوار البوابة المسموحة."""
    if request.user.is_staff or request.user.role in allowed_roles:
        return None
    return Response({'detail': 'غير مسموح.'}, status=status.HTTP_403_FORBIDDEN)


def _logo_file_response(file_field) -> FileResponse | Response:
    """يرد ملف الشعار كاستجابة صورة، أو 404 إن لم يُرفع شعار بعد."""
    if not file_field:
        return Response({'detail': 'لا يوجد شعار مرفوع.'}, status=status.HTTP_404_NOT_FOUND)
    response = FileResponse(file_field.open('rb'))
    response['X-Content-Type-Options'] = 'nosniff'
    response['Cache-Control'] = 'private, max-age=60'
    return response


class OperatorSettingsApiView(views.APIView):
    """رفع/حذف شعار المتعامل الاقتصادي (دور operator) على /api/operator/settings/."""
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        forbidden = _ensure_role(request, ('operator',))
        if forbidden:
            return forbidden
        uploaded: UploadedFile = request.FILES.get('logo')
        validate_logo_file(uploaded)
        user = request.user
        old_name = user.company_logo.name if user.company_logo else None
        # حذف الملف القديم من التخزين قبل الاستبدال
        if user.company_logo:
            user.company_logo.delete(save=False)
        user.company_logo = uploaded
        user.save(update_fields=['company_logo', 'updated_at'])
        _log_audit(
            request,
            'OPERATOR_LOGO_UPLOADED',
            str(user.id),
            f"رفع شعار المؤسسة للمتعامل {user.email} ({uploaded.name}، {uploaded.size} بايت).",
            {'old_logo': old_name, 'new_logo': user.company_logo.name},
        )
        return Response({'has_logo': True, 'detail': 'تم رفع شعار المؤسسة بنجاح.'}, status=status.HTTP_200_OK)

    def delete(self, request):
        user = request.user
        if not user.company_logo:
            return Response({'has_logo': False, 'detail': 'لا يوجد شعار مرفوع.'}, status=status.HTTP_404_NOT_FOUND)
        old_name = user.company_logo.name
        user.company_logo.delete(save=False)
        user.company_logo = None
        user.save(update_fields=['company_logo', 'updated_at'])
        _log_audit(
            request,
            'OPERATOR_LOGO_DELETED',
            str(user.id),
            f"حذف شعار المؤسسة للمتعامل {user.email} ({old_name}).",
            {'deleted_logo': old_name},
        )
        return Response({'has_logo': False, 'detail': 'تم حذف الشعار.'}, status=status.HTTP_200_OK)


class OperatorLogoView(views.APIView):
    """تدفق شعار المتعامل كصورة لعرضه في الشريط العلوي (GET /api/operator/settings/logo/)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ('operator', 'central_admin'):
            return Response({'detail': 'غير مسموح.'}, status=status.HTTP_403_FORBIDDEN)
        uid = request.query_params.get('user') or None
        target = request.user
        if uid and request.user.role == 'central_admin':
            from django.shortcuts import get_object_or_404
            target = get_object_or_404(CustomUser, id=uid)
        return _logo_file_response(target.company_logo)
