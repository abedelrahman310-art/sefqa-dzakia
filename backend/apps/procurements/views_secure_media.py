import os
import mimetypes
from django.conf import settings
from django.http import FileResponse, Http404
from django.core.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response

from .models import OfferDocument, Contract, MilestoneProgressReport, CahierSpecs


class SecureDocumentDownloadView(APIView):
    """
    عرض آمن ومحصن لتحميل ومعاينة الوثائق والمستندات الرسمية (Media Files)
    مع التحقق الصارم من صلاحيات الوصول (RBAC):
    1. الإدارة المركزية (central_admin) والمشرفون: صلاحية رقابية شاملة.
    2. المتعامل الاقتصادي (operator): وثائقه وعروضه وعقوده الخاصة فقط.
    3. المصلحة المتعاقدة (authority): الوثائق المرتبطة بصفقاتها وعقودها فقط.
    4. منع هجمات Path Traversal والوصول المباشر دون مصادقة.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, document_id=None, relative_path=None):
        user = request.user
        is_admin = getattr(user, 'role', '') == 'central_admin' or user.is_superuser or user.is_staff

        # المسار 1: التحميل بواسطة المعرف الرقمي للوثيقة document_id
        if document_id:
            return self._serve_by_document_id(document_id, user, is_admin)

        # المسار 2: التحميل بواسطة المسار النسبي للملف relative_path
        if not relative_path:
            relative_path = request.query_params.get('path') or request.query_params.get('file')

        if not relative_path:
            raise Http404("مسار الملف أو معرف الوثيقة مطلوب.")

        return self._serve_by_path(relative_path, user, is_admin)

    def _serve_by_document_id(self, document_id, user, is_admin):
        try:
            doc = OfferDocument.objects.select_related(
                'offer__operator',
                'offer__deal__authority'
            ).get(id=document_id)
        except (OfferDocument.DoesNotExist, ValueError):
            raise Http404("الوثيقة المطلوبة غير موجودة.")

        # التحقق من الصلاحيات
        is_owner_operator = (getattr(user, 'role', '') == 'operator' and doc.offer.operator_id == user.id)
        is_deal_authority = (getattr(user, 'role', '') == 'authority' and doc.offer.deal and doc.offer.deal.authority_id == user.id)

        if not (is_admin or is_owner_operator or is_deal_authority):
            raise PermissionDenied("ليس لديك الصلاحية للوصول إلى هذه الوثيقة أو تحميلها.")

        if not doc.file:
            raise Http404("ملف الوثيقة غير متوفر في السجل.")

        try:
            file_obj = doc.file.open('rb')
        except Exception:
            raise Http404("تعذر قراءة ملف الوثيقة من وسيط التخزين.")

        filename = os.path.basename(doc.file.name)
        mime_type, _ = mimetypes.guess_type(filename)
        response = FileResponse(file_obj, content_type=mime_type or 'application/octet-stream')
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'private, no-cache, no-store, must-revalidate'
        return response

    def _serve_by_path(self, relative_path, user, is_admin):
        # تطهير المسار والحماية الصارمة من Path Traversal
        clean_path = os.path.normpath(str(relative_path)).lstrip('/\\')
        media_root = os.path.abspath(str(settings.MEDIA_ROOT))
        full_path = os.path.abspath(os.path.join(media_root, clean_path))

        try:
            common = os.path.commonpath([media_root, full_path])
        except ValueError:
            raise Http404("مسار الملف غير صالح.")

        if common != media_root or not os.path.exists(full_path) or os.path.isdir(full_path):
            raise Http404("الملف المطلوب غير موجود على الخادم.")

        # فحص الصلاحية استناداً إلى الكيان الذي يملك الملف
        filename = os.path.basename(full_path)

        # 1. فحص هل الملف وثيقة عرض (OfferDocument)
        doc = OfferDocument.objects.filter(
            file__endswith=filename
        ).select_related('offer__operator', 'offer__deal__authority').first()

        if doc:
            is_owner = (getattr(user, 'role', '') == 'operator' and doc.offer.operator_id == user.id)
            is_auth = (getattr(user, 'role', '') == 'authority' and doc.offer.deal and doc.offer.deal.authority_id == user.id)
            if not (is_admin or is_owner or is_auth):
                raise PermissionDenied("ليس لديك الصلاحية للوصول إلى وثيقة هذا العرض.")
        else:
            # 2. فحص هل الملف عقد (Contract)
            contract = Contract.objects.filter(
                contract_pdf__endswith=filename
            ).select_related('operator', 'deal__authority').first()

            if contract:
                is_owner = (getattr(user, 'role', '') == 'operator' and contract.operator_id == user.id)
                is_auth = (getattr(user, 'role', '') == 'authority' and contract.deal and contract.deal.authority_id == user.id)
                if not (is_admin or is_owner or is_auth):
                    raise PermissionDenied("ليس لديك الصلاحية للوصول إلى وثيقة هذا العقد.")
            else:
                # 3. فحص هل الملف تقرير إنجاز (MilestoneProgressReport)
                report = MilestoneProgressReport.objects.filter(
                    report_file__endswith=filename
                ).select_related('milestone__contract__operator', 'milestone__contract__deal__authority').first()

                if report:
                    c = report.milestone.contract
                    is_owner = (getattr(user, 'role', '') == 'operator' and c.operator_id == user.id)
                    is_auth = (getattr(user, 'role', '') == 'authority' and c.deal and c.deal.authority_id == user.id)
                    if not (is_admin or is_owner or is_auth):
                        raise PermissionDenied("ليس لديك الصلاحية للوصول إلى هذا التقرير.")
                else:
                    # 4. فحص هل الملف دفتر شروط (CahierSpecs)
                    specs = CahierSpecs.objects.filter(
                        file__endswith=filename
                    ).select_related('deal__authority').first()

                    if specs:
                        is_auth = (getattr(user, 'role', '') == 'authority' and specs.deal and specs.deal.authority_id == user.id)
                        is_public = (getattr(user, 'role', '') == 'operator' and specs.deal and specs.deal.current_stage >= 3)
                        if not (is_admin or is_auth or is_public):
                            raise PermissionDenied("ليس لديك الصلاحية للوصول إلى ملف دفتر الشروط هذا.")
                    else:
                        # ملف في الوسائط غير مرتبط بكيان معروف: مسموح للإدارة المركزية فقط
                        if not is_admin:
                            raise PermissionDenied("ليس لديك الصلاحية لتحميل هذا الملف.")

        mime_type, _ = mimetypes.guess_type(full_path)
        file_obj = open(full_path, 'rb')
        response = FileResponse(file_obj, content_type=mime_type or 'application/octet-stream')
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'private, no-cache, no-store, must-revalidate'
        return response
