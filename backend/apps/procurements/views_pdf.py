"""
واجهات تصدير وثائق PDF للمحاضر ودفاتر الشروط المعتمدة وفق القانون 23-12.
PDF Views for Opening Session Minutes (PV) and Cahier des Charges Specifications.
"""

import os
import mimetypes
import logging
from django.http import HttpResponse, FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.models import AuditLog
from .models import OpeningSession, ProcurementDeal, CahierSpecs
from .views_opening import HasSessionAccess
from .pdf_service import generate_opening_session_pdf, generate_cahier_specs_pdf

logger = logging.getLogger(__name__)


class OpeningSessionPdfView(APIView):
    """
    GET /api/procurements/sessions/{id}/pdf/
    تصدير محضر جلسة فتح الأظرفة العلنية بصيغة PDF قابلة للطباعة والتوقيع الإلكتروني
    سنداً لأحكام المادة 70 وما بعدها من القانون 23-12 والمرسوم الرئاسي 15-247.
    """

    permission_classes = [permissions.IsAuthenticated, HasSessionAccess]

    def get(self, request, pk):
        session = get_object_or_404(
            OpeningSession.objects.select_related("tender", "tender__authority"),
            pk=pk,
        )
        self.check_object_permissions(request, session)

        try:
            pdf_bytes = generate_opening_session_pdf(session, request.user)
        except Exception as e:
            logger.error("فشل في توليد محضر جلسة الفتح PDF للجلسة %s: %s", session.id, str(e), exc_info=True)
            return Response(
                {"detail": f"تعذر إنشاء ملف PDF للمحضر: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # توثيق تصدير المحضر في سجل التدقيق غير القابل للتعديل
        safe_ref = session.tender.reference_number.replace("/", "_")
        try:
            AuditLog.objects.create(
                user=request.user,
                action="session_pv_pdf_exported",
                resource_type="OpeningSession",
                resource_id=str(session.id),
                description=f"تصدير وتحميل محضر جلسة فتح الأظرفة للصفقة {session.tender.reference_number} بصيغة PDF",
                changes={
                    "session_id": str(session.id),
                    "status": session.status,
                    "opened_count": session.opened_count,
                    "format": "application/pdf",
                },
            )
        except Exception as audit_err:
            logger.warning("تعذر توثيق حدث تصدير المحضر في AuditLog: %s", audit_err)

        filename = f"PV_Opening_{safe_ref}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="{filename}"'
        response["X-Content-Type-Options"] = "nosniff"
        return response


class CahierSpecsPdfView(APIView):
    """
    GET /api/procurements/deals/{id}/specs-pdf/
    أو GET /api/procurements/specs/{id}/pdf/
    تصدير دفتر الشروط والمواصفات العامة والتقنية المعتمدة بصيغة PDF
    وفق دفاتر الشروط النموذجية الصادرة بموجب القانون 23-12 والمرسوم 15-247.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        # البحث إما برقم الصفقة deal_id أو برقم دفتر الشروط cahier_id
        deal = ProcurementDeal.objects.filter(pk=pk).select_related("authority", "cahier_specs").first()
        if not deal:
            specs = CahierSpecs.objects.filter(pk=pk).select_related("deal", "deal__authority").first()
            if specs:
                deal = specs.deal
            else:
                return Response(
                    {"detail": "لم يتم العثور على الصفقة أو دفتر الشروط المطلوب."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        user = request.user
        role = getattr(user, "role", None)

        # التحقق من الصلاحيات:
        # المصلحة المتعاقدة يمكنها الاطلاع على صفقاتها فقط ما لم تكن منشورة
        # المتعامل الاقتصادي يمكنه الاطلاع على الدفتر إذا كانت الصفقة منشورة (المرحلة 3 فأكثر)
        if role == "authority" and deal.authority_id != user.id and not user.is_staff and role != "central_admin":
            return Response(
                {"detail": "غير مخول بالاطلاع أو تصدير دفتر شروط هذه الصفقة."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if role == "operator" and deal.current_stage < 3 and not user.is_staff and role != "central_admin":
            return Response(
                {"detail": "دفتر الشروط لم يُنشر بعد للعموم في المنصة."},
                status=status.HTTP_403_FORBIDDEN,
            )

        safe_ref = (deal.reference_number or str(deal.id)).replace("/", "_")
        filename = f"Cahier_Specs_{safe_ref}.pdf"

        # 1. إذا كان ملف دفتر الشروط مرفوعاً فعلياً في النموذج cahier_specs.file
        cahier_specs = getattr(deal, "cahier_specs", None)
        if cahier_specs and cahier_specs.file:
            try:
                file_obj = cahier_specs.file.open("rb")
                upload_filename = os.path.basename(cahier_specs.file.name) or filename
                content_type, _ = mimetypes.guess_type(upload_filename)

                try:
                    AuditLog.objects.create(
                        user=request.user,
                        action="cahier_specs_pdf_exported",
                        resource_type="ProcurementDeal",
                        resource_id=str(deal.id),
                        description=f"تصدير وتحميل ملف دفتر الشروط المرفوع للصفقة {deal.reference_number}",
                        changes={
                            "deal_id": str(deal.id),
                            "reference_number": deal.reference_number,
                            "source": "uploaded_file",
                            "filename": upload_filename,
                        },
                    )
                except Exception as audit_err:
                    logger.warning("تعذر توثيق حدث تصدير دفتر الشروط في AuditLog: %s", audit_err)

                response = FileResponse(file_obj, content_type=content_type or "application/pdf")
                response["Content-Disposition"] = f'inline; filename="{upload_filename}"'
                response["X-Content-Type-Options"] = "nosniff"
                return response
            except Exception as e:
                logger.warning("تعذر فتح ملف دفتر الشروط المرفوع، الانتقال للمولد الآلي كحل بديل: %s", str(e))

        # 2. وإذا لم يكن موجوداً، نستخدم المولد الآلي (fallback) كحل مؤقت
        try:
            pdf_bytes = generate_cahier_specs_pdf(deal, request.user)
        except Exception as e:
            logger.error("فشل في توليد دفتر الشروط PDF للصفقة %s: %s", deal.id, str(e), exc_info=True)
            return Response(
                {"detail": f"تعذر إنشاء ملف PDF لدفتر الشروط: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            AuditLog.objects.create(
                user=request.user,
                action="cahier_specs_pdf_exported",
                resource_type="ProcurementDeal",
                resource_id=str(deal.id),
                description=f"تصدير دفتر الشروط والمواصفات للصفقة {deal.reference_number} بصيغة PDF (توليد آلي)",
                changes={
                    "deal_id": str(deal.id),
                    "reference_number": deal.reference_number,
                    "current_stage": deal.current_stage,
                    "source": "generated_fallback",
                    "format": "application/pdf",
                },
            )
        except Exception as audit_err:
            logger.warning("تعذر توثيق حدث تصدير دفتر الشروط في AuditLog: %s", audit_err)

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="{filename}"'
        response["X-Content-Type-Options"] = "nosniff"
        return response
